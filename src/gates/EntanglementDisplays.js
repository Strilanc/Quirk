import {Complex} from "src/math/Complex.js"
import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {MathPainter} from "src/draw/MathPainter.js"
import {Matrix} from "src/math/Matrix.js"
import {seq} from "src/base/Seq.js"
import {densityDisplayStatTexture, densityPixelsToMatrix} from "src/gates/DensityMatrixDisplay.js"

let EntanglementDisplays = {};

/**
 * @param {!Painter} painter
 * @param {!Matrix} xyz
 * @param {!Rect} drawArea
 * @param {!string} fillColor
 * @param {!string} label
 * @param scale
 * @param {!Matrix} xyz_center
 */
function _paintBlochIndicator(
        painter,
        xyz,
        drawArea,
        fillColor,
        label,
        scale=1,
        xyz_center=Matrix.col(0, 0, 0)) {
    let x = xyz.rawBuffer()[0];
    let y = xyz.rawBuffer()[2];
    let z = xyz.rawBuffer()[4];
    let cx = xyz_center.rawBuffer()[0];
    let cy = xyz_center.rawBuffer()[2];
    let cz = xyz_center.rawBuffer()[4];
    let origin = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let {dx, dy, dz} = MathPainter.coordinateSystem(u);
    dy = dy.times(-1);

    let c = origin.plus(dx.times(cx)).plus(dy.times(cy)).plus(dz.times(cz));
    let p = origin.plus(dx.times(x)).plus(dy.times(y)).plus(dz.times(z));
    let r = 18 / (2 + drawArea.w/32 * x / 6);
    r *= scale;

    // Draw state indicators (in not-quite-correct 3d).
    painter.strokeLine(c, p, 'black', 2);
    painter.fillCircle(p, r, fillColor);
    painter.strokeCircle(p, r, 'black');

    painter.print(
        label,
        p.x,
        p.y + 1,
        'center',
        'middle',
        'black',
        '36pt sans-serif',
        r*2.5,
        r*2.5);
}

/**
 * @param {!Matrix} twoQubitDensityMatrix
 * @returns {!Matrix}
 */
function traceOutSecondQubit(twoQubitDensityMatrix) {
    return Matrix.square(
        twoQubitDensityMatrix.cell(0, 0).plus(twoQubitDensityMatrix.cell(2, 2)),
        twoQubitDensityMatrix.cell(1, 0).plus(twoQubitDensityMatrix.cell(3, 2)),
        twoQubitDensityMatrix.cell(0, 1).plus(twoQubitDensityMatrix.cell(2, 3)),
        twoQubitDensityMatrix.cell(1, 1).plus(twoQubitDensityMatrix.cell(3, 3)));
}

/**
 * @param {!Matrix} twoQubitDensityMatrix
 * @returns {!Matrix}
 */
function blochVectorAfterTracingOutSecondQubit(twoQubitDensityMatrix) {
    return Matrix.col(...traceOutSecondQubit(twoQubitDensityMatrix).qubitDensityMatrixToBlochVector());
}

/**
 * @param {!Matrix} twoQubitDensityMatrix
 * @param {!Matrix} desiredFirstQubitColVector
 * @returns {!{successProbability: !number, densityMatrix: !Matrix}}
 */
function projectSecondQubit(twoQubitDensityMatrix, desiredFirstQubitColVector) {
    // Normalize input.
    let u = desiredFirstQubitColVector.times(1 / Math.sqrt(desiredFirstQubitColVector.norm2()));

    // Project.
    let expanded_state = u.tensorProduct(Matrix.identity(2));
    let projector = expanded_state.times(expanded_state.adjoint());
    let projected_density = twoQubitDensityMatrix.times(projector);

    // Normalize output.
    let successProbability = projected_density.trace().abs();
    if (successProbability < 0.0001) {
        return {successProbability, densityMatrix: Matrix.generateDiagonal(4, _ => 0.25)};
    }

    // A blatant violation of proper naming practices.
    return {successProbability, densityMatrix: projected_density.times(1 / successProbability)};
}

/**
 * @param {!Matrix} twoQubitDensityMatrix
 * @param {!Matrix} desiredFirstQubitColVector
 * @returns {!Matrix}
 */
function secondQubitBlochVectorConditioningOnFirstQubitStateVector(twoQubitDensityMatrix, desiredFirstQubitColVector) {
    let {successProbability, densityMatrix} = projectSecondQubit(twoQubitDensityMatrix, desiredFirstQubitColVector);
    if (successProbability < 0.0001) {
        return undefined;
    }
    return blochVectorAfterTracingOutSecondQubit(densityMatrix);
}

