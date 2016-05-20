import Controls from "src/circuit/Controls.js"
import DetailedError from "src/base/DetailedError.js"
import Matrix from "src/math/Matrix.js"
import Seq from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import Util from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import { WglConfiguredShader } from "src/webgl/WglShader.js"
import { initializedWglContext } from "src/webgl/WglContext.js"

/**
 * Some shaders do work for each qubit. They iterate this many times (horizontally and vertically).
 * @type {!int}
 */
const HALF_QUBIT_LIMIT = 10;

/**
 * Defines operations used to initialize, advance, and inspect quantum states stored in WebGL textures.
 */
export default class CircuitShaders {}

const snippets = {
    /**
     * Does a bitwise-and of the given integer value against a single-bit bit mask.
     * @param value The (approximate) integer to extract a bit from.
     * @param singleBitMask A power of two corresponding to the bit to retain (all others get masked out).
     */
    filterBit: `
        float filterBit(float value, float bit) {
            value += 0.5;
            return mod(value, bit * 2.0) - mod(value, bit);
        }`,

    /**
     * Does a bitwise-xor of the given integer value against a single-bit bit mask.
     * @param value The (approximate) integer to toggle a bit in.
     * @param singleBitMask A power of two corresponding to the bit to toggle (all others get left alone).
     */
    toggleBit: `
        float toggleBit(float value, float bit) {
            float hasBit = filterBit(value, bit);
            return value + bit - 2.0 * hasBit;
        }`,

    /**
     * Returns the uv difference between a bit's off and on states.
     */
    bitMaskToPixelDeltaUv: `
        vec2 bitMaskToPixelDeltaUv(float bitMask) {
            float r = mod(bitMask, inputSize.x);
            float d = floor(bitMask / inputSize.x);
            return vec2(r, d) / inputSize.xy;
        }`
};

