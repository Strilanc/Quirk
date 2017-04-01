import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"

let BitCountGates = {};

const POP_COUNT_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float d = read_input_A();
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
    withHeight(span).
    withSerializedId("+cntA" + span).
    withKnownPermutation((t, a) => (t + Util.numberOfSetBits(a)) & ((1 << span) - 1)).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => POP_COUNT_SHADER.withArgs(...ketArgs(ctx, span, ['A']), WglArg.float("factor", +1))));

BitCountGates.MinusBitCountAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-1s(A)",
    "Bit Un-Count Gate [input A]",
    "Counts the number of ON bits in 'input A' and subtracts that into this output.").
    withHeight(span).
    withSerializedId("-cntA" + span).
    withKnownPermutation((t, a) => (t - Util.numberOfSetBits(a)) & ((1 << span) - 1)).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => POP_COUNT_SHADER.withArgs(...ketArgs(ctx, span, ['A']), WglArg.float("factor", -1))));

BitCountGates.all = [
    ...BitCountGates.PlusBitCountAFamily.all,
    ...BitCountGates.MinusBitCountAFamily.all
];

export {BitCountGates}
