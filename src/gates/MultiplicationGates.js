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
        return big_mul_mod(out_id, v, span);
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
        return big_mul_mod(out_id, input_a, span);
    `);

MultiplicationGates.TimesAFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("*A" + span).
    setSymbol("×A").
    setTitle("Multiplication Gate").
    setBlurb("Multiplies the target by input A.\n" +
        "No effect if the multiplication would be irreversible.").
    setRequiredContextKeys("Input Range A").
    setActualEffectToShaderProvider(ctx => MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A']))).
    setKnownEffectToParametrizedPermutation((x, a) => modularMultiply(x, a, 1<<span)));

MultiplicationGates.TimesAInverseFamily = Gate.buildFamily(1, 16, (span, builder) => builder.
    setSerializedId("/A" + span).
    setSymbol("×A^-1").
    setTitle("Inverse Multiplication Gate").
    setBlurb("Inverse-multiplies the target by input A (modulo 2^n).\n" +
        "No effect if the multiplication would be irreversible.").
    setRequiredContextKeys("Input Range A").
    setKnownEffectToParametrizedPermutation((x, a) => modularUnmultiply(x, a, 1<<span)).
    setActualEffectToShaderProvider(ctx => INVERSE_MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A']))));

MultiplicationGates.all = [
    ...MultiplicationGates.TimesAFamily.all,
    ...MultiplicationGates.TimesAInverseFamily.all,
];

export {
    MultiplicationGates,
    MODULAR_INVERSE_SHADER_CODE
}
