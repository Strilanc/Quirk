import Matrix from "src/math/Matrix.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import SimpleShaders from "src/pipeline/SimpleShaders.js"
import Util from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import { initializedWglContext } from "src/webgl/WglContext.js"

/**
 * Defines operations used to initialize, advance, and inspect quantum states stored in WebGL textures.
 */
export default class QuantumShaders {}

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
 * Returns a parameterized shader that renders the superposition corresponding to a classical state.
 *
 * @param {!int} stateBitMask
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
QuantumShaders.classicalState = stateBitMask => ({
    renderTo: destinationTexture => {
        let x = stateBitMask % destinationTexture.width;
        let y = (stateBitMask - x) / destinationTexture.width;
        SET_SINGLE_PIXEL_SHADER.
            withArgs(WglArg.vec2("pixel", x, y)).
            renderTo(destinationTexture);
    }
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
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
QuantumShaders.linearOverlay = (offset, foregroundTexture, backgroundTexture) => LINEAR_OVERLAY_SHADER.withArgs(
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
 * Renders a control mask onto the destination texture, used elsewhere for determining whether or not an operation
 * applies to each pixel. Wherever the control mask's red component is 0, instead of 1, controllable operations are
 * blocked.
 *
 * @param {!int} targetBit The index of the target bit.
 * @param {!boolean} desiredBitValue
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
QuantumShaders.controlMaskForBit = (targetBit, desiredBitValue) => ({
    renderTo: destinationTexture =>
        CONTROL_MASK_FOR_BIT_SHADER.withArgs(
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.float("targetBitPositionMask", 1 << targetBit),
            WglArg.float("desiredBitValue", desiredBitValue ? 1 : 0)
        ).renderTo(destinationTexture)
});
const CONTROL_MASK_FOR_BIT_SHADER = new WglShader(`
    uniform vec2 textureSize;

    /** A power of two (2^n) with the exponent n determined by the index of the qubit acting as a control. */
    uniform float targetBitPositionMask;

    /** The value that the qubit must have for the control to be satisfied. */
    uniform float desiredBitValue;

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = pixelXy.y * textureSize.x + pixelXy.x;
        bool targetBitIsOn = mod(state, targetBitPositionMask * 2.0) > targetBitPositionMask - 0.5;
        float match = mod(float(targetBitIsOn) + desiredBitValue + 1.0, 2.0);

        gl_FragColor = vec4(match, 0.0, 0.0, 0.0);
    }`);

/**
 * Renders a combined control mask onto the destination texture, augmenting the given control mask with a new bit
 * constraint.
 *
 * @param {!WglTexture} originalMaskTexture
 * @param {!int} targetBit
 * @param {!boolean} desiredBitValue
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
QuantumShaders.controlMaskWithBit = (originalMaskTexture, targetBit, desiredBitValue) =>
    CONTROL_MASK_WITH_BIT_SHADER.withArgs(
        WglArg.vec2("textureSize", originalMaskTexture.width, originalMaskTexture.height),
        WglArg.texture("oldControlMaskTexture", originalMaskTexture, 0),
        WglArg.float("targetBitPositionMask", 1 << targetBit),
        WglArg.float("desiredBitValue", desiredBitValue ? 1 : 0));
const CONTROL_MASK_WITH_BIT_SHADER = new WglShader(`
    uniform vec2 textureSize;

    /** The previous control mask, without the bit constraint to be added. */
    uniform sampler2D controlTexture;

    /** A power of two (2^n) with the exponent n determined by the index of the qubit acting as a control. */
    uniform float targetBitPositionMask;

    /** The value that the qubit must have for the control to be satisfied. */
    uniform float desiredBitValue;

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = pixelXy.y * textureSize.x + pixelXy.x;
        bool targetBitIsOn = mod(state, targetBitPositionMask * 2.0) > targetBitPositionMask - 0.5;
        float match = mod(float(targetBitIsOn) + desiredBitValue + 1.0, 2.0);

        vec2 uv = gl_FragCoord.xy / textureSize.xy;
        float oldMatch = texture2D(controlTexture, uv).x;

        gl_FragColor = vec4(match * oldMatch, 0.0, 0.0, 0.0);
    }`);

/**
 * Returns a parameterized shader that dot-products each pixel's rgba vector against itself, rendering the result
 * over the red component of the destination texture (and zero-ing the other components).
 *
 * @param {!WglTexture} inputTexture
 * @returns {!{renderTo: !function(!WglTexture) : void}}
 */
QuantumShaders.squaredMagnitude = inputTexture => SQUARED_MAGNITUDE_SHADER.withArgs(
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
 * Incrementally combines probabilities so that each pixel ends up corresponding to a mask and their value is the
 * sum of all probabilities matching a mask.
 *
 * @param {!WglTexture} destinationTexture
 * @param {!WglTexture} inputTexture
 * @param {!int} step
 * @param {!boolean} requiredBitValue
 */
QuantumShaders.renderConditionalProbabilitiesPipeline = (destinationTexture, inputTexture, step, requiredBitValue) =>
    CONDITIONAL_PROBABILITIES_PIPELINE_SHADER.withArgs(
        WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
        WglArg.texture("inputTexture", inputTexture, 0),
        WglArg.float("stepPower", 1 << step),
        WglArg.bool("conditionValue", requiredBitValue)
    ).renderTo(destinationTexture);
const CONDITIONAL_PROBABILITIES_PIPELINE_SHADER = new WglShader(`
    uniform vec2 textureSize;
    uniform sampler2D inputTexture;

    /** A mask with the qubit being operated on in this step of the pipeline set. */
    uniform float stepPower;

    /** The desired value of this step's qubit. */
    uniform bool conditionValue;

    ${snippets.bitMaskToPixelDeltaUv}
    ${snippets.filterBit}

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        vec2 pixelUv = gl_FragCoord.xy / textureSize;
        float state = pixelXy.y * textureSize.x + pixelXy.x;

        float hasBit = filterBit(state, stepPower);
        vec2 duv = bitMaskToPixelDeltaUv(stepPower);
        if (hasBit == 0.0) {
            gl_FragColor = texture2D(inputTexture, pixelUv) + texture2D(inputTexture, pixelUv + duv);
        } else if (conditionValue) {
            gl_FragColor = texture2D(inputTexture, pixelUv);
        } else {
            gl_FragColor = texture2D(inputTexture, pixelUv - duv);
        }
    }`);

/**
 * Incrementally combines probabilities so that each pixel ends up corresponding to a mask and their value is the
 * sum of all probabilities matching a mask.
 *
 * @param {!WglTexture} destinationTexture
 * @param {!WglTexture} inputTexture
 * @param {!int} controlInclusionMask
 */
QuantumShaders.renderConditionalProbabilitiesFinalize = (destinationTexture, inputTexture, controlInclusionMask) =>
    CONDITIONAL_PROBABILITIES_FINALIZE_SHADER.withArgs(
        WglArg.vec2("inputTextureSize", inputTexture.width, inputTexture.height),
        WglArg.vec2("outputTextureSize", destinationTexture.width, destinationTexture.height),
        WglArg.texture("inputTexture", inputTexture, 0),
        WglArg.float("controlInclusionMask", controlInclusionMask)
    ).renderTo(destinationTexture);
const CONDITIONAL_PROBABILITIES_FINALIZE_SHADER = new WglShader(`
    uniform vec2 inputTextureSize;
    uniform vec2 outputTextureSize;
    uniform sampler2D inputTexture;
    uniform float controlInclusionMask;

    ${snippets.filterBit}
    ${snippets.toggleBit}

    vec2 stateToInputPixelUv(float state) {
        float c = state + 0.5;
        float r = mod(c, inputTextureSize.x);
        float d = floor(c / inputTextureSize.x) + 0.5;
        return vec2(r, d) / inputTextureSize.xy;
    }

    void main() {
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float bit = pow(2.0, pixelXy.y * outputTextureSize.x + pixelXy.x);

        gl_FragColor = vec4(
            texture2D(inputTexture, vec2(0.0, 0.0)).x,
            texture2D(inputTexture, stateToInputPixelUv(bit)).x,
            texture2D(inputTexture, stateToInputPixelUv(controlInclusionMask)).x,
            texture2D(inputTexture, stateToInputPixelUv(toggleBit(controlInclusionMask, bit))).x);
    }`);

/**
 * Renders a control mask texture corresponding to the given control mask.
 * Two workspace textures are needed in order to build up the result; the result of the method indicates which one
 * contains the final result.
 *
 * @param {!QuantumControlMask} controlMask
 * @param {!WglTexture} workspace1
 * @param {!WglTexture} workspace2
 * @returns {!{result: !WglTexture, available: !WglTexture}}
 */
QuantumShaders.renderControlMask = (controlMask, workspace1, workspace2) => {
    // Special case: no constraints.
    if (controlMask.inclusionMask === 0) {
        SimpleShaders.color(1, 0, 0, 0).renderTo(workspace1);
        return {result: workspace1, available: workspace2};
    }

    let hasFirst = false;
    for (let i = 0; (1 << i) <= controlMask.inclusionMask; i++) {
        let c = controlMask.desiredValueFor(i);
        if (c === null) {
            continue;
        }
        let b = /** @type {!boolean} */ c;
        if (hasFirst) {
            QuantumShaders.controlMaskWithBit(workspace1, i, b).renderTo(workspace2);
            let t = workspace2;
            workspace2 = workspace1;
            workspace1 = t;
        } else {
            QuantumShaders.controlMaskForBit(i, b).renderTo(workspace1);
            hasFirst = true;
        }
    }

    return {result: workspace1, available: workspace2};
};

/**
 * Renders a texture with probability sums corresponding to states matching various combinations of controls.
 *
 * @param {!WglTexture} dst
 * @param {!WglTexture} workspace1
 * @param {!WglTexture} workspace2
 * @param {!QuantumControlMask} controlMask
 * @param {!WglTexture} amplitudes
 */
QuantumShaders.renderControlCombinationProbabilities = (dst, workspace1, workspace2, controlMask, amplitudes) => {
    QuantumShaders.squaredMagnitude(amplitudes).renderTo(workspace1);
    let n = amplitudes.width * amplitudes.height;
    for (let i = 0; (1 << i) < n; i++) {
        QuantumShaders.renderConditionalProbabilitiesPipeline(
            workspace2,
            workspace1,
            i,
            (controlMask.desiredValueMask & (1 << i)) !== 0);
        let t = workspace2;
        workspace2 = workspace1;
        workspace1 = t;
    }

    QuantumShaders.renderConditionalProbabilitiesFinalize(
        dst,
        workspace1,
        controlMask.inclusionMask);
};

/**
 * Renders the result of applying a custom controlled single-qubit operation to a superposition.
 *
 * @param {!WglTexture} destinationTexture
 * @param {!WglTexture} inputTexture
 * @param {!Matrix} operation
 * @param {!int} qubitIndex
 * @param {!WglTexture} controlTexture
 */
QuantumShaders.renderQubitOperation = (destinationTexture, inputTexture, operation, qubitIndex, controlTexture) => {
    Util.need(operation.width() === 2 && operation.height() === 2);
    let [[a, b], [c, d]] = operation.rows();
    CUSTOM_SINGLE_QUBIT_OPERATION_SHADER.withArgs(
        WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
        WglArg.texture("inputTexture", inputTexture, 0),
        WglArg.float("qubitIndexMask", 1 << qubitIndex),
        WglArg.texture("controlTexture", controlTexture, 1),
        WglArg.vec2("matrix_a", a.real, a.imag),
        WglArg.vec2("matrix_b", b.real, b.imag),
        WglArg.vec2("matrix_c", c.real, c.imag),
        WglArg.vec2("matrix_d", d.real, d.imag)
    ).renderTo(destinationTexture);
};
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
 * @param {!WglTexture} destinationTexture
 * @param {!WglTexture} inputTexture
 * @param {!int} qubitIndex1
 * @param {!int} qubitIndex2
 * @param {!WglTexture} controlTexture
 */
QuantumShaders.renderSwapOperation = (destinationTexture, inputTexture, qubitIndex1, qubitIndex2, controlTexture) =>
    SWAP_QUBITS_SHADER.withArgs(
        WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
        WglArg.texture("inputTexture", inputTexture, 0),
        WglArg.float("qubitIndexMask1", 1 << qubitIndex1),
        WglArg.float("qubitIndexMask2", 1 << qubitIndex2),
        WglArg.texture("controlTexture", controlTexture, 1)
    ).renderTo(destinationTexture);
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

/**
 * @param {!WglTexture} dst
 * @param {!WglTexture} inputTexture
 * @param {!Array.<!int>} keptBits
 * @param {!Array.<!int>} marginalizedBits
 * @param {!QuantumControlMask} controlMask
 */
QuantumShaders.renderSuperpositionToDensityMatrix = (dst, inputTexture, keptBits, marginalizedBits, controlMask) => {
    Util.need(keptBits.every(b => (controlMask.inclusionMask & (1 << b)) === 0), "kept bits overlap controls");
    Util.need(marginalizedBits.every(b => (controlMask.inclusionMask & (1 << b)) === 0),
        "marginalized bits overlap controls");
    Util.need(keptBits.every(b => marginalizedBits.indexOf(b) === -1), "kept bits overlap marginalized bits");
    Util.need(1 << (controlMask.includedBitCount() + keptBits.length + marginalizedBits.length) ===
        inputTexture.width * inputTexture.height, "all bits must be kept, marginalized, or controls");
    Util.need(1 << (2*keptBits.length) === dst.width * dst.height,
        "destination texture has wrong size for density matrix");

    let specializedShader = MAKE_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX(marginalizedBits.length, keptBits.length);
    let bitArg = (k, n) => {
        let r = n % inputTexture.width;
        let q = (n - r) / inputTexture.width;
        return WglArg.vec2(k, r, q);
    };
    let args = new Seq([
        [
            WglArg.texture("superpositionTexture", inputTexture, 0),
            WglArg.vec2("superpositionTextureSize", inputTexture.width, inputTexture.height),
            WglArg.vec2("outputTextureSize", dst.width, dst.height),
            bitArg("control_bits_offset", controlMask.desiredValueMask)
        ],
        new Seq(keptBits).mapWithIndex((b, i) => bitArg("kept_bit_" + i, 1 << b)),
        new Seq(marginalizedBits).mapWithIndex((b, i) => bitArg("margin_bit_" + i, 1 << b))
    ]).flatten().toArray();

    specializedShader.withArgs(...args).renderTo(dst);
};
const PATTERN_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX = `
    /** Stores the input as 2**n amplitudes defining the state of n qubits. */
    uniform sampler2D superpositionTexture;
    /** The width and height of the input superposition texture. */
    uniform vec2 superpositionTextureSize;
    /** The width and height of the output texture. */
    uniform vec2 outputTextureSize;

    /** The offsets used to toggle between the values of bits to be marginalized over. */
    REPEAT_MARGIN{uniform vec2 margin_bit_#;}

    /** The offsets used to toggle between the values of bits to keep. */
    REPEAT_KEPT{uniform vec2 kept_bit_#;}

    /** Aims the conversion at the correct subset of the space. */
    uniform vec2 control_bits_offset;

    void main() {
        // Find the state pair of the kept bits corresponding to the density matrix position we're computing.
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float ij = xy.y * outputTextureSize.x + xy.x;
        REPEAT_KEPT{float i# = mod(ij, 2.0); ij = (ij - i#)/2.0;}
        REPEAT_KEPT{float j# = mod(ij, 2.0); ij = (ij - j#)/2.0;}
        vec2 i = control_bits_offset REPEAT_KEPT{+ kept_bit_# * i#};
        vec2 j = control_bits_offset REPEAT_KEPT{+ kept_bit_# * j#};

        // Marginalize over the margin bits.
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        REPEAT_MARGIN{for (int k# = 0; k# < 2; k#++)} {
            vec2 k = vec2(0.0, 0.0) REPEAT_MARGIN{+ float(k#) * margin_bit_#};
            vec4 a = texture2D(superpositionTexture, (i + k + vec2(0.5, 0.5)) / superpositionTextureSize);
            vec4 b = texture2D(superpositionTexture, (j + k + vec2(0.5, 0.5)) / superpositionTextureSize);
            gl_FragColor += vec4(a.x*b.x + a.y*b.y, a.x*b.y - a.y*b.x, 0.0, 0.0);
        }
    }`;
let __MAKE_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX__cache = new Map();
let MAKE_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX = (num_margin, num_kept) => {
    let try_replace = (target, key, num) => {
        let i = target.indexOf(key);
        if (i === -1) {
            return [false, target];
        }
        let j = target.indexOf("}", i);
        if (j === -1) {
            return [false, target];
        }

        let i2 = i + key.length;
        let sub = target.substr(i2, j - i2);
        let out = target.substr(0, i) +
            Seq.range(num).map(i => sub.split('#').join(i+"")).join("\n\t\t\t") +
            target.substr(j + 1);
        return [true, out];
    };

    let all_replace = (target, key, num) => {
        let cont = undefined;
        do {
            [cont, target] = try_replace(target, key, num);
        } while (cont);
        return target;
    };

    let key = num_margin + ":" + num_kept;
    let val = __MAKE_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX__cache[key];
    if (val !== undefined) {
        return val;
    }

    let code = PATTERN_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX;
    code = all_replace(code, "REPEAT_MARGIN{", num_margin);
    code = all_replace(code, "REPEAT_KEPT{", num_kept);
    let shader = new WglShader(code);
    __MAKE_GLSL_SUPERPOSITION_TO_DENSITY_MATRIX__cache[key] = shader;
    return shader;
};
