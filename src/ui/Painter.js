//import Format from "src/base/Format.js"
//import Util from "src/base/Util.js"
//import Seq from "src/base/Seq.js"
//import Config from "src/Config.js"
//
//export default class Painter {
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
//    clear(color = Config.DEFAULT_FILL_COLOR) {
//        this.ctx.fillStyle = color;
//        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
//    }
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
//    /**
//     * Draws the outside of a rectangle.
//     * @param {!Rect} rect The rectangular perimeter to stroke.
//     * @param {!string=} color The stroke color.
//     * @param {!number=} thickness The stroke thickness.
//     */
//    strokeRect(rect, color = "black", thickness = 1) {
//        this.ctx.strokeStyle = color;
//        this.ctx.lineWidth = thickness;
//        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
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
//}
