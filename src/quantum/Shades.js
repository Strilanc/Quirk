import U from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglDirector from "src/webgl/WglDirector.js"
import Matrix from "src/linalg/Matrix.js"
import ControlMask from "src/quantum/ControlMask.js"

export default class Shades {
    /**
     * Renders the given color components onto the entire destination texture.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!number} r
     * @param {!number} g
     * @param {!number} b
     * @param {!number} a
     */
    static renderUniformColor(director, destinationTexture, r, g, b, a) {
        director.render(destinationTexture, GLSL_UNIFORM_COLOR, [
            WglArg.vec4("color", r, g, b, a)
        ]);
    };

    /**
     * Renders the given color components onto the entire destination texture.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!int} state
     */
    static renderClassicalState(director, destinationTexture, state) {
        let x = state % destinationTexture.width;
        let y = (state - x) / destinationTexture.width;
        director.render(destinationTexture, GLSL_SET_SINGLE_PIXEL, [
            WglArg.vec2("pixel", x, y)
        ]);
    };

    /**
     * Renders the given color data onto the destination texture.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!Float32Array} pixelColorData
     */
    static renderPixelColorData(director, destinationTexture, pixelColorData) {
        let [w, h] = [destinationTexture.width, destinationTexture.height];
        U.need(pixelColorData.length === w * h * 4);

        director.useRawDataTextureIn(w, h, pixelColorData, texture => {
            director.render(destinationTexture, GLSL_PASS_THROUGH, [
                WglArg.vec2("textureSize", w, h),
                WglArg.rawTexture("sourceTexture", texture)
            ]);
        });
    };

    /**
     * Renders a texture by, effectively, drawing the given background texture then overlaying the given foreground
     * texture over the background using the given offset.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!int} foregroundX
     * @param {!int} foregroundY
     * @param {!WglTexture} foregroundTexture
     * @param {!WglTexture} backgroundTexture
     */
    static renderOverlayed(director, destinationTexture, foregroundX, foregroundY, foregroundTexture, backgroundTexture) {
        director.render(destinationTexture, GLSL_OVERLAY, [
            WglArg.vec2("backgroundTextureSize", backgroundTexture.width, backgroundTexture.height),
            WglArg.vec2("foregroundTextureSize", foregroundTexture.width, foregroundTexture.height),
            WglArg.texture("backgroundTexture", backgroundTexture),
            WglArg.texture("foregroundTexture", foregroundTexture),
            WglArg.vec2("foregroundOffset", foregroundX, foregroundY)
        ]);
    }

