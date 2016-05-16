import DetailedError from "src/base/DetailedError.js"
import Shaders from "src/webgl/Shaders.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import { WglConfiguredShader } from "src/webgl/WglShader.js"

/**
 * Defines shader-based operations used by display gates.
 */
export default class DisplayShaders {}

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTex
 * @returns {!WglConfiguredShader}
 */
DisplayShaders.amplitudesToProbabilities = (inputTexture, controlTex) => new WglConfiguredShader(destinationTexture =>
    AMPLITUDES_TO_PROBABILITIES_SHADER.withArgs(
        WglArg.texture('inputTexture', inputTexture, 0),
        WglArg.texture('controlTexture', controlTex, 1),
        WglArg.vec2('inputSize', inputTexture.width, inputTexture.height),
        WglArg.float('outputWidth', destinationTexture.width)
    ).renderTo(destinationTexture));
const AMPLITUDES_TO_PROBABILITIES_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }
    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        vec2 uv = toUv(state);
        vec4 amp = texture2D(inputTexture, uv);
        float con = texture2D(controlTexture, uv).x;
        float p = con * dot(amp, amp);
        gl_FragColor = vec4(p, 0.0, 0.0, 0.0);
    }`);

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} qubitSpan
 * @returns {!WglConfiguredShader}
 */
DisplayShaders.amplitudesToDensities = (inputTexture, qubitSpan) => new WglConfiguredShader(destinationTexture => {
    let outArea = destinationTexture.width*destinationTexture.height;
    let inArea = inputTexture.width*inputTexture.height;
    if (outArea !== inArea << qubitSpan) {
        throw new DetailedError("Wrong destination size.", {inputTexture, qubitSpan, destinationTexture});
    }
    AMPLITUDES_TO_DENSITIES_SHADER.withArgs(
        WglArg.texture('inputTexture', inputTexture, 0),
        WglArg.vec2('inputSize', inputTexture.width, inputTexture.height),
        WglArg.float('outputWidth', destinationTexture.width),
        WglArg.float('qubitSpan', 1 << qubitSpan)
    ).renderTo(destinationTexture)
});
const AMPLITUDES_TO_DENSITIES_SHADER = new WglShader(`
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform sampler2D inputTexture;
    uniform float qubitSpan;

    vec2 toUv(float state) {
        return vec2(mod(state, inputSize.x) + 0.5, floor(state / inputSize.x) + 0.5) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;

        float stateKet = mod(state, qubitSpan);
        float stateBra = mod(floor(state / qubitSpan), qubitSpan);
        float stateOther = floor(state / qubitSpan / qubitSpan);

        vec2 uvKet = toUv(stateKet + stateOther*qubitSpan);
        vec2 uvBra = toUv(stateBra + stateOther*qubitSpan);

        vec2 ampKet = texture2D(inputTexture, uvKet).xy;
        vec2 ampBra = texture2D(inputTexture, uvBra).xy;
        float r = dot(ampKet, ampBra);
        float i = dot(ampKet, vec2(-ampBra.y, ampBra.x));

        gl_FragColor = vec4(r, i, 0.0, 0.0);
    }`);
