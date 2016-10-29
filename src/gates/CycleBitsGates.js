import {Gate} from "src/circuit/Gate.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

let CycleBitsGates = {};

/**
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
let cycleBits = (ctx, qubitSpan, shiftAmount) =>
    CYCLE_SHADER.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("amount", 1 << Util.properMod(-shiftAmount, qubitSpan)));
const CYCLE_SHADER = ketShaderPermute(
    'uniform float amount;',
    'out_id *= amount; return mod(out_id, span) + floor(out_id / span);');

const makeCycleBitsMatrix = (shift, span) => Matrix.generateTransition(1<<span, e => {
    shift = Util.properMod(shift, span);
    return ((e << shift) & ((1 << span) - 1)) | (e >> (span - shift));
});

CycleBitsGates.CycleBitsFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "↡",
    "Left Shift Gate",
    "Rotates bits in a downward cycle.").
    markedAsStable().
    markedAsOnlyPermutingAndPhasing().
    withKnownMatrix(span >= 4 ? undefined : makeCycleBitsMatrix(1, span)).
    withSerializedId("<<" + span).
    withHeight(span).
    withKnownBitPermutation(i => (i + 1) % span).
    withCustomShader(ctx => cycleBits(ctx, span, +1)));

CycleBitsGates.ReverseCycleBitsFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "↟",
    "Right Shift Gate",
    "Rotates bits in an upward cycle.").
    markedAsStable().
    markedAsOnlyPermutingAndPhasing().
    withKnownMatrix(span >= 4 ? undefined : makeCycleBitsMatrix(-1, span)).
    withSerializedId(">>" + span).
    withHeight(span).
    withKnownBitPermutation(i => (i + span - 1) % span).
    withCustomShader(ctx => cycleBits(ctx, span, -1)));

CycleBitsGates.all = [
    ...CycleBitsGates.CycleBitsFamily.all,
    ...CycleBitsGates.ReverseCycleBitsFamily.all
];

export {CycleBitsGates, cycleBits, makeCycleBitsMatrix};