    /**
     * Renders a control mask onto the destination texture, used elsewhere for determining whether or not an operation
     * applies to each pixel. Wherever the control mask's red component is 0, instead of 1, controllable operations are
     * blocked.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!int} targetBit
     * @param {!boolean} desiredBitValue
     */
    static renderSingleBitConstraintControlMask(director, destinationTexture, targetBit, desiredBitValue) {
        director.render(destinationTexture, GLSL_CONTROL_MASK_SINGLE_BIT_CONSTRAINT, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.float("targetBitPositionMask", 1 << targetBit),
            WglArg.float("desiredBitValue", desiredBitValue ? 1 : 0)
        ]);
    };

    /**
     * Renders a combined control mask onto the destination texture, augmenting the given control mask with a new bit
     * constraint.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!WglTexture} controlMask
     * @param {!int} targetBit
     * @param {!boolean} desiredBitValue
     */
    static renderAddBitConstraintToControlMask(director, destinationTexture, controlMask, targetBit, desiredBitValue) {
        director.render(destinationTexture, GLSL_CONTROL_MASK_ADD_BIT_CONSTRAINT, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.texture("oldControlMaskTexture", controlMask),
            WglArg.float("targetBitPositionMask", 1 << targetBit),
            WglArg.float("desiredBitValue", desiredBitValue ? 1 : 0)
        ]);
    };

    /**
     * Renders a texture with each pixel storing the probability associated with the amplitude from the corresponding
     * pixel in the input texture.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!WglTexture} inputAmplitudeTexture
     */
    static renderProbabilitiesFromAmplitudes(director, destinationTexture, inputAmplitudeTexture) {
        director.render(destinationTexture, GLSL_FROM_AMPLITUDES_TO_PROBABILITIES, [
            WglArg.vec2("textureSize", inputAmplitudeTexture.width, inputAmplitudeTexture.height),
            WglArg.texture("inputTexture", inputAmplitudeTexture)
        ]);
    };

    /**
     * Incrementally combines probabilities so that each pixel ends up corresponding to a mask and their value is the
     * sum of all probabilities matching a mask.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!WglTexture} inputTexture
     * @param {!int} step
     * @param {!boolean} requiredBitValue
     */
    static renderConditionalProbabilitiesPipeline(director, destinationTexture, inputTexture, step, requiredBitValue) {
        director.render(destinationTexture, GLSL_CONDITIONAL_PROBABILITIES_PIPELINE, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.texture("inputTexture", inputTexture),
            WglArg.float("stepPower", 1 << step),
            WglArg.bool("conditionValue", requiredBitValue)
        ]);
    };

    /**
     * Renders a control mask texture corresponding to the given control mask.
     * Two workspace textures are needed in order to build up the result; the result of the method indicates which one
     * contains the final result.
     *
     * @param {!WglDirector} director
     * @param {!ControlMask} controlMask
     * @param {!WglTexture} workspace1
     * @param {!WglTexture} workspace2
     * @returns {!{result: !WglTexture, available: !WglTexture}}
     */
    static renderControlMask(director, controlMask, workspace1, workspace2) {
        // Special case: no constraints.
        if (controlMask.inclusionMask === 0) {
            Shades.renderUniformColor(director, workspace1, 1, 0, 0, 0);
            return {result: workspace1, available: workspace2};
        }

        let hasFirst = false;
        for (let i = 0; (1 << i) <= controlMask.inclusionMask; i++) {
            let c = controlMask.desiredValueFor(i);
            if (c === null) {
                continue;
            }
            //noinspection JSValidateTypes
            /** @type {!boolean} */
            let b = c;
            if (hasFirst) {
                Shades.renderAddBitConstraintToControlMask(director, workspace2, workspace1, i, b);
                let t = workspace2;
                workspace2 = workspace1;
                workspace1 = t;
            } else {
                Shades.renderSingleBitConstraintControlMask(director, workspace1, i, b);
                hasFirst = true;
            }
        }

        return {result: workspace1, available: workspace2};
    };

    /**
     * Renders a texture with probability sums corresponding to states matching various combinations of controls.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} workspace1
     * @param {!WglTexture} workspace2
     * @param {!int} mask Each bit in the mask determines whether the control is must-be-on (1) or must-be-off (0)
     * @param {!WglTexture} amplitudes
     * @returns {!{result: !WglTexture, available: !WglTexture}}
     */
    static renderControlCombinationProbabilities(director, workspace1, workspace2, mask, amplitudes) {
        Shades.renderProbabilitiesFromAmplitudes(director, workspace1, amplitudes);
        let n = amplitudes.width * amplitudes.height;
        for (let i = 0; (1 << i) < n; i++) {
            Shades.renderConditionalProbabilitiesPipeline(director, workspace2, workspace1, i, (mask & (1 << i)) !== 0);
            let t = workspace2;
            workspace2 = workspace1;
            workspace1 = t;
        }
        return {result: workspace1, available: workspace2};
    };

    /**
     * Renders the result of applying a custom controlled single-qubit operation to a superposition.
     *
     * @param {!WglDirector} director
     * @param {!WglTexture} destinationTexture
     * @param {!WglTexture} inputTexture
     * @param {!Matrix} operation
     * @param {!int} qubitIndex
     * @param {!WglTexture} controlTexture
     */
    static renderQubitOperation(director, destinationTexture, inputTexture, operation, qubitIndex, controlTexture) {
        U.need(operation.width() === 2 && operation.height() === 2);
        let [[a, b], [c, d]] = operation.rows;
        director.render(destinationTexture, GLSL_APPLY_CUSTOM_QUBIT_OPERATION, [
            WglArg.vec2("textureSize", destinationTexture.width, destinationTexture.height),
            WglArg.texture("inputTexture", inputTexture),
            WglArg.float("qubitIndexMask", 1 << qubitIndex),
            WglArg.texture("controlTexture", controlTexture),
            WglArg.vec2("matrix_a", a.real, a.imag),
            WglArg.vec2("matrix_b", b.real, b.imag),
            WglArg.vec2("matrix_c", c.real, c.imag),
            WglArg.vec2("matrix_d", d.real, d.imag)
        ]);
    };


}

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

