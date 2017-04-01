import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {
    modularMultiply,
    modularUnmultiply,
    MODULAR_INVERSE_SHADER_CODE
} from "src/gates/ModularMultiplicationGates.js"

let MultiplicationGates = {};

const MULTIPLICATION_SHADER = ketShaderPermute(
    `
        ${MODULAR_INVERSE_SHADER_CODE}
        ${ketInputGateShaderCode('A')}
    `,
    `
        float input_a = read_input_A();
        input_a = mod(input_a, span);
        float v = modular_multiplicative_inverse(input_a, span);
        if (v == -1.0) {
            return out_id;
        }
        return mod(out_id * v, span);
    `);

const INVERSE_MULTIPLICATION_SHADER = ketShaderPermute(
    `
        ${MODULAR_INVERSE_SHADER_CODE}
        ${ketInputGateShaderCode('A')}
    `,
    `
        float input_a = read_input_A();
        input_a = mod(input_a, span);
        if (modular_multiplicative_inverse(input_a, span) == -1.0) {
            return out_id;
        }
        return mod(out_id * input_a, span);
    `);

MultiplicationGates.TimesAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A",
    "Multiplication Gate",
    "Multiplies the target by input A.\n" +
        "But does nothing if the multiplication would be irreversible.").
    withSerializedId("*A" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((x, a) => modularMultiply(x, a, 1<<span)).
    withCustomShader(ctx => MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A']))));

MultiplicationGates.TimesAInverseFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A^-1",
    "Inverse Multiplication Gate",
    "Inverse-multiplies the target by input A (modulo 2^n).\n" +
        "But does nothing if the multiplication would be irreversible.").
    withSerializedId("/A" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((x, a) => modularUnmultiply(x, a, 1<<span)).
    withCustomShader(ctx => INVERSE_MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A']))));

MultiplicationGates.all = [
    ...MultiplicationGates.TimesAFamily.all,
    ...MultiplicationGates.TimesAInverseFamily.all,
];

export {
    MultiplicationGates,
    MODULAR_INVERSE_SHADER_CODE
}
