import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShader, ketShaderPhase, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {Util} from "src/base/Util.js";

let ParametrizedRotationGates = {};

/**
 * @param {!GateDrawParams} args
 */
function exponent_to_A_len_painter(args) {
    let v = args.getGateContext('Input Range A');
    let denom_exponent = v === undefined ? 'ⁿ' : Util.digits_to_superscript_digits('' + v.length);
    let symbol = args.gate.symbol.replace('ⁿ', denom_exponent);
    GatePainting.paintBackground(args);
    GatePainting.paintOutline(args);
    GatePainting.paintGateSymbol(args, symbol);
}

const X_TO_A_SHADER = ketShader(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float angle = read_input_A() * factor / _gen_input_span_A;
        float c = cos(angle) * 0.5;
        float s = sin(angle) * 0.5;
        vec2 u = vec2(0.5 + c, s);
        vec2 v = vec2(0.5 - c, -s);
        // multiply state by the matrix [[u, v], [v, u]]
        vec2 amp2 = inp(1.0-out_id);
        return cmul(u, amp) + cmul(v, amp2);
    `);

const Y_TO_A_SHADER = ketShader(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float angle = read_input_A() * factor / _gen_input_span_A;
        float c = cos(angle) * 0.5;
        float s = sin(angle) * 0.5;
        vec2 u = vec2(c + 0.5, s);
        vec2 v = vec2(c - 0.5, -s);
        // multiply state by the matrix [[u, v], [-v, u]]
        vec2 amp2 = inp(1.0-out_id);
        vec2 vs = v * (-1.0 + 2.0 * out_id);
        return cmul(u, amp) + cmul(vs, amp2);
    `);

const Z_TO_A_SHADER = ketShaderPhase(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float angle = read_input_A() * out_id * factor / _gen_input_span_A;
        return vec2(cos(angle), sin(angle));
    `);

ParametrizedRotationGates.XToA = Gate.withoutKnownMatrix(
    "X^A/2ⁿ",
    "Parametrized X Gate",
    "Rotates the target by input A / 2ⁿ'th of a half turn around the X axis.\n" +
        "n is the number of qubits in input A.").
    markedAsStable().
    markedAsUnitary().
    withSerializedId("X^(A/2^n)").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomDrawer(exponent_to_A_len_painter).
    withCustomShader(ctx => X_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI)));

ParametrizedRotationGates.XToMinusA = Gate.withoutKnownMatrix(
    "X^-A/2ⁿ",
    "Parametrized -X Gate",
    "Counter-rotates the target by input A / 2ⁿ'th of a half turn around the X axis.\n" +
        "n is the number of qubits in input A.").
    markedAsStable().
    markedAsUnitary().
    withSerializedId("X^(-A/2^n)").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomDrawer(exponent_to_A_len_painter).
    withCustomShader(ctx => X_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI)));

ParametrizedRotationGates.YToA = Gate.withoutKnownMatrix(
    "Y^A/2ⁿ",
    "Parametrized Y Gate",
    "Rotates the target by input A / 2ⁿ'th of a half turn around the Y axis.\n" +
        "n is the number of qubits in input A.").
    markedAsStable().
    markedAsUnitary().
    withSerializedId("Y^(A/2^n)").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomDrawer(exponent_to_A_len_painter).
    withCustomShader(ctx => Y_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI)));

ParametrizedRotationGates.YToMinusA = Gate.withoutKnownMatrix(
    "Y^-A/2ⁿ",
    "Parametrized -Y Gate",
    "Counter-rotates the target by input A / 2ⁿ'th of a half turn around the Y axis.\n" +
        "n is the number of qubits in input A.").
    markedAsStable().
    markedAsUnitary().
    withSerializedId("Y^(-A/2^n)").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomDrawer(exponent_to_A_len_painter).
    withCustomShader(ctx => Y_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI)));

ParametrizedRotationGates.ZToA = Gate.withoutKnownMatrix(
    "Z^A/2ⁿ",
    "Parametrized Z Gate",
    "Rotates the target by input A / 2ⁿ'th of a half turn around the Z axis.\n" +
        "n is the number of qubits in input A.").
    markedAsOnlyPhasing().
    markedAsStable().
    withSerializedId("Z^(A/2^n)").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomDrawer(exponent_to_A_len_painter).
    withCustomShader(ctx => Z_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI)));

ParametrizedRotationGates.ZToMinusA = Gate.withoutKnownMatrix(
    "Z^-A/2ⁿ",
    "Parametrized -Z Gate",
    "Counter-rotates the target by input A / 2ⁿ'th of a half turn around the Z axis.\n" +
        "n is the number of qubits in input A.").
    markedAsOnlyPhasing().
    markedAsStable().
    withSerializedId("Z^(-A/2^n)").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomDrawer(exponent_to_A_len_painter).
    withCustomShader(ctx => Z_TO_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI)));

ParametrizedRotationGates.all =[
    ParametrizedRotationGates.XToA,
    ParametrizedRotationGates.XToMinusA,
    ParametrizedRotationGates.YToA,
    ParametrizedRotationGates.YToMinusA,
    ParametrizedRotationGates.ZToA,
    ParametrizedRotationGates.ZToMinusA,
];

export {ParametrizedRotationGates}
