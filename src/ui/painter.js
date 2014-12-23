// ===================================
//      CONFIGURATION CONSTANTS
// ===================================
var AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL = "yellow";
var AMPLITUDE_CIRCLE_FILL_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ONE = "#201000";
var AMPLITUDE_CIRCLE_STROKE_COLOR = "gray";
var AMPLITUDE_CLEAR_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ZERO = "#444";
var AMPLITUDE_PROBABILITY_FILL_UP_COLOR = "orange";

/**
 * @param {!CanvasRenderingContext2D} ctx
 * @property {!CanvasRenderingContext2D} ctx
 * @constructor
 */
function Painter(ctx) {
    this.ctx = ctx;
}

/**
 * Draws the inside of a rectangle.
 * @param {!Rect} rect The rectangular area to fill.
 * @param {=string} color The fill color. Defaults to black.
 */
Painter.prototype.fillRect = function (rect, color) {
    this.ctx.fillStyle = color || "white";
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
};

/**
 * Draws the outside of a rectangle.
 * @param {!Rect} rect The rectangular perimeter to stroke.
 * @param {=string} color The stroke color. Defaults to black.
 * @param {=number} thickness The stroke thickness. Defaults to 1.
 */
Painter.prototype.strokeRect = function (rect, color, thickness) {
    this.ctx.strokeStyle = color || "black";
    this.ctx.strokeWidth = thickness || 1;
    this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
};

/**
 * Draws the inside of a circle.
 * @param {!Point} center The center of the circle.
 * @param {!number} radius The distance from the center of the circle to its side.
 * @param {=string} color The fill color. Defaults to white.
 */
Painter.prototype.fillCircle = function (center, radius, color) {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color || "white";
    this.ctx.fill();
};

/**
 * Draws the outside of a circle.
 * @param {!Point} center The center of the circle.
 * @param {!number} radius The distance from the center of the circle to its side.
 * @param {=string} color The stroke color. Defaults to black.
 * @param {=number} thickness The stroke thickness. Defaults to 1.
 */
Painter.prototype.strokeCircle = function (center, radius, color, thickness) {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = color || "black";
    this.ctx.strokeWidth = thickness || 1;
    this.ctx.stroke();
};

/**
 * Draws a string. Handles multi-line strings.
 *
 * @param {!string} text The string to draw.
 * @param {!Point} pos The top-left position of the drawn string.
 * @param {=string} fontColor The text color. Defaults to black.
 * @param {=number} fontSize The text size. Defaults to 12px.
 * @param {=string} fontFamily The text font family. Defaults to Helvetica.
 */
Painter.prototype.printText = function (text, pos, fontColor, fontSize, fontFamily) {
    fontSize = fontSize || 12;
    fontColor = fontColor || "black";
    fontFamily = fontFamily || "Helvetica";

    this.ctx.fillStyle = fontColor;
    this.ctx.font = fontSize + "px " + fontFamily;

    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        this.ctx.fillText(lines[i], pos.x, pos.y + (i*4*fontSize)/3);
    }
};

/**
 * Draws a string centered around the given point. Does NOT handle multi-line strings.
 *
 * @param {!string} text The string to draw.
 * @param {!Point} pos The center position of the drawn string.
 * @param {=string} fontColor The text color. Defaults to black.
 * @param {=number} fontSize The text size. Defaults to 12px.
 * @param {=string} fontFamily The text font family. Defaults to Helvetica.
 * @param {=Point} centerPointProportion The porportional point to center on, defaulting to (0.5, 0.5).
 */
Painter.prototype.printCenteredText = function (text, pos, fontColor, fontSize, fontFamily, centerPointProportion) {
    fontSize = fontSize || 12;
    fontColor = fontColor || "black";
    fontFamily = fontFamily || "Helvetica";
    centerPointProportion = centerPointProportion || new Point(0.5, 0.5);

    this.ctx.fillStyle = fontColor;
    this.ctx.font = fontSize + "px " + fontFamily;
    var s = this.ctx.measureText(text);

    this.ctx.fillText(
        text,
        pos.x - s.width * centerPointProportion.x,
        pos.y + fontSize * 0.8 * (1 - centerPointProportion.y));
};

/**
 *
 * @param {!Point} firstNodePoint
 * @param {!Point} levelDelta
 * @param {!Point} nodeDelta
 * @param {!Array.<!String>} levelLabels
 */
