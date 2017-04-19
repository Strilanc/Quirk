import {Config} from "src/Config.js";
import {Gate} from "src/circuit/Gate.js"
import {
    ketArgs,
    ketShaderPermute,
    ketInputGateShaderCode
} from "src/circuit/KetShaderUtil.js"
import {modulusTooBigChecker} from "src/gates/ModularArithmeticGates.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"

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

/**
 * @param {!int} val
 * @param {!int} base
 * @param {!int} exponent
 * @param {!int} modulus
 * @returns {!int}
 */
function modularPowerMultiply(val, base, exponent, modulus) {
    if (val >= modulus) {
        return val;
    }
    base = Util.properMod(base, modulus);
    let inverse = Util.modular_multiplicative_inverse(base, modulus);
    if (inverse === undefined) {
        return val;
    }

    if (exponent < 0) {
        exponent = -exponent;
        base = inverse;
    }

    while (exponent > 0) {
        if ((exponent & 1) !== 0) {
            val = (val * base) % modulus;
        }
        base = (base*base) % modulus;
        exponent >>= 1;
    }
    return val;
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

const MODULAR_POWER_MULTIPLICATION_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${MODULAR_INVERSE_SHADER_CODE}
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('B')}
        ${ketInputGateShaderCode('R')}
    `,
    `
        float exponent = read_input_A() * factor;
        float base = read_input_B();
        float modulus = read_input_R();
        float base_inverse = modular_multiplicative_inverse(base, modulus);
        if (base_inverse == -1.0 || out_id >= modulus) {
            return out_id;
        }
        
        if (exponent < 0.0) {
            base = base_inverse;
            exponent = -exponent;
        }

        float f = 1.0;
        for (int k = 0; k < ${Config.MAX_WIRE_COUNT}; k++) {
            if (mod(exponent, 2.0) == 1.0) {
                exponent -= 1.0;
                f = mod(f * base, modulus);
            }
            base = mod(base * base, modulus);
            exponent /= 2.0;
        }
            
        return mod(out_id * f, modulus);
    `);

ModularMultiplicationGates.TimesAModRFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A\nmod R",
    "Modular Multiplication Gate",
    "Multiplies the target by input A mod input B.\n" +
        "Only affects values less than R.\n" +
        "No effect if the multiplication would be irreversible.").
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
        "Only affects values less than R.\n" +
        "No effect if the multiplication would be irreversible.").
    withSerializedId("/AmodR" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A", "Input Range R").
    withCustomDisableReasonFinder(modulusTooBigChecker("R", span)).
    withKnownPermutation(modularUnmultiply).
    withCustomShader(ctx => MODULAR_INVERSE_MULTIPLICATION_SHADER.withArgs(...ketArgs(ctx, span, ['A', 'R']))));

ModularMultiplicationGates.TimesBToTheAModRFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
        "×B^A\nmod R",
        "Modular Power Multiplication Gate",
        "Multiplies the target by input B raised to the input A mod input R.\n" +
            "Only affects values less than R.\n" +
            "No effect if the multiplication would be irreversible.").
    withSerializedId("*AtoBmodR" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A", "Input Range B", "Input Range R").
    withCustomDisableReasonFinder(modulusTooBigChecker("R", span)).
    withKnownPermutation((t, a, b, r) => modularPowerMultiply(t, b, a, r)).
    withCustomShader(ctx => MODULAR_POWER_MULTIPLICATION_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B', 'R']),
        WglArg.float('factor', +1))));

ModularMultiplicationGates.TimesInverseBToTheAModRFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
        "×B^-A\nmod R",
        "Modular Power Inverse Multiplication Gate",
        "Inverse-multiplies the target by input B raised to the input A mod input R.\n" +
            "Only affects values less than R.\n" +
            "No effect if the multiplication would be irreversible.").
    withSerializedId("/AtoBmodR" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A", "Input Range B", "Input Range R").
    withCustomDisableReasonFinder(modulusTooBigChecker("R", span)).
    withKnownPermutation((t, a, b, r) => modularPowerMultiply(t, b, -a, r)).
    withCustomShader(ctx => MODULAR_POWER_MULTIPLICATION_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B', 'R']),
        WglArg.float('factor', -1))));

ModularMultiplicationGates.all = [
    ...ModularMultiplicationGates.TimesAModRFamily.all,
    ...ModularMultiplicationGates.TimesAModRInverseFamily.all,
    ...ModularMultiplicationGates.TimesBToTheAModRFamily.all,
    ...ModularMultiplicationGates.TimesInverseBToTheAModRFamily.all,
];

export {
    ModularMultiplicationGates,
    MODULAR_INVERSE_SHADER_CODE,
    modularMultiply,
    modularUnmultiply,
    modularPowerMultiply
}
