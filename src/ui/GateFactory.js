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
    /**
     * @param {!number} fraction
     * @param {!string} symbol
     * @returns {!Gate}
     */
    static fromPhaseRotation(fraction, symbol) {
        let mod = (n, d) => ((n % d) + d) % d;
        let dif_mod = (n, d) => mod(n + d/2, d) - d/2;
        let deg = dif_mod(fraction, 1) * 360;
        let deg_desc = (Math.round(deg*64)/64).toString();
        let name_desc =
            fraction === 1/3 ? "/3"
                : fraction === -1/3 ? "-/3"
                : fraction === 1/8 ? "/8"
                : fraction === -1/8 ? "-/8"
                : fraction === 1/16 ? "/16"
                : fraction === -1/16 ? "-/16"
                : (Math.round(deg*64)/64).toString() + "°";

        return new Gate(
            symbol || `Z(${name_desc})`,
            Matrix.fromPauliRotation(0, 0, fraction),
            `${deg_desc}° Phase Gate`,
            `Rotates the phase of a qubit's ON state by ${deg_desc}° while leaving its OFF state alone.`,
            `The standard Pauli Z gate corresponds to Z(180°).`,
            GateFactory.POWER_DRAWER);
    }

    /**
     * @param {!number} x
     * @param {!number} y
     * @param {!number} z
     * @param {=string} symbol
     * @returns {!Gate}
     */
    static fromPauliRotation(x, y, z, symbol) {
        if (x === 0 && y === 0) {
            return GateFactory.fromPhaseRotation(z, symbol);
        }

        let n = Math.sqrt(x * x + y * y + z * z);
        let deg = n * 360;
        return new Gate(
            symbol || `R(${[x, y, z].map(e => Format.SIMPLIFIED.formatFloat(e)).toString()})`,
            Matrix.fromPauliRotation(x, y, z),
            `${deg}° around <${x/n}, ${y/n}, ${z/n}>`,
            "A custom operation based on a rotation.",
            "",
            symbol === undefined ? GateFactory.MATRIX_DRAWER : GateFactory.POWER_DRAWER);
    }

    /**
     * @param {!Matrix} matrix
     * @returns {!Gate}
     */
    static fromCustom(matrix) {
        return new GateFactory(
            matrix.toString(Format.MINIFIED),
            matrix,
            matrix.toString(Format.SIMPLIFIED),
            "A custom operation.",
            "",
            GateFactory.MATRIX_DRAWER);
    }
}

GateFactory.MAKE_HIGHLIGHTED_DRAWER = (fillColor = Config.GATE_FILL_COLOR) => args => {
    let backColor = fillColor;
    if (!args.isInToolbox && !args.gate.matrixAt(args.stats.time).isApproximatelyUnitary(0.001)) {
        backColor = Config.BROKEN_COLOR_GATE;
    }
    if (args.isHighlighted) {
        backColor = Config.HIGHLIGHT_COLOR_GATE;
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
        backColor = Config.BROKEN_COLOR_GATE;
    }
    if (args.isHighlighted) {
        backColor = Config.HIGHLIGHT_COLOR_GATE;
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

/**
 * @param {!GateDrawParams} args
 */
GateFactory.MATRIX_DRAWER = args => {
    args.painter.fillRect(args.rect, args.isHighlighted ? Config.HIGHLIGHT_COLOR_GATE : Config.GATE_FILL_COLOR);
    MathPainter.paintMatrix(
        args.painter,
        args.gate.matrixAt(args.stats.time),
        args.rect,
        []);
    if (args.isHighlighted) {
        args.painter.ctx.globalAlpha = 0.9;
        args.painter.fillRect(args.rect, Config.HIGHLIGHT_COLOR_GATE);
        args.painter.ctx.globalAlpha = 1;
    }
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
    let d = new Point(
        Math.cos(t) * 0.75 * args.rect.w/2,
        -Math.sin(t) * 0.75 * args.rect.h/2);
    let p = args.rect.center().plus(d);
    GateFactory.POWER_DRAWER(args);
    args.painter.fillCircle(p, 3, "gray");
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
