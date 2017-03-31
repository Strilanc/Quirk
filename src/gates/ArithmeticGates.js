import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

let ArithmeticGates = {};

const makeOffsetMatrix = (offset, qubitSpan) =>
    Matrix.generateTransition(1<<qubitSpan, e => (e + offset) & ((1<<qubitSpan)-1));

const INCREMENT_MATRIX_MAKER = span => makeOffsetMatrix(1, span);
const DECREMENT_MATRIX_MAKER = span => makeOffsetMatrix(-1, span);
const CHUNKED_ADDITION_PERMUTATION_MAKER = span => e => {
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = e & ((1 << sa) - 1);
    let b = e >> sa;
    b += a;
    b &= ((1 << sb) - 1);
    return a + (b << sa);
};
const CHUNKED_ADDITION_MATRIX_MAKER = span => Matrix.generateTransition(
    1<<span, CHUNKED_ADDITION_PERMUTATION_MAKER(span));
const CHUNKED_SUBTRACTION_PERMUTATION_MAKER = span => e => {
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = e & ((1 << sa) - 1);
    let b = e >> sa;
    b -= a;
    b &= ((1 << sb) - 1);
    return a + (b << sa);
};
const CHUNKED_SUBTRACTION_MATRIX_MAKER = span => Matrix.generateTransition(
    1<<span, CHUNKED_SUBTRACTION_PERMUTATION_MAKER(span));

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan
 * @param {!int} incrementAmount
 * @returns {!WglConfiguredShader}
 */
const incrementShaderFunc = (ctx, qubitSpan, incrementAmount) =>
    incrementShader.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("amount", incrementAmount));
const incrementShader = ketShaderPermute(
    'uniform float amount;',
    'return mod(out_id - amount + span, span);');

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} span
 * @param {!int} srcOffset
 * @param {!int} srcSpan
 * @param {!int} scaleFactor
 * @returns {!WglConfiguredShader}
 */
function additionShaderFunc(ctx, span, srcOffset, srcSpan, scaleFactor) {
    return ADDITION_SHADER.withArgs(
        ...ketArgs(ctx, span),
        WglArg.float("srcOffset", 1 << srcOffset),
        WglArg.float("srcSpan", 1 << srcSpan),
        WglArg.float("factor", scaleFactor));
}
const ADDITION_SHADER = ketShaderPermute(
    'uniform float srcOffset, srcSpan, factor;',
    `
        float d = mod(floor(full_out_id / srcOffset), srcSpan);
        d *= factor;
        d = mod(d, span);
        return mod(out_id + span - d, span);`);

ArithmeticGates.IncrementFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+1",
    "Increment Gate",
    "Adds 1 to the little-endian number represented by a block of qubits.").
    withKnownMatrix(span >= 4 ? undefined : INCREMENT_MATRIX_MAKER(span)).
    withKnownPermutation(t => (t + 1) & ((1 << span) - 1)).
    withSerializedId("inc" + span).
    withHeight(span).
    withCustomShader(ctx => incrementShaderFunc(ctx, span, +1)));

ArithmeticGates.DecrementFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "−1",
    "Decrement Gate",
    "Subtracts 1 from the little-endian number represented by a block of qubits.").
    withKnownMatrix(span >= 4 ? undefined : DECREMENT_MATRIX_MAKER(span)).
    withKnownPermutation(t => (t - 1) & ((1 << span) - 1)).
    withSerializedId("dec" + span).
    withHeight(span).
    withCustomShader(ctx => incrementShaderFunc(ctx, span, -1)));

ArithmeticGates.AdditionFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "b+=a",
    "Addition Gate",
    "Adds a little-endian number into another.").
    withKnownMatrix(span >= 5 ? undefined : CHUNKED_ADDITION_MATRIX_MAKER(span)).
    withKnownPermutation(CHUNKED_ADDITION_PERMUTATION_MAKER(span)).
    withSerializedId("add" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b+=a"], [Math.floor(span/2) / span])).
    withHeight(span).
    withCustomShader(ctx => additionShaderFunc(
        ctx.withRow(ctx.row + Math.floor(span/2)),
        Math.ceil(span/2),
        ctx.row,
        Math.floor(span/2),
        +1)));

ArithmeticGates.SubtractionFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "b-=a",
    "Subtraction Gate",
    "Subtracts a little-endian number from another.").
    withKnownMatrix(span >= 5 ? undefined : CHUNKED_SUBTRACTION_MATRIX_MAKER(span)).
    withKnownPermutation(CHUNKED_SUBTRACTION_PERMUTATION_MAKER(span)).
    withSerializedId("sub" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b-=a"], [Math.floor(span/2) / span])).
    withHeight(span).
    withCustomShader(ctx => additionShaderFunc(
        ctx.withRow(ctx.row + Math.floor(span/2)),
        Math.ceil(span/2),
        ctx.row,
        Math.floor(span/2),
        -1)));

ArithmeticGates.PlusAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+A",
    "Addition Gate [input A]",
    "Adds 'input A' into the qubits covered by this gate.").
    withHeight(span).
    withKnownPermutation((v, a) => (v + a) & ((1 << span) - 1)).
    withSerializedId("+=A" + span).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => {
        let {offset: inputOffset, length: inputLength} = ctx.customContextFromGates.get('Input Range A');
        return additionShaderFunc(ctx, span, inputOffset, inputLength, +1);
    }));

ArithmeticGates.MinusAFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "−A",
    "Subtraction Gate [input A]",
    "Subtracts 'input A' out of the qubits covered by this gate.").
    withKnownPermutation((v, a) => (v - a) & ((1 << span) - 1)).
    withHeight(span).
    withSerializedId("-=A" + span).
    withRequiredContextKeys("Input Range A").
    withCustomShader(ctx => {
        let {offset: inputOffset, length: inputLength} = ctx.customContextFromGates.get('Input Range A');
        return additionShaderFunc(ctx, span, inputOffset, inputLength, -1);
    }));

ArithmeticGates.all = [
    ...ArithmeticGates.IncrementFamily.all,
    ...ArithmeticGates.DecrementFamily.all,
    ...ArithmeticGates.AdditionFamily.all,
    ...ArithmeticGates.SubtractionFamily.all,
    ...ArithmeticGates.PlusAFamily.all,
    ...ArithmeticGates.MinusAFamily.all,
];

export {ArithmeticGates, makeOffsetMatrix, incrementShaderFunc, additionShaderFunc}
