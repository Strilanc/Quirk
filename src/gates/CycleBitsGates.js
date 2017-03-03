import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {ketArgs, ketShaderPermute} from "src/circuit/KetShaderUtil.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader} from "src/webgl/WglConfiguredShader.js"

let CycleBitsGates = {};

/**
 * @param {!GateDrawParams} args
 * @param {!int} offset
 * @returns {!number}
 */
function wireY(args, offset) {
    return args.rect.center().y + (offset - args.gate.height/2 + 0.5) * Config.WIRE_SPACING;
}

/**
 * @param {!GateDrawParams} args
 */
function eraseWires(args) {
    for (let i = 0; i < args.gate.height; i++) {
        let y = wireY(args, i);
        let p = new Point(args.rect.x, y);
        let c = new Point(args.rect.center().x, y);
        let q = new Point(args.rect.right(), y);
        let pt = new Point(args.positionInCircuit.col, args.positionInCircuit.row + i);
        let isMeasured1 = args.stats.circuitDefinition.locIsMeasured(pt);
        let isMeasured2 = args.stats.circuitDefinition.locIsMeasured(pt.offsetBy(1, 0));

        for (let dy of isMeasured1 ? [-1, +1] : [0]) {
            args.painter.strokeLine(p.offsetBy(0, dy), c.offsetBy(0, dy), 'white');
        }
        for (let dy of isMeasured2 ? [-1, +1] : [0]) {
            args.painter.strokeLine(c.offsetBy(0, dy), q.offsetBy(0, dy), 'white');
        }
    }
}

/**
 * @param {!GateDrawParams} args
 * @returns {!boolean}
 */
function useFallbackDrawer(args) {
    return args.isHighlighted ||
        args.isResizeHighlighted ||
        args.positionInCircuit === undefined ||
        args.stats.circuitDefinition.colHasControls(args.positionInCircuit.col);
}

/**
 * The X gate is drawn as a crossed circle when it has controls.
 * @param {!GateDrawParams} args
 * @param {!function(!int) : !int} permutation
 */
function PERMUTATION_DRAWER(args, permutation) {
    if (useFallbackDrawer(args)) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    eraseWires(args);

    // Draw wires.
    for (let i = 0; i < args.gate.height; i++) {
        let j = permutation(i);

        let pt = new Point(args.positionInCircuit.col, args.positionInCircuit.row + i);
        let isMeasured = args.stats.circuitDefinition.locIsMeasured(pt);
        let y1 = wireY(args, i);
        let y2 = wireY(args, j);
        let x1 = args.rect.x;
        let x2 = args.rect.right();
        args.painter.ctx.beginPath();
        args.painter.ctx.strokeStyle = 'black';
        for (let [dx, dy] of isMeasured ? [[j > i ? +1 : -1, -1], [0, +1]] : [[0, 0]]) {
            args.painter.ctx.moveTo(Math.min(x1, x1 + dx), y1 + dy);
            args.painter.ctx.lineTo(x1 + dx, y1 + dy);
            args.painter.ctx.lineTo(x2 + dx, y2 + dy);
            args.painter.ctx.lineTo(Math.max(x2, x2 + dx), y2 + dy);
        }
        args.painter.ctx.stroke();
    }
}

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
    withCustomShader(ctx => cycleBits(ctx, span, +1)).
    withCustomDrawer(args => PERMUTATION_DRAWER(args, r => Util.properMod(r + 1, span))));

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
    withCustomShader(ctx => cycleBits(ctx, span, -1)).
    withCustomDrawer(args => PERMUTATION_DRAWER(args, r => Util.properMod(r - 1, span))));

CycleBitsGates.all = [
    ...CycleBitsGates.CycleBitsFamily.all,
    ...CycleBitsGates.ReverseCycleBitsFamily.all
];

export {CycleBitsGates, cycleBits, makeCycleBitsMatrix, PERMUTATION_DRAWER};
