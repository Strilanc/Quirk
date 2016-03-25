import Matrix from "src/math/Matrix.js"
import Controls from "src/circuit/Controls.js"
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
     * Converts the index of a classical state to the XY coordinate of the pixel storing its amplitude.
     * @param state The classical state's index, where the index in binary is a list of the qubit values.
     */
    stateToPixelUv: `
        vec2 stateToPixelUv(float state) {
            float c = state + 0.5;
            float r = mod(c, textureSize.x);
            float d = floor(c / textureSize.x) + 0.5;
            return vec2(r, d) / textureSize.xy;
        }`,

    /**
     * Returns the uv difference between a bit's off and on states.
     */
    bitMaskToPixelDeltaUv: `
        vec2 bitMaskToPixelDeltaUv(float bitMask) {
            float r = mod(bitMask, textureSize.x);
            float d = floor(bitMask / textureSize.x);
            return vec2(r, d) / textureSize.xy;
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
 * Returns a configured shader that dot-products each pixel's rgba vector against itself, rendering the result
 * over the red component of the destination texture (and zero-ing the other components).
 *
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.squaredMagnitude = inputTexture => SQUARED_MAGNITUDE_SHADER.withArgs(
    WglArg.vec2("textureSize", inputTexture.width, inputTexture.height),
    WglArg.texture("inputTexture", inputTexture, 0));
const SQUARED_MAGNITUDE_SHADER = new WglShader(`
    uniform vec2 textureSize;
    uniform sampler2D inputTexture;
    void main() {
        vec4 v = texture2D(inputTexture, gl_FragCoord.xy / textureSize.xy);
        float m = dot(v, v);
        gl_FragColor = vec4(m, 0.0, 0.0, 0.0);
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

    void main() {
        float outIndex = (gl_FragCoord.y - 0.5) * outputWidth + (gl_FragCoord.x - 0.5);
        float inIndex = scatter(outIndex, used, desired);

        float x = mod(inIndex, inputSize.x);
        float y = floor(inIndex / inputSize.x);
        vec2 uv = vec2(x + 0.5, y + 0.5) / inputSize;

        gl_FragColor = texture2D(inputTexture, uv);
    }`);

/**
 * Returns a configured shader that renders the marginal states of each qubit, for each possible values of the other
 * qubits (i.e. folding still needs to be done), into a destination texture.
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.allQubitDensities = inputTexture => {
    let ceilQubitCount = 1 << Math.ceil(Math.log2(Math.log2(inputTexture.width * inputTexture.height)));
    return new WglConfiguredShader(destinationTexture => {
        return ALL_QUBIT_DENSITIES.withArgs(
            WglArg.texture('inputTexture', inputTexture, 0),
            WglArg.vec2('inputSize', inputTexture.width, inputTexture.height),
            WglArg.float('outputWidth', destinationTexture.width),
            WglArg.float('qubitCountCeilPow2', ceilQubitCount)
        ).renderTo(destinationTexture)
    });
};
const ALL_QUBIT_DENSITIES = new WglShader(`
    uniform float qubitCountCeilPow2;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;

    void main() {
        float outIndex = (gl_FragCoord.y - 0.5) * outputWidth + (gl_FragCoord.x - 0.5);

        float bitIndex = mod(outIndex, qubitCountCeilPow2);
        float otherBits = floor(outIndex / qubitCountCeilPow2);
        float bit = pow(2.0, bitIndex);

        // Indices of the two complex values making up the current conditional ket.
        float srcIndex0 = mod(otherBits, bit) + floor(otherBits / bit) * bit * 2.0;
        float srcIndex1 = srcIndex0 + bit;

        // Index to uv.
        float x0 = mod(srcIndex0, inputSize.x);
        float y0 = floor(srcIndex0 / inputSize.x);
        float x1 = mod(srcIndex1, inputSize.x);
        float y1 = floor(srcIndex1 / inputSize.x);
        vec2 uv0 = vec2(x0+0.5, y0+0.5)/inputSize;
        vec2 uv1 = vec2(x1+0.5, y1+0.5)/inputSize;

        // Grab the two complex values.
        vec2 w1 = texture2D(inputTexture, uv0).xy;
        vec2 w2 = texture2D(inputTexture, uv1).xy;

        // Compute density matrix components.
        float a = dot(w1, w1);
        float br = dot(w1, w2);
        float bi = dot(vec2(-w1.y, w1.x), w2);
        float d = dot(w2, w2);

        gl_FragColor = vec4(a, br, bi, d);
    }`);

/**
 * Renders the result of applying a custom controlled single-qubit operation to a superposition.
 *
 * @param {!WglTexture} inputTexture
 * @param {!Matrix} operation
 * @param {!int} qubitIndex
 * @param {!WglTexture} controlTexture
 * @returns {!WglConfiguredShader}
 */
CircuitShaders.qubitOperation = (inputTexture, operation, qubitIndex, controlTexture) =>
    new WglConfiguredShader(destinationTexture => {
        Util.need(operation.width() === 2 && operation.height() === 2);
        let [ar, ai, br, bi, cr, ci, dr, di] = operation.rawBuffer();
        CUSTOM_SINGLE_QUBIT_OPERATION_SHADER.withArgs(
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.float("qubitIndexMask", 1 << qubitIndex),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.vec2("matrix_a", ar, ai),
            WglArg.vec2("matrix_b", br, bi),
            WglArg.vec2("matrix_c", cr, ci),
            WglArg.vec2("matrix_d", dr, di)
        ).renderTo(destinationTexture);
    });
const CUSTOM_SINGLE_QUBIT_OPERATION_SHADER = new WglShader(`
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
    uniform vec2 textureSize;

    /**
     * A power of two (2^n) with the exponent n determined by the index of the qubit to operate on.
     */
    uniform float qubitIndexMask;

    /**
     * The row-wise complex coefficients of the matrix to apply. Laid out normally, they would be:
     * M = |a b|
     *     |c d|
     */
    uniform vec2 matrix_a, matrix_b, matrix_c, matrix_d;

    ${snippets.filterBit}
    ${snippets.toggleBit}
    ${snippets.stateToPixelUv}

    void main() {

        // Which part of the multiplication are we doing?
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        vec2 pixelUv = gl_FragCoord.xy / textureSize;
        float state = pixelXy.y * textureSize.x + pixelXy.x;
        float opposingState = toggleBit(state, qubitIndexMask);
        vec2 opposingPixelUv = stateToPixelUv(opposingState);
        bool targetBitIsOff = state < opposingState;

        // Does this part of the superposition match the controls?
        bool blockedByControls = texture2D(controlTexture, pixelUv).x == 0.0;
        if (blockedByControls) {
            gl_FragColor = texture2D(inputTexture, pixelUv);
            return;
        }

        // The row we operate against is determined by the output pixel's operated-on-bit's value
        vec2 c1, c2;
        if (targetBitIsOff) {
            c1 = matrix_a;
            c2 = matrix_b;
        } else {
            c1 = matrix_d;
            c2 = matrix_c;
        }

        // Do (our part of) the matrix multiplication
        vec4 amplitudeCombo = vec4(texture2D(inputTexture, pixelUv).xy,
                                   texture2D(inputTexture, opposingPixelUv).xy);
        vec4 dotReal = vec4(c1.x, -c1.y,
                            c2.x, -c2.y);
        vec4 dotImag = vec4(c1.y, c1.x,
                            c2.y, c2.x);
        vec2 outputAmplitude = vec2(dot(amplitudeCombo, dotReal),
                                    dot(amplitudeCombo, dotImag));

        gl_FragColor = vec4(outputAmplitude, 0.0, 0.0);
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
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
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
    uniform vec2 textureSize;

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
    ${snippets.stateToPixelUv}

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = pixelXy.y * textureSize.x + pixelXy.x;
        vec2 pixelUv = gl_FragCoord.xy / textureSize;

        float opposingState1 = toggleBit(state, qubitIndexMask1);
        float opposingState2 = toggleBit(state, qubitIndexMask2);
        bool qubitIsOn1 = state >= opposingState1;
        bool qubitIsOn2 = state >= opposingState2;
        bool blockedByControls = texture2D(controlTexture, pixelUv).x == 0.0;

        vec2 srcPixelUv;
        if (!blockedByControls && qubitIsOn1 != qubitIsOn2) {
            float swapState = opposingState1 + opposingState2 - state;
            vec2 swapPixelUv = stateToPixelUv(swapState);
            srcPixelUv = swapPixelUv;
        } else {
            srcPixelUv = pixelUv;
        }
        gl_FragColor = texture2D(inputTexture, srcPixelUv);
    }`);
