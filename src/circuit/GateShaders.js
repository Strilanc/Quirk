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
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @returns {!WglConfiguredShader}
 */
GateShaders.universalNot = (inputTexture, controlTexture, qubitIndex) =>
    new WglConfiguredShader(destinationTexture => {
        UNIVERSAL_NOT_SHADER.withArgs(
            WglArg.texture("inputTexture", inputTexture, 0),
            WglArg.texture("controlTexture", controlTexture, 1),
            WglArg.float("outputWidth", destinationTexture.width),
            WglArg.vec2("inputSize", inputTexture.width, inputTexture.height),
            WglArg.float("bit", 1 << qubitIndex)
        ).renderTo(destinationTexture);
    });
const UNIVERSAL_NOT_SHADER = new WglShader(`
    uniform sampler2D inputTexture;
    uniform sampler2D controlTexture;
    uniform float outputWidth;
    uniform vec2 inputSize;
    uniform float bit;

    vec2 uvFor(float state) {
        return (vec2(mod(state, inputSize.x), floor(state / inputSize.x)) + vec2(0.5, 0.5)) / inputSize;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float state = xy.y * outputWidth + xy.x;
        float hasBit = mod(floor(state / bit), 2.0);
        float partnerState = state + bit * (1.0 - 2.0 * hasBit);
        vec2 uv = uvFor(state);
        vec2 partnerUv = uvFor(partnerState);

        float control = texture2D(controlTexture, uv).x;
        vec2 val = vec4(texture2D(inputTexture, uv)).xy;
        vec2 partnerVal = vec4(texture2D(inputTexture, partnerUv)).xy;
        vec2 outUncontrolled = vec2(partnerVal.x, -partnerVal.y) * (1.0 - 2.0 * hasBit);
        vec2 outVal = (1.0 - control) * val + control * outUncontrolled;
        gl_FragColor = vec4(outVal.x, outVal.y, 0.0, 0.0);
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