/**
 * Returns a configured shader that renders the superposition corresponding to a classical state.
 *
 * @param {!int} stateBitMask
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.classicalState = stateBitMask => new WglConfiguredShader(destinationTexture => {
        let x = stateBitMask % destinationTexture.width;
        let y = (stateBitMask - x) / destinationTexture.width;
        SET_SINGLE_PIXEL_SHADER.
            withArgs(WglArg.vec2("pixel", x, y)).
            renderTo(destinationTexture);
    });
const SET_SINGLE_PIXEL_SHADER = new WglShader(`
    /** The location of the single pixel to set. */
    uniform vec2 pixel;

    void main() {
        vec2 d = gl_FragCoord.xy - vec2(0.5, 0.5) - pixel;
        float f = float(d == vec2(0.0, 0.0));
        gl_FragColor = vec4(f, 0.0, 0.0, 0.0);
    }`);

/**
 * Renders a texture with the given background texture, but with the given foreground texture's data scanned
 * linearly into the background.
 *
 * @param {!int} offset
 * @param {!WglTexture} foregroundTexture
 * @param {!WglTexture} backgroundTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.linearOverlay = (offset, foregroundTexture, backgroundTexture) => LINEAR_OVERLAY_SHADER.withArgs(
    WglArg.vec2("backgroundTextureSize", backgroundTexture.width, backgroundTexture.height),
    WglArg.vec2("foregroundTextureSize", foregroundTexture.width, foregroundTexture.height),
    WglArg.texture("backgroundTexture", backgroundTexture, 0),
    WglArg.texture("foregroundTexture", foregroundTexture, 1),
    WglArg.int("offset", offset));
const LINEAR_OVERLAY_SHADER = new WglShader(`
    uniform vec2 backgroundTextureSize;
    uniform vec2 foregroundTextureSize;

    uniform sampler2D backgroundTexture;
    uniform sampler2D foregroundTexture;

    /** The starting index of the range where the foreground data should be copied. */
    uniform int offset;

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float i = pixelXy.x + pixelXy.y * backgroundTextureSize.x - float(offset);
        if (i >= 0.0 && i < foregroundTextureSize.x * foregroundTextureSize.y) {
            float x = mod(i, foregroundTextureSize.x);
            float y = (i - x) / foregroundTextureSize.x;
            vec2 fore_uv = vec2(x + 0.5, y + 0.5) / foregroundTextureSize.xy;
            gl_FragColor = texture2D(foregroundTexture, fore_uv);
        } else {
            vec2 back_uv = gl_FragCoord.xy / backgroundTextureSize;
            gl_FragColor = texture2D(backgroundTexture, back_uv);
        }
    }`);

/**
 * Returns a configured shader that renders a control mask texture corresponding to the given control mask, with 1s
 * at pixels meeting the control and 0s at pixels not meeting the control.
 * @param {!Controls} controlMask
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.controlMask = controlMask => {
    if (controlMask.isEqualTo(Controls.NONE)) {
        return Shaders.color(1, 0, 0, 0);
    }

    return new WglConfiguredShader(destinationTexture => {
        if (destinationTexture.width * destinationTexture.height > (1 << (HALF_QUBIT_LIMIT*2))) {
            throw new Error("CircuitShaders.controlMask needs to be updated to allow more qubits.");
        }
        let xMask = destinationTexture.width - 1;
        let xLen = Math.floor(Math.log2(destinationTexture.width));
        CONTROL_MASK_SHADER.withArgs(
            WglArg.float('usedX', controlMask.inclusionMask & xMask),
            WglArg.float('desiredX', controlMask.desiredValueMask & xMask),
            WglArg.float('usedY', controlMask.inclusionMask >> xLen),
            WglArg.float('desiredY', controlMask.desiredValueMask >> xLen)
        ).renderTo(destinationTexture);
    })
};
const CONTROL_MASK_SHADER = new WglShader(`
    uniform float usedX;
    uniform float desiredX;

    uniform float usedY;
    uniform float desiredY;

    /**
     * Returns 1 if (val & used == desired & used), else returns 0.
     * Note: ignores bits past the first 10.
     */
    float check(float val, float used, float desired) {
        float pass = 1.0;
        float bit = 1.0;
        for (int i = 0; i < ${HALF_QUBIT_LIMIT}; i++) {
            float v = mod(floor(val/bit), 2.0);
            float u = mod(floor(used/bit), 2.0);
            float d = mod(floor(desired/bit), 2.0);
            pass *= 1.0 - abs(v-d)*u;
            bit *= 2.0;
        }
        return pass;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float pass = check(xy.x, usedX, desiredX) * check(xy.y, usedY, desiredY);
        gl_FragColor = vec4(pass, 0.0, 0.0, 0.0);
    }`);

/**
 * Returns a configured shader that renders only the control-matching parts of an input texture to a smaller output
 * texture. This allows later shaders to omit any control-masking steps (and to work on less data).
 * @param {!Controls} controlMask
 * @param {!WglTexture} dataTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.controlSelect = (controlMask, dataTexture) => {
    if (controlMask.isEqualTo(Controls.NONE)) {
        return Shaders.passthrough(dataTexture);
    }

    return new WglConfiguredShader(destinationTexture => {
        if (dataTexture.width * dataTexture.height > (1 << (HALF_QUBIT_LIMIT*2))) {
            throw new Error("CircuitShaders.controlSelect needs to be updated to allow more qubits.");
        }
        CONTROL_SELECT_SHADER.withArgs(
            WglArg.texture('inputTexture', dataTexture, 0),
            WglArg.vec2('inputSize', dataTexture.width, dataTexture.height),
            WglArg.float('outputWidth', destinationTexture.width),
            WglArg.float('used', controlMask.inclusionMask),
            WglArg.float('desired', controlMask.desiredValueMask)
        ).renderTo(destinationTexture);
    });
};
const CONTROL_SELECT_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;

    uniform float used;
    uniform float desired;

    /**
     * Inserts bits from the given value into the holes between used bits in the desired mask.
     */
    float scatter(float val, float used, float desired) {
        float maskPos = 1.0;
        float coordPos = 1.0;
        float result = 0.0;
        for (int i = 0; i < ${HALF_QUBIT_LIMIT*2}; i++) {
            float v = mod(floor(val/coordPos), 2.0);
            float u = mod(floor(used/maskPos), 2.0);
            float d = mod(floor(desired/maskPos), 2.0);
            result += (v + u*(d-v)) * maskPos;
            coordPos *= 2.0-u;
            maskPos *= 2.0;
        }
        return result;
    }

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float scatteredInputState = scatter(state, used, desired);
        gl_FragColor = texture2D(inputTexture, toUv(scatteredInputState));
    }`);

/**
 * Renders the result of applying a controlled swap operation to a superposition.
 *
 * @param {!WglTexture} inputTexture
 * @param {!int} qubitIndex1
 * @param {!int} qubitIndex2
 * @param {!WglTexture} controlTexture
 */
CircuitShaders.swap = (inputTexture, qubitIndex1, qubitIndex2, controlTexture) =>
    new WglConfiguredShader(destinationTexture => {
        if (destinationTexture.width !== inputTexture.width || destinationTexture.height !== inputTexture.height) {
            throw new Error("Texture sizes must match.");
        }
        SWAP_QUBITS_SHADER.withArgs(
            WglArg.vec2("inputSize", destinationTexture.width, destinationTexture.height),
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.float("qubitIndexMask1", 1 << qubitIndex1),
            WglArg.float("qubitIndexMask2", 1 << qubitIndex2),
            WglArg.texture("controlTexture", controlTexture, 1)
        ).renderTo(destinationTexture)
    });
