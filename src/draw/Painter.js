/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Config} from "../Config.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {RestartableRng} from "../base/RestartableRng.js"
import {seq, Seq} from "../base/Seq.js"
import {Util} from "../base/Util.js"

class Painter {
    /**
     * @param {!HTMLCanvasElement} canvas
     * @param {!RestartableRng=} rng
     */
    constructor(canvas, rng = new RestartableRng()) {
        /** @type {!HTMLCanvasElement} */
        this.canvas = canvas;
        /** @type {!CanvasRenderingContext2D} */
        this.ctx = canvas.getContext("2d");
        /**
         * @type {!Array.<!function()>}
         * @private
         */
        this._deferredPaintActions = [];
        /**
         * @type {!TraceAction}
         * @private
         */
        this._traceAction = new TraceAction(this.ctx);
        /**
         * @type {!Tracer}
         * @private
         */
        this._tracer = new Tracer(this.ctx);
        /**
         * @type {undefined|!string}
         */
        this.desiredCursorStyle = undefined;
        /**
         * @type {!Array.<!{rect: !Rect, cursor: undefined|!string}>}
         */
        this.touchBlockers = [];
        /**
         * @type {!RestartableRng}
         */
        this.rng = rng;

        this._ignoringTouchBlockers = 0;
    }

    startIgnoringIncomingTouchBlockers() {
        this._ignoringTouchBlockers += 1
    }

    stopIgnoringIncomingTouchBlockers() {
        this._ignoringTouchBlockers -= 1
    }

    /**
     * @param {!{rect: !Rect, cursor: undefined|!string}} blocker
     */
    noteTouchBlocker(blocker) {
        if (this._ignoringTouchBlockers === 0) {
            this.touchBlockers.push(blocker);
        }
    }

    /**
     * @param {!string} cursorStyle auto|pointer|move|ns-resize|...
     */
    setDesiredCursor(cursorStyle) {
        this.desiredCursorStyle = cursorStyle;
    }

    /**
     * @param {!function()} tooltipPainter
     */
    defer(tooltipPainter) {
        this._deferredPaintActions.push(tooltipPainter);
    }

    paintDeferred() {
        for (let e of this._deferredPaintActions) {
            e();
        }
        this._deferredPaintActions = [];
    }

