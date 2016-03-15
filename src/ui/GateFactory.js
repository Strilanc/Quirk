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
export default class GateFactory {
}

GateFactory.MAKE_HIGHLIGHTED_DRAWER = (toolboxFillColor = Config.GATE_FILL_COLOR) => args => {
    let backColor = args.isInToolbox ? toolboxFillColor : Config.GATE_FILL_COLOR;
    if (!args.isInToolbox && !args.gate.matrixAt(args.stats.time).isApproximatelyUnitary(0.001)) {
        backColor = Config.NON_UNITARY_GATE_FILL_COLOR;
    }
    if (args.isHighlighted) {
        backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
    }
    args.painter.fillRect(args.rect, backColor);
    args.painter.strokeRect(args.rect);
    let fontSize = 16;
    args.painter.printLine(
        args.gate.symbol,
        args.rect.paddedBy(-2).takeTopProportion(0.85),
        0.5,
        Config.DEFAULT_TEXT_COLOR,
        fontSize);
};

/**
 * @param {!GateDrawParams} args
 */
GateFactory.DEFAULT_DRAWER = GateFactory.MAKE_HIGHLIGHTED_DRAWER();

/**
 * @param {!GateDrawParams} args
 */
GateFactory.POWER_DRAWER = args => {
    let parts = args.gate.symbol.split("^");
    if (parts.length != 2) {
        GateFactory.DEFAULT_DRAWER(args);
        return;
    }

    let backColor = Config.GATE_FILL_COLOR;
    if (!args.isInToolbox && !args.gate.matrixAt(args.stats.time).isApproximatelyUnitary(0.001)) {
        backColor = Config.NON_UNITARY_GATE_FILL_COLOR;
    }
    if (args.isHighlighted) {
        backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
    }
    args.painter.fillRect(args.rect, backColor);
    args.painter.strokeRect(args.rect);
    let fontSize = 16;
    args.painter.printLine(
        parts[0],
        args.rect.paddedBy(-2).takeBottomProportion(0.6).takeLeftProportion(0.4),
        0.8,
        Config.DEFAULT_TEXT_COLOR,
        fontSize);
    args.painter.printLine(
        parts[1],
        args.rect.paddedBy(-2).takeTopProportion(0.6).takeRightProportion(0.8),
        0.3,
        Config.DEFAULT_TEXT_COLOR,
        fontSize);
};

GateFactory.SQUARE_WAVE_DRAWER_MAKER = offset => args => {
    GateFactory.POWER_DRAWER(args);

    if (args.isInToolbox && !args.isHighlighted) {
        return;
    }

    let t = (args.stats.time + offset) % 1;
    let yOff = args.rect.takeTopProportion(0.2).center().y;
    let yOn = args.rect.takeBottomProportion(0.2).center().y;
    let yNeutral = yOn;
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
    args.painter.ctx.globalAlpha = 0.3;
    args.painter.fillPolygon(curve, 'yellow');
    for (let i = 1; i < curve.length - 2; i++) {
        args.painter.strokeLine(curve[i], curve[i+1], 'black');
    }
    if (off) {
        args.painter.fillRect(args.rect, 'white');
        args.painter.fillRect(args.rect, 'white');
        args.painter.fillRect(args.rect, 'white');
    }
    args.painter.ctx.globalAlpha = 1.0;
};

/**
 * @param {!GateDrawParams} args
 */
GateFactory.MATRIX_DRAWER = args => {
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

GateFactory.POST_SELECT_DRAWER = args => {
    if (args.isInToolbox  || args.isHighlighted) {
        GateFactory.DEFAULT_DRAWER(args);
        return;
    }

    args.painter.fillRect(args.rect, Config.BACKGROUND_COLOR_CIRCUIT);
    args.painter.printParagraph(args.gate.symbol, args.rect, new Point(0.5, 0.5), Config.DEFAULT_TEXT_COLOR, 16);
    args.painter.printParagraph("post-", args.rect, new Point(0.5, 0), 'red', 10);
    args.painter.printParagraph("select", args.rect, new Point(0.5, 1), 'red', 10);
};

/**
 * @param {!GateDrawParams} args
 */
GateFactory.CYCLE_DRAWER = args => {
    if (args.isInToolbox && !args.isHighlighted) {
        GateFactory.POWER_DRAWER(args);
        return;
    }
    let t = args.stats.time * 2 * Math.PI;
    let c = args.rect.center();
    let r = 0.4 * args.rect.w;

    GateFactory.POWER_DRAWER(args);

    args.painter.ctx.beginPath();
    args.painter.ctx.moveTo(c.x, c.y);
    args.painter.ctx.lineTo(c.x + r, c.y);
    args.painter.ctx.arc(c.x, c.y, r, 0, -t, true);
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
 */
GateFactory.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX = args => {
    if (args.isInToolbox) {
        GateFactory.DEFAULT_DRAWER(args);
        return;
    }
    GateFactory.MATRIX_DRAWER(args);
};