const SWAP_QUBITS_SHADER = new WglShader(`
    /**
     * A texture holding the complex coefficients of the superposition to operate on.
     * The real components are in the red component, and the imaginary components are in the green component.
     */
    uniform sampler2D inputTexture;

    /**
     * A texture with flags that determine which states get affected by the operation.
     * The red component is 1 for states that should participate, and 0 otherwise.
     */
    uniform sampler2D controlTexture;

    /**
     * The width and height of the textures being operated on.
     */
    uniform vec2 inputSize;

    /**
     * A power of two (2^n) with the exponent n determined by the index of one of the qubits to swap.
     */
    uniform float qubitIndexMask1;

    /**
     * A power of two (2^n) with the exponent n determined by the index of the other qubit to swap.
     */
    uniform float qubitIndexMask2;

    ${snippets.filterBit}
    ${snippets.toggleBit}

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = pixelXy.y * inputSize.x + pixelXy.x;
        vec2 pixelUv = gl_FragCoord.xy / inputSize;

        float opposingState1 = toggleBit(state, qubitIndexMask1);
        float opposingState2 = toggleBit(state, qubitIndexMask2);
        bool qubitIsOn1 = state >= opposingState1;
        bool qubitIsOn2 = state >= opposingState2;
        bool blockedByControls = texture2D(controlTexture, pixelUv).x == 0.0;

        vec2 srcPixelUv;
        if (!blockedByControls && qubitIsOn1 != qubitIsOn2) {
            float swapState = opposingState1 + opposingState2 - state;
            vec2 swapPixelUv = toUv(swapState);
            srcPixelUv = swapPixelUv;
        } else {
            srcPixelUv = pixelUv;
        }
        gl_FragColor = texture2D(inputTexture, srcPixelUv);
    }`);

