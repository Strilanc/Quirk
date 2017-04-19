import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShaderPermute, ketInputGateShaderCode} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"

let MultiplyAccumulateGates = {};

let sectionSizes = totalSize => {
    let c = Math.ceil(totalSize / 2);
    let b = Math.ceil((totalSize - c) / 2);
    let a = Math.max(totalSize - c - b, 1);
    return [a, b, totalSize - a - b];
};

const makeScaledMultiplyAddPermutation = (span, scaleFactor) => e => {
    let [sa, sb, sc] = sectionSizes(span);
    let a = e & ((1 << sa) - 1);
    let b = (e >> sa) & ((1 << sb) - 1);
    let c = e >> (sa + sb);
    c += a*b*scaleFactor;
    c &= ((1 << sc) - 1);
    return a | (b << sa) | (c << (sa+sb));
};
const makeScaledMultiplyAddMatrix = (span, scaleFactor) =>
    Matrix.generateTransition(1<<span, makeScaledMultiplyAddPermutation(span, scaleFactor));

const MULTIPLY_ACCUMULATE_SHADER = ketShaderPermute(
    `
        uniform float factor;
        ${ketInputGateShaderCode('A')}
        ${ketInputGateShaderCode('B')}
    `,
    `
        float d1 = read_input_A();
        float d2 = read_input_B();
        float d = mod(d1*d2*factor, span);
        return mod(out_id + span - d, span);`);

MultiplyAccumulateGates.MultiplyAddFamily = Gate.generateFamily(3, 16, span => Gate.withoutKnownMatrix(
    "c+=ab",
    "Multiply-Add Gate",
    "Adds the product of two numbers into a third.").
    withKnownMatrix(span >= 5 ? undefined : makeScaledMultiplyAddMatrix(span, +1)).
    withKnownPermutation(makeScaledMultiplyAddPermutation(span, +1)).
    withSerializedId("c+=ab" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c+=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    withHeight(span).
    withCustomOperation(ctx => {
        let [a, b, c] = sectionSizes(span);
        return MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(c).customOperation(
            ctx.withRow(ctx.row + a + b).
                withInputSetToRange('A', ctx.row, a).
                withInputSetToRange('B', ctx.row + a, b));
    }));

MultiplyAccumulateGates.MultiplySubtractFamily = Gate.generateFamily(3, 16, span => Gate.withoutKnownMatrix(
    "c-=ab",
    "Multiply-Subtract Gate",
    "Subtracts the product of two numbers from a third.").
    withKnownMatrix(span >= 5 ? undefined : makeScaledMultiplyAddMatrix(span, -1)).
    withKnownPermutation(makeScaledMultiplyAddPermutation(span, -1)).
    withSerializedId("c-=ab" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(
        ["a", "b", "c-=ab"],
        sectionSizes(span).slice(0, 2).map(e => e/span))).
    withHeight(span).
    withCustomOperation(ctx => {
        let [a, b, c] = sectionSizes(span);
        return MultiplyAccumulateGates.MultiplySubtractInputsFamily.ofSize(c).customOperation(
            ctx.withRow(ctx.row + a + b).
                withInputSetToRange('A', ctx.row, a).
                withInputSetToRange('B', ctx.row + a, b));
    }));

MultiplyAccumulateGates.MultiplyAddInputsFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+AB",
    "Multiply-Add Gate [Inputs A, B]",
    "Adds the product of inputs A and B into the qubits covered by this gate.").
    withSerializedId("+=AB" + span).
    withHeight(span).
    withKnownPermutation((t, a, b) => (t + a*b) & ((1 << span) - 1)).
    withRequiredContextKeys('Input Range A', 'Input Range B').
    withCustomShader(ctx => MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B']),
        WglArg.float("factor", +1))));

MultiplyAccumulateGates.MultiplySubtractInputsFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "−AB",
    "Multiply-Subtract Gate [Inputs A, B]",
    "Subtracts the product of inputs A and B out of the qubits covered by this gate.").
    withSerializedId("-=AB" + span).
    withHeight(span).
    withKnownPermutation((t, a, b) => (t - a*b) & ((1 << span) - 1)).
    withRequiredContextKeys('Input Range A', 'Input Range B').
    withCustomShader(ctx => MULTIPLY_ACCUMULATE_SHADER.withArgs(
        ...ketArgs(ctx, span, ['A', 'B']),
        WglArg.float("factor", -1))));

MultiplyAccumulateGates.SquareAddInputFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+=A^2",
    "Square-Add Gate [Input A]",
    "Adds the square of input A into the qubits covered by this gate.").
    withSerializedId("+=AA" + span).
    withHeight(span).
    withKnownPermutation((t, a) => (t + a*a) & ((1 << span) - 1)).
    withRequiredContextKeys('Input Range A').
    withCustomOperation(ctx =>
        MultiplyAccumulateGates.MultiplyAddInputsFamily.ofSize(span).customOperation(
            ctx.withInputSetToOtherInput('B', 'A'))));

MultiplyAccumulateGates.SquareSubtractInputFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-=A^2",
    "Square-Subtract Gate [Input A]",
    "Subtracts the square of input A out of the qubits covered by this gate.").
    withSerializedId("-=AA" + span).
    withKnownPermutation((t, a) => (t - a*a) & ((1 << span) - 1)).
    withHeight(span).
    withRequiredContextKeys('Input Range A').
    withCustomOperation(ctx =>
        MultiplyAccumulateGates.MultiplySubtractInputsFamily.ofSize(span).customOperation(
            ctx.withInputSetToOtherInput('B', 'A'))));

MultiplyAccumulateGates.all = [
    ...MultiplyAccumulateGates.MultiplyAddFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractFamily.all,
    ...MultiplyAccumulateGates.MultiplyAddInputsFamily.all,
    ...MultiplyAccumulateGates.MultiplySubtractInputsFamily.all,
    ...MultiplyAccumulateGates.SquareAddInputFamily.all,
    ...MultiplyAccumulateGates.SquareSubtractInputFamily.all,
];

export {MultiplyAccumulateGates}
