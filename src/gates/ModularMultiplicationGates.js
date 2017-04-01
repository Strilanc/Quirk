import {Config} from "src/Config.js";
import {Gate} from "src/circuit/Gate.js"
import {
    ketArgs,
    ketShaderPermute,
    ketInputGateShaderCode
} from "src/circuit/KetShaderUtil.js"
import {modulusTooBigChecker} from "src/gates/ModularArithmeticGates.js"
import {Util} from "src/base/Util.js"

let ModularMultiplicationGates = {};

const MODULAR_INVERSE_SHADER_CODE = `
    vec2 _mod_mul_step(vec2 v, float q) {
        return vec2(v.y - q * v.x, v.x);
    }
    
    float modular_multiplicative_inverse(float value, float modulus) {
        vec2 s = vec2(0.0, 1.0);
        vec2 t = vec2(1.0, 0.0);
        vec2 r = vec2(modulus, value);
        float q;
        // For values up to x, a number of iterations n satisfying phi^n > x should be sufficient.
        for (int repeat = 0; repeat < ${Math.ceil(Config.MAX_WIRE_COUNT/(Math.log2(1+Math.sqrt(5))-1))}; repeat++) {
            if (r.x != 0.0) {
                q = floor(r.y / r.x);
                r = _mod_mul_step(r, q);
                s = _mod_mul_step(s, q);
                t = _mod_mul_step(t, q);
            }
        }
        if (r.y != 1.0) {
            return -1.0;
        }
        return mod(mod(s.y, modulus) + modulus, modulus);
    }
`;

/**
 * Multiplies the value by the given factor, modulo the given modulus, but with tweaks to avoid irreversible actions.
 *
 * If the value is out of range or the factor is not invertible, nothing happens.
 *
 * @param {!int} val
 * @param {!int} factor
 * @param {!int} modulus
 * @returns {!int}
 */
function modularMultiply(val, factor, modulus) {
    if (val >= modulus) {
        return val;
    }
    factor = Util.properMod(factor, modulus);
    if (factor === 0 || Util.extended_gcd(factor, modulus).gcd !== 1) {
        return val;
    }
    return (val * factor) % modulus;
}

/**
 * Un-multiplies the value by the given factor, modulo the given modulus, but with tweaks to avoid irreversible actions.
 *
 * If the value is out of range or the factor is not invertible, nothing happens.
 *
 * @param {!int} val
 * @param {!int} factor
 * @param {!int} modulus
 * @returns {!int}
 */
function modularUnmultiply(val, factor, modulus) {
    if (val >= modulus) {
        return val;
    }
    factor = Util.properMod(factor, modulus);
    if (factor === 0) {
        return val;
    }

    let inverse_factor = Util.modular_multiplicative_inverse(factor, modulus);
    if (inverse_factor === undefined) {
        return val;
    }
    return (val * inverse_factor) % modulus;
}

const MODULAR_MULTIPLICATION_SHADER = ketShaderPermute(
    `
        ${MODULAR_INVERSE_SHADER_CODE}
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('R')}
    `,
    `
        float input_a = read_input_A();
        float modulus = read_input_R();
        input_a = mod(input_a, modulus);
        float v = modular_multiplicative_inverse(input_a, modulus);
        if (v == -1.0 || out_id >= modulus) {
            return out_id;
        }
        return mod(out_id * v, modulus);
    `);

const MODULAR_INVERSE_MULTIPLICATION_SHADER = ketShaderPermute(
    `
        ${MODULAR_INVERSE_SHADER_CODE}
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('R')}
    `,
    `
        float input_a = read_input_A();
        float modulus = read_input_R();
        input_a = mod(input_a, modulus);
        if (modular_multiplicative_inverse(input_a, modulus) == -1.0 || out_id >= modulus) {
            return out_id;
        }
        return mod(out_id * input_a, modulus);
    `);

ModularMultiplicationGates.TimesAModRFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A\nmod R",
    "Modular Multiplication Gate",
    "Multiplies the target by input A mod input B.\n" +
        "But does nothing if the multiplication would be irreversible.").
    withSerializedId("*AmodR" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A", "Input Range R").
    withCustomDisableReasonFinder(modulusTooBigChecker("R", span)).
    withKnownPermutation(modularMultiply).
    withCustomShader(ctx => MODULAR_MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A', 'R']))));

ModularMultiplicationGates.TimesAModRInverseFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A^-1\nmod R",
    "Inverse Multiplication Gate",
    "Inverse-multiplies the target by input A mod input R.\n" +
        "But does nothing if the multiplication would be irreversible.").
    withSerializedId("/AmodR" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A", "Input Range R").
    withCustomDisableReasonFinder(modulusTooBigChecker("R", span)).
    withKnownPermutation(modularUnmultiply).
    withCustomShader(ctx => MODULAR_INVERSE_MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A', 'B']))));

ModularMultiplicationGates.all = [
    ...ModularMultiplicationGates.TimesAModRFamily.all,
    ...ModularMultiplicationGates.TimesAModRInverseFamily.all,
];

export {
    ModularMultiplicationGates,
    MODULAR_INVERSE_SHADER_CODE,
    modularMultiply,
    modularUnmultiply
}
