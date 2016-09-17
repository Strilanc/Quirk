import {Gate} from "src/circuit/Gate.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader, WglShader} from "src/webgl/WglShader.js"

/**
 * @param {!WglTexture} inputTexture
 * @param {!WglTexture} controlTexture
 * @param {!int} qubitIndex
 * @returns {!WglConfiguredShader}
 */
let universalNot = (inputTexture, controlTexture, qubitIndex) =>
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

let UniversalNotGate = Gate.withoutKnownMatrix(
    "UniNot",
    "Universal Not Gate",
    "Mirrors through the origin of the Bloch sphere.\nImpossible in practice.").
    markedAsStable().
    withCustomShader(args => universalNot(args.stateTexture, args.controlsTexture, args.row)).
    withSerializedId("__unstable__UniversalNot").
    markedAsAffectsOtherWires();

export {universalNot, UniversalNotGate}
