import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"
import WglArg from "src/webgl/WglArg.js"
import { WglConfiguredShader, WglShader } from "src/webgl/WglShader.js"

const τ = Math.PI * 2;
const GRADIENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => r === c ? Complex.polar(1, τ*r/(2<<span)) : 0);
const DE_GRADIENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => r === c ? Complex.polar(1, -τ*r/(2<<span)) : 0);

/**
 * @param {!WglTexture} inputTexture Superposition stored as a grid of amplitudes.
 * @param {!WglTexture} controlTexture 1 at affected amplitudes, 0 at protected amplitudes.
 * @param {!int} qubitIndex Location of the gate.
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 * @returns {!WglConfiguredShader} A configured shader that renders the output superposition (as a grid of amplitudes).
 */
function phaseGradient(inputTexture, controlTexture, qubitIndex, qubitSpan, factor=1) {
    return new WglConfiguredShader(destinationTexture => {
        PHASE_GRADIENT_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("qubitSpan", 1 << qubitSpan),
            WglArg.float("factor", factor)
        ).renderTo(destinationTexture);
    });
}
const PHASE_GRADIENT_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float qubitIndex;
    uniform float qubitSpan;
    uniform float factor;

    vec2 toUv(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float step = mod(floor(state / qubitIndex), qubitSpan);
        float angle = step * factor * 3.141592653589793 / qubitSpan;
        float c = cos(angle);
        float s = sin(angle);
        mat2 rot = mat2(c, s, -s, c);

        vec2 uv = toUv(state);
        float control = texture2D(controlTexture, uv).x;
        vec2 inAmp = texture2D(inputTexture, uv).xy;
        vec2 outAmp = control*(rot*inAmp) + (1.0-control)*inAmp;
        gl_FragColor = vec4(outAmp.x, outAmp.y, 0.0, 0.0);
    }`);

let PhaseGradientGates = {};

PhaseGradientGates.PhaseGradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^#",
    "Phase Gradient Gate",
    "Phases by an amount proportional to the little endian number represented by a block of qubits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseGradient" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => phaseGradient(val, con, bit, span)));

PhaseGradientGates.PhaseDegradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "Z^-#",
    "Inverse Phase Gradient Gate",
    "Phases by a negative amount proportional to the little endian number represented by a block of qubits.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DE_GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseUngradient" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => phaseGradient(val, con, bit, span, -1)));

PhaseGradientGates.all = [
    ...PhaseGradientGates.PhaseGradientFamily.all,
    ...PhaseGradientGates.PhaseDegradientFamily.all
];

export default PhaseGradientGates;
export { PhaseGradientGates, phaseGradient }
