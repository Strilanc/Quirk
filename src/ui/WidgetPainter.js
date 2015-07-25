import Format from "src/base/Format.js"
import Util from "src/base/Util.js"
import Rect from "src/math/Rect.js"
import Config from "src/Config.js"
import Point from "src/math/Point.js"
import Gate from "src/ui/Gate.js"
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
        painter.fillRect(area);

        let h = area.h;
        let w = area.w;
        let titleRect = area.skipTop(h*0.02).takeTop(h*0.06).skipLeft(w*0.02).skipRight(w*0.02);
        let blurbRect = area.skipTop(h*0.09).takeTop(h*0.06).skipLeft(w*0.01).skipRight(w*0.01);
        let detailsRect = area.skipTop(h*0.16).takeTop(h*0.15).skipLeft(w*0.01).skipRight(w*0.01);
        let matrixTitleRect = area.skipTop(h*0.32).takeTop(h*0.06).skipLeft(w*0.02).skipRight(w*0.02);
        let matrixDesc = gate.matrixAt(time).toString(gate.isTimeBased() ? Format.CONSISTENT : Format.SIMPLIFIED);

        painter.printLine(gate.name, titleRect, 0.5, "blue", 24);
        painter.printLine(gate.blurb, blurbRect, 0.5, Config.DEFAULT_TEXT_COLOR, 14);
        painter.printParagraph(gate.details, detailsRect, new Point(0, 0.5));
        let matrixTitleUsed = painter.printLine("Matrix:", matrixTitleRect, 0, Config.DEFAULT_TEXT_COLOR, 20);
        let matrixDescRect = area.skipTop(matrixTitleUsed.bottom() - area.y).takeTop(Math.min(h*0.1, 16)).
            skipLeft(w*0.01).skipRight(w*0.01);
        painter.printLine(matrixDesc, matrixDescRect, 0, Config.DEFAULT_TEXT_COLOR, 14);
        let matrixDrawArea = area.skipTop(matrixDescRect.bottom() - area.y).
            skipTop(h*0.01).skipBottom(h*0.01).skipLeft(w*0.01).skipRight(w*0.01);

        let d = Math.min(matrixDrawArea.w, matrixDrawArea.h);
        MathPainter.paintMatrix(
            painter,
            gate.matrixAt(time),
            matrixDrawArea.withW(d).withH(d),
            []);

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

    //paintDisalloweds(matrix, drawArea) {
    //    let numCols = matrix.width();
    //    let numRows = matrix.height();
    //    let topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);
    //
    //    this.ctx.globalAlpha = 0.25;
    //    for (let c = 0; c < numCols; c++) {
    //        for (let r = 0; r < numRows; r++) {
    //            let cell = topLeftCell.proportionalShiftedBy(c, r);
    //            if (matrix.rows[r][c].isEqualTo(0)) {
    //                this.fillRect(cell, "red")
    //            }
    //        }
    //    }
    //    this.ctx.globalAlpha = 1;
    //};

    /**
     *
     * @param {!Array<*>} factors
     * @param {!Rect} drawArea
     * @param {!Array<!string>} labels
     */
    //paintFactoredQuantumStateAsLabelledGrid(factors, drawArea, labels) {
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

    ///**
    // * Draws a visual representation of a column vector, using a grid layout.
    // * @param {!QuantumState} quantumState The quantum state to draw.
    // * @param {!Rect} drawArea The rectangle to draw the vector within.
    // */
    //paintQuantumStateAsGrid(quantumState, drawArea) {
    //    let numStates = quantumState.columnVector.height();
    //    let numWires = quantumState.countQubits();
    //    let numWireCols = Math.ceil(numWires / 2);
    //    let numWireRows = Math.floor(numWires / 2);
    //    let numDrawCols = 1 << numWireCols;
    //    let numDrawRows = 1 << numWireRows;
    //    let topLeftCell = new Rect(
    //        drawArea.x,
    //        drawArea.y,
    //        drawArea.w / numDrawCols,
    //        drawArea.h / numDrawRows);
    //
    //    for (let r = 0; r < numStates; r++) {
    //        let dx = r % numDrawCols;
    //        let dy = Math.floor(r / numDrawCols);
    //        this.paintAmplitude(quantumState.columnVector.rows[r][0], topLeftCell.proportionalShiftedBy(dx, dy));
    //    }
    //
    //    this.strokeGrid(topLeftCell, numDrawCols, numDrawRows);
    //}
}
