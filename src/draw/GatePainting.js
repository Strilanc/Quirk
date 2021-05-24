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
import {GateDrawParams} from "./GateDrawParams.js"
import {MathPainter} from "./MathPainter.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {Util} from "../base/Util.js"

/**
 * A described and possibly time-varying quantum operation.
 */
class GatePainting {}

const GATE_SYMBOL_FONT = '16px sans-serif';

GatePainting.paintOutline = args => {
    if (args.isInToolbox) {
        let r = args.rect.shiftedBy(0.5, 0.5);
        args.painter.strokeLine(r.topRight(), r.bottomRight());
        args.painter.strokeLine(r.bottomLeft(), r.bottomRight());
    }
    args.painter.strokeRect(args.rect, 'black');
};

GatePainting.paintBackground =
    (args, toolboxFillColor = Config.GATE_FILL_COLOR, normalFillColor = Config.GATE_FILL_COLOR) => {
        let backColor = args.isInToolbox ? toolboxFillColor : normalFillColor;
        if (args.isHighlighted) {
            backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
        }
        args.painter.fillRect(args.rect, backColor);
    };

/**
 * @param {!GateDrawParams} args
 */
GatePainting.LABEL_DRAWER = args => {
    if (args.positionInCircuit === undefined || args.isHighlighted) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    let cut = Math.max(0, args.rect.h - Config.GATE_RADIUS*2)/2;
    args.painter.fillRect(args.rect.skipTop(cut).skipBottom(cut), Config.GATE_FILL_COLOR);

    GatePainting.paintGateSymbol(args);
};

/**
 * @param {!string=} toolboxFillColor
 * @param {!string=} normalFillColor
 * @constructor
 */
GatePainting.MAKE_HIGHLIGHTED_DRAWER =
    (toolboxFillColor = Config.GATE_FILL_COLOR, normalFillColor = Config.GATE_FILL_COLOR) => args => {
        GatePainting.paintBackground(args, toolboxFillColor, normalFillColor);
        GatePainting.paintOutline(args);
        GatePainting.paintResizeTab(args);
        GatePainting.paintGateSymbol(args);
    };

/**
 * @param {!GateDrawParams} args
 */
GatePainting.DEFAULT_DRAWER = GatePainting.MAKE_HIGHLIGHTED_DRAWER();

/**
 * @param {!Rect} gateRect
 * @returns {!Rect}
 */
GatePainting.rectForResizeTab = gateRect => {
    let overlap = Math.min(Config.GATE_RADIUS, gateRect.h/4);
    return new Rect(gateRect.x, gateRect.bottom() - overlap, gateRect.w, Config.GATE_RADIUS * 2);
};

/**
 * @param {!GateDrawParams} args
 */
GatePainting.paintResizeTab = args => {
    if (!args.isResizeShowing || !args.gate.canChangeInSize()) {
        return;
    }

    let d = Config.GATE_RADIUS;
    let rect = GatePainting.rectForResizeTab(args.rect);
    let trimRect = rect.skipLeft(2).skipRight(2);
    let {x: cx, y: cy} = trimRect.center();
    let backColor = args.isResizeHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : Config.GATE_FILL_COLOR;
    let foreColor = args.isResizeHighlighted ? '#222' : 'gray';
    args.painter.ctx.save();
    args.painter.ctx.globalAlpha *= args.isResizeHighlighted ? 1 : 0.7;
    args.painter.fillRect(trimRect, backColor);
    args.painter.strokeRect(trimRect, 'gray');
    args.painter.ctx.restore();
    args.painter.print('resize', cx, cy, 'center', 'middle', foreColor, 'monospace', trimRect.w - 4, trimRect.h - 4);
    args.painter.trace(tracer => {
        let arrowDirs = [
            args.gate.canIncreaseInSize() ? +1 : -1,
            args.gate.canDecreaseInSize() ? -1 : +1
        ];
        let arrowOffsets = [+1, -1];
        for (let sx of [-1, +1]) {
            for (let k = 0; k < 2; k++) {
                let by = cy + d*arrowOffsets[k]*5/8;
                let y1 = by + d*arrowDirs[k]/8;
                let y2 = by - d*arrowDirs[k]/8;
                tracer.line(cx, y1, cx + d*sx*0.3, y2);
            }
        }
    }).thenStroke(foreColor);
};

/**
 * @param {!GateDrawParams} args
 * @param {undefined|!string=undefined} symbolOverride
 * @param {!boolean=} allowExponent
 */
