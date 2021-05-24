/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Painter} from "./Painter.js"
import {Format} from "../base/Format.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {seq, Seq} from "../base/Seq.js"
import {Util} from "../base/Util.js"
import {Config} from "../Config.js"
import {Complex} from "../math/Complex.js"
import {Matrix} from "../math/Matrix.js"

class MathPainter {
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
        let cen = drawArea.center();
        if (isNaN(probability)) {
            painter.fillPolygon([drawArea.bottomLeft(), drawArea.topLeft(), drawArea.topRight()], fillColor);
            painter.print("NaN", cen.x, cen.y, 'center', 'middle', 'red', '9pt sans-serif', drawArea.w, drawArea.h);
        } else {
            painter.fillRect(drawArea.takeBottomProportion(probability), fillColor);
            painter.print(
                MathPainter.describeProbability(probability, 1),
                cen.x,
                cen.y,
                'center',
                'middle',
                'black',
                '9pt sans-serif',
                drawArea.w,
                drawArea.h);
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
     * @param {!function(!int, !int, !Complex) : !string} valueTextFunc1
     * @param {(!function(!int, !int, !Complex) : (undefined|!string))=} valueTextFunc2
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
        let p = real*real + imag*imag;
        if (p > 0.001) {
            trace.polygon([
                x, y + d * (1 - p),
                x + d, y + d * (1 - p),
                x + d, y + d,
                x, y + d]);
        }
    }

