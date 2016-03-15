import Format from "src/base/Format.js"
import Seq from "src/base/Seq.js"
import Util from "src/base/Util.js"
import Rect from "src/math/Rect.js"
import Config from "src/Config.js"
import Point from "src/math/Point.js"
import Matrix from "src/math/Matrix.js"
import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import Painter from "src/ui/Painter.js"
import MathPainter from "src/ui/MathPainter.js"

export default class WidgetPainter {

    /**
     * @param {!Painter} painter
     * @param {!number} w
     * @param {!Gate} gate
     * @param {!number} time
     * @returns {!{maxX: !number, maxY: !number}}
     * @private
     */
    static paintGateTooltipHelper(painter, w, gate, time) {
        let maxX = 0;
        let maxY = 4;
        let pad = 4;
        let dispSize = 65;
        let pushRect = (rect, actualPad=pad) => {
            maxY = Math.max(maxY, rect.bottom() + actualPad);
            maxX = Math.max(maxX, rect.right() + actualPad);
        };

        pushRect(painter.printLine(gate.name, new Rect(pad, maxY, w, 18), 0, "blue", 24));
        pushRect(painter.printParagraph(gate.blurb, new Rect(pad, maxY, w, 50), new Point(0, 0), 'black', 14));

        if (Matrix.identity(2).isEqualTo(gate.matrixOrFunc)) {
            return {maxX, maxY};
        }
        pushRect(new Rect(0, maxY, 1, 0), pad*3);
        let curMatrix = gate.matrixAt(time);
        let format = gate.isTimeBased() ? Format.CONSISTENT : Format.SIMPLIFIED;

        // Matrix interpretation.
        pushRect(painter.printParagraph('As matrix:', new Rect(pad, maxY, w, 18), new Point(0, 0), 'black', 12), 0);
        let matrixRect = new Rect(pad, maxY, dispSize, dispSize);
        let matrixDescRect = new Rect(0, matrixRect.y, w - pad, dispSize).skipLeft(matrixRect.right() + pad);
        MathPainter.paintMatrix(painter, curMatrix, matrixRect, Config.DISPLAY_GATE_FORE_COLOR, 'black', undefined);
        pushRect(matrixRect);
        let n = curMatrix.height();
        let b = Math.log2(n);
        let matDescs = Seq.range(n).
            map(c => {
                let inDesc = WidgetPainter.describeKet(b, c, 1, Format.SIMPLIFIED);
                let col = curMatrix.getColumn(c);
                if (col.every(e => e.isEqualTo(0))) {
                    return "discards " + inDesc;
                } else if (Seq.range(n).every(r => col[r].isEqualTo(r === c ? 1 : 0))) {
                    if (!gate.isTimeBased()) {
                        return "doesn't affect " + inDesc;
                    }
                } else if (Seq.range(n).every(r => r === c || col[r].isEqualTo(0))) {
                    return "phases " + inDesc + " by " + col[c].toString(format);
                }
                let outDesc = new Seq(col).
                    mapWithIndex((e, c) => WidgetPainter.describeKet(b, c, e, format)).
                    filter(e => e !== "").
                    join(" + ").
                    replace(" + -", " - ").
                    replace(" + +", " + ");
                return 'transforms ' + inDesc + ' into ' + outDesc;
            }).
            toArray();
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
        if (curMatrix.width() === 2 && curMatrix.isApproximatelyUnitary(0.000000001)) {
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
                blochRect);
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
    };

    static describeKet(bitCount, bitMask, factor, format) {
        factor = Complex.from(factor);
        if (factor.isEqualTo(0)) {
            return "";
        }
        let scaleFactoDesc =
            factor.isEqualTo(1) ? "" :
            factor.isEqualTo(-1) ? "-" :
            factor.isEqualTo(Complex.I) ? "i" :
            factor.isEqualTo(Complex.I.times(-1)) ? "-i" :
            (factor.real === 0 || factor.imag === 0) && format !== Format.CONSISTENT ? factor.toString(format) :
            '(' + factor.toString(format) + ')·';

        let bitDesc = bitMask.toString(2);
        while (bitDesc.length < bitCount) {
            bitDesc = '0' + bitDesc;
        }
        return scaleFactoDesc + '|' + bitDesc + '⟩';
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

    ///**
    // *
    // * @param {!Point} firstNodePoint
    // * @param {!Point} levelDelta
    // * @param {!Point} nodeDelta
    // * @param {!Array<!String>} levelLabels
    // */
    //paintBinaryTree(firstNodePoint, levelDelta, nodeDelta, levelLabels) {
    //    let makeNodePoint = i => firstNodePoint.
    //        plus(nodeDelta.times(i)).
    //        plus(levelDelta.times(Util.powerOfTwoness(i)));
    //
    //    let n = 1 << levelLabels.length;
    //    for (let i = 1; i < n; i++) {
    //        let b = Util.powerOfTwoness(i);
    //        let p = makeNodePoint(i);
    //        if (b > 0) {
    //            let d = 1 << (b - 1);
    //            this.strokeLine(p, makeNodePoint(i + d), Config.BINARY_TREE_LABEL_EDGE_COLOR);
    //            this.strokeLine(p, makeNodePoint(i - d), Config.BINARY_TREE_LABEL_EDGE_COLOR);
    //        }
    //
    //        let levelDeltaLength = Math.sqrt(levelDelta.x * levelDelta.x + levelDelta.y * levelDelta.y);
    //        let weight = new Point(0.5, 0.5).plus(levelDelta.times(-0.5 / levelDeltaLength));
    //        this.printCenteredText(
    //            levelLabels[b],
    //            p,
    //            Config.DEFAULT_TEXT_COLOR,
    //            Config.DEFAULT_FONT_SIZE,
    //            Config.DEFAULT_FONT_FAMILY,
    //            weight);
    //    }
    //};

    ///**
    // *
    // * @param {!QuantumState} state
    // * @param {!Rect} drawArea
    // * @param {!Array<!string>} labels
    // */
    //paintQuantumStateAsLabelledGrid(state, drawArea, labels) {
    //    Util.need(state.columnVector.height() === 1 << labels.length, "columnVector.height() === labels.length");
    //
    //    let numWireRows = Math.floor(labels.length / 2);
    //    let numWireCols = labels.length - numWireRows;
    //    let numDrawRows = 1 << numWireRows;
    //    let numDrawCols = 1 << numWireCols;
    //
    //    let labelDif = 5;
    //    let labelSpace = 8;
    //    let skipLength = Math.max(numWireRows, numWireCols) * labelDif + labelSpace;
    //
    //    // Draw state grid
    //    let gridRect = drawArea.skipLeft(skipLength).skipTop(skipLength);
    //    this.paintQuantumStateAsGrid(state, gridRect);
    //
    //    // Draw row label tree
    //    this.paintBinaryTree(
    //        gridRect.topLeft().offsetBy(0, -1),
    //        new Point(-labelDif, 0),
    //        new Point(0, gridRect.h / numDrawRows),
    //        labels.slice(numWireCols));
    //
    //    // Draw column label tree
    //    this.paintBinaryTree(
    //        gridRect.topLeft().offsetBy(0, -1),
    //        new Point(0, -labelDif),
    //        new Point(gridRect.w / numDrawCols, 0),
    //        labels.slice(0, numWireCols));
    //}
}
