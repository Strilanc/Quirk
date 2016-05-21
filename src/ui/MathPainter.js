import Painter from "src/ui/Painter.js"
import Format from "src/base/Format.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"
import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

export default class MathPainter {
    static describeProbability(p, fractionalDigits) {
        let v = p * 100;
        let e = Math.pow(10, -fractionalDigits);

        if (v > 100 - e / 2) {
            return "On";
        }
        if (v < e / 2) {
            return "Off";
        }

        return Math.min(Math.max(v, e), 100 - e).toFixed(fractionalDigits) + "%";
    }

    /**
     * @param {!Painter} painter
     * @param {!number} probability
     * @param {!Rect} drawArea
     * @param {!Array.<!Point>=} focusPoints
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintProbabilityBox(painter,
                               probability,
                               drawArea,
                               focusPoints = [],
                               backgroundColor = Config.DISPLAY_GATE_BACK_COLOR,
                               fillColor = Config.DISPLAY_GATE_FORE_COLOR) {
        painter.fillRect(drawArea, backgroundColor);
        if (isNaN(probability)) {
            painter.fillPolygon([drawArea.bottomLeft(), drawArea.topLeft(), drawArea.topRight()], fillColor);
            painter.printParagraph("NaN", drawArea, new Point(0.5, 0.5), 'red');
        } else {
            painter.fillRect(drawArea.takeBottomProportion(probability), fillColor);
            painter.printParagraph(MathPainter.describeProbability(probability, 1), drawArea, new Point(0.5, 0.5));
        }

        painter.strokeRect(drawArea, 'lightgray');


        // Tool tips.
        if (seq(focusPoints).any(pt => drawArea.containsPoint(pt))) {
            painter.strokeRect(drawArea, 'orange', 2);
            MathPainter.paintDeferredValueTooltip(
                painter,
                drawArea.right(),
                drawArea.y,
                'Chance of being ON if measured',
                (100*probability).toFixed(5) + "%");
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!Matrix} matrix The matrix to draw.
     * @param {!Rect} drawArea The rectangle to draw the matrix within.
     * @param {!Array.<!Point>} focusPoints
     * @param {!function(!int, !int) : !string} titleFunc
     * @param {!function(!int, !int) : !string} valueTextFunc1
     * @param {!function(!int, !int) : !string=} valueTextFunc2
     */
    static paintMatrixTooltip(
            painter,
            matrix,
            drawArea,
            focusPoints,
            titleFunc,
            valueTextFunc1,
            valueTextFunc2 = () => undefined) {
        let numCols = matrix.width();
        let numRows = matrix.height();
        let {x, y} = drawArea;
        let diam = Math.min(drawArea.w / numCols, drawArea.h / numRows);
        for (let pt of focusPoints) {
            let c = Math.floor((pt.x - x) / diam);
            let r = Math.floor((pt.y - y) / diam);
            if (c >= 0 && c < matrix.width() && r >= 0 && r < matrix.height()) {
                painter.strokeRect(new Rect(x + diam*c, y + diam*r, diam, diam), 'orange', 2);
                let v = matrix.cell(c, r);
                MathPainter.paintDeferredValueTooltip(
                    painter,
                    x + diam*c + diam,
                    y + diam*r,
                    titleFunc(c, r),
                    valueTextFunc1(c, r, v),
                    valueTextFunc2(c, r, v));
            }
        }
    }

    /**
     * @param {!Tracer} trace
     * @param {!number} real
     * @param {!number} imag
     * @param {!number} x
     * @param {!number} y
     * @param {!number} d
     * @private
     */
    static _traceAmplitudeProbabilitySquare(trace, real, imag, x, y, d) {
        let p = Math.sqrt(real*real + imag*imag);
        if (p > 0.001) {
            trace.polygon([
                x, y + d * (1 - p),
                x + d, y + d * (1 - p),
                x + d, y + d,
                x, y + d]);
        }
    }

