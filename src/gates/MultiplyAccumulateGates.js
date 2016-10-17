import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

let MultiplyAccumulateGates = {};

let sectionSizes = totalSize => {
    let c = Math.ceil(totalSize / 2);
    let b = Math.ceil((totalSize - c) / 2);
    let a = Math.max(totalSize - c - b, 1);
    return [a, b, totalSize - a - b];
};

const makeScaledMultiplyAddMatrix = (span, scaleFactor) => Matrix.generateTransition(1<<span, e => {
    let [sa, sb, sc] = sectionSizes(span);
    let a = e & ((1 << sa) - 1);
    let b = (e >> sa) & ((1 << sb) - 1);
    let c = e >> (sa + sb);
    c += a*b*scaleFactor;
    c &= ((1 << sc) - 1);
    return a | (b << sa) | (c << (sa+sb));
});

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 * @param {!int} srcIndex1
 * @param {!int} srcSpan1
 * @param {!int} srcIndex2
 * @param {!int} srcSpan2
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
function multiplyAccumulate(
        ctx,
        span,
        srcIndex1,
        srcSpan1,
        srcIndex2,
        srcSpan2,
        scaleFactor) {
    return MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("srcOffset1", 1 << srcIndex1),
        WglArg.float("srcSpan1", 1 << srcSpan1),
        WglArg.float("srcOffset2", 1 << srcIndex2),
        WglArg.float("srcSpan2", 1 << srcSpan2),
        WglArg.float("factor", scaleFactor));
}
const MULTIPLY_ACCUMULATE_SHADER = ketShaderPermute(
    'uniform float srcOffset1, srcSpan1, srcOffset2, srcSpan2, factor;',
    `
        float d1 = mod(floor(full_out_id / srcOffset1), srcSpan1);
        float d2 = mod(floor(full_out_id / srcOffset2), srcSpan2);
        float d = mod(d1*d2*factor, span);
        return mod(out_id + span - d, span);`);

MultiplyAccumulateGates.MultiplyAddFamily = Gate.generateFamily(3, 16, span => Gate.withoutKnownMatrix(
    "c+=ab",
    "Multiply-Add Gate",
    "Adds the product of two numbers into a third.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : makeScaledMultiplyAddMatrix(span, +1)).
    withSerializedId("c+=ab" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c+=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    withHeight(span).
    withCustomShader(ctx => {
        let [a, b, c] = sectionSizes(span);
        return multiplyAccumulate(
            ctx.withRow(ctx.row + a + b),
            c,
            ctx.row,
            a,
            ctx.row + a,
            b,
            +1)
    }));

MultiplyAccumulateGates.MultiplySubtractFamily = Gate.generateFamily(3, 16, span => Gate.withoutKnownMatrix(
    "c-=ab",
    "Multiply-Subtract Gate",
    "Subtracts the product of two numbers from a third.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : makeScaledMultiplyAddMatrix(span, -1)).
    withSerializedId("c-=ab" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c-=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    withHeight(span).
    withCustomShader(ctx => {
        let [a, b, c] = sectionSizes(span);
        return multiplyAccumulate(
            ctx.withRow(ctx.row + a + b),
            c,
            ctx.row,
            a,
            ctx.row + a,
            b,
            -1)
    }));

MultiplyAccumulateGates.MultiplyAddInputsFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+=AB",
    "Multiply-Add Gate [Inputs A, B]",
    "Adds the product of inputs A and B into the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("+=AB" + span).
    withHeight(span).
    withRequiredContextKeys('Input Range A', 'Input Range B').
    withCustomShader(ctx => {
        let {offset: inputOffsetA, length: inputLengthA} = ctx.customContextFromGates.get('Input Range A');
        let {offset: inputOffsetB, length: inputLengthB} = ctx.customContextFromGates.get('Input Range B');
        return multiplyAccumulate(
            ctx,
            span,
            inputOffsetA,
            inputLengthA,
            inputOffsetB,
            inputLengthB,
            +1)
    }));

MultiplyAccumulateGates.MultiplySubtractInputsFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-=AB",
    "Multiply-Subtract Gate [Inputs A, B]",
    "Subtracts the product of inputs A and B out of the qubits covered by this gate.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withSerializedId("-=AB" + span).
    withHeight(span).
    withRequiredContextKeys('Input Range A', 'Input Range B').
    withCustomShader(ctx => {
        let {offset: inputOffsetA, length: inputLengthA} = ctx.customContextFromGates.get('Input Range A');
        let {offset: inputOffsetB, length: inputLengthB} = ctx.customContextFromGates.get('Input Range B');
        return multiplyAccumulate(
            ctx,
            span,
            inputOffsetA,
            inputLengthA,
            inputOffsetB,
            inputLengthB,
            -1)
    }));

MultiplyAccumulateGates.all = [
    ...MultiplyAccumulateGates.MultiplyAddFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractFamily.all,
    ...MultiplyAccumulateGates.MultiplyAddInputsFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractInputsFamily.all
];

export {MultiplyAccumulateGates}