    //noinspection JSUnusedLocalSymbols
    /**
     * @param {!Tracer} trace
     * @param {!number} real
     * @param {!number} imag
     * @param {!number} x
     * @param {!number} y
     * @param {!number} d
     * @private
     */
    static _traceProbabilitySquare(trace, real, imag, x, y, d) {
        let p = real;
        if (d*p > 0.1) {
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
        if (d*mag > 0.5) {
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
        let g = 1 + Math.log(real*real + imag*imag)/15;
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
        let r = Math.max(1, g/mag)*Math.max(d/2, 5);
        if (r < 0.1) {
            return;
        }
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
     * @param {undefined|!string=} logCircleStrokeColor
     */
    static paintMatrix(painter,
                       matrix,
                       drawArea,
                       amplitudeCircleFillColor,
                       amplitudeCircleStrokeColor,
                       amplitudeProbabilityFillColor,
                       backColor = Config.DISPLAY_GATE_BACK_COLOR,
                       amplitudePhaseStrokeColor = undefined,
                       logCircleStrokeColor = '#AAA') {
        let numCols = matrix.width();
        let numRows = matrix.height();
        let buf = matrix.rawBuffer();
        let diam = Math.min(drawArea.w / numCols, drawArea.h / numRows);
        drawArea = drawArea.withW(diam * numCols).withH(diam*numRows);
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
            if (amplitudeCircleFillColor !== undefined) {
                traceCellsWith(MathPainter._traceAmplitudeProbabilityCircle).
                    thenFill(amplitudeCircleFillColor).
                    thenStroke(amplitudeCircleStrokeColor, 0.5);

                traceCellsWith(MathPainter._traceAmplitudeLogarithmCircle).
                    thenStroke(logCircleStrokeColor, 0.5);
            }
        }

        // Dividers.
        painter.trace(trace => trace.grid(x, y, drawArea.w, drawArea.h, numCols, numRows)).
            thenStroke('lightgray');

        if (!hasNaN) {
            // Phase lines.
            if (logCircleStrokeColor !== undefined) {
                traceCellsWith(MathPainter._traceAmplitudePhaseDirection).
                    thenStroke(amplitudePhaseStrokeColor);
            }
        }

        // Error text.
        if (hasNaN) {
            painter.print(
                'NaN',
                drawArea.x + drawArea.w/2,
                drawArea.y + drawArea.h/2,
                'center',
                'middle',
                'red',
                '16px sans-serif',
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
        const labelFont = '12px sans-serif';
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
     * @param {!number} unit
     * @returns {!{dx: !Point, dy: !Point, dz: !Point}}
     */
    static coordinateSystem(unit) {
        return {
            dx: new Point(unit / 3, -unit / 3),
            dy: new Point(unit, 0),
            dz: new Point(0, unit)
        };
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
        let {dx, dy, dz} = MathPainter.coordinateSystem(u);
        let projMatrix = Matrix.fromRows([
            [-dx.x, -dx.y],
            [dy.x, dy.y],
            [-dz.x, -dz.y],
        ]).adjoint();
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
            mapWithIndex((a, i) => a.times([-3, -2, 1][i])). // Prioritize/orient axes to look good.
            map(a => axisVec.cross3(a)).
            maxBy(norm);
        let perpVec2 = axisVec.cross3(perpVec1);
        perpVec1 = perpVec1.times(0.15 / norm(perpVec1));
        perpVec2 = perpVec2.times(0.15 / norm(perpVec2));
        let dPerp1 = projToPt(perpVec1);
        let dPerp2 = projToPt(perpVec2);

        MathPainter._paintBlochSphereRotation_rotationGuideArrows(painter, c, angle, dAxis, dPerp1, dPerp2, fillColor);
    }

    /**
     * @param {!Painter} painter
     * @param {!Point} center
     * @param {!number} angle
     * @param {!Point} dAlong
     * @param {!Point} dPerp1
     * @param {!Point} dPerp2
     * @param {!string} fillColor
     * @private
     */
    static _paintBlochSphereRotation_rotationGuideArrows(painter, center, angle, dAlong, dPerp1, dPerp2, fillColor) {
        // Compute the rotation arc.
        let rotationGuideDeltas = Seq.range(Math.floor(Math.abs(angle) * 32)).
            map(i => {
                let θ = (angle < 0 ? Math.PI - i / 32 : i / 32);
                return dPerp1.times(Math.cos(θ)).
                    plus(dPerp2.times(Math.sin(θ)));
            }).
            toArray();

        if (rotationGuideDeltas.length <= 1) {
            return;
        }

        // Draw the three rotation guides.
        for (let offsetFactor of [-0.55, 0, 0.55]) {
            let offsetCenter = center.plus(dAlong.times(offsetFactor));
            let arcPts = rotationGuideDeltas.map(d => offsetCenter.plus(d));
            let arrowHeadRoot = arcPts[arcPts.length - 1];
            let arrowHeadDirection = arrowHeadRoot.plus(arcPts[arcPts.length - 2].times(-1));
            let arrowHeadPts = [
                dAlong.times(0.15),
                arrowHeadDirection.times(30),
                dAlong.times(-0.15)
            ].map(d => arrowHeadRoot.plus(d));
            let interleaved = [].concat.apply([], arrowHeadPts.map(e => [e.x, e.y]));

            painter.strokePath(arcPts, '#444');
            painter.trace(tracer => tracer.polygon(interleaved)).
                thenFill(fillColor).
                thenStroke('#444');
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
            traceDiagonalWith(MathPainter._traceProbabilitySquare).
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
        let d = drawArea.w/numCols;
        if (d > 2) {
            painter.trace(trace => trace.grid(x, y, drawArea.w, drawArea.h, numCols, numRows)).
                thenStroke('lightgray', Math.min(1, 2/Math.log(numCols)));
        } else {
           painter.ctx.save();
           painter.ctx.globalAlpha *= 0.2;
           painter.fillRect(drawArea, 'lightgray');
           painter.ctx.restore();
        }

        if (hasNaN) {
            painter.print(
                'NaN',
                drawArea.x + drawArea.w/2,
                drawArea.y + drawArea.h/2,
                'center',
                'middle',
                'red',
                '16px sans-serif',
                drawArea.w,
                drawArea.h);
        }

        let n = Math.round(Math.log2(numRows));
        MathPainter.paintMatrixTooltip(painter, matrix, drawArea, focusPoints,
            (c, r) => c === r ?
                `Probability of |${Util.bin(c, n)}⟩ (decimal ${c})` :
                `Coupling of |${Util.bin(r, n)}⟩ to ⟨${Util.bin(c, n)}| (decimal ${r} to ${c})`,
            (c, r, v) => c === r ?
                (matrix.cell(c, r).real*100).toFixed(4) + "%" :
                matrix.cell(c, r).toString(new Format(false, 0, 6, ", ")));
    }
}

export {MathPainter}