    /**
     * @param {!Tracer} trace
     * @param {!number} real
     * @param {!number} imag
     * @param {!number} x
     * @param {!number} y
     * @param {!number} d
     * @private
     */
    static _traceAmplitudeProbabilityCircle(trace, real, imag, x, y, d) {
        let mag = Math.sqrt(real*real + imag*imag);
        if (mag > 0.0001) {
            trace.circle(x+d/2, y+d/2, mag*d/2);
        }
    }

    /**
     * @param {!Tracer} trace
     * @param {!number} real
     * @param {!number} imag
     * @param {!number} x
     * @param {!number} y
     * @param {!number} d
     * @private
     */
    static _traceAmplitudeLogarithmCircle(trace, real, imag, x, y, d) {
        let g = 1 + Math.log(real*real + imag*imag)/20;
        if (g > 0) {
            trace.circle(x+d/2, y+d/2, g*d/2);
        }
    }

    /**
     * @param {!Tracer} trace
     * @param {!number} real
     * @param {!number} imag
     * @param {!number} x
     * @param {!number} y
     * @param {!number} d
     * @private
     */
    static _traceAmplitudePhaseDirection(trace, real, imag, x, y, d) {
        let mag = Math.sqrt(real*real + imag*imag);
        let g = 1 + Math.log(mag)/10;
        if (isNaN(mag) || g < 0.000001) {
            return;
        }
        let r = Math.max(1, g/mag)*d/2;
        let cx = x + d/2;
        let cy = y + d/2;
        trace.line(cx, cy, cx + real*r, cy - imag*r);
    }

