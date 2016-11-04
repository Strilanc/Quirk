import {Complex} from "src/math/Complex.js"
import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPhase} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {HalfTurnGates} from "src/gates/HalfTurnGates.js"
import {reverseShaderForSize} from "src/gates/ReverseBitsGate.js"
import {WglArg} from "src/webgl/WglArg.js"

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan Size of the gate.
 * @param {!number=} factor Scaling factor for the applied phases.
 */
function applyControlledPhaseGradient(ctx, qubitSpan, factor=1) {
    ctx.applyOperation(CONTROLLED_PHASE_GRADIENT_SHADER.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("factor", factor)));
}
const CONTROLLED_PHASE_GRADIENT_SHADER = ketShaderPhase(
    'uniform float factor;',
    `
        float hold = floor(out_id * 2.0 / span);
        float step = mod(out_id, span / 2.0);
        float angle = hold * step * factor * 6.2831853071795864769 / span;
        return vec2(cos(angle), sin(angle));
    `);

const τ = Math.PI * 2;
const FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => Complex.polar(Math.pow(0.5, span/2), τ*r*c/(1<<span)));
const INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER = span =>
    FOURIER_TRANSFORM_MATRIX_MAKER(span).adjoint();

let FourierTransformGates = {};

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 */
function applyForwardGradientShaders(ctx, span) {
    if (span > 1) {
        ctx.applyOperation(reverseShaderForSize(span));
    }
    for (let i = 0; i < span; i++) {
        if (i > 0) {
            applyControlledPhaseGradient(ctx, i + 1, +1);
        }
        HalfTurnGates.H.customOperation(ctx.withRow(ctx.row + i));
    }
}

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 */
function applyBackwardGradientShaders(ctx, span) {
    for (let i = span - 1; i >= 0; i--) {
        HalfTurnGates.H.customOperation(ctx.withRow(ctx.row + i));
        if (i > 0) {
            applyControlledPhaseGradient(ctx, i + 1, -1);
        }
    }
    if (span > 1) {
        ctx.applyOperation(reverseShaderForSize(span));
    }
}

FourierTransformGates.FourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT",
    "Fourier Transform Gate",
    "Transforms to/from phase frequency space.").
    markedAsStable().
    markedAsUnitary().
    withKnownMatrix(span >= 4 ? undefined : FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT" + span).
    withHeight(span).
    withCustomOperation(ctx => applyForwardGradientShaders(ctx, span)));

FourierTransformGates.InverseFourierTransformFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "QFT^†",
    "Inverse Fourier Transform Gate",
    "Transforms from/to phase frequency space.").
    markedAsStable().
    markedAsUnitary().
    withKnownMatrix(span >= 4 ? undefined : INVERSE_FOURIER_TRANSFORM_MATRIX_MAKER(span)).
    withSerializedId("QFT†" + span).
    withHeight(span).
    withCustomOperation(ctx => applyBackwardGradientShaders(ctx, span)));

FourierTransformGates.all = [
    ...FourierTransformGates.FourierTransformFamily.all,
    ...FourierTransformGates.InverseFourierTransformFamily.all
];

export {applyControlledPhaseGradient, FourierTransformGates}
