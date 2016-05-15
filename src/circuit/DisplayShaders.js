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
