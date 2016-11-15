import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShader} from "src/circuit/KetShaderUtil.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

/**
 * @param {!CircuitEvalContext} ctx
 * @returns {!WglConfiguredShader}
 */
let universalNot = ctx => UNIVERSAL_NOT_SHADER.withArgs(...ketArgs(ctx));
const UNIVERSAL_NOT_SHADER = ketShader(
    '',
    'vec2 other = inp(1.0 - out_id); return vec2(other.x, -other.y) * (1.0 - 2.0 * out_id);',
    1);

let UniversalNotGate = Gate.withoutKnownMatrix(
    "UniNot",
    "Universal Not Gate",
    "Mirrors through the origin of the Bloch sphere.\nImpossible in practice.").
    markedAsStable().
    withCustomShader(universalNot).
    withSerializedId("__unstable__UniversalNot");

export {universalNot, UniversalNotGate}