/**
 * Returns a configured shader that renders the marginal states of each qubit, for each possible values of the other
 * qubits (i.e. folding still needs to be done), into a destination texture. The marginal states are laid out in
 * [a,br,bi,d] order within each pixel and represent the density matrix {{a, b},{b*, d}}.
 * @param {!WglTexture} inputTexture A superposition texture.
 * @param {undefined|!int=} keptBitMask A bit mask with a 1 at the positions corresponding to indicates of the desired
 * qubit densities.
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.qubitDensities = (inputTexture, keptBitMask = undefined) => {
    if (keptBitMask === undefined) {
        keptBitMask = inputTexture.width * inputTexture.height - 1;
    }
    let keptCount = Util.ceilingPowerOf2(Util.numberOfSetBits(keptBitMask));

    return new WglConfiguredShader(destinationTexture => {
        let expectedOutputSize = keptCount * inputTexture.width * inputTexture.height / 2;
        if (destinationTexture.width * destinationTexture.height !== expectedOutputSize) {
            throw new DetailedError("Wrong destination size.", {inputTexture, keptBitMask, destinationTexture});
        }
        QUBIT_DENSITIES_SHADER.withArgs(
            WglArg.texture('inputTexture', inputTexture, 0),
            WglArg.vec2('inputSize', inputTexture.width, inputTexture.height),
            WglArg.float('outputWidth', destinationTexture.width),
            WglArg.float('keptCount', keptCount),
            WglArg.float('keptBitMask', keptBitMask)
        ).renderTo(destinationTexture)
    });
};
const QUBIT_DENSITIES_SHADER = new WglShader(`
    uniform float keptCount;
    uniform float outputWidth;
    uniform float keptBitMask;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;

    float scatter(float val, float used) {
        float result = 0.0;
        float posUsed = 1.0;
        float posVal = 1.0;
        for (int i = 0; i < ${HALF_QUBIT_LIMIT*2}; i++) {
            float u = mod(floor(used/posUsed), 2.0);
            float v = mod(floor(val/posVal), 2.0);
            result += u * v * posUsed;
            posVal *= 1.0+u;
            posUsed *= 2.0;
        }
        return result;
    }

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        float outIndex = (gl_FragCoord.y - 0.5) * outputWidth + (gl_FragCoord.x - 0.5);

        float bitIndex = mod(outIndex, keptCount);
        float otherBits = floor(outIndex / keptCount);
        float bit = scatter(pow(2.0, bitIndex), keptBitMask);

        // Indices of the two complex values making up the current conditional ket.
        float srcIndex0 = mod(otherBits, bit) + floor(otherBits / bit) * bit * 2.0;
        float srcIndex1 = srcIndex0 + bit;

        // Grab the two complex values.
        vec2 w1 = texture2D(inputTexture, toUv(srcIndex0)).xy;
        vec2 w2 = texture2D(inputTexture, toUv(srcIndex1)).xy;

        // Compute density matrix components.
        float a = dot(w1, w1);
        float br = dot(w1, w2);
        float bi = dot(vec2(-w1.y, w1.x), w2);
        float d = dot(w2, w2);

        gl_FragColor = vec4(a, br, bi, d);
    }`);

/**
 * Returns a configured shader that renders the marginal states of adjacent qubits, for each possible values of the
 * other qubits (i.e. folding still needs to be done). The marginal states are laid out in a tricky order.
 * @param {!WglTexture} inputTexture A superposition texture.
 * @param {undefined|!int=} keptBitMask A bit mask with a 1 at the positions corresponding to the first bit of each
 * desired qubit pair density.
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.qubitPairDensities = (inputTexture, keptBitMask = undefined) => {
    if (keptBitMask === undefined) {
        keptBitMask = inputTexture.width * inputTexture.height - 1;
    }
    let keptCount = Util.ceilingPowerOf2(Util.numberOfSetBits(keptBitMask));

    return new WglConfiguredShader(destinationTexture => {
        let expectedOutputSize = keptCount * inputTexture.width * inputTexture.height;
        if (destinationTexture.width * destinationTexture.height !== expectedOutputSize) {
            throw new DetailedError("Wrong destination size.", {inputTexture, keptBitMask, destinationTexture});
        }
        TWO_QUBIT_DENSITIES_SHADER.withArgs(
            WglArg.texture('inputTexture', inputTexture, 0),
            WglArg.vec2('inputSize', inputTexture.width, inputTexture.height),
            WglArg.float('outputWidth', destinationTexture.width),
            WglArg.float('keptCount', keptCount),
            WglArg.float('keptBitMask', keptBitMask)
        ).renderTo(destinationTexture)
    });
};
const TWO_QUBIT_DENSITIES_SHADER = new WglShader(`
    uniform float keptCount;
    uniform float keptBitMask;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;

    float scatter(float val, float used) {
        float result = 0.0;
        float posUsed = 1.0;
        float posVal = 1.0;
        for (int i = 0; i < ${HALF_QUBIT_LIMIT*2}; i++) {
            float u = mod(floor(used/posUsed), 2.0);
            float v = mod(floor(val/posVal), 2.0);
            result += u * v * posUsed;
            posVal *= 1.0+u;
            posUsed *= 2.0;
        }
        return result;
    }

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        float outIndex = (gl_FragCoord.y - 0.5) * outputWidth + (gl_FragCoord.x - 0.5);

        float componentIndex = mod(outIndex, 4.0);
        float bitIndex = mod(floor(outIndex / 4.0), keptCount);
        float otherBits = floor(outIndex / (keptCount * 4.0));
        float bit = scatter(pow(2.0, bitIndex), keptBitMask);

        // Indices of the complex values making up the conditional ket.
        float srcIndex00 = mod(otherBits, bit) + floor(otherBits / bit) * bit * 4.0;
        float srcIndex01 = srcIndex00 + bit;
        float srcIndex10 = srcIndex00 + bit * 2.0;
        float srcIndex11 = srcIndex00 + bit * 3.0;

        // Grab the complex values.
        vec2 w00 = texture2D(inputTexture, toUv(srcIndex00)).xy;
        vec2 w01 = texture2D(inputTexture, toUv(srcIndex01)).xy;
        vec2 w10 = texture2D(inputTexture, toUv(srcIndex10)).xy;
        vec2 w11 = texture2D(inputTexture, toUv(srcIndex11)).xy;

        // Compute density matrix components.
        if (componentIndex == 0.0) {
            float r00 = dot(w00, w00);
            float r01 = dot(w01, w01);
            float r10 = dot(w10, w10);
            float r11 = dot(w11, w11);
            gl_FragColor = vec4(r00, r01, r10, r11);
        } else if (componentIndex == 1.0) {
            float cr_00_01 = dot(w00, w01);
            float cr_00_10 = dot(w00, w10);
            float cr_00_11 = dot(w00, w11);
            float cr_10_11 = dot(w10, w11);
            gl_FragColor = vec4(cr_00_01, cr_00_10, cr_00_11, cr_10_11);
        } else if (componentIndex == 2.0) {
            float ci_00_01 = dot(vec2(-w00.y, w00.x), w01);
            float ci_00_10 = dot(vec2(-w00.y, w00.x), w10);
            float ci_00_11 = dot(vec2(-w00.y, w00.x), w11);
            float ci_10_11 = dot(vec2(-w10.y, w10.x), w11);
            gl_FragColor = vec4(ci_00_01, ci_00_10, ci_00_11, ci_10_11);
        } else if (componentIndex == 3.0) {
            float cr_01_10 = dot(w01, w10);
            float cr_01_11 = dot(w01, w11);
            float ci_01_10 = dot(vec2(-w01.y, w01.x), w10);
            float ci_01_11 = dot(vec2(-w01.y, w01.x), w11);
            gl_FragColor = vec4(cr_01_10, cr_01_11, ci_01_10, ci_01_11);
        }
    }`);
