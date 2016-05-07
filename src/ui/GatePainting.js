import Config from "src/Config.js"
import Gate from "src/circuit/Gate.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Util from "src/base/Util.js"

/**
 * A described and possibly time-varying quantum operation.
 */
export default class GatePainting {
}

/**
 * @param {!string=} toolboxFillColor
 * @param {!string=} normalFillColor
 * @constructor
 */
GatePainting.MAKE_HIGHLIGHTED_DRAWER =
    (toolboxFillColor = Config.GATE_FILL_COLOR, normalFillColor = Config.GATE_FILL_COLOR) => args => {
        let backColor = args.isInToolbox ? toolboxFillColor : normalFillColor;
        if (args.isHighlighted) {
            backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
        }
        args.painter.fillRect(args.rect, backColor);
        args.painter.strokeRect(args.rect);
        GatePainting.paintResizeTab(args);
        paintGateSymbol(args);
    };

/**
 * @param {!GateDrawParams} args
 */
GatePainting.DEFAULT_DRAWER = GatePainting.MAKE_HIGHLIGHTED_DRAWER();

/**
 * @param {!Rect} gateRect
 * @returns {!Rect}
 */
GatePainting.rectForResizeTab = gateRect =>
    new Rect(gateRect.x, gateRect.bottom()-Config.GATE_RADIUS, gateRect.w, Config.GATE_RADIUS*2);

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
    args.painter.ctx.globalAlpha = args.isResizeHighlighted ? 1 : 0.7;
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
 */
const paintGateSymbol = args => {
    let painter = args.painter;
    let symbol = args.gate.symbol;
    let rect = args.rect;
    const font = '16px Helvetica';
    rect = rect.paddedBy(-2);

    let note = args.gate.gateFamily.length > 1 && args.isInToolbox ? "↕" : undefined;
    let noteIndex = symbol.indexOf('\n');
    if (noteIndex !== -1) {
        note = symbol.substring(noteIndex + 1);
        symbol = symbol.substring(0, noteIndex);
    }
    if (note !== undefined && (args.isInToolbox || args.isHighlighted)) {
        painter.print(
            note,
            rect.x + rect.w,
            rect.y + rect.h,
            'right',
            'bottom',
            'black' ,
            '12px Helvetica',
            rect.w,
            rect.h);
    }

    let parts = symbol.split("^");
    if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
        painter.print(
            symbol,
            rect.x + rect.w/2,
            rect.y + rect.h/2,
            'center',
            'middle',
            'black',
            font,
            rect.w,
            rect.h);
        return;
    }

    let [baseText, expText] = parts;
    painter.ctx.font = font;
    let baseWidth = painter.ctx.measureText(baseText).width;
    let expWidth = painter.ctx.measureText(expText).width;
    let scaleDown = Math.min(rect.w, baseWidth + expWidth) / (baseWidth + expWidth);
    let divider = rect.w/2 + (baseWidth - expWidth)*scaleDown/2;
    painter.print(
        baseText,
        rect.x + divider,
        rect.y + rect.h/2,
        'right',
        'hanging',
        'black',
        font,
        divider,
        rect.h);
    painter.print(
        expText,
        rect.x + divider,
        rect.y + rect.h/2,
        'left',
        'alphabetic',
        'black',
        font,
        rect.w - divider,
        rect.h);
};

