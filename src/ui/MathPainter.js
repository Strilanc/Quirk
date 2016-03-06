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

        if (v > 100 - e/2) {
            return "On";
        }
        if (v < e/2) {
            return "Off";
        }

        return Math.min(Math.max(v, e), 100 - e).toFixed(fractionalDigits) + "%";
    };

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
                               backgroundColor = Config.PEEK_GATE_OFF_FILL_COLOR,
                               fillColor = Config.PEEK_GATE_ON_FILL_COLOR) {
        painter.fillRect(drawArea, backgroundColor);
        if (isNaN(probability)) {
            painter.fillPolygon([drawArea.bottomLeft(), drawArea.topLeft(), drawArea.topRight()], fillColor);
        } else {
            painter.fillRect(drawArea.takeBottomProportion(probability), fillColor);
        }

        painter.printParagraph(MathPainter.describeProbability(probability, 1), drawArea, new Point(0.5, 0.5));
        painter.ctx.setLineDash([2, 3]);
        painter.strokeRect(drawArea);
        painter.ctx.setLineDash([]);
    }

    /**
     * Draws a complex value, assuming it's magnitude is less than 1.
     *
     * @param {!Painter} painter
     * @param {!Rect} area The drawing area, where the amplitude will be represented visually.
     * @param {!Complex} amplitude The complex value to represent visually. Its magnitude should be at most 1.
     * @param {!string=} amplitudeCircleFillColor
     * @param {!string=} amplitudeCircleStrokeColor
     * @param {!string=} amplitudeProbabilityFillColor
     */
    static paintAmplitude(painter,
                          amplitude,
                          area,
                          amplitudeCircleFillColor = Config.AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL,
                          amplitudeCircleStrokeColor = Config.AMPLITUDE_CIRCLE_STROKE_COLOR,
                          amplitudeProbabilityFillColor = Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR) {
        let c = area.center();
        let magnitude = amplitude.abs();
        let p = amplitude.norm2();
        let d = Math.min(area.w, area.h) / 2;
        let r = d * magnitude;
        let dx = d * amplitude.real;
        let dy = d * amplitude.imag;
        let isControl = amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE;

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
        painter.fillRect(area.takeBottom(p * area.h), amplitudeProbabilityFillColor);

        // show the direction and magnitude as a circle with a line indicator
        painter.fillCircle(c, r, amplitudeCircleFillColor);
        painter.strokeCircle(c, r, amplitudeCircleStrokeColor);
        painter.strokeLine(c, new Point(c.x + dx, c.y - dy));

        // cross out (in addition to the darkening) when controlled
        if (isControl) {
            painter.strokeLine(area.topLeft(), area.bottomRight());
        }
    };

    /**
     * Draws a visual representation of a complex matrix.
     * @param {!Painter} painter
     * @param {!Matrix} matrix The matrix to draw.
     * @param {!Rect} drawArea The rectangle to draw the matrix within.
     * @param {!(!Point[])} focusPoints
     */
    static paintMatrix(painter, matrix, drawArea, focusPoints) {
        let numCols = matrix.width();
        let numRows = matrix.height();
        let topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);

        // Contents
        for (let c = 0; c < numCols; c++) {
            for (let r = 0; r < numRows; r++) {
                MathPainter.paintAmplitude(
                    painter,
                    matrix.cell(c, r),
                    topLeftCell.proportionalShiftedBy(c, r));
            }
        }

        // Frame
        painter.strokeRect(drawArea);
        if (Config.PAINT_MATRIX_GRID_COLOR_OR_NULL !== null) {
            painter.strokeGrid(topLeftCell, numCols, numRows, Config.PAINT_MATRIX_GRID_COLOR_OR_NULL);
        }

        // Tooltip
        for (let pos of focusPoints) {
            let focus_c = Math.floor((pos.x - topLeftCell.x) / topLeftCell.w);
            let focus_r = Math.floor((pos.y - topLeftCell.y) / topLeftCell.h);
            if (!new Rect(0, 0, numCols, numRows).containsPoint(new Point(focus_c, focus_r))) {
                continue;
            }

            let cell = topLeftCell.proportionalShiftedBy(focus_c, focus_r);
            let numWires = Math.log2(Math.max(matrix.width(), matrix.height()));
            let stater = bitMask => Seq.range(numWires).
                map(i => ((1 << (numWires - i - 1)) & bitMask) !== 0 ? "1" : "0").
                join("");

            let tip = `${stater(focus_c)} → ${stater(focus_r)}` +
                "\n= " + matrix.cell(focus_c, focus_r).toString(Format.CONSISTENT);

            let paintRect = new Rect(cell.x, cell.y - 30, 100, 30).snapInside(painter.paintableArea()).paddedBy(-2);
            painter.defer(() => {
                let usedRect = painter.printParagraph(tip, paintRect, new Point(0, 1)).paddedBy(2);
                painter.fillRect(usedRect);
                painter.strokeRect(usedRect);
                painter.printParagraph(tip, paintRect, new Point(0, 1));
            });
        }
    };


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
                              backgroundColor = Config.PEEK_GATE_OFF_FILL_COLOR,
                              fillColor = Config.PEEK_GATE_ON_FILL_COLOR) {
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
                let v = matrix.cell(x, y).times(Math.PI/2);

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
        painter.ctx.setLineDash([2, 3]);
        painter.strokeRect(drawArea);
        painter.ctx.setLineDash([]);

        // Inline
        for (let i = 1; i < n; i++) {
            let x = drawArea.x + drawArea.w / n * i;
            let y = drawArea.y + drawArea.h / n * i;
            painter.strokeLine(new Point(drawArea.x, y), new Point(drawArea.right(), y), 'lightgray');
            painter.strokeLine(new Point(x, drawArea.y), new Point(x, drawArea.bottom()), 'lightgray');
        }
    }
}
