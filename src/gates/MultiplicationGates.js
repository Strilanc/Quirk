import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {
    modularMultiply,
    modularUnmultiply,
    MODULAR_INVERSE_SHADER_CODE
} from "src/gates/ModularMultiplicationGates.js"
import {WglArg} from "src/webgl/WglArg.js"

let MultiplicationGates = {};

const MULTIPLICATION_SHADER = ketShaderPermute(
    `
        uniform float input_a_offset, input_a_span;
        ${MODULAR_INVERSE_SHADER_CODE}
    `,
    `
        float input_a = mod(floor(full_out_id / input_a_offset), input_a_span);
        input_a = mod(input_a, span);
        float v = modular_multiplicative_inverse(input_a, span);
        if (v == -1.0) {
            return out_id;
        }
        return mod(out_id * v, span);
    `);

const INVERSE_MULTIPLICATION_SHADER = ketShaderPermute(
    `
        uniform float input_a_offset, input_a_span;
        ${MODULAR_INVERSE_SHADER_CODE}
    `,
    `
        float input_a = mod(floor(full_out_id / input_a_offset), input_a_span);
        input_a = mod(input_a, span);
        if (modular_multiplicative_inverse(input_a, span) == -1.0) {
            return out_id;
        }
        return mod(out_id * input_a, span);
    `);

MultiplicationGates.TimesAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A",
    "Multiplication Gate",
    "Multiplies the target by 'input A'.\n" +
        "But does nothing if the multiplication would be irreversible.").
    withSerializedId("*A" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((x, a) => modularMultiply(x, a, 1<<span)).
    withCustomShader(ctx => {
        let {offset: a_offset, length: a_length} = ctx.customContextFromGates.get('Input Range A');
        return MULTIPLICATION_SHADER.withArgs(
            ...ketArgs(ctx, span),
            WglArg.float("input_a_offset", 1 << a_offset),
            WglArg.float("input_a_span", 1 << a_length));
    }));

MultiplicationGates.TimesAInverseFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A^-1",
    "Inverse Multiplication Gate",
    "Inverse-multiplies the target by 'input A' (modulo 2^n)." +
        "But does nothing if the multiplication would be irreversible.").
    withSerializedId("/A" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((x, a) => modularUnmultiply(x, a, 1<<span)).
    withCustomShader(ctx => {
        let {offset: a_offset, length: a_length} = ctx.customContextFromGates.get('Input Range A');
        return INVERSE_MULTIPLICATION_SHADER.withArgs(
            ...ketArgs(ctx, span),
            WglArg.float("input_a_offset", 1 << a_offset),
            WglArg.float("input_a_span", 1 << a_length));
    }));

MultiplicationGates.all = [
    ...MultiplicationGates.TimesAFamily.all,
    ...MultiplicationGates.TimesAInverseFamily.all,
];

export {
    MultiplicationGates,
    MODULAR_INVERSE_SHADER_CODE
}
