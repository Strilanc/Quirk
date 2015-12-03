import Util from "src/base/Util.js"
import Gates from "src/ui/Gates.js"
import GateColumn from "src/circuit/GateColumn.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import Rect from "src/math/Rect.js"
import Point from "src/math/Point.js"
import Seq from "src/base/Seq.js"
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
        return new Rect(c.x - Config.TOOLBOX_GATE_SPAN, c.y - 5, Config.TOOLBOX_GATE_SPAN*2, 10);
    }

    /**
     *
     * @param {!Point} p
     *
     * @returns {?{groupIndex: !int, gateIndex: !int, gate: !Gate}}
     */
    findGateAt(p) {
        for (let groupIndex = 0; groupIndex < Gates.Sets.length; groupIndex++) {
            let group = Gates.Sets[groupIndex];
            for (let gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
                let gate = group.gates[gateIndex];
                if (gate !== null && this.gateDrawRect(groupIndex, gateIndex).containsPoint(p)) {
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
     * @param {!(!Point[])} focusPoints
     */
    paint(painter, stats, focusPoints) {
        painter.fillRect(this.area, Config.BACKGROUND_COLOR_TOOLBOX);

        for (let groupIndex = 0; groupIndex < Gates.Sets.length; groupIndex++) {
            let group = Gates.Sets[groupIndex];
            painter.printLine(group.hint, this.groupLabelRect(groupIndex), 0.5);

            for (let gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
                let gate = group.gates[gateIndex];
                if (gate !== null) {
                    let r = this.gateDrawRect(groupIndex, gateIndex);
                    let isHighlighted = new Seq(focusPoints).any(pt => r.containsPoint(pt));
                    gate.drawer(new GateDrawParams(painter, true, isHighlighted, r, Util.notNull(gate), stats, null));
                }
            }
        }

        for (let pt of focusPoints) {
            let f = this.findGateAt(pt);
            if (f === null) {
                continue;
            }

            let gateRect = this.gateDrawRect(f.groupIndex, f.gateIndex);
            let hintRect = new Rect(gateRect.center().x - 200, gateRect.bottom() + 2, 600, 300).
                snapInside(painter.paintableArea().skipTop(gateRect.bottom()));
            painter.defer(() => WidgetPainter.paintGateTooltip(painter, hintRect, f.gate, stats.time));
        }
    }

    /**
     * @param {!Hand} hand
     * @returns {!Hand} newHand
     */
    tryGrab(hand) {
        if (hand.pos === null || hand.isBusy()) {
            return hand;
        }

        let f = this.findGateAt(Util.notNull(hand.pos));
        if (f === null) {
            return hand;
        }

        if (f.gate.symbol === Gates.Named.Silly.FUZZ_SYMBOL) {
            Gates.Sets[f.groupIndex].gates[f.gateIndex] = Gates.Named.Silly.FUZZ_MAKER();
        }
        return hand.withHeldGates(new GateColumn([f.gate]));
    }

    /**
    * @param {!Hand} hand
    * @returns {!boolean}
    */
    needsContinuousRedraw(hand) {
        return new Seq(hand.hoverPoints()).
            map(p => this.findGateAt(p)).
            any(f => f !== null && f.gate !== null && f.gate.isTimeBased());
    }
}

export default ToolboxWidget;