GatePainting.paintGateSymbol = (args, symbolOverride=undefined, allowExponent=true) => {
    let painter = args.painter;
    let rect = args.rect.paddedBy(-2);
    if (symbolOverride === undefined) {
        symbolOverride = args.gate.symbol;
    }
    let {symbol, offsetY} = _paintSymbolHandleLines(args.painter, symbolOverride, rect);
    painter.ctx.font = GATE_SYMBOL_FONT;  // So that measure-text calls return the right stuff.

    let splitIndex = allowExponent ? symbol.indexOf('^') : -1;
    let parts = splitIndex === -1 ? [symbol] : [symbol.substr(0, splitIndex), symbol.substr(splitIndex + 1)];
    if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
        painter.print(
            symbol,
            rect.x + rect.w/2,
            rect.y + rect.h/2 + offsetY,
            'center',
            'middle',
            'black',
            GATE_SYMBOL_FONT,
            rect.w,
            rect.h);
        return;
    }

    let [baseText, expText] = parts;
    let lines = baseText.split('\n');
    baseText = lines[0];

    let baseWidth = painter.ctx.measureText(baseText).width;
    let expWidth = painter.ctx.measureText(expText).width;
    let scaleDown = Math.min(rect.w, baseWidth + expWidth) / (baseWidth + expWidth);
    let divider = rect.w/2 + (baseWidth - expWidth)*scaleDown/2;
    painter.print(
        baseText,
        rect.x + divider,
        rect.y + rect.h/2 + offsetY,
        'right',
        'hanging',
        'black',
        GATE_SYMBOL_FONT,
        divider,
        rect.h);
    painter.print(
        expText,
        rect.x + divider,
        rect.y + rect.h/2 + offsetY,
        'left',
        'alphabetic',
        'black',
        GATE_SYMBOL_FONT,
        rect.w - divider,
        rect.h);
};

/**
 * @param {!Painter} painter
 * @param {!string} symbol
 * @param {!Rect} rect
 * @returns {!{symbol: !string, offsetY: !int}} The symbol without any extra lines.
 * @private
 */
function _paintSymbolHandleLines(painter, symbol, rect) {
    let lines = symbol.split('\n');

    for (let i = 1; i < lines.length; i++) {
        painter.print(
            lines[i],
            rect.x + rect.w/2,
            rect.y + rect.h/2 + 9*i,
            'center',
            'hanging',
            'black',
            GATE_SYMBOL_FONT,
            rect.w,
            16);
    }

    return {symbol: lines[0], offsetY: lines.length > 1 ? -5 : 0};
}

/**
 * @param {!GateDrawParams} args
 * @param {!Tracer} tracer
 */
GatePainting.traceLocationIndependentOutline = (args, tracer) => {
    let [x1, x2, y1, y2] = [args.rect.x, args.rect.right(), args.rect.y, args.rect.bottom()];
    let diameter = Math.min(args.rect.h, args.rect.w, Config.GATE_RADIUS*2);
    let clip = diameter / (2 + Math.sqrt(2));
    tracer.polygon([
        x1, y1 + clip,
        x1 + clip, y1,

        x2 - clip, y1,
        x2, y1 + clip,

        x2, y2 - clip,
        x2 - clip, y2,

        x1 + clip, y2,
        x1, y2 - clip
    ]);
};

/**
 * @param {!GateDrawParams} args
 * @param {!string} normalFillColor
 * @param {!string} toolboxFillColor
 */
GatePainting.paintLocationIndependentFrame = (args,
                                              normalFillColor = Config.GATE_FILL_COLOR,
                                              toolboxFillColor = Config.GATE_FILL_COLOR) => {
    if (args.isInToolbox) {
        GatePainting.paintBackground(args, toolboxFillColor, normalFillColor);
        GatePainting.paintOutline(args);
        return;
    }

    let backColor = args.isHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : normalFillColor;
    args.painter.trace(tracer => GatePainting.traceLocationIndependentOutline(args, tracer)).
    thenFill(backColor).
    thenStroke('black');
};

/**
 * @param {!string} normalFillColor
 * @returns {!function(!GateDrawParams)}
 */
GatePainting.makeLocationIndependentGateDrawer = normalFillColor => args => {
    GatePainting.paintLocationIndependentFrame(args, normalFillColor);
    GatePainting.paintGateSymbol(args);
};

/**
 * @param {!GateDrawParams} args
 */
GatePainting.LOCATION_INDEPENDENT_GATE_DRAWER = GatePainting.makeLocationIndependentGateDrawer(Config.GATE_FILL_COLOR);

