import Painter from "src/ui/Painter.js"
import Format from "src/base/Format.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

export default class MathPainter {
    static describeProbability(p, fractionalDigits) {
        var v = p * 100;
        var e = Math.pow(10, -fractionalDigits);

        if (v > 100 - e / 2) {
            return "On";
        }
        if (v < e / 2) {
            return "Off";
        }

        return Math.min(Math.max(v, e), 100 - e).toFixed(fractionalDigits) + "%";
    }

;

    /**
     * @param {!Painter} painter
     * @param {!number} probability
     * @param {!Rect} drawArea
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintProbabilityBox(painter,
                               probability,
                               drawArea,
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
    }

    /**
     * Draws a complex value, assuming it's magnitude is less than 1.
     *
     * @param {!Painter} painter
     * @param {!Rect} area The drawing area, where the amplitude will be represented visually.
     * @param {!Complex} amplitude The complex value to represent visually. Its magnitude should be at most 1.
     * @param {!string} amplitudeCircleFillColor
     * @param {!string} amplitudeCircleStrokeColor
     * @param {!string|undefined} amplitudeProbabilityFillColor
     */
    static paintAmplitude(painter,
                          amplitude,
                          area,
                          amplitudeCircleFillColor,
                          amplitudeCircleStrokeColor,
                          amplitudeProbabilityFillColor) {
        let c = area.center();
        let magnitude = amplitude.abs();
        let p = amplitude.norm2();
        let d = Math.min(area.w, area.h) / 2;
        let r = d * magnitude;
        let dx = d * amplitude.real;
        let dy = d * amplitude.imag;

        if (magnitude <= 0.0001) {
            return; // Even showing a tiny dot is too much.
        }
        if (isNaN(magnitude)) {
            painter.printParagraph("NaN", area, new Point(0.5, 0.5), "red");
        }
        if (magnitude == Infinity) {
            painter.printParagraph("\u221E", area, new Point(0.5, 0.5), "red");
        }
        if (magnitude == -Infinity) {
            painter.printParagraph("-\u221E", area, new Point(0.5, 0.5), "red");
        }

        // fill rect from bottom to top as the amplitude becomes more probable
        if (amplitudeProbabilityFillColor !== undefined) {
            let fillRect = area.takeBottom(p * area.h);
            painter.fillRect(fillRect, amplitudeProbabilityFillColor);
            painter.strokeLine(fillRect.topLeft(), fillRect.topRight(), amplitudeCircleStrokeColor);
        }

        // show the direction and magnitude as a circle with a line indicator
        painter.fillCircle(c, r, amplitudeCircleFillColor);
        painter.strokeCircle(c, r, amplitudeCircleStrokeColor);
        painter.strokeLine(c, new Point(c.x + dx, c.y - dy));
    }

    /**
     * Draws a visual representation of a complex matrix.
     * @param {!Painter} painter
     * @param {!Matrix} matrix The matrix to draw.
     * @param {!Rect} drawArea The rectangle to draw the matrix within.
     * @param {!string} amplitudeCircleFillColor
     * @param {!string} amplitudeCircleStrokeColor
     * @param {!string|undefined} amplitudeProbabilityFillColor
     * @param {!string=} backColor
     */
    static paintMatrix(painter,
                       matrix,
                       drawArea,
                       amplitudeCircleFillColor,
                       amplitudeCircleStrokeColor,
                       amplitudeProbabilityFillColor,
                       backColor = Config.DISPLAY_GATE_BACK_COLOR) {
        let numCols = matrix.width();
        let numRows = matrix.height();
        let topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);

        painter.fillRect(drawArea, backColor);

        // Contents
        for (let c = 0; c < numCols; c++) {
            for (let r = 0; r < numRows; r++) {
                MathPainter.paintAmplitude(
                    painter,
                    matrix.cell(c, r),
                    topLeftCell.proportionalShiftedBy(c, r),
                    amplitudeCircleFillColor,
                    amplitudeCircleStrokeColor,
                    amplitudeProbabilityFillColor);
            }
        }

