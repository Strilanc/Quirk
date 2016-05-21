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
 * Defines operations used by gates to operate on textures representing superpositions.
 */
export default class GateShaders {}

/**
 * Renders the result of applying a custom controlled single-qubit operation to a superposition.
 *
 * @param {!WglTexture} inputTexture
 * @param {!Matrix} operation
 * @param {!int} qubitIndex
 * @param {!WglTexture} controlTexture
 * @returns {!WglConfiguredShader}
 */
GateShaders.qubitOperation = (inputTexture, operation, qubitIndex, controlTexture) =>
    new WglConfiguredShader(destinationTexture => {
        Util.need(operation.width() === 2 && operation.height() === 2);
        let [ar, ai, br, bi, cr, ci, dr, di] = operation.rawBuffer();
        CUSTOM_SINGLE_QUBIT_OPERATION_SHADER.withArgs(
            WglArg.vec2("inputSize", destinationTexture.width, destinationTexture.height),
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
    uniform vec2 inputSize;

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

    float filterBit(float value, float bit) {
        value += 0.5;
        return mod(value, bit * 2.0) - mod(value, bit);
    }
    float toggleBit(float value, float bit) {
        float hasBit = filterBit(value, bit);
        return value + bit - 2.0 * hasBit;
    }
    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {

        // Which part of the multiplication are we doing?
        vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
        vec2 pixelUv = gl_FragCoord.xy / inputSize;
        float state = pixelXy.y * inputSize.x + pixelXy.x;
        float opposingState = toggleBit(state, qubitIndexMask);
        vec2 opposingPixelUv = toUv(opposingState);
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
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @param {!int} qubitSpan
 * @param {!int} incrementAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.increment = (inputTexture, controlTexture, qubitIndex, qubitSpan, incrementAmount) =>
    new WglConfiguredShader(destinationTexture => {
        INCREMENT_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("qubitSpan", 1 << qubitSpan),
            WglArg.float("incrementAmount", incrementAmount)
        ).renderTo(destinationTexture);
    });
const INCREMENT_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float incrementAmount;
    uniform float qubitIndex;
    uniform float qubitSpan;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float oldState = xy.y * outputWidth + xy.x;
        float oldStateTarget = mod(floor(oldState / qubitIndex), qubitSpan);
        float newStateTarget = mod(oldStateTarget - incrementAmount + qubitSpan, qubitSpan);
        float newState = oldState + (newStateTarget - oldStateTarget) * qubitIndex;

        vec2 oldUv = uvFor(oldState);
        float control = texture2D(controlTexture, oldUv).x;

        vec2 newUv = uvFor(newState);
        vec2 usedUv = control*newUv + (1.0-control)*oldUv;

        gl_FragColor = texture2D(inputTexture, usedUv);
    }`);

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @param {!int} qubitSrcSpan
 * @param {!int} qubitDstSpan
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
GateShaders.addition = (inputTexture, controlTexture, qubitIndex, qubitSrcSpan, qubitDstSpan, scaleFactor) =>
    new WglConfiguredShader(destinationTexture => {
        ADDITION_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("qubitSrcSpan", 1 << qubitSrcSpan),
            WglArg.float("qubitDstSpan", 1 << qubitDstSpan),
            WglArg.float("scaleFactor", scaleFactor)
        ).renderTo(destinationTexture);
    });
const ADDITION_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float scaleFactor;
    uniform float qubitIndex;
    uniform float qubitSrcSpan;
    uniform float qubitDstSpan;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float stateSrc = mod(floor(state / qubitIndex), qubitSrcSpan);
        float stateDst = mod(floor((state / qubitIndex) / qubitSrcSpan), qubitDstSpan);
        float newDst = mod(stateDst + (qubitDstSpan - stateSrc) * scaleFactor, qubitDstSpan);
        float newState = state + (newDst - stateDst) * qubitIndex * qubitSrcSpan;

        vec2 oldUv = uvFor(state);
        float control = texture2D(controlTexture, oldUv).x;

        vec2 newUv = uvFor(newState);
        vec2 usedUv = control*newUv + (1.0-control)*oldUv;

        gl_FragColor = texture2D(inputTexture, usedUv);
    }`);

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @param {!int} qubitSpan
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.cycleBits = (inputTexture, controlTexture, qubitIndex, qubitSpan, shiftAmount) =>
    new WglConfiguredShader(destinationTexture => {
        CYCLE_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("qubitSpan", 1 << qubitSpan),
            WglArg.float("shiftAmount", 1 << Util.properMod(-shiftAmount, qubitSpan))
        ).renderTo(destinationTexture);
    });
const CYCLE_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float shiftAmount;
    uniform float qubitIndex;
    uniform float qubitSpan;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float val = mod(floor(state / qubitIndex), qubitSpan);
        float newVal = val * shiftAmount;
        newVal = mod(newVal, qubitSpan) + floor(newVal / qubitSpan);
        float newState = state + (newVal - val) * qubitIndex;

        vec2 oldUv = uvFor(state);
        float control = texture2D(controlTexture, oldUv).x;

        vec2 newUv = uvFor(newState);
        vec2 usedUv = control*newUv + (1.0-control)*oldUv;

        gl_FragColor = texture2D(inputTexture, usedUv);
    }`);

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
GateShaders.cycleAllBits = (inputTexture, shiftAmount) => {
    let size = Math.floor(Math.log2(inputTexture.width * inputTexture.height));
    return new WglConfiguredShader(destinationTexture => {
        CYCLE_ALL_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("shiftAmount", 1 << Util.properMod(-shiftAmount, size))
        ).renderTo(destinationTexture);
    });
};
const CYCLE_ALL_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float shiftAmount;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float span = inputSize.x * inputSize.y;
        float state = xy.y * outputWidth + xy.x;
        float shiftedState = state * shiftAmount;
        float cycledState = mod(shiftedState, span) + floor(shiftedState / span);
        vec2 uv = uvFor(cycledState);
        gl_FragColor = texture2D(inputTexture, uv);
    }`);