/**
 * @param {!Array.<!string>} labels
 * @param {!Array.<!number>} dividers
 * @returns {!function(!GateDrawParams)}
 */
GatePainting.SECTIONED_DRAWER_MAKER = (labels, dividers) => args => {
    if (args.isInToolbox) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    let backColor = args.isHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : Config.GATE_FILL_COLOR;
    const font = '16px sans-serif';
    args.painter.fillRect(args.rect, backColor);
    let p = 0;
    for (let i = 0; i < labels.length; i++) {
        let p2;
        if (i < labels.length - 1) {
            p2 = p + dividers[i];
            let cy = args.rect.y + args.rect.h*p2;
            args.painter.strokeLine(new Point(args.rect.x, cy), new Point(args.rect.right(), cy), '#BBB');
        } else {
            p2 = 1;
        }
        args.painter.print(
            labels[i],
            args.rect.x + args.rect.w/2,
            args.rect.y + args.rect.h*(p + p2)/2,
            'center',
            'middle',
            'black',
            font,
            args.rect.w-2,
            args.rect.h*(p2-p));
        p = p2;
    }
    args.painter.strokeRect(args.rect);
    GatePainting.paintResizeTab(args);
};

const DISPLAY_GATE_DEFAULT_DRAWER = GatePainting.MAKE_HIGHLIGHTED_DRAWER(Config.DISPLAY_GATE_IN_TOOLBOX_FILL_COLOR);

GatePainting.makeDisplayDrawer = statePainter => args => {
    if (args.positionInCircuit === undefined) {
        DISPLAY_GATE_DEFAULT_DRAWER(args);
        return;
    }

    GatePainting.paintResizeTab(args);

    statePainter(args);

    if (args.isHighlighted) {
        args.painter.strokeRect(args.rect, 'black', 1.5);
    }

    args.painter.ctx.save();
    args.painter.ctx.globalAlpha *= 0.25;
    GatePainting.paintResizeTab(args);
    args.painter.ctx.restore();
};

/**
 * @param {!GateDrawParams} args
 */
GatePainting.MATRIX_DRAWER = args => {
    let m = args.gate.knownMatrixAt(args.stats.time);
    if (m === undefined) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    args.painter.fillRect(args.rect, args.isHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : Config.GATE_FILL_COLOR);
    MathPainter.paintMatrix(
        args.painter,
        m,
        args.rect,
        Config.OPERATION_FORE_COLOR,
        'black',
        undefined,
        Config.OPERATION_BACK_COLOR,
        undefined,
        'transparent');
    if (args.isHighlighted) {
        args.painter.ctx.save();
        args.painter.ctx.globalAlpha *= 0.9;
        args.painter.fillRect(args.rect, Config.HIGHLIGHTED_GATE_FILL_COLOR);
        args.painter.ctx.restore();
    }
    GatePainting.paintOutline(args);
};

/**
 * @param {!number=} xScale
 * @param {!number=} yScale
 * @param {!number=} tScale
 * @param {!number=} zeroAngle
 * @returns {!function(!GateDrawParams) : *}
 */
GatePainting.makeCycleDrawer = (xScale=1, yScale=1, tScale=1, zeroAngle=0) => args => {
    GatePainting.MAKE_HIGHLIGHTED_DRAWER(Config.TIME_DEPENDENT_HIGHLIGHT_COLOR)(args);

    if (args.isInToolbox && !args.isHighlighted) {
        return;
    }
    GatePainting.paintCycleState(args, args.stats.time * 2 * Math.PI * tScale, xScale, yScale, zeroAngle);
};

/**
 * @param {!GateDrawParams} args
 * @param {!number} angle
 * @param {!number} xScale
 * @param {!number} yScale
 * @param {!number} zeroAngle
 */
GatePainting.paintCycleState = (args, angle, xScale=1, yScale=1, zeroAngle=0) => {
    let t = Util.properMod(-angle, 2 * Math.PI);
    let c = args.rect.center();
    let r = 16;

    args.painter.ctx.save();

    args.painter.ctx.translate(c.x, c.y);
    args.painter.ctx.scale(-xScale, -yScale);
    args.painter.ctx.rotate(zeroAngle);
    args.painter.ctx.strokeStyle = 'black';
    args.painter.ctx.fillStyle = 'yellow';
    args.painter.ctx.globalAlpha *= 0.4;

    args.painter.ctx.beginPath();
    args.painter.ctx.moveTo(0, 0);
    args.painter.ctx.lineTo(0, r);
    args.painter.ctx.arc(0, 0, r, Math.PI/2, Math.PI/2 + t, true);
    args.painter.ctx.lineTo(0, 0);
    args.painter.ctx.closePath();
    args.painter.ctx.stroke();
    args.painter.ctx.fill();

    args.painter.ctx.restore();
};

