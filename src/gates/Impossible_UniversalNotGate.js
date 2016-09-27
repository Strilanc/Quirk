import {Gate} from "src/circuit/Gate.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {ketArgs, ketShader} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader, WglShader} from "src/webgl/WglShader.js"

/**
 * @param {!CircuitEvalArgs} args
 * @returns {!WglConfiguredShader}
 */
let universalNot = args => UNIVERSAL_NOT_SHADER.withArgs(...ketArgs(args));
const UNIVERSAL_NOT_SHADER = ketShader(
    'vec2 other = inp(1.0 - out_id); return vec2(other.x, -other.y) * (1.0 - 2.0 * out_id);');

let UniversalNotGate = Gate.withoutKnownMatrix(
    "UniNot",
    "Universal Not Gate",
    "Mirrors through the origin of the Bloch sphere.\nImpossible in practice.").
    markedAsStable().
    withCustomShader(universalNot).
    withSerializedId("__unstable__UniversalNot").
    markedAsAffectsOtherWires();

export {universalNot, UniversalNotGate}
