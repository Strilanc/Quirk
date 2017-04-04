import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPhase, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

const τ = Math.PI * 2;
const GRADIENT_MATRIX_MAKER = span => Matrix.generateDiagonal(1<<span, k => Complex.polar(1, τ*k/(2<<span)));
const DE_GRADIENT_MATRIX_MAKER = span => Matrix.generateDiagonal(1<<span, k => Complex.polar(1, -τ*k/(2<<span)));

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 * @returns {!WglConfiguredShader} A configured shader that renders the output superposition (as a grid of amplitudes).
 */
function phaseGradient(ctx, qubitSpan, factor=1) {
    return PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("factor", factor));
}
const PHASE_GRADIENT_SHADER = ketShaderPhase(
    'uniform float factor;',
    'float angle = out_id * factor * 3.141592653589793 / span; return vec2(cos(angle), sin(angle));');

let PhaseGradientGates = {};

PhaseGradientGates.PhaseGradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "e^iπ%",
    "Phase Gradient Gate",
    "Phases by an amount proportional to the target value.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseGradient" + span).
    withHeight(span).
    withCustomShader(ctx => phaseGradient(ctx, span)));

PhaseGradientGates.PhaseDegradientFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "e^-iπ%",
    "Inverse Phase Gradient Gate",
    "Counter-phases by an amount proportional to the target value.").
    markedAsOnlyPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DE_GRADIENT_MATRIX_MAKER(span)).
    withSerializedId("PhaseUngradient" + span).
    withHeight(span).
    withCustomShader(ctx => phaseGradient(ctx, span, -1)));

const PHASE_BY_A_SHADER = ketShaderPhase(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
    `,
    `
        float angle = read_input_A() * out_id * factor / _gen_input_span_A;
        return vec2(cos(angle), sin(angle));
    `);

PhaseGradientGates.PhaseByFracA = Gate.withoutKnownMatrix(
        "Z^A%",
        "Proportional Phase Gate",
        "Phases the target by input A * π / 2^n radians.\nn is the number of qubits in input A.").
    markedAsOnlyPhasing().
    markedAsStable().
    withSerializedId("Z^A").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomShader(ctx => PHASE_BY_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', Math.PI)));

PhaseGradientGates.PhaseByMinusFracA = Gate.withoutKnownMatrix(
    "Z^-A%",
    "Proportional Counter-Phase Gate",
    "Counter-phases the target by input A * π / 2^n radians.\nn is the number of qubits in input A.").
    markedAsOnlyPhasing().
    markedAsStable().
    withSerializedId("Z^-A").
    withRequiredContextKeys('Input NO_DEFAULT Range A').
    withCustomShader(ctx => PHASE_BY_A_SHADER.withArgs(
        ...ketArgs(ctx, 1, ['A']),
        WglArg.float('factor', -Math.PI)));


PhaseGradientGates.all = [
    ...PhaseGradientGates.PhaseGradientFamily.all,
    ...PhaseGradientGates.PhaseDegradientFamily.all,
    PhaseGradientGates.PhaseByFracA,
    PhaseGradientGates.PhaseByMinusFracA
];

export {PhaseGradientGates, phaseGradient}
