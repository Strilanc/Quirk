import U from "src/base/util.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"

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
        }`
};

const GLSL_PASS_THROUGH = new WglShader(`
    /** The width and height of the textures being operated on. */
    uniform vec2 textureSize;

    /** The texture to pass through. */
    uniform sampler2D inputTexture;

    void main() {
        vec2 uv = gl_FragCoord.xy / textureSize.xy;
        gl_FragColor = texture2D(inputTexture, uv);
    }`);

const GLSL_CONTROL_MASK_SINGLE_BIT_CONSTRAINT = new WglShader(`
    /** The width and height of the textures being operated on. */
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
        gl_FragColor = vec4(match, 0, 0, 0);
    }`);

const GLSL_CONTROL_MASK_ADD_BIT_CONSTRAINT = new WglShader(`
    /** The width and height of the textures being operated on. */
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

        gl_FragColor = vec4(match * oldMatch, 0, 0, 0);
    }`);

///**
//* Renders a control texture equal to the intersection of two input control textures. The output texture prevents any
//* operation prevented by either of the input textures.
//*/
//const GLSL_COMBINE_CONTROLS = new WglShader(`
//    /**
//     * The width and height of the textures being operated on.
//     */
//    uniform vec2 textureSize;
//
//    /**
//     * A texture with flags that determine which states get affected by operations.
//     * The red component is 1 for states that should participate, and 0 otherwise.
//     */
//    uniform sampler2D controlTexture1;
//    /**
//     * Another texture with flags that determine which states get affected by operations.
//     * The red component is 1 for states that should participate, and 0 otherwise.
//     */
//    uniform sampler2D controlTexture2;
//
//    void main() {
//        vec2 uv = gl_FragCoord.xy / textureSize.xy;
//        float c1 = texture2D(controlTexture1, uv).x;
//        float c2 = texture2D(controlTexture2, uv).x;
//        gl_FragColor = vec4(c1 * c2, 0, 0, 0);
//    }`);

///**
// * Encodes the red, green, blue, or alpha floating point component of the texture;s pixels so that, when read as bytes,
// * the output holds (roughly) IEEE single-precision float data.
// */
//const GLSL_PACK_COMPONENT_FLOAT_INTO_BYTES = new WglShader(`
//    uniform vec2 textureSize;
//    uniform int selector;
//    uniform sampler2D texture;
//
//    vec4 encode_float(float val) {
//        // Zero? Avoid log(0).
//        if (val == 0.0) {
//            return vec4(0, 0, 0, 0);
//        }
//
//        // Extract sign chunks.
//        float s1 = float(val < 0.0) * 128.0;
//        val = abs(val);
//
//        // Extract exponent chunks.
//        float exponent = floor(log(val) / log(2.0));
//        float e1 = floor(exponent/2.0 + 32.0);
//        float e2 = mod(exponent, 2.0) * 128.0;
//
//        // Extract mantissa chunks.
//        float mantissa = val / pow(2.0, exponent) - 1.0;
//        mantissa *= 128.0;
//        float m1 = floor(mantissa);
//        mantissa -= m1;
//        mantissa *= 256.0;
//        float m2 = floor(mantissa);
//        mantissa -= m2;
//        mantissa *= 256.0;
//        float m3 = floor(mantissa);
//
//        // Pack into bytes as IEEE single-precision float.
//        return vec4(m3, m2, e2 + m1, s1 + e1) / 255.0;
//    }
//
//    void main() {
//        vec2 uv = gl_FragCoord.xy / textureSize.xy;
//        vec4 data = texture2D(texture, uv);
//        float f;
//        if (selector == 0) {
//            f = data.r;
//        } else if (selector == 1) {
//            f = data.g;
//        } else if (selector == 2) {
//            f = data.b;
//        } else {
//            f = data.a;
//        }
//        gl_FragColor = encode_float(f);
//    }`);

///**
// * Renders the result of applying a custom optionally-controlled single-qubit operation to a superposition.
// */
//const GLSL_APPLY_CUSTOM_QUBIT_OPERATION = new WglShader(`
//    /**
//     * A texture holding the complex coefficients of the superposition to operate on.
//     * The real components are in the red component, and the imaginary components are in the green component.
//     */
//    uniform sampler2D inputTexture;
//
//    /**
//     * A texture with flags that determine which states get affected by the operation.
//     * The red component is 1 for states that should participate, and 0 otherwise.
//     */
//    uniform sampler2D controlTexture;
//
//    /**
//     * The width and height of the textures being operated on.
//     */
//    uniform vec2 textureSize;
//
//    /**
//     * A power of two (2^n) with the exponent n determined by the index of the qubit to operate on.
//     */
//    uniform float qubitIndexMask;
//
//    /**
//     * The row-wise complex coefficients of the matrix to apply. Laid out normally, they would be:
//     * M = |a b|
//     *     |c d|
//     */
//    uniform vec2 matrix_a, matrix_b, matrix_c, matrix_d;
//
//    ${snippets.filterBit}
//    ${snippets.toggleBit}
//    ${snippets.stateToPixelUv}
//
//    void main() {
//
//        // Which part of the multiplication are we doing?
//        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
//        vec2 pixelUv = gl_FragCoord.xy / textureSize;
//        float state = pixelXy.y * textureSize.x + pixelXy.x;
//        float opposingState = toggleBit(state, qubitIndexMask);
//        vec2 opposingPixelUv = stateToPixelUv(opposingState);
//        bool targetBitIsOff = state < opposingState;
//
//        // Does this part of the superposition match the controls?
//        bool blockedByControls = texture2D(controlTexture, pixelUv).x == 0.0;
//        if (blockedByControls) {
//            gl_FragColor = texture2D(inputTexture, pixelUv);
//            return;
//        }
//
//        // The row we operate against is determined by the output pixel's operated-on-bit's value
//        vec2 c1, c2;
//        if (targetBitIsOff) {
//            c1 = matrix_a;
//            c2 = matrix_b;
//        } else {
//            c1 = matrix_d;
//            c2 = matrix_c;
//        }
//
//        // Do (our part of) the matrix multiplication
//        vec4 amplitudeCombo = vec4(texture2D(inputTexture, pixelUv).xy,
//                                   texture2D(inputTexture, opposingPixelUv).xy);
//        vec4 dotReal = vec4(c1.x, -c1.y,
//                            c2.x, -c2.y);
//        vec4 dotImag = vec4(c1.y, c1.x,
//                            c2.y, c2.x);
//        vec2 outputAmplitude = vec2(dot(amplitudeCombo, dotReal),
//                                    dot(amplitudeCombo, dotImag));
//
//        gl_FragColor = vec4(outputAmplitude, 0, 0);
//
//    }`);