Painter.prototype.paintBinaryTree = function(firstNodePoint, levelDelta, nodeDelta, levelLabels) {
    var makeNodePoint = function(i) {
        return firstNodePoint.
            plus(nodeDelta.times(i)).
            plus(levelDelta.times(evenPower(i)));
    };

    var n = 1 << levelLabels.length;
    for (var i = 1; i < n; i++) {
        var b = evenPower(i);
        var p = makeNodePoint(i);
        if (b > 0) {
            var d = 1 << (b - 1);
            this.strokeLine(p, makeNodePoint(i + d), "gray");
            this.strokeLine(p, makeNodePoint(i - d), "gray");
        }

        var levelDeltaLength = Math.sqrt(levelDelta.x * levelDelta.x + levelDelta.y * levelDelta.y);
        var weight = new Point(0.5, 0.5).plus(levelDelta.times(-0.5/levelDeltaLength));
        this.printCenteredText(
            levelLabels[b],
            p,
            undefined,
            undefined,
            undefined,
            weight);
    }
};

/**
 * Draws a line segment between the two points.
 *
 * @param {!Point} p1
 * @param {!Point} p2
 * @param {=string} color The color of the drawn line. Defaults to black.
 * @param {=number} thickness The thickness of the drawn line. Defaults to 1.
 */
Painter.prototype.strokeLine = function(p1, p2, color, thickness) {
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.strokeStyle = color || "black";
    this.ctx.strokeWidth = thickness || 1;
    this.ctx.stroke();
};

/**
 * Draws representations of complex values used to weight components of a superposition.
 *
 * @param {!Rect} area The drawing area, where the amplitude will be represented visually.
 * @param {!Complex} amplitude The complex value to represent visually. Its magnitude should be at most 1.
 */
Painter.prototype.paintAmplitude = function(amplitude, area) {
    if (amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO) {
        this.fillRect(area, AMPLITUDE_CLEAR_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ZERO);
        return;
    }

    var c = area.center();
    var magnitude = amplitude.abs();
    var p = amplitude.norm2();
    var d = Math.min(area.w, area.h) / 2;
    var r = d * magnitude;
    var dx = d * amplitude.real;
    var dy = d * amplitude.imag;
    var isControl = amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE;

    if (magnitude <= 0.0001) {
        return; // Even showing a tiny dot is too much.
    }

    // fill rect from bottom to top as the amplitude becomes more probable
    this.fillRect(area.takeBottom(p * area.h), AMPLITUDE_PROBABILITY_FILL_UP_COLOR);

    // show the direction and magnitude as a circle with a line indicator
    this.fillCircle(c, r, isControl ?
        AMPLITUDE_CIRCLE_FILL_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ONE
        : AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL);
    this.strokeCircle(c, r, AMPLITUDE_CIRCLE_STROKE_COLOR);
    this.strokeLine(c, new Point(c.x + dx, c.y - dy));

    // cross out (in addition to the darkening) when controlled
    if (isControl) {
        this.strokeLine(area.topLeft(), area.bottomRight());
    }
};

/**
 * Draws a grid.
 * @param {!Rect} topLeftCell
 * @param {!number} cols
 * @param {!number} rows
 * @param {=string} strokeColor
 * @param {=number} strokeThickness
 */
Painter.prototype.strokeGrid = function(topLeftCell, cols, rows, strokeColor, strokeThickness) {
    var x = topLeftCell.x;
    var y = topLeftCell.y;
    var dw = topLeftCell.w;
    var dh = topLeftCell.h;
    var x2 = x + cols*dw;
    var y2 = y + rows*dh;
    this.ctx.beginPath();
    for (var c = 0; c <= cols; c++) {
        this.ctx.moveTo(x + c*dw, y);
        this.ctx.lineTo(x + c*dw, y2);
    }
    for (var r = 0; r <= rows; r++) {
        this.ctx.moveTo(x, y + r*dh);
        this.ctx.lineTo(x2, y + r*dh);
    }

    this.ctx.strokeStyle = strokeColor || "black";
    this.ctx.strokeWidth = strokeThickness || 1;
    this.ctx.stroke();
};

/**
 * Draws a visual representation of a complex matrix.
 * @param {!Matrix} matrix The matrix to draw.
 * @param {!Rect} drawArea The rectangle to draw the matrix within.
 * @param {=string} highlightColor
 */
Painter.prototype.paintMatrix = function(matrix, drawArea, highlightColor) {
    var numCols = matrix.width();
    var numRows = matrix.height();
    var topLeftCell = new Rect(drawArea.x, drawArea.y, drawArea.w / numCols, drawArea.h / numRows);

    this.fillRect(drawArea, highlightColor);

    for (var c = 0; c < numCols; c++) {
        for (var r = 0; r < numRows; r++) {
            this.paintAmplitude(matrix.rows[r][c], topLeftCell.proportionalShiftedBy(c, r));
        }
    }

    this.strokeGrid(topLeftCell, numCols, numRows);
};

