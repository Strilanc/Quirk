import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"

let BitCountGates = {};

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 * @param {!int} srcOffset
 * @param {!int} srcSpan
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
function popCountOffsetShader(ctx, span, srcOffset, srcSpan, scaleFactor) {
    return POP_COUNT_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("srcOffset", 1 << srcOffset),
        WglArg.float("srcSpan", 1 << srcSpan),
        WglArg.float("factor", scaleFactor));
}
const POP_COUNT_SHADER = ketShaderPermute(
    'uniform float srcOffset, srcSpan, factor;',
    `
        float d = mod(floor(full_out_id / srcOffset), srcSpan);
        float popcnt = 0.0;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT}; i++) {
            popcnt += mod(d, 2.0);
            d = floor(d / 2.0);
        }
        float offset = mod(popcnt * factor, span);
        return mod(out_id + span - offset, span);`);

BitCountGates.PlusBitCountAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+1s(A)",
    "Bit Count Gate [input A]",
    "Counts the number of ON bits in 'input A' and adds that into this output.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withHeight(span).
    withSerializedId("+cntA" + span).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => {
        let {offset: inputOffset, length: inputLength} = ctx.customContextFromGates.get('Input Range A');
        return popCountOffsetShader(ctx, span, inputOffset, inputLength, +1);
    }));

BitCountGates.MinusBitCountAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-1s(A)",
    "Bit Un-Count Gate [input A]",
    "Counts the number of ON bits in 'input A' and subtracts that into this output.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withHeight(span).
    withSerializedId("-cntA" + span).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => {
        let {offset: inputOffset, length: inputLength} = ctx.customContextFromGates.get('Input Range A');
        return popCountOffsetShader(ctx, span, inputOffset, inputLength, -1);
    }));

BitCountGates.all = [
    ...BitCountGates.PlusBitCountAFamily.all,
    ...BitCountGates.MinusBitCountAFamily.all
];

export {BitCountGates}
