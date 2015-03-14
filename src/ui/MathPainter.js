import Painter from "src/ui/Painter.js"
import Format from "src/base/Format.js"
import Point from "src/base/Point.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

export default class MathPainter {
    static describeProbability(p, fractionalDigits) {
        if (p >= 0.9999) {
            return "100%";
        }
        if (p <= 0.0001) {
            return "0%";
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
        painter.printCenteredText(MathPainter.describeProbability(probability, 1), drawArea.center());
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
        let gs = w === 0 ? "0/0" : MathPainter.describeProbability(w, 0);
        let ps = MathPainter.describeProbability(w * h, 0);

        painter.fillRect(drawArea, semiFillColor);
        painter.fillRect(drawArea.takeLeftProportion(w).takeBottomProportion(h), fillColor);
        painter.fillRect(drawArea.takeRightProportion(1 - w).takeTopProportion(1 - h), backgroundColor);

        painter.printCenteredText(
            "t|c:",
            drawArea.topHalf().centerLeft().offsetBy(1, 0),
            new Point(0, 0.5),
            Config.DEFAULT_TEXT_COLOR,
            10);
        painter.printCenteredText(
            "t\u00B7c:",
            drawArea.bottomHalf().centerLeft().offsetBy(1, 0),
            new Point(0, 0.5),
            Config.DEFAULT_TEXT_COLOR,
            10);

        painter.printCenteredText(
            gs.replace("100%", "100 "),
            drawArea.topHalf().centerRight(),
            new Point(1, 0.5),
            Config.DEFAULT_TEXT_COLOR,
            11);
        painter.printCenteredText(
            ps.replace("100%", "100 "),
            drawArea.bottomHalf().centerRight(),
            new Point(1, 0.5),
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
}
