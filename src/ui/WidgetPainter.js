import Format from "src/base/Format.js"
import Util from "src/base/Util.js"
import Rect from "src/math/Rect.js"
import Config from "src/Config.js"
import Point from "src/math/Point.js"
import Matrix from "src/math/Matrix.js"
import Gate from "src/circuit/Gate.js"
import Painter from "src/ui/Painter.js"
import MathPainter from "src/ui/MathPainter.js"

export default class WidgetPainter {
    /**
     * @param {!Painter} painter
     * @param {!Rect} area
     * @param {!Gate} gate
     * @param {!number} time
     */
    static paintGateTooltip(painter, area, gate, time) {
        let h = area.h;
        let w = area.w;
        let hasOp = !Matrix.identity(2).isEqualTo(gate.matrixOrFunc);
        let titleRect = area.skipTop(h*0.02).takeTop(h*0.09).
            skipLeft(w*0.02).skipRight(w*0.02);
        let blurbRect = area.skipTop(titleRect.bottom()-area.y+h*0.01).takeTop(h*0.09).
            skipLeft(w*0.01).skipRight(w*0.01);
        let detailsRect = area.skipTop(blurbRect.bottom()-area.y+h*0.01).takeTop(h*0.18).
            skipLeft(w*0.01).skipRight(w*0.01);
        let matrixTitleRect = area.skipTop(detailsRect.bottom()-area.y+h*0.01).takeTop(h*0.08).
            skipLeft(w*0.02).skipRight(w*0.02);

        if (!hasOp) {
            area = area.takeTop(matrixTitleRect.y - area.y);
        }

        painter.fillRect(area);

        painter.printLine(gate.name, titleRect, 0.5, "blue", 24);
        painter.printLine(gate.blurb, blurbRect, 0.5, Config.DEFAULT_TEXT_COLOR, 14);
        painter.printParagraph(gate.details, detailsRect, new Point(0, 0.5));

        if (hasOp) {
            let curMatrix = gate.matrixAt(time);
            let matrixDesc = curMatrix.toString(gate.isTimeBased() ? Format.CONSISTENT : Format.SIMPLIFIED);
            let matrixTitleUsed = painter.printLine("Matrix form: ", matrixTitleRect, 0, Config.DEFAULT_TEXT_COLOR, 20);
            let matrixDescRect = matrixTitleRect.skipLeft(matrixTitleUsed.right() - matrixTitleRect.x);

            painter.printLine(matrixDesc, matrixDescRect, 0, Config.DEFAULT_TEXT_COLOR, 14);
            let matrixDrawArea = area.skipTop(matrixDescRect.bottom() - area.y).
                skipTop(h*0.01).skipBottom(h*0.01).skipLeft(w*0.01).skipRight(w*0.01);

            let d = Math.min(matrixDrawArea.w, matrixDrawArea.h);
            MathPainter.paintMatrix(
                painter,
                curMatrix,
                matrixDrawArea.withW(d).withH(d),
                []);

            if (curMatrix.width() === 2 && curMatrix.isApproximatelyUnitary(0.000000001)) {
                MathPainter.paintBlochSphereRotation(
                    painter,
                    curMatrix,
                    matrixDrawArea.skipLeft(d + 10).withW(d).withH(d));
            }
        }

        painter.strokeRect(area);
    };

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