EntanglementDisplays.EntanglementDisplay = new GateBuilder().
    setSerializedId('entdisp').
    setSymbol('Entang').
    setTitle('Entanglement Display').
    setBlurb('Shows the Bloch vectors of one qubit after respectively conditioning on the |0⟩, |1⟩, |+⟩, |-⟩, |i⟩, and |-i⟩ states of another.').
    setWidth(2).
    setHeight(2).
    promiseHasNoNetEffectOnStateVector().
    setDrawer(GatePainting.makeDisplayDrawer(args => {
        let twoQubitDensityMatrix = args.customStats || Matrix.zero(4, 4).times(NaN);

        for (let dx of [0]) {
            args.painter.strokeLine(args.rect.topHalf().center().offsetBy(dx, 0), args.rect.bottomHalf().center().offsetBy(dx, 0));
        }
        let topArea = args.rect.takeTopProportion(0.95);
        let c = topArea.center();
        let u = Math.min(topArea.w, topArea.h) / 2;
        let {dx, dy, dz} = MathPainter.coordinateSystem(u);

        // Draw redirected wires and for-all control.
        GatePainting.DrawPerturbedWires(args, [0.48, 0.4]);
        let vc = args.rect.takeBottomProportion(0.01).takeLeftProportion(0.25).center();
        args.painter.strokeLine(vc, c, 'black');
        args.painter.fillCircle(vc, 6, '#EFF');
        args.painter.strokeCircle(vc, 6, 'black');
        args.painter.print('∀', vc.x, vc.y, 'center', 'middle', 'black', '16pt monospace', 20, 20);

        // Draw big blue sphere and axis lines (in not-quite-proper 3d).
        args.painter.fillCircle(c, u, '#EFF');
        args.painter.trace(trace => {
            trace.circle(c.x, c.y, u);
            trace.ellipse(c.x, c.y, dy.x, dx.y);
            trace.ellipse(c.x, c.y, dx.x, dz.y);
            for (let d of [dx, dy, dz]) {
                trace.line(c.x - d.x, c.y - d.y, c.x + d.x, c.y + d.y);
            }
        }).thenStroke('#BBB');

        if (twoQubitDensityMatrix.hasNaN()) {
            args.painter.print(
                'NaN',
                args.rect.x + args.rect.w/2,
                args.rect.y + args.rect.h/2,
                'center',
                'middle',
                'red',
                '16px sans-serif',
                args.rect.w,
                args.rect.h);
            return;
        }

        let [x, y, z] = traceOutSecondQubit(twoQubitDensityMatrix).qubitDensityMatrixToBlochVector();
        let cen = Matrix.col(x, y, z);
        let s = Math.sqrt(0.5);
        let draws = [];
        let kets = [
            [Matrix.col(s, s), '+', '#FAA', 0.7],
            [Matrix.col(s, -s), '-', '#FAA', 0.7],
            [Matrix.col(s, new Complex(0, s)), 'i', '#AFA', 0.7],
            [Matrix.col(s, new Complex(0, -s)), '-i', '#AFA', 0.7],
            [Matrix.col(1, 0), '0', '#AAF', 0.7],
            [Matrix.col(0, 1), '1', '#AAF', 0.7],
            [undefined, '', '#FFF', 0.5],
        ];
        let kk = 0;
        for (let [ket, label, color, scale] of kets) {
            kk += 1;
            let xyz = ket !== undefined ? secondQubitBlochVectorConditioningOnFirstQubitStateVector(twoQubitDensityMatrix, ket) : Matrix.col(x, y, z);
            if (xyz === undefined) {
                continue;
            }
            draws.push([
                -xyz.cell(0, 0).real + kk/1000, () => _paintBlochIndicator(
                    args.painter,
                    xyz,
                    topArea,
                    color,
                    label,
                    scale,
                    ket === undefined ? undefined : cen)]);
        }
        for (let [_, f] of seq(draws).sortedBy(e => e[0])) {
            f();
        }
    })).
    setStatTexturesMaker(ctx => densityDisplayStatTexture(
        ctx.stateTrader.currentTexture, ctx.wireCount, ctx.controls, ctx.row, 2)).
    setStatPixelDataPostProcessor(densityPixelsToMatrix).
    gate;

EntanglementDisplays.all = [
    EntanglementDisplays.EntanglementDisplay,
];

export {EntanglementDisplays}
