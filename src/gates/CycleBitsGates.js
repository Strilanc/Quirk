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
 * @param {!CircuitEvalContext} ctx
 * @param {!int} qubitSpan
 * @param {!int} shiftAmount
 * @returns {!WglConfiguredShader}
 */
let cycleBitsShader = (ctx, qubitSpan, shiftAmount) =>
    CYCLE_SHADER.withArgs(
        ...ketArgs(ctx, qubitSpan),
        WglArg.float("amount", 1 << Util.properMod(-shiftAmount, qubitSpan)));
const CYCLE_SHADER = ketShaderPermute(
    'uniform float amount;',
    'out_id *= amount; return mod(out_id, span) + floor(out_id / span);');

const makeCycleBitsPermutation = (shift, span) => e => {
    shift = Util.properMod(shift, span);
    return ((e << shift) & ((1 << span) - 1)) | (e >> (span - shift));
};
const makeCycleBitsMatrix = (shift, span) => Matrix.generateTransition(1<<span, makeCycleBitsPermutation(shift, span));

let cyclePainter = reverse => args => {
    if (args.positionInCircuit !== undefined) {
        GatePainting.PERMUTATION_DRAWER(args);
        return;
    }

    GatePainting.paintBackground(args);
    GatePainting.paintOutline(args);
    GatePainting.paintResizeTab(args);

    let x1 = args.rect.x + 6;
    let x2 = args.rect.right() - 6;
    let y = args.rect.center().y - Config.GATE_RADIUS + 6;
    let dh = (Config.GATE_RADIUS - 6)*2 / 2;

    for (let i = 0; i < 3; i++) {
        let j = (i + (reverse ? 2 : 1)) % 3;
        let y1 = y + i*dh;
        let y2 = y + j*dh;
        args.painter.strokePath([
            new Point(x1, y1),
            new Point(x1 + 8, y1),
            new Point(x2 - 8, y2),
            new Point(x2, y2)
        ]);
    }
};

CycleBitsGates.CycleBitsFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "<<<",
    "Left Rotate",
    "Rotates bits downward.").
    withKnownMatrix(span >= 4 ? undefined : makeCycleBitsMatrix(1, span)).
    withSerializedId("<<" + span).
    withHeight(span).
    withKnownBitPermutation(i => (i + 1) % span).
    withCustomShader(ctx => cycleBitsShader(ctx, span, +1)).
    withCustomDrawer(cyclePainter(false)));

CycleBitsGates.ReverseCycleBitsFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    ">>>",
    "Right Rotate",
    "Rotates bits upward.").
    withKnownMatrix(span >= 4 ? undefined : makeCycleBitsMatrix(-1, span)).
    withSerializedId(">>" + span).
    withHeight(span).
    withKnownBitPermutation(i => (i + span - 1) % span).
    withCustomShader(ctx => cycleBitsShader(ctx, span, -1)).
    withCustomDrawer(cyclePainter(true)));

CycleBitsGates.all = [
    ...CycleBitsGates.CycleBitsFamily.all,
    ...CycleBitsGates.ReverseCycleBitsFamily.all
];

export {CycleBitsGates, cycleBitsShader, makeCycleBitsPermutation};