///**
// * Renders a texture storing the same data as a given texture.
// */
//const GLSL_OVERLAY = new WglShader(`
//    uniform vec2 backgroundTextureSize;
//    uniform vec2 foregroundTextureSize;
//    uniform sampler2D backgroundTexture;
//    uniform sampler2D foregroundTexture;
//    uniform vec2 xy;
//
//    void main() {
//        vec2 uv = (gl_FragCoord.xy - xy) / foregroundTextureSize.xy;
//        if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x < 1.0 && uv.y < 1.0) {
//          gl_FragColor = texture2D(foregroundTexture, uv);
//        } else {
//          uv = gl_FragCoord.xy / backgroundTextureSize;
//          gl_FragColor = texture2D(backgroundTexture, uv);
//        }
//    }`);

///**
// * Turns the amplitude stored at each pixel into a probability.
// */
//const GLSL_FROM_AMPLITUDES_TO_PROBABILITIES = new WglShader(`
//    uniform vec2 textureSize;",
//    uniform sampler2D inputTexture;",
//
//    void main() {
//        vec2 uv = gl_FragCoord.xy / textureSize.xy;
//        vec4 amps = texture2D(inputTexture, uv);
//        float p = dot(amps, amps);
//        gl_FragColor = vec4(p, 0, 0, 0);
//    }`);

///**
// * Incrementally combines probabilities so that each pixel ends up corresponding to a mask and their value is the sum
// * of all probabilities matching the mask.
// */
//const GLSL_CONDITIONAL_PROBABILITIES_PIPELINE = new WglShader(`
//    uniform vec2 textureSize;
//    uniform sampler2D inputTexture;
//    uniform float stepPower;
//    uniform bool conditionValue;
//
//    ${snippets.stateToPixelUv}
//    ${snippets.filterBit}
//
//    void main() {
//        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
//        vec2 pixelUv = gl_FragCoord.xy / textureSize;
//        float state = pixelXy.y * textureSize.x + pixelXy.x;
//
//        float hasBit = filterBit(state, stepPower);
//        vec4 probability = texture2D(inputTexture, pixelUv);
//        if ((hasBit == 0.0) == conditionValue) {
//            float toggleSign = float(conditionValue)*2.0 - 1.0;
//            probability += texture2D(inputTexture, stateToPixelUv(state + stepPower * toggleSign));
//        }
//        gl_FragColor = probability;
//    }`);

export default class Shades {
    /**
     * Renders the given color data onto the destination texture.
     *
     * @param {!WglWorkArea} workArea
     * @param {!WglTexture} destinationTexture
     * @param {!Float32Array} pixelColorData
     */
    static renderPixelColorData(workArea, destinationTexture, pixelColorData) {
        U.need(pixelColorData.length === destinationTexture.width * destinationTexture.height * 4);
        workArea.render(destinationTexture, GLSL_PASS_THROUGH, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.dataTexture("sourceTexture", pixelColorData, destinationTexture.width, destinationTexture.height)
        ]);
    };

    /**
     * Renders a control mask onto the destination texture, used elsewhere for determining whether or not an operation
     * applies to each pixel. Wherever the control mask's red component is 0, instead of 1, controllable operations are
     * blocked.
     *
     * @param {!WglWorkArea} workArea
     * @param {!WglTexture} destinationTexture
     * @param {!int} targetBit
     * @param {!boolean} desiredBitValue
     */
    static renderSingleBitConstraintControlMask(workArea, destinationTexture, targetBit, desiredBitValue) {
        workArea.render(destinationTexture, GLSL_CONTROL_MASK_SINGLE_BIT_CONSTRAINT, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.float("targetBitPositionMask", 1 << targetBit),
            WglArg.float("desiredBitValue", desiredBitValue ? 1 : 0)
        ]);
    };

    /**
     * Renders a combined control mask onto the destination texture, augmenting the given control mask with a new bit
     * constraint.
     *
     * @param {!WglWorkArea} workArea
     * @param {!WglTexture} destinationTexture
     * @param {!WglTexture} controlMask
     * @param {!int} targetBit
     * @param {!boolean} desiredBitValue
     */
    static renderAddBitConstraintToControlMask(workArea, destinationTexture, controlMask, targetBit, desiredBitValue) {
        workArea.render(destinationTexture, GLSL_CONTROL_MASK_ADD_BIT_CONSTRAINT, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.texture("oldControlMaskTexture", controlMask),
            WglArg.float("targetBitPositionMask", 1 << targetBit),
            WglArg.float("desiredBitValue", desiredBitValue ? 1 : 0)
        ]);
    };
}
