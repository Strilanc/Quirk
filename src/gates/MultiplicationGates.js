import {Config} from "src/Config.js";
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"

let MultiplicationGates = {};

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

const EXTRACT_2S_SHADER_CODE = `
    float extract2s(float f) {
        float s = 1.0;
        float x;
        for (int i = 0; i < ${Config.MAX_WIRE_COUNT - 1}; i++) {
            if (f > 0.0 && mod(f, 2.0) == 0.0) {
                f = floor(f / 2.0);
                s *= 2.0;
            }
        }
        return s;
    }
`;

const MULTIPLICATION_SHADER = ketShaderPermute(
    `
        uniform float input_a_offset, input_a_span;
        ${EXTRACT_2S_SHADER_CODE}
        ${MODULAR_INVERSE_SHADER_CODE}
    `,
    `
        float input_a = mod(floor(full_out_id / input_a_offset), input_a_span);
        float s = extract2s(input_a);
        float v = modular_multiplicative_inverse(input_a / s, span);
        float r = out_id;

        r = floor(r / s) + mod(out_id, s) * (span / s);

        if (v != -1.0) {
            r = mod(r * v, span);
        }

        return r;
    `);

const INVERSE_MULTIPLICATION_SHADER = ketShaderPermute(
    `
        uniform float input_a_offset, input_a_span;
        ${EXTRACT_2S_SHADER_CODE}
    `,
    `
        float input_a = mod(floor(full_out_id / input_a_offset), input_a_span);
        float s = extract2s(input_a);
        float v = input_a / s;
        float r = out_id;
        
        if (v != 0.0) {
            r = mod(r * v, span);
        }
        
        s = span / s;
        r = floor(r / s) + mod(r, s) * (span / s);

        return r;
    `);

function reversible2sComplementMultiply(x, a, bitSpan) {
    if (a === 0) {
        return x;
    }

    let s = Util.powerOfTwoness(a);

    x *= a >> s;
    x &= (1 << bitSpan) - 1;

    x <<= s;
    x |= x >> bitSpan;
    x &= (1 << bitSpan) - 1;

    return x;
}

function reversible2sComplementUnmultiply(x, a, bitSpan) {
    if (a === 0) {
        return x;
    }

    let s = Util.powerOfTwoness(a);

    x <<= bitSpan - s;
    x |= x >> bitSpan;
    x &= (1 << bitSpan) - 1;

    x *= Util.modular_multiplicative_inverse(a >> s, 1 << bitSpan);
    x &= (1 << bitSpan) - 1;

    return x;
}

MultiplicationGates.TimesAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "×A",
    "Multiplication Gate",
    "Multiplies the target by 'input A'.\n" +
        "Irreversible factors of 2 are replaced by bit rotations.\n" +
        "Ignores multiplication by zero.").
    withSerializedId("*A" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((x, a) => reversible2sComplementMultiply(x, a, span)).
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
        "Irreversible factors of 2 are replaced by bit rotations." +
        "Ignores multiplication by zero.").
    withSerializedId("/A" + span).
    withHeight(span).
    withRequiredContextKeys("Input Range A").
    withKnownPermutation((x, a) => reversible2sComplementUnmultiply(x, a, span)).
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
    MODULAR_INVERSE_SHADER_CODE,
    reversible2sComplementMultiply,
    reversible2sComplementUnmultiply,
}
