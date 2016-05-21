import Gate from "src/circuit/Gate.js"
import Matrix from "src/math/Matrix.js"
import Util from "src/base/Util.js"
import WglArg from "src/webgl/WglArg.js"
import { WglConfiguredShader, WglShader } from "src/webgl/WglShader.js"

let CycleBitsGates = {};

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @param {!int} qubitSpan
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
let cycleBits = (inputTexture, controlTexture, qubitIndex, qubitSpan, shiftAmount) =>
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

const CYCLE_BITS_MATRIX_MAKER = (shift, span) => Matrix.generate(1<<span, 1<<span, (r, c) => {
    shift = Util.properMod(shift, span);
    let expected = r;
    let input = c;
    let actual = input << shift;
    actual = (actual & ((1 << span) - 1)) | (actual >> span);
    return expected === actual ? 1 : 0;
});

CycleBitsGates.CycleBitsFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "<<1",
    "Bit Cycle Gate",
    "Swaps bits in a cycle.").
    markedAsStable().
    markedAsOnlyPermutingAndPhasing().
    withKnownMatrix(span >= 4 ? undefined : CYCLE_BITS_MATRIX_MAKER(1, span)).
    withSerializedId("__unstable__<<1_" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => cycleBits(val, con, bit, span, 1)));

CycleBitsGates.ReverseCycleBitsFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    ">>1",
    "Bit Cycle Gate",
    "Swaps bits in a cycle.").
    markedAsStable().
    markedAsOnlyPermutingAndPhasing().
    withKnownMatrix(span >= 4 ? undefined : CYCLE_BITS_MATRIX_MAKER(-1, span)).
    withSerializedId("__unstable__>>1_" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => cycleBits(val, con, bit, span, -1)));

CycleBitsGates.all = [
    ...CycleBitsGates.CycleBitsFamily.all,
    ...CycleBitsGates.ReverseCycleBitsFamily.all
];

export default CycleBitsGates;
export {CycleBitsGates, cycleBits};
