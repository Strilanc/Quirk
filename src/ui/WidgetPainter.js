import Complex from "src/math/Complex.js"
import Config from "src/Config.js"
import Format from "src/base/Format.js"
import Gate from "src/circuit/Gate.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Painter from "src/ui/Painter.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"

export default class WidgetPainter {

    /**
     * @param {!Matrix} matrix
     * @param {!Format} format
     * @returns {!Array.<!string>}
     * @private
     */
    static describeGateTransformations(matrix, format) {
        let n = matrix.height();
        let b = Math.log2(n);
        return Seq.range(n).
            map(c => {
                let inputDescription = WidgetPainter.describeKet(b, c, 1, Format.SIMPLIFIED);
                let col = matrix.getColumn(c);
                if (col.every(e => e.isEqualTo(0))) {
                    return "discards " + inputDescription;
                } else if (Seq.range(n).every(r => col[r].isEqualTo(r === c ? 1 : 0))) {
                    if (format !== Format.CONSISTENT) {
                        return "doesn't affect " + inputDescription;
                    }
                } else if (Seq.range(n).every(r => r === c || col[r].isEqualTo(0))) {
                    return "phases " + inputDescription + " by " + col[c].toString(format);
                }
                let outputDescription = new Seq(col).
                    mapWithIndex((e, c) => WidgetPainter.describeKet(b, c, e, format)).
                    filter(e => e !== "").
                    join(" + ").
                    split(" + -").join(" - ").
                    split(" + +").join(" + ");
                return 'transforms ' + inputDescription + ' into ' + outputDescription;
            }).
            toArray();
    }

    /**
     * @param {!Painter} painter
     * @param {!number} w
     * @param {!Gate} gate
     * @param {!number} time
     * @returns {!{maxX: !number, maxY: !number}}
     * @private
     */
    static paintGateTooltipHelper(painter, w, gate, time) {
        const [pad, dispSize] = [4, 65];
        let [maxX, maxY] = [0, pad];
        let pushRect = (rect, actualPad=pad) => {
            maxY = Math.max(maxY, rect.bottom() + actualPad);
            maxX = Math.max(maxX, rect.right() + actualPad);
        };

        pushRect(painter.printLine(gate.name, new Rect(pad, maxY, w, 18), 0, "blue", 24));
        pushRect(painter.printParagraph(gate.blurb, new Rect(pad, maxY, w, 50), new Point(0, 0), 'black', 14));

        if (gate.matrixOrFunc instanceof Matrix && (gate.matrixOrFunc.isIdentity() || gate.matrixOrFunc.hasNaN())) {
            return {maxX, maxY};
        }
        pushRect(new Rect(0, maxY, 1, 0), pad*3);
        let curMatrix = gate.matrixAt(time);
        let format = gate.isTimeBased() ? Format.CONSISTENT : Format.SIMPLIFIED;

        // Matrix interpretation.
        pushRect(painter.printParagraph('As matrix:', new Rect(pad, maxY, w, 18), new Point(0, 0), 'black', 12), 0);
        let matrixRect = new Rect(pad, maxY, dispSize, dispSize);
        let matrixDescRect = new Rect(0, matrixRect.y, w - pad, dispSize).skipLeft(matrixRect.right() + pad);
        MathPainter.paintMatrix(
            painter,
            curMatrix,
            matrixRect,
            Config.OPERATION_FORE_COLOR,
            'black',
            undefined,
            Config.OPERATION_BACK_COLOR);
        pushRect(matrixRect);
        let n = curMatrix.height();
        let matDescs = WidgetPainter.describeGateTransformations(curMatrix, format);
        let rowHeight = matrixDescRect.h / n;
        for (let r = 0; r < n; r++) {
            pushRect(painter.printParagraph(
                matDescs[r],
                matrixDescRect.skipTop(r * rowHeight).takeTop(rowHeight),
                new Point(0, 0.5),
                'black',
                12));
        }

        // Bloch sphere interpretation.
        if (curMatrix.width() === 2 && curMatrix.isUnitary(0.001)) {
            pushRect(painter.printParagraph(
                'As rotation:',
                new Rect(pad, maxY, w, 18),
                new Point(0, 0),
                'black',
                12), 0);
            let {angle, axis, phase} = curMatrix.qubitOperationToAngleAxisRotation();

            let blochRect = new Rect(pad, maxY, dispSize, dispSize);
            MathPainter.paintBlochSphereRotation(
                painter,
                curMatrix,
                blochRect,
                Config.OPERATION_BACK_COLOR,
                Config.OPERATION_FORE_COLOR);
            pushRect(blochRect);

            let rotDesc = new Seq([
                `rotates: ${format.formatFloat(angle * 180 / Math.PI)}°`,
                `around: ${WidgetPainter.describeAxis(axis, format)}`,
                '',
                `hidden phase: exp(${format.formatFloat(phase * 180 / Math.PI)}°i)`,
                ''
            ]).join('\n');
            pushRect(painter.printParagraph(
                rotDesc,
                new Rect(0, blochRect.y, w - pad, dispSize).skipLeft(blochRect.right() + pad),
                new Point(0, 0.5),
                'black',
                12));
        }

        return {maxX, maxY};
    }

    /**
     * @param {!Painter} painter
     * @param {!Rect} area
     * @param {!Gate} gate
     * @param {!number} time
     */
    static paintGateTooltip(painter, area, gate, time) {
        painter.ctx.save();
        painter.ctx.translate(area.x, area.y);
        area = area.withX(0).withY(0);
        let scale = Math.min(area.w/500, area.h/200);
        if (scale < 1) {
            painter.ctx.scale(scale, scale);
            area = area.withH(area.h/scale).withW(area.w/scale);
        }
        let w = area.w;

        let {maxX, maxY} = WidgetPainter.paintGateTooltipHelper(painter, w, gate, time);
        let r = new Rect(0, 0, maxX, maxY);
        painter.fillRect(r, '#F9FFF9');
        painter.strokeRect(r, 'black');
        WidgetPainter.paintGateTooltipHelper(painter, w, gate, time);

        painter.ctx.restore();
    }

    static describeKet(bitCount, bitMask, factor, format) {
        factor = Complex.from(factor);
        if (factor.isEqualTo(0)) {
            return "";
        }
        let scaleFactorDesc =
            factor.isEqualTo(1) ? "" :
            factor.isEqualTo(-1) ? "-" :
            factor.isEqualTo(Complex.I) ? "i" :
            factor.isEqualTo(Complex.I.times(-1)) ? "-i" :
            (factor.real === 0 || factor.imag === 0) && format !== Format.CONSISTENT ? factor.toString(format) :
            '(' + factor.toString(format) + ')·';

        let bitDesc = seq(bitMask.toString(2)).reverse().padded(bitCount, '0').join('');
        return scaleFactorDesc + '|' + bitDesc + '⟩';
    }
    /**
     * @param {!Array.<!number>} unitAxis x, y, z
     * @param {!Format} format
     * @returns {!string}
     */
    static describeAxis(unitAxis, format) {
        let max = new Seq(unitAxis).map(Math.abs).max();
        return new Seq(unitAxis).
            map(e => e/max).
            zip(["X", "Y", "Z"], (val, name) => {
                if (val === 0) {
                    return "";
                }
                if (val === 1) {
                    return name;
                }
                if (val === -1) {
                    return "-" + name;
                }
                return format.formatFloat(val) + "·" + name;
            }).
            filter(e => e !== "").
            join(" + ").
            replace(" + -", " - ").
            replace(" + +", " + ");
    }
}
