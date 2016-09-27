import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Config} from "src/Config.js"
import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"
import {seq, Seq} from "src/base/Seq.js"
import {WglConfiguredShader, WglShader} from "src/webgl/WglShader.js"

/**
 * @param {!WglTexture} inputTexture Superposition stored as a grid of amplitudes.
 * @param {!WglTexture} controlTexture 1 at affected amplitudes, 0 at protected amplitudes.
 * @param {!int} qubitIndex Location of the gate.
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 * @returns {!WglConfiguredShader} A configured shader that renders the output superposition (as a grid of amplitudes).
 */
function controlledPhaseGradient(inputTexture, controlTexture, qubitIndex, qubitSpan, factor=1) {
    return new WglConfiguredShader(destinationTexture => {
        CONTROLLED_PHASE_GRADIENT_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("qubitSpan", 1 << (qubitSpan-1)),
            WglArg.float("factor", factor)
        ).renderTo(destinationTexture);
    });
}
const CONTROLLED_PHASE_GRADIENT_SHADER = new WglShader(`
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
        float hold = mod(floor(state / qubitIndex / qubitSpan), 2.0);
        float step = mod(floor(state / qubitIndex), qubitSpan);
        float angle = step * factor * 3.141592653589793 / qubitSpan;
        float c = cos(angle);
        float s = sin(angle);
        mat2 rot = mat2(c, s, -s, c);

        vec2 uv = toUv(state);
        float control = texture2D(controlTexture, uv).x * hold;
        vec2 inAmp = texture2D(inputTexture, uv).xy;
        vec2 outAmp = control*(rot*inAmp) + (1.0-control)*inAmp;
        gl_FragColor = vec4(outAmp.x, outAmp.y, 0.0, 0.0);
    }`);

const τ = Math.PI * 2;
const FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => Complex.polar(Math.pow(0.5, span/2), τ*r*c/(1<<span)));
const INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    FOURIER_TRANSFORM_MATRIX_MAKER(span).adjoint();

let FourierTransformGates = {};

let swapShaders = n => Seq.range(Math.floor(n/2)).map(i => args => CircuitShaders.swap(
    args.stateTexture,
    args.row + i,
    args.row + n - i - 1,
    args.controlsTexture));
let gradShaders = (n, factor) => Seq.range(n).
    flatMap(i => [
        args => controlledPhaseGradient(
            args.stateTexture,
            args.controlsTexture,
            args.row,
            i + 1,
            factor),
        args => GateShaders.matrixOperation(
            args.withRow(args.row + i),
            Matrix.HADAMARD)
    ]).
    skip(1);

FourierTransformGates.FourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT",
    "Fourier Transform Gate",
    "Transforms to/from phase frequency space.").
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT" + span).
    withHeight(span).
    withCustomShaders(swapShaders(span).concat(gradShaders(span, 1)).toArray()));

FourierTransformGates.InverseFourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT^†",
    "Inverse Fourier Transform Gate",
    "Transforms from/to phase frequency space.").
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT†" + span).
    withHeight(span).
    withCustomShaders(swapShaders(span).concat(gradShaders(span, -1)).reverse().toArray()));

FourierTransformGates.all = [
    ...FourierTransformGates.FourierTransformFamily.all,
    ...FourierTransformGates.InverseFourierTransformFamily.all
];

export {controlledPhaseGradient, FourierTransformGates}
