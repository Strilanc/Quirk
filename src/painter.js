/**
 * @param {CanvasRenderingContext2D} ctx
 * @constructor
 */
function Painter(ctx) {
    this.ctx = ctx;
}

/**
 * Draws the inside of a rectangle.
 * @param {Rect} rect The rectangular area to fill.
 * @param {=string} color The fill color. Defaults to black.
 */
Painter.prototype.fillRect = function (rect, color) {
    this.ctx.fillStyle = color || "white";
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
};

/**
 * Draws the outside of a rectangle.
 * @param {Rect} rect The rectangular perimeter to stroke.
 * @param {=string} color The stroke color. Defaults to black.
 * @param {=number} thickness The stroke thickness. Defaults to 1.
 */
Painter.prototype.strokeRect = function (rect, color, thickness) {
    this.ctx.strokeStyle = color || "black";
    this.ctx.strokeWidth = thickness || 1;
    this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
};

/**
 * Draws a string. Handles multi-line strings.
 *
 * @param {string} text The string to draw.
 * @param {number} x The left position of the drawn string.
 * @param {number} y The top position of the drawn string.
 * @param {=string} fontColor The text color. Defaults to black.
 * @param {=number} fontSize The text size. Defaults to 12px.
 * @param {=string} fontFamily The text font family. Defaults to Helvetica.
 */
Painter.prototype.printText = function (text, x, y, fontColor, fontSize, fontFamily) {
    fontSize = fontSize || 12;
    fontColor = fontColor || "black";
    fontFamily = fontFamily || "Helvetica";

    this.ctx.fillStyle = fontColor;
    this.ctx.font = fontSize + "px " + fontFamily;

    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        this.ctx.fillText(lines[i], x, y + (i*4*fontSize)/3);
    }
};

/**
 * Draws a string centered around the given point. Does NOT handle multi-line strings.
 *
 * @param text The string to draw.
 * @param x The x coordinate of the center position of the drawn string.
 * @param y The y coordinate of the center position of the drawn string.
 * @param {=string} fontColor The text color. Defaults to black.
 * @param {=number} fontSize The text size. Defaults to 12px.
 * @param {=string} fontFamily The text font family. Defaults to Helvetica.
 */
Painter.prototype.printCenteredText = function (text, x, y, fontColor, fontSize, fontFamily) {
    fontSize = fontSize || 12;
    fontColor = fontColor || "black";
    fontFamily = fontFamily || "Helvetica";

    this.ctx.fillStyle = fontColor;
    this.ctx.font = fontSize + "px " + fontFamily;
    var s = this.ctx.measureText(text);

    this.ctx.fillText(text, x - s.width / 2, y + fontSize/3);
};

/**
 * Draws a line segment between the two points.
 *
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
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