        painter.strokeGrid(topLeftCell, numCols, numRows, 'lightgray');
    }

    /**
     * @param {!Painter} painter
     * @param {!Matrix} qubitDensityMatrix
     * @param {!Rect} drawArea
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintBlochSphere(painter,
                            qubitDensityMatrix,
                            drawArea,
                            backgroundColor = Config.DISPLAY_GATE_BACK_COLOR,
                            fillColor = Config.DISPLAY_GATE_FORE_COLOR) {
        let c = drawArea.center();
        let u = Math.min(drawArea.w, drawArea.h) / 2;
        let [dx, dy, dz] = [new Point(-u, 0), new Point(u / 3, -u / 3), new Point(0, u)];

        // Draw sphere and axis lines (in not-quite-proper 3d).
        painter.fillCircle(c, u, backgroundColor);
        painter.strokeCircle(c, u, '#BBB');
        painter.strokeEllipse(c, new Point(dx.x, dy.y), '#BBB');
        painter.strokeEllipse(c, new Point(dy.x, dz.y), '#BBB');
        for (let d of [dx, dy, dz]) {
            painter.strokeLine(c.plus(d.times(-1)), c.plus(d), '#BBB');
        }
        if (isNaN(qubitDensityMatrix.cell(0, 0).real)) {
            painter.printParagraph("NaN", drawArea, new Point(0.5, 0.5), 'red');
            return;
        }

        let [x, y, z] = qubitDensityMatrix.qubitDensityMatrixToBlochVector().getColumn(0);
        [x, y, z] = [x.real, y.real, z.real];
        let pxy = c.plus(dx.times(x)).plus(dy.times(y));
        let p = pxy.plus(dz.times(z));
        let r = 4 / (1 + y / 8);

        // Draw state indicators (also in not-quite-correct 3d).
        painter.strokeLine(c, pxy, '#666');
        painter.strokeLine(pxy, p, '#666');
        painter.strokeLine(c, c.plus(dz.times(z)), '#666');
        painter.strokeLine(p, c.plus(dz.times(z)), '#666');
        painter.strokeLine(c, p, 'black', 2);
        painter.fillCircle(p, r, fillColor);
        painter.ctx.globalAlpha = Math.min(1, Math.max(0, 1-x*x-y*y-z*z));
        painter.fillCircle(p, r, 'yellow');
        painter.ctx.globalAlpha = 1;
        painter.strokeCircle(p, r, 'black');
        painter.ctx.globalAlpha = Math.min(1, Math.max(0, 0.5+y*5));
        painter.strokeLine(c, p, 'black', 2);
        painter.ctx.globalAlpha = 1;
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
        painter.strokeCircle(c, u, '#BBB');
        painter.strokeEllipse(c, new Point(u, u / 3), '#BBB');
        painter.strokeEllipse(c, new Point(u / 3, u), '#BBB');
        for (let a of axes) {
            let d = projToPt(a);
            painter.strokeLine(c.plus(d.times(-1)), c.plus(d), '#BBB');
        }

        let {angle, axis} = operation.qubitOperationToAngleAxisRotation();
        let axisVec = Matrix.col(axis);
        let dAxis = projToPt(axisVec);

        // Disambiguating 3d guide lines for axis, forming vertical rectangles.
        let guideDeltas = [
            Matrix.col([axis[0], axis[1], 0]),
            axisVec,
            Matrix.col([0, 0, axis[2]])
        ].map(projToPt);
        painter.strokePolygon(new Seq(guideDeltas).
            reverse().
            concat(guideDeltas.map(d => d.times(-1))).
            map(d => c.plus(d)).
            toArray(), '#666');
        // Rotation axis.
        painter.strokeLine(c.plus(dAxis), c.plus(dAxis.times(-1)), 'black', 2);

        // Find perpendicular axes, for drawing the rotation arrow circles.
        let norm = e => Math.sqrt(e.adjoint().times(e).cell(0, 0).real);
        let perpVec1 = new Seq(axes).
            mapWithIndex((a, i) => a.scaledBy([2, -3, 1][i])). // Prioritize/orient axes to look good.
            map(a => axisVec.cross3(a)).
            maxBy(norm);
        let perpVec2 = axisVec.cross3(perpVec1);
        perpVec1 = perpVec1.scaledBy(0.15 / norm(perpVec1));
        perpVec2 = perpVec2.scaledBy(0.15 / norm(perpVec2));
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
     * @param {!string=} backgroundColor
     * @param {!string=} fillColor
     */
    static paintDensityMatrix(painter,
                              matrix,
                              drawArea,
                              backgroundColor = Config.DISPLAY_GATE_BACK_COLOR,
                              fillColor = Config.DISPLAY_GATE_FORE_COLOR) {
        painter.fillRect(drawArea, backgroundColor);

        let n = matrix.width();
        let topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / n, drawArea.h / n);

        // Off-diagonal contents.
        let unitRadius = Math.min(topLeftCell.w, topLeftCell.h) / 2;
        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                if (x == y) {
                    continue;
                }

                let r = topLeftCell.proportionalShiftedBy(x, y);
                let v = matrix.cell(x, y).times(Math.PI / 2);

                let mag = v.abs();
                if (isNaN(mag)) {
                    painter.printParagraph("NaN", r, new Point(0.5, 0.5), "red");
                    continue;
                }
                if (mag < 0.0001) {
                    continue; // Too small to see.
                }

                // show the direction and magnitude as a circle with a line indicator
                let c = r.center();
                painter.fillCircle(c, unitRadius * mag, fillColor);
                painter.strokeCircle(c, unitRadius * mag, '#040');
                painter.strokeLine(c, c.offsetBy(unitRadius * v.real, unitRadius * v.imag));
            }
        }

        // Main diagonal
        for (let d = 0; d < n; d++) {
            let p = matrix.cell(d, d).abs();
            if (p < 0.0001) {
                continue; // Too small to see.
            }
            let r = topLeftCell.proportionalShiftedBy(d, d);
            if (isNaN(p)) {
                painter.fillPolygon([r.bottomLeft(), r.topLeft(), r.topRight()], fillColor);
                painter.printParagraph("NaN", r, new Point(0.5, 0.5), "red");
            } else {
                let b = r.takeBottomProportion(p);
                painter.fillRect(b, fillColor);
                painter.strokeLine(b.topLeft(), b.topRight(), '#040');
            }
        }

        // Outline
        painter.strokeRect(drawArea, 'lightgray');

        // Inline
        for (let i = 1; i < n; i++) {
            let x = drawArea.x + drawArea.w / n * i;
            let y = drawArea.y + drawArea.h / n * i;
            painter.strokeLine(new Point(drawArea.x, y), new Point(drawArea.right(), y), 'lightgray');
            painter.strokeLine(new Point(x, drawArea.y), new Point(x, drawArea.bottom()), 'lightgray');
        }
    }
}
