import Util from "src/base/Util.js"
import Gates from "src/ui/Gates.js"
import GateColumn from "src/circuit/GateColumn.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import GatePainting from "src/ui/GatePainting.js"
import Rect from "src/math/Rect.js"
import Point from "src/math/Point.js"
import {seq, Seq} from "src/base/Seq.js"
import Config from "src/Config.js"
import Painter from "src/ui/Painter.js"
import WidgetPainter from "src/ui/WidgetPainter.js"

class ToolboxWidget {
    /**
     * That thing showing gates you can grab.
     * @param {!Rect} area
     * @property {!Rect} area
     */
    constructor(area) {
        this.area = area;
    }

    /**
     * @param {!int} groupIndex
     * @param {!int} gateIndex
     * @returns {!Rect}
     * @private
     */
    gateDrawRect(groupIndex, gateIndex) {
        let dx = Math.floor(gateIndex / 3);
        let dy = gateIndex % 3;

        let x = this.area.x + Config.TOOLBOX_MARGIN_X +
            dx * Config.TOOLBOX_GATE_SPAN +
            groupIndex * Config.TOOLBOX_GROUP_SPAN;
        let y = this.area.y + Config.TOOLBOX_MARGIN_Y +
            dy * Config.TOOLBOX_GATE_SPAN;

        return new Rect(
            Math.round(x - 0.5) + 0.5,
            Math.round(y - 0.5) + 0.5,
            Config.GATE_RADIUS * 2,
            Config.GATE_RADIUS * 2);
    }

    /**
     * @param {!int} groupIndex
     * @returns {!Rect}
     * @private
     */
    groupLabelRect(groupIndex) {
        let r = this.gateDrawRect(groupIndex, 0);
        let c = new Point(r.x + Config.TOOLBOX_GATE_SPAN - Config.TOOLBOX_GATE_SPACING / 2, r.y - 10);
        return new Rect(c.x - Config.TOOLBOX_GATE_SPAN, c.y - 5, Config.TOOLBOX_GATE_SPAN*2, 14);
    }

    /**
     *
     * @param {undefined|!Point} pt
     *
     * @returns {?{groupIndex: !int, gateIndex: !int, gate: !Gate}}
     */
    findGateAt(pt) {
        if (pt === undefined) {
            return null;
        }
        for (let groupIndex = 0; groupIndex < Gates.Sets.length; groupIndex++) {
            let group = Gates.Sets[groupIndex];
            for (let gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
                let gate = group.gates[gateIndex];
                if (gate !== null && this.gateDrawRect(groupIndex, gateIndex).containsPoint(Util.notNull(pt))) {
                    return {groupIndex: groupIndex, gateIndex: gateIndex, gate: Util.notNull(gate)};
                }
            }
        }
        return null;
    }

    /**
     * @param {!ToolboxWidget|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof ToolboxWidget && this.area.isEqualTo(other.area);
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.area = drawArea;
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!Hand} hand
     */
    paint(painter, stats, hand) {
        painter.fillRect(this.area, Config.BACKGROUND_COLOR_TOOLBOX);

        for (let groupIndex = 0; groupIndex < Gates.Sets.length; groupIndex++) {
            let group = Gates.Sets[groupIndex];
            painter.printLine(group.hint, this.groupLabelRect(groupIndex), 0.5, 'black', 16);

            for (let gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
                let gate = group.gates[gateIndex];
                if (gate !== null) {
                    let r = this.gateDrawRect(groupIndex, gateIndex);
                    let isHighlighted = seq(hand.hoverPoints()).any(pt => r.containsPoint(pt));
                    let drawer = gate.customDrawer || GatePainting.DEFAULT_DRAWER;
                    drawer(new GateDrawParams(
                        painter,
                        true,
                        isHighlighted,
                        false,
                        false,
                        r,
                        Util.notNull(gate),
                        stats,
                        null,
                        []));
                }
            }
        }

        // Draw tooltip when hovering, but also when dragging a gate over its own toolbox spot.
        let f = this.findGateAt(hand.pos);
        if (f !== null && (hand.heldGate === undefined || f.gate.symbol === hand.heldGate.symbol)) {
            let gateRect = this.gateDrawRect(f.groupIndex, f.gateIndex);
            let hintRect = new Rect(gateRect.right() + 1, gateRect.center().y, 500, 200).
                snapInside(painter.paintableArea().skipTop(gateRect.y));
            painter.defer(() => WidgetPainter.paintGateTooltip(painter, hintRect, f.gate, stats.time));
            painter.setDesiredCursor('pointer');
        }

        let r = new Rect(0, 0, Config.TOOLBOX_MARGIN_X, this.area.h);
        let {x, y} = r.center();
        painter.ctx.save();
        painter.ctx.translate(x, y);
        painter.ctx.rotate(-Math.PI/2);
        painter.printLine("Toolbox", new Rect(-r.h / 2, -r.w / 2, r.h, r.w), 0.5, 'black', 24);
        painter.ctx.restore();
    }

    desiredWidth() {
        return this.gateDrawRect(Gates.Sets.length - 1, 5).right() + 5;
    }

    /**
     * @param {!Hand} hand
     * @returns {!Hand} newHand
     */
    tryGrab(hand) {
        if (hand.pos === undefined || hand.isBusy()) {
            return hand;
        }

        let f = this.findGateAt(hand.pos);
        if (f === null) {
            return hand;
        }

        if (f.gate.symbol === Gates.Misc.MysteryGateSymbol) {
            Gates.Sets[f.groupIndex].gates[f.gateIndex] = Gates.Misc.MysteryGateMaker();
        }
        return hand.withHeldGate(f.gate, new Point(Config.GATE_RADIUS, Config.GATE_RADIUS));
    }

    /**
    * @param {!Hand} hand
    * @returns {Infinity|!number}
    */
    stableDuration(hand) {
        return seq(hand.hoverPoints()).
            map(p => this.findGateAt(p)).
            filter(e => e !== null).
            map(e => e.gate.stableDuration()).
            min(Infinity);
    }
}

export default ToolboxWidget;