const GLSL_UNIFORM_COLOR = new WglShader(`
    /** The uniform color to render. */
    uniform vec4 color;

    void main() {
        gl_FragColor = color;
    }`);

const GLSL_SET_SINGLE_PIXEL = new WglShader(`
    /** The location of the single pixel to set. */
    uniform vec2 pixel;

    void main() {
        vec2 d = gl_FragCoord.xy - vec2(0.5, 0.5) - pixel;
        float f = float(d == vec2(0, 0));
        gl_FragColor = vec4(f, 0, 0, 0);
    }`);

const GLSL_PASS_THROUGH = new WglShader(`
    /** The width and height of the textures being operated on. */
    uniform vec2 textureSize;

    /** The texture to pass through. */
    uniform sampler2D inputTexture;

    void main() {
        vec2 uv = gl_FragCoord.xy / textureSize.xy;
        gl_FragColor = texture2D(inputTexture, uv);
    }`);

/**
 * Renders a texture storing the same data as a given texture.
 */
const GLSL_OVERLAY = new WglShader(`
    /** The size of the covered texture. */
    uniform vec2 backgroundTextureSize;

    /** The size of the covering texture. */
    uniform vec2 foregroundTextureSize;

    /** The larger covered texture. */
    uniform sampler2D backgroundTexture;

    /** The smaller covering texture that can be positioned. */
    uniform sampler2D foregroundTexture;

    /** The top-left corner of the area where the foreground is overlaid over the background. */
    uniform vec2 foregroundOffset;

    void main() {
        vec2 uv = (gl_FragCoord.xy - foregroundOffset) / foregroundTextureSize.xy;
        if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x < 1.0 && uv.y < 1.0) {
          gl_FragColor = texture2D(foregroundTexture, uv);
        } else {
          uv = gl_FragCoord.xy / backgroundTextureSize;
          gl_FragColor = texture2D(backgroundTexture, uv);
        }
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

const GLSL_FROM_AMPLITUDES_TO_PROBABILITIES = new WglShader(`
    /** The width and height of the textures being operated on. */
    uniform vec2 textureSize;

    /** The texture of amplitudes, to be converted into probabilities. */
    uniform sampler2D inputTexture;

    void main() {
        vec2 uv = gl_FragCoord.xy / textureSize.xy;
        vec4 amps = texture2D(inputTexture, uv);
        float p = dot(amps, amps);
        gl_FragColor = vec4(p, 0, 0, 0);
    }`);

const GLSL_CONDITIONAL_PROBABILITIES_PIPELINE = new WglShader(`
    /** The width and height of the textures being operated on. */
    uniform vec2 textureSize;

    /** The input texture, or output of the previous step. */
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

const GLSL_APPLY_CUSTOM_QUBIT_OPERATION = new WglShader(`
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

        gl_FragColor = vec4(outputAmplitude, 0, 0);

    }`);
