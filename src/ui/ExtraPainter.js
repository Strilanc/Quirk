//import Format from "src/base/Format.js"
//import Util from "src/base/Util.js"
//import Seq from "src/base/Seq.js"
//
//class Painter {
//    /**
//     * @param {!HTMLCanvasElement} canvas
//     * @property {!HTMLCanvasElement} canvas
//     * @property {!CanvasRenderingContext2D} ctx
//     */
//    constructor(canvas) {
//        this.canvas = canvas;
//        this.ctx = canvas.getContext("2d");
//    }
//
//    /**
//     * Draws the inside of a rectangle.
//     * @param {!Rect} rect The rectangular area to fill.
//     * @param {!string=} color The fill color.
//     */
//    fillRect(rect, color = Config.DEFAULT_FILL_COLOR) {
//        this.ctx.fillStyle = color;
//        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
//    }
//
//    /**
//     * Draws the outside of a rectangle.
//     * @param {!Rect} rect The rectangular perimeter to stroke.
//     * @param {!string=} color The stroke color.
//     * @param {!number=} thickness The stroke thickness.
//     */
//    strokeRect(rect, color = "black", thickness = 1) {
//        this.ctx.strokeStyle = color;
//        this.ctx.strokeWidth = thickness;
//        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
//    }
//
//    /**
//     * Draws the inside of a circle.
//     * @param {!Point} center The center of the circle.
//     * @param {!number} radius The distance from the center of the circle to its side.
//     * @param {!string=} color The fill color. Defaults to white.
//     */
//    fillCircle(center, radius, color = Config.DEFAULT_FILL_COLOR) {
//        this.ctx.beginPath();
//        this.ctx.arc(center.x, center.y, Math.max(radius - 0.5, 0), 0, 2 * Math.PI);
//        this.ctx.fillStyle = color;
//        this.ctx.fill();
//    }
//
//    /**
//     * Draws the outside of a circle.
//     * @param {!Point} center The center of the circle.
//     * @param {!number} radius The distance from the center of the circle to its side.
//     * @param {!string=} color The stroke color.
//     * @param {!number=} thickness The stroke thickness.
//     */
//    strokeCircle(center, radius, color = Config.DEFAULT_STROKE_COLOR, thickness = Config.DEFAULT_STROKE_THICKNESS) {
//        this.ctx.beginPath();
//        this.ctx.strokeStyle = color;
//        this.ctx.lineWidth = thickness;
//        this.ctx.arc(center.x, center.y, Math.max(radius - 0.5, 0), 0, 2 * Math.PI);
//        this.ctx.stroke();
//    }
//
//    /**
//     * Draws a string. Handles multi-line strings.
//     *
//     * @param {!string} text The string to draw.
//     * @param {!Point} pos The top-left position of the drawn string.
//     * @param {=string} fontColor The text color. Defaults to black.
//     * @param {=number} fontSize The text size. Defaults to 12px.
//     * @param {=string} fontFamily The text font family. Defaults to Helvetica.
//     */
//    printText(text,
//              pos,
//              fontColor = Config.DEFAULT_TEXT_COLOR,
//              fontSize = Config.DEFAULT_FONT_SIZE,
//              fontFamily = Config.DEFAULT_FONT_FAMILY) {
//        this.ctx.fillStyle = fontColor;
//        this.ctx.font = fontSize + "px " + fontFamily;
//
//        let lines = text.split("\n");
//        for (let i = 0; i < lines.length; i++) {
//            this.ctx.fillText(lines[i], pos.x, pos.y + (i * 4 * fontSize) / 3);
//        }
//    }
//
//    /**
//     * Draws a string centered around the given point. Does NOT handle multi-line strings.
//     *
//     * @param {!string} text The string to draw.
//     * @param {!Point} pos The center position of the drawn string.
//     * @param {!string=} fontColor The text color.
//     * @param {!number=} fontSize The text size.
//     * @param {!string=} fontFamily The text font family.
//     * @param {!Point=} centerPointProportion The porportional point to center on.
//     */
//    printCenteredText(text,
//                      pos,
//                      fontColor = Config.DEFAULT_TEXT_COLOR,
//                      fontSize = Config.DEFAULT_FONT_SIZE,
//                      fontFamily = Config.DEFAULT_FONT_FAMILY,
//                      centerPointProportion = new Point(0.5, 0.5)) {
//        this.ctx.fillStyle = fontColor;
//        this.ctx.font = fontSize + "px " + fontFamily;
//        let s = this.ctx.measureText(text);
//
//        this.ctx.fillText(
//            text,
//            pos.x - s.width * centerPointProportion.x,
//            pos.y + fontSize * 0.8 * (1 - centerPointProportion.y));
//    }
//
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
//    /**
//     * Draws a line segment between the two points.
//     *
//     * @param {!Point} p1
//     * @param {!Point} p2
//     * @param {=string} color The color of the drawn line.
//     * @param {=number} thickness The thickness of the drawn line.
//     */
//    strokeLine(p1, p2, color = Config.DEFAULT_STROKE_COLOR, thickness = 1) {
//        this.ctx.beginPath();
//        this.ctx.moveTo(p1.x, p1.y);
//        this.ctx.lineTo(p2.x, p2.y);
//        this.ctx.strokeStyle = color;
//        this.ctx.lineWidth = thickness;
//        this.ctx.stroke();
//    };
//
//    ///**
//    // * Draws representations of complex values used to weight components of a superposition.
//    // *
//    // * @param {!Rect} area The drawing area, where the amplitude will be represented visually.
//    // * @param {!Complex} amplitude The complex value to represent visually. Its magnitude should be at most 1.
//    // */
//    //paintAmplitude(amplitude, area) {
//    //    let c = area.center();
//    //    let magnitude = amplitude.abs();
//    //    let p = amplitude.norm2();
//    //    let d = Math.min(area.w, area.h) / 2;
//    //    let r = d * magnitude;
//    //    let dx = d * amplitude.real;
//    //    let dy = d * amplitude.imag;
//    //    let isControl = amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE;
//    //
//    //    if (magnitude <= 0.0001) {
//    //        return; // Even showing a tiny dot is too much.
//    //    }
//    //
//    //    // fill rect from bottom to top as the amplitude becomes more probable
//    //    this.fillRect(area.takeBottom(p * area.h), Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR);
//    //
//    //    // show the direction and magnitude as a circle with a line indicator
//    //    this.fillCircle(c, r, Config.AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL);
//    //    this.strokeCircle(c, r, Config.AMPLITUDE_CIRCLE_STROKE_COLOR);
//    //    this.strokeLine(c, new Point(c.x + dx, c.y - dy));
//    //
//    //    // cross out (in addition to the darkening) when controlled
//    //    if (isControl) {
//    //        this.strokeLine(area.topLeft(), area.bottomRight());
//    //    }
//    //};
//
//    /**
//     * Draws a grid.
//     * @param {!Rect} topLeftCell
//     * @param {!number} cols
//     * @param {!number} rows
//     * @param {=string} strokeColor
//     * @param {=number} strokeThickness
//     */
//    strokeGrid(topLeftCell, cols, rows, strokeColor, strokeThickness) {
//        let x = topLeftCell.x;
//        let y = topLeftCell.y;
//        let dw = topLeftCell.w;
//        let dh = topLeftCell.h;
//        let x2 = x + cols * dw;
//        let y2 = y + rows * dh;
//        this.ctx.beginPath();
//        for (let c = 0; c <= cols; c++) {
//            this.ctx.moveTo(x + c * dw, y);
//            this.ctx.lineTo(x + c * dw, y2);
//        }
//        for (let r = 0; r <= rows; r++) {
//            this.ctx.moveTo(x, y + r * dh);
//            this.ctx.lineTo(x2, y + r * dh);
//        }
//
//        this.ctx.strokeStyle = strokeColor || Config.DEFAULT_STROKE_COLOR;
//        this.ctx.lineWidth = strokeThickness || Config.DEFAULT_STROKE_THICKNESS;
//        this.ctx.stroke();
//    };
//
//    ///**
//    // * Draws a visual representation of a complex matrix.
//    // * @param {!Matrix} matrix The matrix to draw.
//    // * @param {!Rect} drawArea The rectangle to draw the matrix within.
//    // * @param {=Hand} hand Determines if a focus box with numbers is shown.
//    // */
//    //paintMatrix(matrix, drawArea, hand) {
//    //    let numCols = matrix.width();
//    //    let numRows = matrix.height();
//    //    let topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);
//    //
//    //    let focus_c = null;
//    //    let focus_r = null;
//    //    let pos = hand !== undefined && hand.pos !== null && hand.heldGateBlock === null ? hand.pos : null;
//    //    let cell;
//    //    for (let c = 0; c < numCols; c++) {
//    //        for (let r = 0; r < numRows; r++) {
//    //            cell = topLeftCell.proportionalShiftedBy(c, r);
//    //            this.paintAmplitude(matrix.rows[r][c], cell);
//    //            if (pos !== null && cell.containsPoint(Util.notNull(pos))) {
//    //                focus_c = c;
//    //                focus_r = r;
//    //            }
//    //        }
//    //    }
//    //
//    //    this.strokeRect(drawArea);
//    //    if (Config.PAINT_MATRIX_GRID_COLOR_OR_NULL !== null) {
//    //        this.strokeGrid(topLeftCell, numCols, numRows, Config.PAINT_MATRIX_GRID_COLOR_OR_NULL);
//    //    }
//    //
//    //    if (focus_c !== null) {
//    //        cell = topLeftCell.proportionalShiftedBy(focus_c, focus_r);
//    //        let numWires = Math.log2(Math.max(matrix.width(), matrix.height()));
//    //        let stater = bitMask => Seq.range(numWires).
//    //            map(i => ((1 << (numWires - i - 1)) & bitMask) !== 0 ? "1" : "0").
//    //            join("");
//    //
//    //        let tip = stater(focus_c) + " → " + stater(focus_r) +
//    //            "\n= " + matrix.rows[focus_r][focus_c].toString(Format.CONSISTENT);
//    //
//    //        hand.paintToolTipIfHoveringIn(this, cell, tip);
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
//    ///**
//    // * @param {!number} probability
//    // * @param {!Rect} drawArea
//    // * @param {=string} highlightColor
//    // */
//    //paintProbabilityBox(probability, drawArea, highlightColor) {
//    //    let w = drawArea.w * probability;
//    //    this.fillRect(drawArea, highlightColor);
//    //    this.fillRect(drawArea.takeLeft(w), Config.PROBABILITY_BOX_FILL_UP_COLOR);
//    //    this.printCenteredText(describeProbability(probability, 1), drawArea.center());
//    //    this.strokeRect(drawArea);
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
//
//    ///**
//    // * @param {!number} probabilityOfCondition
//    // * @param {!number} probabilityOfHitGivenCondition
//    // * @param {!Rect} drawArea
//    // * @param {=string} highlightColor
//    // */
//    //paintConditionalProbabilityBox(probabilityOfCondition,
//    //                               probabilityOfHitGivenCondition,
//    //                               drawArea,
//    //                               highlightColor) {
//    //    this.fillRect(drawArea, highlightColor);
//    //    let topPrintPos = new Point(drawArea.x, drawArea.y + 15);
//    //    let s;
//    //    if (probabilityOfCondition === 0) {
//    //        // Draw bad-value triangle
//    //        let ps = [drawArea.topLeft(), drawArea.centerRight(), drawArea.centerLeft()];
//    //        this.ctx.beginPath();
//    //        this.ctx.moveTo(ps[0].x, ps[0].y);
//    //        this.ctx.lineTo(ps[1].x, ps[1].y);
//    //        this.ctx.lineTo(ps[2].x, ps[2].y);
//    //        this.ctx.lineTo(ps[0].x, ps[0].y);
//    //        this.ctx.fillStyle = Config.PROBABILITY_BOX_FILL_UP_COLOR;
//    //        this.ctx.fill();
//    //        s = "0/0";
//    //    } else {
//    //        this.fillRect(drawArea.topHalf().takeLeftProportion(probabilityOfHitGivenCondition),
//    //            Config.PROBABILITY_BOX_FILL_UP_COLOR);
//    //        s = describeProbability(probabilityOfHitGivenCondition, 0);
//    //    }
//    //
//    //    let probabilityOfHit = probabilityOfCondition * probabilityOfHitGivenCondition;
//    //    this.fillRect(drawArea.bottomHalf().takeLeftProportion(probabilityOfHit), Config.PROBABILITY_BOX_FILL_UP_COLOR);
//    //    this.printText(
//    //        "|:" + s,
//    //        topPrintPos.offsetBy(3, 0));
//    //    this.printText(
//    //        "∧" + describeProbability(probabilityOfHit, 0),
//    //        topPrintPos.offsetBy(-1, drawArea.h / 2));
//    //    this.strokeRect(drawArea);
//    //}
//}