    /**
     * Draws a visual representation of a complex matrix.
     * @param {!Painter} painter
     * @param {!Matrix} matrix The matrix to draw.
     * @param {!Rect} drawArea The rectangle to draw the matrix within.
     * @param {undefined|!string} amplitudeCircleFillColor
     * @param {!string} amplitudeCircleStrokeColor
     * @param {undefined|!string} amplitudeProbabilityFillColor
     * @param {undefined|!string=} backColor
     * @param {undefined|!string=} amplitudePhaseStrokeColor
     */
    static paintMatrix(painter,
                       matrix,
                       drawArea,
                       amplitudeCircleFillColor,
                       amplitudeCircleStrokeColor,
                       amplitudeProbabilityFillColor,
                       backColor = Config.DISPLAY_GATE_BACK_COLOR,
                       amplitudePhaseStrokeColor = undefined) {
        let numCols = matrix.width();
        let numRows = matrix.height();
        let buf = matrix.rawBuffer();
        let diam = Math.min(drawArea.w / numCols, drawArea.h / numRows);
        let {x, y} = drawArea;
        let hasNaN = matrix.hasNaN();
        amplitudePhaseStrokeColor = amplitudePhaseStrokeColor || amplitudeCircleStrokeColor;

        painter.fillRect(drawArea, backColor);

        let traceCellsWith = cellTraceFunc => painter.trace(trace => {
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    let k = (row * numCols + col) * 2;
                    cellTraceFunc(
                        trace,
                        buf[k],
                        buf[k + 1],
                        x + diam * col,
                        y + diam * row,
                        diam);
                }
            }
        });

        if (!hasNaN) {
            // Squared magnitude levels.
            if (amplitudeProbabilityFillColor !== undefined) {
                traceCellsWith(MathPainter._traceAmplitudeProbabilitySquare).
                    thenFill(amplitudeProbabilityFillColor).
                    thenStroke('lightgray', 0.5);
            }

            // Circles.
            if (amplitudeProbabilityFillColor !== undefined) {
                traceCellsWith(MathPainter._traceAmplitudeProbabilityCircle).
                    thenFill(amplitudeCircleFillColor).
                    thenStroke(amplitudeCircleStrokeColor, 0.5);

                traceCellsWith(MathPainter._traceAmplitudeLogarithmCircle).
                    thenStroke('#AAA', 0.5);
            }

            // Phase lines.
            traceCellsWith(MathPainter._traceAmplitudePhaseDirection).
                thenStroke(amplitudePhaseStrokeColor);
        }

        // Dividers.
        painter.trace(trace => trace.grid(x, y, drawArea.w, drawArea.h, numCols, numRows)).
            thenStroke('lightgray');

        // Error text.
        if (hasNaN) {
            painter.print(
                'NaN',
                drawArea.x + drawArea.w/2,
                drawArea.y + drawArea.h/2,
                'center',
                'middle',
                'red',
                '16px Helvetica',
                drawArea.w,
                drawArea.h);
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!number} x
     * @param {!number} y
     * @param {!string} labelText
     * @param {!string} valueText
     * @param {undefined|!string=} valueText2
     * @param {!string=} backColor
     */
    static paintDeferredValueTooltip(
            painter,
            x,
            y,
            labelText,
            valueText,
            valueText2 = undefined,
            backColor = Config.DISPLAY_GATE_BACK_COLOR) {
        const labelFont = '12px Helvetica';
        const valueFont = 'bold 12px monospace';
        painter.defer(() => {
            painter.ctx.font = labelFont;
            let width1 = painter.ctx.measureText(labelText).width;
            painter.ctx.font = valueFont;
            let width2 = painter.ctx.measureText(valueText).width;
            let width3 = valueText2 === undefined ? 0 : painter.ctx.measureText(valueText2).width;

            let lineHeight = 20;
            let height = 40 + (valueText2 === undefined ? 0 : 20);
            let width = Math.max(Math.max(width1, width2), width3);
            let boundingRect = new Rect(x, y - height, width, height).snapInside(
                new Rect(0, 0, painter.ctx.canvas.clientWidth, painter.ctx.canvas.clientHeight));

            let borderPainter = (w, h) => {
                let r = new Rect(
                    boundingRect.x,
                    boundingRect.bottom()-h,
                    w,
                    h).paddedBy(4);
                painter.trace(tracer => tracer.rect(r.x, r.y, r.w, r.h)).
                    thenFill(backColor).
                    thenStroke('black');
            };

            let labelPainter = (w, h) => {
                painter.print(
                    labelText,
                    boundingRect.x,
                    boundingRect.bottom()-h,
                    'left',
                    'bottom',
                    'black',
                    labelFont,
                    boundingRect.w,
                    lineHeight,
                    (w2, h2) => borderPainter(Math.max(w, w2), h + h2));
            };

            let value1Painter = (w, h) => {
                painter.print(
                    valueText,
                    boundingRect.x,
                    boundingRect.bottom()-h,
                    'left',
                    'bottom',
                    'black',
                    valueFont,
                    boundingRect.w,
                    lineHeight,
                    (w2, h2) => labelPainter(Math.max(w, w2), h + h2));
            };

            if (valueText2 === undefined) {
                value1Painter(0, 0);
            } else {
                painter.print(
                    valueText2,
                    boundingRect.x,
                    boundingRect.bottom(),
                    'left',
                    'bottom',
                    'black',
                    valueFont,
                    boundingRect.w,
                    lineHeight,
                    value1Painter);
            }
        });
    }

    /**
     * @param {!Painter} painter
     * @param {!Matrix} qubitDensityMatrix
     * @param {!Rect} drawArea
     * @param {!Array.<!Point>=} focusPoints
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintBlochSphere(painter,
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
            let pxy = c.plus(dx.times(x)).plus(dy.times(y));
            let p = pxy.plus(dz.times(z));
            let r = 4 / (1 + y / 8);

            // Draw state indicators (also in not-quite-correct 3d).
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

        // Tool tips.
        if (seq(focusPoints).any(pt => pt.distanceTo(c) < u)) {
            painter.strokeCircle(c, u, 'orange', 2);
            let f = v => (v >= 0 ? '+' : '') + v.toFixed(2);
            let g = v => (v >= 0 ? '+' : '') + v.toFixed(4);
            let d = Math.sqrt(x*x + y*y + z*z);
            let ϕ = Math.atan2(y, -x);
            let θ = Math.atan2(-z, Math.sqrt(y*y + x*x));
            let τ = Math.PI * 2;
            MathPainter.paintDeferredValueTooltip(
                painter,
                c.x+u*Math.sqrt(0.5),
                c.y-u*Math.sqrt(0.5),
                'Bloch sphere representation of local state',
                `r:${g(d)}, ϕ:${f(ϕ*360/τ)}°, θ:${f(θ*360/τ)}°`,
                `x:${g(-x)}, y:${g(y)}, z:${g(-z)}`);
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!Matrix} operation
     * @param {!Rect} drawArea
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintBlochSphereRotation(painter,
                                    operation,
                                    drawArea,
                                    backgroundColor = Config.DISPLAY_GATE_BACK_COLOR,
                                    fillColor = Config.DISPLAY_GATE_FORE_COLOR) {
        let c = drawArea.center();
        let u = Math.min(drawArea.w, drawArea.h) / 2;
        let projMatrix = Matrix.fromRows([
            [-u, 0],
            [-u / 3, u / 3],
            [0, u]]).adjoint();
        let projToPt = col => {
            let p = projMatrix.times(col);
            return new Point(p.cell(0, 0).real, p.cell(0, 1).real)
        };
        let axes = Seq.range(3).map(i => Matrix.generate(1, 3, (r, _) => r === i ? 1 : 0)).toArray();

        // Draw sphere and axis lines (in not-quite-proper 3d).
        painter.fillCircle(c, u, backgroundColor);

        painter.trace(trace => {
            trace.circle(c.x, c.y, u);
            trace.ellipse(c.x, c.y, u, u / 3);
            trace.ellipse(c.x, c.y, u / 3, u);
            for (let a of axes) {
                let d = projToPt(a);
                trace.line(c.x - d.x, c.y - d.y, c.x + d.x, c.y + d.y);
            }
        }).thenStroke('#BBB');

        let {angle, axis} = operation.qubitOperationToAngleAxisRotation();
        let axisVec = Matrix.col(...axis);
        let dAxis = projToPt(axisVec);

        // Disambiguating 3d guide lines for axis, forming vertical rectangles.
        let guideDeltas = [
            Matrix.col(axis[0], axis[1], 0),
            axisVec,
            Matrix.col(0, 0, axis[2])
        ].map(projToPt);
        painter.strokePolygon(seq(guideDeltas).
            reverse().
            concat(guideDeltas.map(d => d.times(-1))).
            map(d => c.plus(d)).
            toArray(), '#666');
        // Rotation axis.
        painter.strokeLine(c.plus(dAxis), c.plus(dAxis.times(-1)), 'black', 2);

        // Find perpendicular axes, for drawing the rotation arrow circles.
        let norm = e => Math.sqrt(e.adjoint().times(e).cell(0, 0).real);
        let perpVec1 = seq(axes).
            mapWithIndex((a, i) => a.times([2, -3, 1][i])). // Prioritize/orient axes to look good.
            map(a => axisVec.cross3(a)).
            maxBy(norm);
        let perpVec2 = axisVec.cross3(perpVec1);
        perpVec1 = perpVec1.times(0.15 / norm(perpVec1));
        perpVec2 = perpVec2.times(0.15 / norm(perpVec2));
        let dPerp1 = projToPt(perpVec1);
        let dPerp2 = projToPt(perpVec2);

        // Compute the rotation arc.
        let rotationGuideDeltas = Seq.range(Math.floor(Math.abs(angle) * 64)).
            map(i => {
                let θ = (angle < 0 ? Math.PI - i / 64 : i / 64);
                return dPerp1.times(Math.cos(θ)).
                    plus(dPerp2.times(Math.sin(θ)));
            }).
            toArray();

        if (rotationGuideDeltas.length > 1) {
            // Draw the three rotation guides.
            for (let offsetFactor of [-0.55, 0, 0.55]) {
                let offsetCenter = c.plus(dAxis.times(offsetFactor));
                let arcPts = rotationGuideDeltas.map(d => offsetCenter.plus(d));
                let arrowHeadRoot = arcPts[arcPts.length - 1];
                let arrowHeadDirection = arrowHeadRoot.plus(arcPts[arcPts.length - 2].times(-1));
                let arrowHeadPts = [
                    dAxis.times(0.15),
                    arrowHeadDirection.times(60),
                    dAxis.times(-0.15)
                ].map(d => arrowHeadRoot.plus(d));

                painter.strokePath(arcPts, '#444');
                painter.fillPolygon(arrowHeadPts, fillColor);
                painter.strokePolygon(arrowHeadPts, '#444');
            }
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!Matrix} matrix
     * @param {!Rect} drawArea
     * @param {!Array.<!Point>} focusPoints
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintDensityMatrix(painter,
                              matrix,
                              drawArea,
                              focusPoints = [],
                              backgroundColor = Config.DISPLAY_GATE_BACK_COLOR,
                              fillColor = Config.DISPLAY_GATE_FORE_COLOR) {
        let numCols = matrix.width();
        let numRows = matrix.height();
        let buf = matrix.rawBuffer();
        let diam = Math.min(drawArea.w / numCols, drawArea.h / numRows);
        let x = drawArea.x;
        let y = drawArea.y;
        let hasNaN = matrix.hasNaN();

        let traceCouplingsWith = cellTraceFunc => painter.trace(trace => {
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    if (col !== row) {
                        let k = (row * numCols + col) * 2;
                        cellTraceFunc(
                            trace,
                            buf[k],
                            buf[k + 1],
                            x + diam * col,
                            y + diam * row,
                            diam);
                    }
                }
            }
        });

        let traceDiagonalWith = cellTraceFunc => painter.trace(trace => {
            for (let col = 0; col < numRows; col++) {
                let k = col * (numCols + 1) * 2;
                cellTraceFunc(
                    trace,
                    buf[k],
                    buf[k + 1],
                    x + diam * col,
                    y + diam * col,
                    diam);
            }
        });

        painter.fillRect(drawArea, backgroundColor);

        if (!hasNaN) {
            traceDiagonalWith(MathPainter._traceAmplitudeProbabilitySquare).
                thenFill(fillColor).
                thenStroke('#040', 0.5);

            traceCouplingsWith(MathPainter._traceAmplitudeProbabilityCircle).
                thenFill(fillColor).
                thenStroke('#040', 0.5);

            traceCouplingsWith(MathPainter._traceAmplitudeLogarithmCircle).
                thenStroke('#BBB', 0.5);

            traceCouplingsWith(MathPainter._traceAmplitudePhaseDirection).
                thenStroke('black');
        }

        // Dividers.
        painter.trace(trace => trace.grid(x, y, drawArea.w, drawArea.h, numCols, numRows)).
            thenStroke('lightgray');

        if (hasNaN) {
            painter.print(
                'NaN',
                drawArea.x + drawArea.w/2,
                drawArea.y + drawArea.h/2,
                'center',
                'middle',
                'red',
                '16px Helvetica',
                drawArea.w,
                drawArea.h);
        }

        let n = Math.round(Math.log2(numRows));
        MathPainter.paintMatrixTooltip(painter, matrix, drawArea, focusPoints,
            (c, r) => c === r ?
                `Probability of |${Util.bin(c, n)}⟩` :
                `Coupling of |${Util.bin(c, n)}⟩ to ⟨${Util.bin(r, n)}|`,
            (c, r, v) => c === r ?
                (matrix.cell(c, r).real*100).toFixed(4) + "%" :
                matrix.cell(c, r).toString(new Format(false, 0, 6, ", ")));
    }
}
