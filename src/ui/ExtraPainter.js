//import Format from "src/base/Format.js"
//import Util from "src/base/Util.js"
//import Seq from "src/base/Seq.js"
//
//class Painter {
//    ///**
//    // *
//    // * @param {!Point} firstNodePoint
//    // * @param {!Point} levelDelta
//    // * @param {!Point} nodeDelta
//    // * @param {!Array<!String>} levelLabels
//    // */
//    //paintBinaryTree(firstNodePoint, levelDelta, nodeDelta, levelLabels) {
//    //    let makeNodePoint = i => firstNodePoint.
//    //        plus(nodeDelta.times(i)).
//    //        plus(levelDelta.times(Util.powerOfTwoness(i)));
//    //
//    //    let n = 1 << levelLabels.length;
//    //    for (let i = 1; i < n; i++) {
//    //        let b = Util.powerOfTwoness(i);
//    //        let p = makeNodePoint(i);
//    //        if (b > 0) {
//    //            let d = 1 << (b - 1);
//    //            this.strokeLine(p, makeNodePoint(i + d), Config.BINARY_TREE_LABEL_EDGE_COLOR);
//    //            this.strokeLine(p, makeNodePoint(i - d), Config.BINARY_TREE_LABEL_EDGE_COLOR);
//    //        }
//    //
//    //        let levelDeltaLength = Math.sqrt(levelDelta.x * levelDelta.x + levelDelta.y * levelDelta.y);
//    //        let weight = new Point(0.5, 0.5).plus(levelDelta.times(-0.5 / levelDeltaLength));
//    //        this.printCenteredText(
//    //            levelLabels[b],
//    //            p,
//    //            Config.DEFAULT_TEXT_COLOR,
//    //            Config.DEFAULT_FONT_SIZE,
//    //            Config.DEFAULT_FONT_FAMILY,
//    //            weight);
//    //    }
//    //};
//
//    //paintDisalloweds(matrix, drawArea) {
//    //    let numCols = matrix.width();
//    //    let numRows = matrix.height();
//    //    let topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);
//    //
//    //    this.ctx.globalAlpha = 0.25;
//    //    for (let c = 0; c < numCols; c++) {
//    //        for (let r = 0; r < numRows; r++) {
//    //            let cell = topLeftCell.proportionalShiftedBy(c, r);
//    //            if (matrix.rows[r][c].isEqualTo(0)) {
//    //                this.fillRect(cell, "red")
//    //            }
//    //        }
//    //    }
//    //    this.ctx.globalAlpha = 1;
//    //};
//
//    /**
//     *
//     * @param {!Array<*>} factors
//     * @param {!Rect} drawArea
//     * @param {!Array<!string>} labels
//     */
//    //paintFactoredQuantumStateAsLabelledGrid(factors, drawArea, labels) {
//    //    let numWireRows = Math.floor(labels.length / 2);
//    //    let numWireCols = labels.length - numWireRows;
//    //    let numDrawRows = 1 << numWireRows;
//    //    let numDrawCols = 1 << numWireCols;
//    //
//    //    let labelDif = 5;
//    //    let labelSpace = 8;
//    //    let skipLength = Math.max(numWireRows, numWireCols) * labelDif + labelSpace;
//    //
//    //    // Draw state grid
//    //    let gridRect = drawArea.skipLeft(skipLength).skipTop(skipLength);
//    //    this.paintQuantumStateAsGrid(state, gridRect);
//    //
//    //};
//
//    ///**
//    // *
//    // * @param {!QuantumState} state
//    // * @param {!Rect} drawArea
//    // * @param {!Array<!string>} labels
//    // */
//    //paintQuantumStateAsLabelledGrid(state, drawArea, labels) {
//    //    Util.need(state.columnVector.height() === 1 << labels.length, "columnVector.height() === labels.length");
//    //
//    //    let numWireRows = Math.floor(labels.length / 2);
//    //    let numWireCols = labels.length - numWireRows;
//    //    let numDrawRows = 1 << numWireRows;
//    //    let numDrawCols = 1 << numWireCols;
//    //
//    //    let labelDif = 5;
//    //    let labelSpace = 8;
//    //    let skipLength = Math.max(numWireRows, numWireCols) * labelDif + labelSpace;
//    //
//    //    // Draw state grid
//    //    let gridRect = drawArea.skipLeft(skipLength).skipTop(skipLength);
//    //    this.paintQuantumStateAsGrid(state, gridRect);
//    //
//    //    // Draw row label tree
//    //    this.paintBinaryTree(
//    //        gridRect.topLeft().offsetBy(0, -1),
//    //        new Point(-labelDif, 0),
//    //        new Point(0, gridRect.h / numDrawRows),
//    //        labels.slice(numWireCols));
//    //
//    //    // Draw column label tree
//    //    this.paintBinaryTree(
//    //        gridRect.topLeft().offsetBy(0, -1),
//    //        new Point(0, -labelDif),
//    //        new Point(gridRect.w / numDrawCols, 0),
//    //        labels.slice(0, numWireCols));
//    //}
//
//    ///**
//    // * Draws a visual representation of a column vector, using a grid layout.
//    // * @param {!QuantumState} quantumState The quantum state to draw.
//    // * @param {!Rect} drawArea The rectangle to draw the vector within.
//    // */
//    //paintQuantumStateAsGrid(quantumState, drawArea) {
//    //    let numStates = quantumState.columnVector.height();
//    //    let numWires = quantumState.countQubits();
//    //    let numWireCols = Math.ceil(numWires / 2);
//    //    let numWireRows = Math.floor(numWires / 2);
//    //    let numDrawCols = 1 << numWireCols;
//    //    let numDrawRows = 1 << numWireRows;
//    //    let topLeftCell = new Rect(
//    //        drawArea.x,
//    //        drawArea.y,
//    //        drawArea.w / numDrawCols,
//    //        drawArea.h / numDrawRows);
//    //
//    //    for (let r = 0; r < numStates; r++) {
//    //        let dx = r % numDrawCols;
//    //        let dy = Math.floor(r / numDrawCols);
//    //        this.paintAmplitude(quantumState.columnVector.rows[r][0], topLeftCell.proportionalShiftedBy(dx, dy));
//    //    }
//    //
//    //    this.strokeGrid(topLeftCell, numDrawCols, numDrawRows);
//    //}
//
//    /**
//     * Draws a tooltip box.
//     *
//     * @param {!string} text The tooltip's text.
//     * @param {!Point} focusPoint The position of the mouse cursor.
//     * @param {!Rect} focusRect The location of the object to which the tooltip belongs.
//     * @param {=string} fontColor The text color. Defaults to black.
//     * @param {=number} fontSize The text size. Defaults to 12px.
//     * @param {=string} fontFamily The text font family. Defaults to Helvetica.
//     */
//    paintTooltip(text, focusPoint, focusRect, fontColor, fontSize, fontFamily) {
//        fontSize = fontSize || Config.DEFAULT_FONT_SIZE;
//
//        let ctx = this.ctx;
//        let lines = text.split("\n");
//        //noinspection JSCheckFunctionSignatures
//        let w = new Seq(lines).map(e => ctx.measureText(e).width).max();
//        let h = fontSize * lines.length * 1.3;
//
//        let paintRect = new Rect(focusPoint.x, focusRect.y - h, w, h).paddedBy(2);
//        if (paintRect.y < 0) {
//            new Rect(focusPoint.x, focusRect.bottom(), w, h).paddedBy(2);
//        }
//
//        if (paintRect.right() > this.canvas.width) {
//            paintRect = paintRect.withX(this.canvas.width - paintRect.w);
//        }
//        if (paintRect.bottom() > this.canvas.height) {
//            paintRect = paintRect.withY(this.canvas.height - paintRect.h);
//        }
//        if (paintRect.x < 0) {
//            paintRect = paintRect.withX(0);
//        }
//        if (paintRect.y < 0) {
//            paintRect = paintRect.withY(0);
//        }
//
//        this.fillRect(paintRect);
//        this.strokeRect(paintRect);
//        this.printText(text, paintRect.center().offsetBy(-w / 2, -h / 2 + fontSize), fontColor, fontSize, fontFamily);
//    }
//}
