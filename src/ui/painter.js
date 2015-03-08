//var force6 = e => e;
//
///**
// * @param {!HTMLCanvasElement} canvas
// * @property {!HTMLCanvasElement} canvas
// * @property {!CanvasRenderingContext2D} ctx
// * @constructor
// */
//function Painter(canvas) {
//    this.canvas = canvas;
//    this.ctx = canvas.getContext("2d");
//}
//
///**
// * Draws the inside of a rectangle.
// * @param {!Rect} rect The rectangular area to fill.
// * @param {=string} color The fill color. Defaults to black.
// */
//Painter.prototype.fillRect = function (rect, color) {
//    this.ctx.fillStyle = color || Config.DEFAULT_FILL_COLOR;
//    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
//};
//
///**
// * Draws the outside of a rectangle.
// * @param {!Rect} rect The rectangular perimeter to stroke.
// * @param {=string} color The stroke color. Defaults to black.
// * @param {=number} thickness The stroke thickness. Defaults to 1.
// */
//Painter.prototype.strokeRect = function (rect, color, thickness) {
//    this.ctx.strokeStyle = color || "black";
//    this.ctx.strokeWidth = thickness || 1;
//    this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
//};
//
///**
// * Draws the inside of a circle.
// * @param {!Point} center The center of the circle.
// * @param {!number} radius The distance from the center of the circle to its side.
// * @param {=string} color The fill color. Defaults to white.
// */
//Painter.prototype.fillCircle = function (center, radius, color) {
//    this.ctx.beginPath();
//    this.ctx.arc(center.x, center.y, Math.max(radius - 0.5, 0), 0, 2 * Math.PI);
//    this.ctx.fillStyle = color || Config.DEFAULT_FILL_COLOR;
//    this.ctx.fill();
//};
//
///**
// * Draws the outside of a circle.
// * @param {!Point} center The center of the circle.
// * @param {!number} radius The distance from the center of the circle to its side.
// * @param {=string} color The stroke color. Defaults to black.
// * @param {=number} thickness The stroke thickness. Defaults to 1.
// */
//Painter.prototype.strokeCircle = function (center, radius, color, thickness) {
//    this.ctx.beginPath();
//    this.ctx.strokeStyle = color || Config.DEFAULT_STROKE_COLOR;
//    this.ctx.lineWidth = thickness || Config.DEFAULT_STROKE_THICKNESS;
//    this.ctx.arc(center.x, center.y, Math.max(radius - 0.5, 0), 0, 2 * Math.PI);
//    this.ctx.stroke();
//};
//
///**
// * Draws a string. Handles multi-line strings.
// *
// * @param {!string} text The string to draw.
// * @param {!Point} pos The top-left position of the drawn string.
// * @param {=string} fontColor The text color. Defaults to black.
// * @param {=number} fontSize The text size. Defaults to 12px.
// * @param {=string} fontFamily The text font family. Defaults to Helvetica.
// */
//Painter.prototype.printText = function (text, pos, fontColor, fontSize, fontFamily) {
//    fontSize = fontSize || Config.DEFAULT_FONT_SIZE;
//    fontColor = fontColor || Config.DEFAULT_TEXT_COLOR;
//    fontFamily = fontFamily || Config.DEFAULT_FONT_FAMILY;
//
//    this.ctx.fillStyle = fontColor;
//    this.ctx.font = fontSize + "px " + fontFamily;
//
//    var lines = text.split("\n");
//    for (var i = 0; i < lines.length; i++) {
//        this.ctx.fillText(lines[i], pos.x, pos.y + (i*4*fontSize)/3);
//    }
//};
//
///**
// * Draws a string centered around the given point. Does NOT handle multi-line strings.
// *
// * @param {!string} text The string to draw.
// * @param {!Point} pos The center position of the drawn string.
// * @param {=string} fontColor The text color. Defaults to black.
// * @param {=number} fontSize The text size. Defaults to 12px.
// * @param {=string} fontFamily The text font family. Defaults to Helvetica.
// * @param {=Point} centerPointProportion The porportional point to center on, defaulting to (0.5, 0.5).
// */
//Painter.prototype.printCenteredText = function (text, pos, fontColor, fontSize, fontFamily, centerPointProportion) {
//    fontSize = fontSize || Config.DEFAULT_FONT_SIZE;
//    fontColor = fontColor || Config.DEFAULT_TEXT_COLOR;
//    fontFamily = fontFamily || Config.DEFAULT_FONT_FAMILY;
//    centerPointProportion = centerPointProportion || new Point(0.5, 0.5);
//
//    this.ctx.fillStyle = fontColor;
//    this.ctx.font = fontSize + "px " + fontFamily;
//    var s = this.ctx.measureText(text);
//
//    this.ctx.fillText(
//        text,
//        pos.x - s.width * centerPointProportion.x,
//        pos.y + fontSize * 0.8 * (1 - centerPointProportion.y));
//};
//
///**
// *
// * @param {!Point} firstNodePoint
// * @param {!Point} levelDelta
// * @param {!Point} nodeDelta
// * @param {!Array<!String>} levelLabels
// */
//Painter.prototype.paintBinaryTree = function(firstNodePoint, levelDelta, nodeDelta, levelLabels) {
//    var makeNodePoint = function(i) {
//        return firstNodePoint.
//            plus(nodeDelta.times(i)).
//            plus(levelDelta.times(evenPower(i)));
//    };
//
//    var n = 1 << levelLabels.length;
//    for (var i = 1; i < n; i++) {
//        var b = evenPower(i);
//        var p = makeNodePoint(i);
//        if (b > 0) {
//            var d = 1 << (b - 1);
//            this.strokeLine(p, makeNodePoint(i + d), Config.BINARY_TREE_LABEL_EDGE_COLOR);
//            this.strokeLine(p, makeNodePoint(i - d), Config.BINARY_TREE_LABEL_EDGE_COLOR);
//        }
//
//        var levelDeltaLength = Math.sqrt(levelDelta.x * levelDelta.x + levelDelta.y * levelDelta.y);
//        var weight = new Point(0.5, 0.5).plus(levelDelta.times(-0.5/levelDeltaLength));
//        this.printCenteredText(
//            levelLabels[b],
//            p,
//            undefined,
//            undefined,
//            undefined,
//            weight);
//    }
//};
//
///**
// * Draws a line segment between the two points.
// *
// * @param {!Point} p1
// * @param {!Point} p2
// * @param {=string} color The color of the drawn line. Defaults to black.
// * @param {=number} thickness The thickness of the drawn line. Defaults to 1.
// */
//Painter.prototype.strokeLine = function(p1, p2, color, thickness) {
//    this.ctx.beginPath();
//    this.ctx.moveTo(p1.x, p1.y);
//    this.ctx.lineTo(p2.x, p2.y);
//    this.ctx.strokeStyle = color || Config.DEFAULT_STROKE_COLOR;
//    this.ctx.lineWidth = thickness || 1;
//    this.ctx.stroke();
//};
//
///**
// * Draws representations of complex values used to weight components of a superposition.
// *
// * @param {!Rect} area The drawing area, where the amplitude will be represented visually.
// * @param {!Complex} amplitude The complex value to represent visually. Its magnitude should be at most 1.
// */
//Painter.prototype.paintAmplitude = function(amplitude, area) {
//    var c = area.center();
//    var magnitude = amplitude.abs();
//    var p = amplitude.norm2();
//    var d = Math.min(area.w, area.h) / 2;
//    var r = d * magnitude;
//    var dx = d * amplitude.real;
//    var dy = d * amplitude.imag;
//    var isControl = amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE;
//
//    if (magnitude <= 0.0001) {
//        return; // Even showing a tiny dot is too much.
//    }
//
//    // fill rect from bottom to top as the amplitude becomes more probable
//    this.fillRect(area.takeBottom(p * area.h), Config.AMPLITUDE_PROBABILITY_FILL_UP_COLOR);
//
//    // show the direction and magnitude as a circle with a line indicator
//    this.fillCircle(c, r, Config.AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL);
//    this.strokeCircle(c, r, Config.AMPLITUDE_CIRCLE_STROKE_COLOR);
//    this.strokeLine(c, new Point(c.x + dx, c.y - dy));
//
//    // cross out (in addition to the darkening) when controlled
//    if (isControl) {
//        this.strokeLine(area.topLeft(), area.bottomRight());
//    }
//};
//
///**
// * Draws a grid.
// * @param {!Rect} topLeftCell
// * @param {!number} cols
// * @param {!number} rows
// * @param {=string} strokeColor
// * @param {=number} strokeThickness
// */
//Painter.prototype.strokeGrid = function(topLeftCell, cols, rows, strokeColor, strokeThickness) {
//    var x = topLeftCell.x;
//    var y = topLeftCell.y;
//    var dw = topLeftCell.w;
//    var dh = topLeftCell.h;
//    var x2 = x + cols*dw;
//    var y2 = y + rows*dh;
//    this.ctx.beginPath();
//    for (var c = 0; c <= cols; c++) {
//        this.ctx.moveTo(x + c*dw, y);
//        this.ctx.lineTo(x + c*dw, y2);
//    }
//    for (var r = 0; r <= rows; r++) {
//        this.ctx.moveTo(x, y + r*dh);
//        this.ctx.lineTo(x2, y + r*dh);
//    }
//
//    this.ctx.strokeStyle = strokeColor || Config.DEFAULT_STROKE_COLOR;
//    this.ctx.lineWidth = strokeThickness || Config.DEFAULT_STROKE_THICKNESS;
//    this.ctx.stroke();
//};
//
///**
// * Draws a visual representation of a complex matrix.
// * @param {!Matrix} matrix The matrix to draw.
// * @param {!Rect} drawArea The rectangle to draw the matrix within.
// * @param {=Hand} hand Determines if a focus box with numbers is shown.
// */
//Painter.prototype.paintMatrix = function(matrix, drawArea, hand) {
//    var numCols = matrix.width();
//    var numRows = matrix.height();
//    var topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);
//
//    var focus_c = null;
//    var focus_r = null;
//    var pos = hand !== undefined && hand.pos !== null && hand.heldGateBlock === null ? hand.pos : null;
//    for (var c = 0; c < numCols; c++) {
//        for (var r = 0; r < numRows; r++) {
//            var cell = topLeftCell.proportionalShiftedBy(c, r);
//            this.paintAmplitude(matrix.rows[r][c], cell);
//            if (pos !== null && cell.containsPoint(notNull(pos))) {
//                focus_c = c;
//                focus_r = r;
//            }
//        }
//    }
//
//    this.strokeRect(drawArea);
//    if (Config.PAINT_MATRIX_GRID_COLOR_OR_NULL !== null) {
//        this.strokeGrid(topLeftCell, numCols, numRows, Config.PAINT_MATRIX_GRID_COLOR_OR_NULL);
//    }
//
//    if (focus_c !== null) {
//        cell = topLeftCell.proportionalShiftedBy(focus_c, focus_r);
//        var numWires = Math.log2(Math.max(matrix.width(), matrix.height()));
//        var stater = function(bitMask) {
//            return range(numWires).map(function(i) {
//                return ((1 << (numWires - i - 1)) & bitMask) !== 0 ? "1" : "0";
//            }).join("");
//        };
//
//        var tip = stater(focus_c) + " → " + stater(focus_r) +
//            "\n= " + matrix.rows[focus_r][focus_c].toString(Format.CONSISTENT);
//
//        hand.paintToolTipIfHoveringIn(this,  cell,  tip);
//    }
//};
//
////Painter.prototype.paintDisalloweds = function(matrix, drawArea) {
////    var numCols = matrix.width();
////    var numRows = matrix.height();
////    var topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);
////
////    this.ctx.globalAlpha = 0.25;
////    for (var c = 0; c < numCols; c++) {
////        for (var r = 0; r < numRows; r++) {
////            var cell = topLeftCell.proportionalShiftedBy(c, r);
////            if (matrix.rows[r][c].isEqualTo(0)) {
////                this.fillRect(cell, "red")
////            }
////        }
////    }
////    this.ctx.globalAlpha = 1;
////};
//
///**
// *
// * @param {!Array<!QuantumState>} factors
// * @param {!Rect} drawArea
// * @param {!Array<!string>} labels
// */
////Painter.prototype.paintFactoredQuantumStateAsLabelledGrid = function (factors, drawArea, labels) {
////    var numWireRows = Math.floor(labels.length / 2);
////    var numWireCols = labels.length - numWireRows;
////    var numDrawRows = 1 << numWireRows;
////    var numDrawCols = 1 << numWireCols;
////
////    var labelDif = 5;
////    var labelSpace = 8;
////    var skipLength = Math.max(numWireRows, numWireCols) * labelDif + labelSpace;
////
////    // Draw state grid
////    var gridRect = drawArea.skipLeft(skipLength).skipTop(skipLength);
////    this.paintQuantumStateAsGrid(state, gridRect);
////
////};
//
///**
// *
// * @param {!QuantumState} state
// * @param {!Rect} drawArea
// * @param {!Array<!string>} labels
// */
//Painter.prototype.paintQuantumStateAsLabelledGrid = function (state, drawArea, labels) {
//    need(state.columnVector.height() === 1 << labels.length, "columnVector.height() === labels.length");
//
//    var numWireRows = Math.floor(labels.length / 2);
//    var numWireCols = labels.length - numWireRows;
//    var numDrawRows = 1 << numWireRows;
//    var numDrawCols = 1 << numWireCols;
//
//    var labelDif = 5;
//    var labelSpace = 8;
//    var skipLength = Math.max(numWireRows, numWireCols) * labelDif + labelSpace;
//
//    // Draw state grid
//    var gridRect = drawArea.skipLeft(skipLength).skipTop(skipLength);
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
//};
//
///**
// * Draws a visual representation of a column vector, using a grid layout.
// * @param {!QuantumState} quantumState The quantum state to draw.
// * @param {!Rect} drawArea The rectangle to draw the vector within.
// */
//Painter.prototype.paintQuantumStateAsGrid = function (quantumState, drawArea) {
//    var numStates = quantumState.columnVector.height();
//    var numWires = quantumState.countQubits();
//    var numWireCols = Math.ceil(numWires / 2);
//    var numWireRows = Math.floor(numWires / 2);
//    var numDrawCols = 1 << numWireCols;
//    var numDrawRows = 1 << numWireRows;
//    var topLeftCell = new Rect(
//        drawArea.x,
//        drawArea.y,
//        drawArea.w / numDrawCols,
//        drawArea.h / numDrawRows);
//
//    for (var r = 0; r < numStates; r++) {
//        var dx = r % numDrawCols;
//        var dy = Math.floor(r / numDrawCols);
//        this.paintAmplitude(quantumState.columnVector.rows[r][0], topLeftCell.proportionalShiftedBy(dx, dy));
//    }
//
//    this.strokeGrid(topLeftCell, numDrawCols, numDrawRows);
//};
//
///**
// * @param {!number} probability
// * @param {!Rect} drawArea
// * @param {=string} highlightColor
// */
//Painter.prototype.paintProbabilityBox = function (probability, drawArea, highlightColor) {
//    var w = drawArea.w * probability;
//    this.fillRect(drawArea, highlightColor);
//    this.fillRect(drawArea.takeLeft(w), Config.PROBABILITY_BOX_FILL_UP_COLOR);
//    this.printCenteredText(describeProbability(probability, 1), drawArea.center());
//    this.strokeRect(drawArea);
//};
//
///**
// * Draws a tooltip box.
// *
// * @param {!string} text The tooltip's text.
// * @param {!Point} focusPoint The position of the mouse cursor.
// * @param {!Rect} focusRect The location of the object to which the tooltip belongs.
// * @param {=string} fontColor The text color. Defaults to black.
// * @param {=number} fontSize The text size. Defaults to 12px.
// * @param {=string} fontFamily The text font family. Defaults to Helvetica.
// */
//Painter.prototype.paintTooltip = function(text, focusPoint, focusRect, fontColor, fontSize, fontFamily) {
//    fontSize = fontSize || Config.DEFAULT_FONT_SIZE;
//
//    var ctx = this.ctx;
//    var lines = text.split("\n");
//    var w = lines.map(function(e) { return ctx.measureText(e).width; }).max();
//    var h = fontSize * lines.length * 1.3;
//
//    var paintRect = new Rect(focusPoint.x, focusRect.y - h, w, h).paddedBy(2);
//    if (paintRect.y < 0) {
//        new Rect(focusPoint.x, focusRect.bottom(), w, h).paddedBy(2);
//    }
//
//    if (paintRect.right() > this.canvas.width) {
//        paintRect = paintRect.withX(this.canvas.width - paintRect.w);
//    }
//    if (paintRect.bottom() > this.canvas.height) {
//        paintRect = paintRect.withY(this.canvas.height - paintRect.h);
//    }
//    if (paintRect.x < 0) {
//        paintRect = paintRect.withX(0);
//    }
//    if (paintRect.y < 0) {
//        paintRect = paintRect.withY(0);
//    }
//
//    this.fillRect(paintRect);
//    this.strokeRect(paintRect);
//    this.printText(text, paintRect.center().offsetBy(-w/2, -h/2 + fontSize), fontColor, fontSize, fontFamily);
//};
//
///**
// * @param {!number} probabilityOfCondition
// * @param {!number} probabilityOfHitGivenCondition
// * @param {!Rect} drawArea
// * @param {=string} highlightColor
// */
//Painter.prototype.paintConditionalProbabilityBox = function(probabilityOfCondition,
//                                                            probabilityOfHitGivenCondition,
//                                                            drawArea,
//                                                            highlightColor) {
//    this.fillRect(drawArea, highlightColor);
//    var topPrintPos = new Point(drawArea.x, drawArea.y + 15);
//    var s;
//    if (probabilityOfCondition === 0) {
//        // Draw bad-value triangle
//        var ps = [drawArea.topLeft(), drawArea.centerRight(), drawArea.centerLeft()];
//        this.ctx.beginPath();
//        this.ctx.moveTo(ps[0].x, ps[0].y);
//        this.ctx.lineTo(ps[1].x, ps[1].y);
//        this.ctx.lineTo(ps[2].x, ps[2].y);
//        this.ctx.lineTo(ps[0].x, ps[0].y);
//        this.ctx.fillStyle = Config.PROBABILITY_BOX_FILL_UP_COLOR;
//        this.ctx.fill();
//        s = "0/0";
//    } else {
//        this.fillRect(drawArea.topHalf().takeLeftProportion(probabilityOfHitGivenCondition),
//            Config.PROBABILITY_BOX_FILL_UP_COLOR);
//        s = describeProbability(probabilityOfHitGivenCondition, 0);
//    }
//
//    var probabilityOfHit = probabilityOfCondition * probabilityOfHitGivenCondition;
//    this.fillRect(drawArea.bottomHalf().takeLeftProportion(probabilityOfHit), Config.PROBABILITY_BOX_FILL_UP_COLOR);
//    this.printText(
//        "|:" + s,
//        topPrintPos.offsetBy(3, 0));
//    this.printText(
//        "∧" + describeProbability(probabilityOfHit, 0),
//        topPrintPos.offsetBy(-1, drawArea.h/2));
//    this.strokeRect(drawArea);
//};