GatePainting.SQUARE_WAVE_DRAWER_MAKER = offset => args => {
    GatePainting.DEFAULT_DRAWER(args);

    if (args.isInToolbox && !args.isHighlighted) {
        return;
    }

    let t = (args.stats.time + offset) % 1;
    let yOn = args.rect.takeTopProportion(0.2).center().y;
    let yNeutral = args.rect.bottom();
    let yOff = args.rect.takeBottomProportion(0.2).center().y;
    let xi = args.rect.x;
    let xf = args.rect.right();
    let xt = p => Math.min(Math.max(xi + (xf - xi)*p, xi), xf);
    let x1 = xt(0.5 - t);
    let x2 = xt(1 - t);
    let x3 = xt(1.5 - t);
    let off = t < 0.5;
    let curve = [
        new Point(xi, yNeutral),
        new Point(xi, yOff),
        new Point(x1, yOff),
        new Point(x1, yOn),
        new Point(x2, yOn),
        new Point(x2, yOff),
        new Point(x3, yOff),
        new Point(x3, yOn),
        new Point(xf, yOn),
        new Point(xf, yOff),
        new Point(xf, yNeutral)];
    args.painter.ctx.save();
    args.painter.ctx.globalAlpha *= 0.3;
    args.painter.fillPolygon(curve, 'yellow');
    for (let i = 1; i < curve.length - 2; i++) {
        args.painter.strokeLine(curve[i], curve[i+1], 'black');
    }
    if (off) {
        args.painter.fillRect(args.rect, 'white');
        args.painter.fillRect(args.rect, 'white');
        args.painter.fillRect(args.rect, 'white');
    }
    args.painter.ctx.restore();
};

/**
 * @param {!GateDrawParams} args
 */
GatePainting.MATRIX_DRAWER = args => {
    args.painter.fillRect(args.rect, args.isHighlighted ? Config.HIGHLIGHTED_GATE_FILL_COLOR : Config.GATE_FILL_COLOR);
    MathPainter.paintMatrix(
        args.painter,
        args.gate.matrixAt(args.stats.time),
        args.rect,
        Config.OPERATION_FORE_COLOR,
        'black',
        undefined,
        Config.OPERATION_BACK_COLOR);
    if (args.isHighlighted) {
        args.painter.ctx.globalAlpha = 0.9;
        args.painter.fillRect(args.rect, Config.HIGHLIGHTED_GATE_FILL_COLOR);
        args.painter.ctx.globalAlpha = 1;
    }
};

GatePainting.POST_SELECT_DRAWER = args => {
    if (args.isInToolbox  || args.isHighlighted) {
        GatePainting.DEFAULT_DRAWER(args);
        return;
    }

    args.painter.fillRect(args.rect, Config.BACKGROUND_COLOR_CIRCUIT);
    args.painter.printParagraph(args.gate.symbol, args.rect, new Point(0.5, 0.5), Config.DEFAULT_TEXT_COLOR, 16);
    args.painter.printParagraph("post-", args.rect, new Point(0.5, 0), 'red', 10);
    args.painter.printParagraph("select", args.rect, new Point(0.5, 1), 'red', 10);
};

/**
 * @param {!number} factor
 * @returns {!function(!GateDrawParams) : *}
 */
GatePainting.makeCycleDrawer = factor => args => {
    GatePainting.DEFAULT_DRAWER(args);

    if (args.isInToolbox && !args.isHighlighted) {
        return;
    }
    let τ = 2 * Math.PI;
    let t = Util.properMod(-args.stats.time * τ * factor, τ);
    let c = args.rect.center();
    let r = 0.4 * args.rect.w;

    args.painter.ctx.beginPath();
    args.painter.ctx.moveTo(c.x, c.y);
    args.painter.ctx.lineTo(c.x, c.y + r);
    args.painter.ctx.arc(c.x, c.y, r, τ/4, τ/4 + t, factor > 0);
    args.painter.ctx.lineTo(c.x, c.y);
    args.painter.ctx.closePath();

    args.painter.ctx.strokeStyle = 'black';
    args.painter.ctx.fillStyle = 'yellow';
    args.painter.ctx.globalAlpha = 0.3;
    args.painter.ctx.stroke();
    args.painter.ctx.fill();
    args.painter.ctx.globalAlpha = 1.0;
};

/**
 * @param {!GateDrawParams} args
 * @returns {void}
 */
GatePainting.MATHWISE_CYCLE_DRAWER = GatePainting.makeCycleDrawer(+1);

/**
 * @param {!GateDrawParams} args
 * @returns {void}
 */
GatePainting.CLOCKWISE_CYCLE_DRAWER = GatePainting.makeCycleDrawer(-1);

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