    /**
     * @returns {!Rect}
     */
    paintableArea() {
        return new Rect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * @param {!string=} color
     */
    clear(color = Config.DEFAULT_FILL_COLOR) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draws a line segment between the two points.
     *
     * @param {!Point} p1
     * @param {!Point} p2
     * @param {=string} color The color of the drawn line.
     * @param {=number} thickness The thickness of the drawn line.
     */
    strokeLine(p1, p2, color = Config.DEFAULT_STROKE_COLOR, thickness = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.stroke();
    }

    /**
     * Draws the outside of a rectangle.
     * @param {!Rect} rect The rectangular perimeter to stroke.
     * @param {!string=} color The stroke color.
     * @param {!number=} thickness The stroke thickness.
     */
    strokeRect(rect, color = "black", thickness = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    /**
     * Draws the inside of a rectangle.
     * @param {!Rect} rect The rectangular area to fill.
     * @param {!string=} color The fill color.
     */
    fillRect(rect, color = Config.DEFAULT_FILL_COLOR) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    /**
     * Draws the outside of a circle.
     * @param {!Point} center The center of the circle.
     * @param {!number} radius The distance from the center of the circle to its side.
     * @param {!string=} color The stroke color.
     * @param {!number=} thickness The stroke thickness.
     */
    strokeCircle(center, radius, color = Config.DEFAULT_STROKE_COLOR, thickness = Config.DEFAULT_STROKE_THICKNESS) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.arc(center.x, center.y, Math.max(radius - 0.5, 0), 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * @param {!function(!Tracer) : void} tracerFunc
     * @returns {!TraceAction}
     */
    trace(tracerFunc) {
        this.ctx.beginPath();
        tracerFunc(this._tracer);
        return this._traceAction;
    }

    /**
     * Draws the inside of a circle.
     * @param {!Point} center The center of the circle.
     * @param {!number} radius The distance from the center of the circle to its side.
     * @param {!string=} color The fill color. Defaults to white.
     */
    fillCircle(center, radius, color = Config.DEFAULT_FILL_COLOR) {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, Math.max(radius - 0.5, 0), 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * Draws some text in a bounded area.
     * @param {!string} text The text to print.
     * @param {!number} x
     * @param {!number} y
     * @param {!number} boundingWidth The text will be scaled down so it doesn't exceed this width.
     * @param {!number} boundingHeight The text will be scaled down so it doesn't exceed this width.
     * @param {!string} textAlign Horizontal alignment. Options: start, end, left, right, center.
     * @param {!string} textBaseline Vertical alignment. Options: top, hanging, middle, alphabetic, ideographic, bottom.
     * @param {!string} fillStyle Text color.
     * @param {!string} font
     * @param {!function(!number, !number) : void} afterMeasureBeforeDraw
     * @param {!boolean} alsoStroke
     */
    print(text,
          x,
          y,
          textAlign,
          textBaseline,
          fillStyle,
          font,
          boundingWidth,
          boundingHeight,
          afterMeasureBeforeDraw = undefined,
          alsoStroke = false) {

        this.ctx.font = font;
        let naiveWidth = this.ctx.measureText(text).width;
        //noinspection JSSuspiciousNameCombination
        let naiveHeight = this.ctx.measureText("0").width * 2.5;
        let scale = Math.min(Math.min(boundingWidth / naiveWidth, boundingHeight / naiveHeight), 1);

        if (afterMeasureBeforeDraw !== undefined) {
            afterMeasureBeforeDraw(naiveWidth * scale, naiveHeight * scale);
        }
        this.ctx.save();
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = textBaseline;
        this.ctx.font = font; // Re-set the font, because the 'afterMeasureBeforeDraw' callback may have changed it.
        this.ctx.fillStyle = fillStyle;
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        if (alsoStroke) {
            this.ctx.strokeText(text, 0, 0);
        }
        this.ctx.fillText(text, 0, 0);
        this.ctx.restore();
    }

    /**
     * Draws some text within the given rectangular area, aligned based on the given proportional center, with
     * line breaking and (if line breaking isn't enough) font size reduction to make things fit.
     *
     * @param {!string} text
     * @param {!Rect} area
     * @param {!Point} proportionalCenterOfAlignment
     * @param {!string} fontColor
     * @param {!int} maxFontSize
     * @param {!string} fontFamily
     * @returns {!Rect} A minimal bounding rectangle containing the pixels affected by the text printing.
     */
    printParagraph(text,
                   area,
                   proportionalCenterOfAlignment = new Point(0, 0),
                   fontColor = Config.DEFAULT_TEXT_COLOR,
                   maxFontSize = Config.DEFAULT_FONT_SIZE,
                   fontFamily = Config.DEFAULT_FONT_FAMILY) {

        let fontSize;
        let ascendingHeightOf = metric => {
            let d = metric.fontBoundingBoxAscent;
            return d === undefined ? fontSize * 0.75 : d;
        };
        let descendingHeightOf = metric => {
            let d = metric.fontBoundingBoxDescent;
            return d === undefined ? fontSize * 0.25 : d;
        };
        let heightOf = metric => ascendingHeightOf(metric) + descendingHeightOf(metric);

        let lines;
        let measures;
        let height;
        let forcedLines = seq(text.split("\n"));
        for (let df = 0; ; df++) { // Note: potential for quadratic behavior.
            fontSize = maxFontSize - df;
            this.ctx.font = fontSize + "px " + fontFamily;
            lines = forcedLines.
                flatMap(line => Util.breakLine(line, area.w, s => this.ctx.measureText(s).width)).
                toArray();
            measures = lines.map(e => this.ctx.measureText(e));
            height = seq(measures.map(heightOf)).sum();
            if (height <= area.h || fontSize <= 4) {
                break;
            }
        }

        let f = (offset, full, used, proportion) => offset + (full - used) * proportion;
        let fx = w => f(area.x, area.w, w, proportionalCenterOfAlignment.x);
        let fy = h => f(area.y, area.h, h, proportionalCenterOfAlignment.y);
        let y = fy(height);

        this.ctx.fillStyle = fontColor;

        let dy = 0;
        for (let i = 0; i < lines.length; i++) {
            dy += ascendingHeightOf(measures[i]);
            this.ctx.fillText(lines[i], fx(measures[i].width), y + dy);
            dy += descendingHeightOf(measures[i]);
        }

        let maxWidth = new Seq(measures).map(e => e.width).max(0);
        return new Rect(fx(maxWidth), y, maxWidth, height);
    }

    /**
     * Draws a single line of text, without line breaks, using font size reduction to make things fit.
     *
     * @param {!string} text
     * @param {!Rect} area
     * @param {!number|undefined=} proportionalCenterOfHorizontalAlignment
     * @param {!string|undefined=} fontColor
     * @param {!int|undefined=} maxFontSize
     * @param {!string|undefined=} fontFamily
     * @param {!number|undefined=} proportionalCenterOfVerticalAlignment
     * @returns {!Rect} A minimal bounding rectangle containing the pixels affected by the text printing.
     */
    printLine(text,
              area,
              proportionalCenterOfHorizontalAlignment = 0,
              fontColor = Config.DEFAULT_TEXT_COLOR,
              maxFontSize = Config.DEFAULT_FONT_SIZE,
              fontFamily = Config.DEFAULT_FONT_FAMILY,
              proportionalCenterOfVerticalAlignment = undefined) {

        let fontSize;
        let ascendingHeightOf = metric => {
            let d = metric.fontBoundingBoxAscent;
            return d === undefined ? fontSize * 0.75 : d;
        };
        let descendingHeightOf = metric => {
            let d = metric.fontBoundingBoxDescent;
            return d === undefined ? fontSize * 0.25 : d;
        };
        let heightOf = metric => ascendingHeightOf(metric) + descendingHeightOf(metric);

        let measure;
        for (let df = 0; ; df++) { // Note: potential for quadratic behavior.
            fontSize = maxFontSize - df;
            this.ctx.font = fontSize + "px " + fontFamily;
            measure = this.ctx.measureText(text);
            if ((measure.width <= area.w && heightOf(measure) <= area.h) || fontSize <= 4) {
                break;
            }
        }

        let h = heightOf(measure);
        let py = proportionalCenterOfVerticalAlignment === undefined ?
            ascendingHeightOf(measure) / h :
            proportionalCenterOfVerticalAlignment;
        let f = (offset, full, used, proportion) => offset + (full - used) * proportion;
        let x = f(area.x, area.w, measure.width, proportionalCenterOfHorizontalAlignment);
        let y = f(area.y, area.h, h, py);

        this.ctx.fillStyle = fontColor;
        this.ctx.fillText(text, x, y + ascendingHeightOf(measure));

        return new Rect(x, y, measure.width, h);
    }

    /**
     * Draws the outside of a polygon.
     * @param {!(!Point[])} vertices
     * @param {!string=} strokeColor The stroke color.
     * @param {!number=} strokeThickness The stroke thickness.
     */
    strokePolygon(vertices,
                  strokeColor = Config.DEFAULT_STROKE_COLOR,
                  strokeThickness = Config.DEFAULT_STROKE_THICKNESS) {
        if (vertices.length === 0) {
            return;
        }
        let last = vertices[vertices.length - 1];

        this.ctx.beginPath();
        this.ctx.moveTo(last.x, last.y);
        for (let p of vertices) {
            this.ctx.lineTo(p.x, p.y);
        }

        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeThickness;
        this.ctx.stroke();
    }

    /**
     * Draws a path.
     * @param {!(!Point[])} vertices
     * @param {!string=} strokeColor The stroke color.
     * @param {!number=} strokeThickness The stroke thickness.
     */
    strokePath(vertices,
                  strokeColor = Config.DEFAULT_STROKE_COLOR,
                  strokeThickness = Config.DEFAULT_STROKE_THICKNESS) {
        if (vertices.length === 0) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let p of vertices.slice(1)) {
            this.ctx.lineTo(p.x, p.y);
        }

        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeThickness;
        this.ctx.stroke();
    }

    /**
     * Draws the inside of a polygon.
     * @param {!(!Point[])} vertices
     * @param {!string} fillColor
     */
    fillPolygon(vertices, fillColor) {
        let last = vertices[vertices.length - 1];

        this.ctx.beginPath();
        this.ctx.moveTo(last.x, last.y);
        for (let p of vertices) {
            this.ctx.lineTo(p.x, p.y);
        }

        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
    }
}

/**
 * Has various helper methods for tracing shapes and paths in a CanvasRenderingContext2D.
 */
class Tracer {
    /**
     * @param {!CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        /** @type {!CanvasRenderingContext2D} */
        this.ctx = ctx;
    }

    /**
     * @param {!number} x1
     * @param {!number} y1
     * @param {!number} x2
     * @param {!number} y2
     */
    line(x1, y1, x2, y2) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
    }

    /**
     * @param {!number} x
     * @param {!number} y
     * @param {!number} w
     * @param {!number} h
     */
    rect(x, y, w, h) {
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + w, y);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x, y);
    }

    /**
     * @param {!number} x The x-coordinate of the center of the circle.
     * @param {!number} y The y-coordinate of the center of the circle.
     * @param {!number} radius The distance from the center of the circle to its side.
     */
    circle(x, y, radius) {
        this.ctx.moveTo(x + radius, y);
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    }

    /**
     * @param {!number} x The x-coordinate of the center of the ellipse.
     * @param {!number} y The y-coordinate of the center of the ellipse.
     * @param {!number} horizontal_radius The horizontal distance from the center of the ellipse to its side.
     * @param {!number} vertical_radius The vertical distance from the center of the ellipse to its side.
     */
    ellipse(x, y, horizontal_radius, vertical_radius) {
        this.ctx.save();

        this.ctx.translate(x - horizontal_radius, y - vertical_radius);
        this.ctx.scale(horizontal_radius, vertical_radius);
        this.ctx.moveTo(2, 1);
        this.ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);

        this.ctx.restore();
    }

    /**
     * @param {!number} x
     * @param {!number} y
     * @param {!number} w
     * @param {!number} h
     * @param {!int} numCols
     * @param {!int} numRows
     */
    grid(x, y, w, h, numCols, numRows) {
        let dw = w / numCols;
        let dh = h / numRows;
        let x2 = x + numCols * dw;
        let y2 = y + numRows * dh;
        for (let c = 0; c <= numCols; c++) {
            this.ctx.moveTo(x + c * dw, y);
            this.ctx.lineTo(x + c * dw, y2);
        }
        for (let r = 0; r <= numRows; r++) {
            this.ctx.moveTo(x, y + r * dh);
            this.ctx.lineTo(x2, y + r * dh);
        }
    }

    /**
     * @param {!Array.<!number>|!Float32Array} interleavedCoordinates
     */
    polygon(interleavedCoordinates) {
        if (interleavedCoordinates.length === 0) {
            return;
        }

        let n = interleavedCoordinates.length;
        this.ctx.moveTo(interleavedCoordinates[n-2], interleavedCoordinates[n-1]);
        for (let i = 0; i < n; i += 2) {
            this.ctx.lineTo(interleavedCoordinates[i], interleavedCoordinates[i+1]);
        }
    }

    /**
     * @param {!number} x The x-position of the center of the arrow head.
     * @param {number} y The y-position of the center of the arrow head.
     * @param {number} radius The radius of the circle the arrow head is inscribed inside.
     * @param {number} facingAngle The direction the arrow head is pointing towards.
     * @param {number} sweptAngle The angle swept out by the back of the arrow head, relative to its center (not the
     * point at the front).
     */
    arrowHead(x, y, radius, facingAngle, sweptAngle) {
        let a1 = facingAngle + sweptAngle/2 + Math.PI;
        let a2 = facingAngle - sweptAngle/2 + Math.PI;
        this.polygon([
            x + Math.cos(facingAngle)*radius, y + Math.sin(facingAngle)*radius,
            x + Math.cos(a1)*radius, y + Math.sin(a1)*radius,
            x + Math.cos(a2)*radius, y + Math.sin(a2)*radius
        ]);
    }

}

/**
 * Strokes/fills a traced path.
 */
class TraceAction {
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * @param {!string} fillStyle
     * @returns {!TraceAction}
     */
    thenFill(fillStyle) {
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        return this;
    }

    /**
     * @param {!string} strokeStyle
     * @param {!number=} lineWidth
     * @returns {!TraceAction}
     */
    thenStroke(strokeStyle, lineWidth = 1) {
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
        return this;
    }
}

export {Painter}
