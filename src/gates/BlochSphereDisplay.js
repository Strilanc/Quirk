import {Config} from "src/Config.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {MathPainter} from "src/draw/MathPainter.js"
import {Point} from "src/math/Point.js"

/**
 * @param {!Painter} painter
 * @param {!Rect} drawArea
 * @param {!number} x
 * @param {!number} y
 * @param {!number} z
 * @param {!Array.<!Point>} focusPoints
 */
function _paintBlochSphereDisplay_tooltips(
        painter,
        drawArea,
        x,
        y,
        z,
        focusPoints) {
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    if (focusPoints.every(pt => pt.distanceTo(c) >= u)) {
        return;
    }

    const τ = Math.PI * 2;
    let deg = v => (v >= 0 ? '+' : '') + (v*360/τ).toFixed(2) + '°';
    let forceSign = v => (v >= 0 ? '+' : '') + v.toFixed(4);
    let d = Math.sqrt(x*x + y*y + z*z);
    let ϕ = Math.atan2(y, -x);
    let θ = Math.atan2(-z, Math.sqrt(y*y + x*x));
    painter.strokeCircle(c, u, 'orange', 2);
    MathPainter.paintDeferredValueTooltip(
        painter,
        c.x+u*Math.sqrt(0.5),
        c.y-u*Math.sqrt(0.5),
        'Bloch sphere representation of local state',
        `r:${forceSign(d)}, ϕ:${deg(ϕ)}, θ:${deg(θ)}`,
        `x:${forceSign(-x)}, y:${forceSign(y)}, z:${forceSign(-z)}`);
}

/**
 * @param {!Painter} painter
 * @param {!number} x
 * @param {!number} y
 * @param {!number} z
 * @param {!Rect} drawArea
 * @param {!string=} fillColor
 */
function _paintBlochSphereDisplay_indicator(
        painter,
        x,
        y,
        z,
        drawArea,
        fillColor) {
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let [dx, dy, dz] = [new Point(-u, 0), new Point(u / 3, -u / 3), new Point(0, u)];

    let pxy = c.plus(dx.times(x)).plus(dy.times(y));
    let p = pxy.plus(dz.times(z));
    let r = 4 / (1 + y / 8);

    // Draw state indicators (in not-quite-correct 3d).
    let cz = c.plus(dz.times(z));
    painter.strokePolygon([cz, c, pxy, p], '#666');
    painter.strokeLine(c, p, 'black', 2);
    painter.fillCircle(p, r, fillColor);

    painter.ctx.save();
    painter.ctx.globalAlpha *= Math.min(1, Math.max(0, 1-x*x-y*y-z*z));
    painter.fillCircle(p, r, 'yellow');
    painter.ctx.restore();

    painter.strokeCircle(p, r, 'black');

    painter.ctx.save();
    painter.ctx.globalAlpha *= Math.min(1, Math.max(0, 0.5+y*5));
    painter.strokeLine(c, p, 'black', 2);
    painter.ctx.restore();
}

/**
 * @param {!Painter} painter
 * @param {!Matrix} qubitDensityMatrix
 * @param {!Rect} drawArea
 * @param {!Array.<!Point>=} focusPoints
 * @param {!string=} backgroundColor
 * @param {!string=} fillColor
 */
function paintBlochSphereDisplay(
        painter,
        qubitDensityMatrix,
        drawArea,
        focusPoints = [],
        backgroundColor = Config.DISPLAY_GATE_BACK_COLOR,
        fillColor = Config.DISPLAY_GATE_FORE_COLOR) {
    let c = drawArea.center();
    let u = Math.min(drawArea.w, drawArea.h) / 2;
    let [dx, dy, dz] = [new Point(-u, 0), new Point(u / 3, -u / 3), new Point(0, u)];

    // Draw sphere and axis lines (in not-quite-proper 3d).
    painter.fillCircle(c, u, backgroundColor);
    painter.trace(trace => {
        trace.circle(c.x, c.y, u);
        trace.ellipse(c.x, c.y, dx.x, dy.y);
        trace.ellipse(c.x, c.y, dy.x, dz.y);
        for (let d of [dx, dy, dz]) {
            trace.line(c.x - d.x, c.y - d.y, c.x + d.x, c.y + d.y);
        }
    }).thenStroke('#BBB');

    let [x, y, z] = [NaN, NaN, NaN];
    if (qubitDensityMatrix.hasNaN()) {
        painter.printParagraph("NaN", drawArea, new Point(0.5, 0.5), 'red');
    } else {
        [x, y, z] = qubitDensityMatrix.qubitDensityMatrixToBlochVector();
        _paintBlochSphereDisplay_indicator(painter, x, y, z, drawArea, fillColor);
    }

    _paintBlochSphereDisplay_tooltips(painter, drawArea, x, y, z, focusPoints);
}

let BlochSphereDisplay = Gate.fromIdentity(
    "Bloch",
    "Bloch Sphere Display",
    "Shows a wire's local state as a point on the Bloch Sphere.\nUse controls to see conditional states.").
    withCustomDrawer(GatePainting.makeDisplayDrawer(args => {
        let {row, col} = args.positionInCircuit;
        let ρ = args.stats.qubitDensityMatrix(col, row);
        paintBlochSphereDisplay(args.painter, ρ, args.rect, args.focusPoints);
    })).
    withCustomDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined);

export {paintBlochSphereDisplay, BlochSphereDisplay};