/**
 *
 * @param {!QuantumState} state
 * @param {!Rect} drawArea
 * @param {!Array.<!string>} labels
 */
Painter.prototype.paintQuantumStateAsLabelledGrid = function (state, drawArea, labels) {
    need(state.columnVector.height() === 1 << labels.length, "columnVector.height() === labels.length");

    var numWireRows = Math.floor(labels.length / 2);
    var numWireCols = labels.length - numWireRows;
    var numDrawRows = 1 << numWireRows;
    var numDrawCols = 1 << numWireCols;

    var labelDif = 5;
    var labelSpace = 8;
    var skipLength = Math.max(numWireRows, numWireCols) * labelDif + labelSpace;

    // Draw state grid
    var gridRect = drawArea.skipLeft(skipLength).skipTop(skipLength);
    this.paintColumnVectorAsGrid(state.columnVector, gridRect);

    // Draw row label tree
    this.paintBinaryTree(
        gridRect.topLeft().offsetBy(0, -1),
        new Point(-labelDif, 0),
        new Point(0, gridRect.h / numDrawRows),
        labels.slice(numWireCols));

    // Draw column label tree
    this.paintBinaryTree(
        gridRect.topLeft().offsetBy(0, -1),
        new Point(0, -labelDif),
        new Point(gridRect.w / numDrawCols, 0),
        labels.slice(0, numWireCols));
};

/**
 * Draws a visual representation of a column vector, using a grid layout.
 * @param {!Matrix} columnVector The complex column vector to draw.
 * @param {!Rect} drawArea The rectangle to draw the vector within.
 */
Painter.prototype.paintColumnVectorAsGrid = function (columnVector, drawArea) {
    var n = columnVector.height();
    var numDrawRows = 1 << Math.floor(Math.log(n) / Math.log(2) / 2);
    var numDrawCols = Math.ceil(n / numDrawRows);
    var topLeftCell = new Rect(
        drawArea.x,
        drawArea.y,
        drawArea.w / numDrawCols,
        drawArea.h / numDrawRows);

    for (var r = 0; r < n; r++) {
        var dx = r % numDrawCols;
        var dy = Math.floor(r / numDrawCols);
        this.paintAmplitude(columnVector.rows[r][0], topLeftCell.proportionalShiftedBy(dx, dy));
    }

    this.strokeGrid(topLeftCell, numDrawCols, numDrawRows);
};

/**
 * @param {!number} probability
 * @param {!Rect} drawArea
 * @param {=string} highlightColor
 */
Painter.prototype.paintProbabilityBox = function (probability, drawArea, highlightColor) {
    var w = drawArea.w * probability;
    this.fillRect(drawArea, highlightColor);
    this.fillRect(drawArea.takeLeft(w), "gray");
    this.strokeRect(drawArea);
    this.printCenteredText((probability*100).toFixed(1) + "%", drawArea.center());
};

/**
 * @param {!number} probabilityIncludingConditions
 * @param {!number} probabilityGivenConditions
 * @param {!Rect} drawArea
 * @param {=string} highlightColor
 */
Painter.prototype.paintConditionalProbabilityBox = function(probabilityIncludingConditions,
                                                            probabilityGivenConditions,
                                                            drawArea,
                                                            highlightColor) {
    this.fillRect(drawArea, highlightColor);
    this.strokeRect(drawArea);
    var topPrintPos = new Point(drawArea.x, drawArea.y + 15);
    var s;
    if (probabilityIncludingConditions === 0) {
        // Draw bad-value triangle
        var ps = [drawArea.topLeft(), drawArea.centerRight(), drawArea.centerLeft()];
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0].x, ps[0].y);
        this.ctx.lineTo(ps[1].x, ps[1].y);
        this.ctx.lineTo(ps[2].x, ps[2].y);
        this.ctx.lineTo(ps[0].x, ps[0].y);
        this.ctx.fillStyle = "gray";
        this.ctx.fill();
        s = "N/A";
    } else {
        this.fillRect(drawArea.topHalf().takeLeftProportion(probabilityGivenConditions), "gray");
        s = Math.round(probabilityGivenConditions*100) + "%";
    }

    this.fillRect(drawArea.bottomHalf().takeLeftProportion(probabilityIncludingConditions), "gray");
    this.printText(
        "|:" + s,
        topPrintPos.offsetBy(7, 0));
    this.printText(
        "∧:" + Math.round(probabilityIncludingConditions*100) + "%",
        topPrintPos.offsetBy(0, drawArea.h/2));
};