/**
 * @param {!GateDrawParams} args
 */
GatePainting.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX = args => {
    if (args.isInToolbox) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }
    GatePainting.MATRIX_DRAWER(args);
};

/**
 * @param {!GateDrawParams} args
 * @param {!int} offset
 * @returns {!number}
 */
function _wireY(args, offset) {
    return args.rect.center().y + (offset - args.gate.height/2 + 0.5) * Config.WIRE_SPACING;
}

/**
 * @param {!Rect} wholeRect
 * @returns {!Rect}
 */
GatePainting.gateButtonRect = wholeRect => {
    if (wholeRect.h > 50) {
        return wholeRect.bottomHalf().skipTop(6).paddedBy(-7);
    }
    return wholeRect.bottomHalf().paddedBy(+2);
};

/**
 * @param {!GateDrawParams} args
 */
GatePainting.paintGateButton = args => {
    if (!args.isHighlighted || args.isInToolbox || args.hand.isHoldingSomething()) {
        return;
    }

    let buttonRect = GatePainting.gateButtonRect(args.rect);
    let buttonFocus = !args.focusPoints.every(pt => !buttonRect.containsPoint(pt));
    args.painter.fillRect(buttonRect, buttonFocus ? 'red' : 'orange');
    args.painter.print(
        'change',
        buttonRect.center().x,
        buttonRect.center().y,
        'center',
        'middle',
        'black',
        '12px sans-serif',
        buttonRect.w,
        buttonRect.h);
    args.painter.strokeRect(buttonRect, 'black');
};


/**
 * @param {!GateDrawParams} args
 */
function _eraseWiresForPermutation(args) {
    for (let i = 0; i < args.gate.height; i++) {
        let y = _wireY(args, i);
        let p = new Point(args.rect.x, y);
        let c = new Point(args.rect.x + Config.GATE_RADIUS, y);
        let q = new Point(args.rect.right(), y);
        let loc = new Point(args.positionInCircuit.col, args.positionInCircuit.row + i);
        let isMeasured1 = args.stats.circuitDefinition.locIsMeasured(loc);
        let isMeasured2 = args.stats.circuitDefinition.locIsMeasured(loc.offsetBy(1, 0));

        for (let dy of isMeasured1 ? [-1, +1] : [0]) {
            args.painter.strokeLine(p.offsetBy(0, dy), c.offsetBy(1, dy), 'white');
        }
        for (let dy of isMeasured2 ? [-1, +1] : [0]) {
            args.painter.strokeLine(c.offsetBy(-1, dy), q.offsetBy(0, dy), 'white');
        }
    }
}

/**
 * Draws the gate as a re-arrangement of wires.
 * @param {!GateDrawParams} args
 */
GatePainting.PERMUTATION_DRAWER = args => {
    if (args.positionInCircuit === undefined) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    if (args.isHighlighted ||
            args.isResizeHighlighted ||
            args.stats.circuitDefinition.colHasControls(args.positionInCircuit.col)) {
        GatePainting.paintBackground(args, '#F3F3F3', '#F3F3F3');
        GatePainting.paintOutline(args);
        GatePainting.paintResizeTab(args);
    } else {
        _eraseWiresForPermutation(args);
    }

    // Draw wires.
    let x1 = args.rect.x;
    let x2 = args.rect.right();
    args.painter.ctx.strokeStyle = 'black';
    for (let i = 0; i < args.gate.height; i++) {
        let j = args.gate.knownBitPermutationFunc(i);

        let pt = new Point(args.positionInCircuit.col, args.positionInCircuit.row + i);
        let isMeasured = args.stats.circuitDefinition.locIsMeasured(pt);
        let y1 = _wireY(args, i);
        let y2 = _wireY(args, j);
        args.painter.ctx.beginPath();
        for (let [dx, dy] of isMeasured ? [[j > i ? +1 : -1, -1], [0, +1]] : [[0, 0]]) {
            args.painter.ctx.moveTo(Math.min(x1, x1 + dx), y1 + dy);
            args.painter.ctx.lineTo(x1 + dx, y1 + dy);
            args.painter.ctx.lineTo(x2 + dx, y2 + dy);
            args.painter.ctx.lineTo(Math.max(x2, x2 + dx), y2 + dy);
        }
        args.painter.ctx.stroke();
    }
};

export {GatePainting}
