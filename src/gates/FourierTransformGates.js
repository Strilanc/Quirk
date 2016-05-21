import CircuitShaders from "src/circuit/CircuitShaders.js"
import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"
import WglArg from "src/webgl/WglArg.js"
import {seq, Seq} from "src/base/Seq.js"
import {WglConfiguredShader, WglShader} from "src/webgl/WglShader.js"

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @param {!int} stepIndex
 * @returns {!WglConfiguredShader}
 */
let fourierTransformStep = (inputTexture, controlTexture, qubitIndex, stepIndex) =>
    new WglConfiguredShader(destinationTexture => {
        FOURIER_TRANSFORM_STEP_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("qubitIndex", 1 << qubitIndex),
            WglArg.float("stepIndex", 1 << stepIndex)
        ).renderTo(destinationTexture);
    });
const FOURIER_TRANSFORM_STEP_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float qubitIndex;
    uniform float stepIndex;

    vec2 toUv(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float targetIndex = qubitIndex * stepIndex;
        float bit = mod(floor(state / targetIndex), 2.0);
        float state0 = state - bit*targetIndex;
        float state1 = state0 + targetIndex;

        float control = texture2D(controlTexture, toUv(state)).x;
        vec2 amp0 = texture2D(inputTexture, toUv(state0)).xy;
        vec2 amp1 = texture2D(inputTexture, toUv(state1)).xy;

        float phase1 = -mod(floor(state / qubitIndex), stepIndex) * 3.141592653589793 / stepIndex;
        float c = cos(phase1);
        float s = sin(phase1);
        mat2 rot = mat2(c,-s,
                        s, c);
        vec2 phasedAmp1 = rot*amp1;

        vec2 outAmp = (amp0 + phasedAmp1*(1.0-bit*2.0))*sqrt(0.5);
        vec2 inAmp = bit*amp1 + (1.0-bit)*amp0;
        vec2 amp = control*outAmp + (1.0-control)*inAmp;
        gl_FragColor = vec4(amp.x, amp.y, 0.0, 0.0);
    }`);

const τ = Math.PI * 2;
const FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => Complex.polar(Math.pow(0.5, span/2), τ*r*c/(1<<span)));

let FourierTransformGates = {};

FourierTransformGates.FourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT",
    "Fourier Transform Gate",
    "Transforms to/from phase frequency space.").
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT" + span).
    withHeight(span).
    withCustomShaders(
        Seq.range(Math.floor(span/2)).
            map(i => (val, con, bit) => CircuitShaders.swap(val, bit + i, bit + span - i - 1, con)).
            concat(Seq.range(span).
                map(i => (val, con, bit) => fourierTransformStep(val, con, bit, i))).
            toArray()));

FourierTransformGates.all = [
    ...FourierTransformGates.FourierTransformFamily.all
];

export default FourierTransformGates;
export {fourierTransformStep, FourierTransformGates}
