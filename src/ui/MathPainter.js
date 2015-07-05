import Painter from "src/ui/Painter.js"
import Format from "src/base/Format.js"
import Point from "src/base/Point.js"
import Rect from "src/base/Rect.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

export default class MathPainter {
    static describeProbability(p, fractionalDigits) {
        if (p >= 0.999) {
            return "ON";
        }
        if (p <= 0.001) {
            return "OFF";
        }

        var v = p * 100;
        var e = Math.pow(10, -fractionalDigits);
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
                               backgroundColor = Config.BACKGROUND_COLOR,
                               fillColor = Config.PROBABILITY_BOX_FILL_UP_COLOR) {
        painter.fillRect(drawArea, backgroundColor);
        painter.fillRect(drawArea.takeBottomProportion(probability), fillColor);
        painter.printParagraph(MathPainter.describeProbability(probability, 1), drawArea, new Point(0.5, 0.5));
        painter.strokeRect(drawArea);
    }

    /**
     * @param {!Painter} painter
     * @param {!number} probabilityOfCondition
     * @param {!number} probabilityOfHitGivenCondition
     * @param {!Rect} drawArea
     * @param {!string=} backgroundColor
     * @param {!string=} semiFillColor
     * @param {!string=} fillColor
     */
    static paintConditionalProbabilityBox(painter,
                                          probabilityOfCondition,
                                          probabilityOfHitGivenCondition,
                                          drawArea,
                                          backgroundColor = Config.BACKGROUND_COLOR,
                                          semiFillColor = Config.PROBABILITY_BOX_SEMI_FILL_COLOR,
                                          fillColor = Config.PROBABILITY_BOX_FILL_UP_COLOR) {
        let h = probabilityOfCondition;
        let w = h === 0 ? 0 : probabilityOfHitGivenCondition;
        let gs = w === 0 ? "N/A" : MathPainter.describeProbability(w, 0);
        let ps = MathPainter.describeProbability(w * h, 0);

        painter.fillRect(drawArea, semiFillColor);
        painter.fillRect(drawArea.takeLeftProportion(w).takeBottomProportion(h), fillColor);
        painter.fillRect(drawArea.takeRightProportion(1 - w).takeTopProportion(1 - h), backgroundColor);

        let usedTop = painter.printLine(
            "t|c:",
            drawArea.topHalf().skipLeft(1),
            0,
            Config.DEFAULT_TEXT_COLOR,
            10);
        let usedBottom = painter.printLine(
            "t\u00B7c:",
            drawArea.bottomHalf().skipLeft(1),
            0,
            Config.DEFAULT_TEXT_COLOR,
            10);

        let available = drawArea.skipLeft(Math.max(usedTop.right(), usedBottom.right()) - drawArea.x + 1);
        painter.printLine(
            gs,
            available.topHalf().skipRight(1),
            1,
            w === 0 ? "red" : Config.DEFAULT_TEXT_COLOR,
            11);
        painter.printLine(
            ps,
            available.bottomHalf().skipRight(1),
            1,
            Config.DEFAULT_TEXT_COLOR,
            11);
        painter.strokeRect(drawArea);
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
                    matrix.rows[r][c],
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
                "\n= " + matrix.rows[focus_r][focus_c].toString(Format.CONSISTENT);

            let paintRect = new Rect(cell.x, cell.y - 30, 100, 30).snapInside(painter.paintableArea()).paddedBy(-2);
            painter.defer(() => {
                let usedRect = painter.printParagraph(tip, paintRect, new Point(0, 1)).paddedBy(2);
                painter.fillRect(usedRect);
                painter.strokeRect(usedRect);
                painter.printParagraph(tip, paintRect, new Point(0, 1));
            });
        }
    };
}
