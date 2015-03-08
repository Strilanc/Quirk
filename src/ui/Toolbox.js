//import Util from "src/base/Util.js"
//
//class Toolbox {
//    /**
//     * That thing showing gates you can grab.
//     *
//     * @param {!Rect} area
//     *
//     * @property {!Rect} area
//     */
//    constructor(area) {
//        this.area = area;
//    }
//
//    /**
//     * @param {!Toolbox|*} other
//     * @returns {!boolean}
//     */
//    isEqualTo(other) {
//        if (this === other) {
//            return true;
//        }
//        return other instanceof Toolbox &&
//            other.area.isEqualTo(this.area);
//    };
//
//    /**
//     * @param {!int} groupIndex
//     * @param {!int} gateIndex
//     * @returns {!Rect}
//     * @private
//     */
//    groupedGateRect(groupIndex, gateIndex) {
//        var dx = Math.floor(gateIndex / 3);
//        var dy = gateIndex % 3;
//
//        var x = this.area.x + Config.TOOLBOX_MARGIN_X + dx * Config.TOOLBOX_GATE_SPAN + groupIndex * Config.TOOLBOX_GROUP_SPAN;
//        var y = this.area.y + Config.TOOLBOX_MARGIN_Y + dy * Config.TOOLBOX_GATE_SPAN;
//
//        return new Rect(x, y, Config.GATE_RADIUS * 2, Config.GATE_RADIUS * 2);
//    };
//
//    /**
//     * @param {!int} groupIndex
//     * @returns {!Point}
//     * @private
//     */
//    groupLabelCenter(groupIndex) {
//        var r = this.groupedGateRect(groupIndex, 0);
//        return new Point(r.x + Config.TOOLBOX_GATE_SPAN - Config.TOOLBOX_GATE_SPACING / 2, r.y - 10);
//    };
//
//    /**
//     * @param {!Painter} painter
//     * @param {!int} groupIndex
//     * @param {!int} gateIndex
//     * @param {!number} time
//     * @private
//     */
//    paintHint(painter, groupIndex, gateIndex, time) {
//        var gateRect = this.groupedGateRect(groupIndex, gateIndex);
//        var gate = Gate.GATE_SET[groupIndex].gates[gateIndex];
//        var paragraphHeight = (gate.description.split("\n").length + 5) * 16;
//        var hintRect = new Rect(
//            this.area.x + 50,
//            gateRect.bottom() + 10,
//            400,
//            paragraphHeight + 4 * Config.GATE_RADIUS + 25);
//
//        var matFormat = gate.isTimeBased() ? Format.CONSISTENT : Format.SIMPLIFIED;
//        painter.fillRect(hintRect);
//        painter.printText(
//            gate.name +
//            "\n\n" +
//            gate.description +
//            "\n\n" +
//            "Transition Matrix:\n" +
//            "\n" +
//            "\n" +
//            "\n" +
//            "\n" +
//            "\n" +
//            "\n" +
//            gate.matrixAt(time).toString(matFormat), new Point(this.area.x + 55, gateRect.bottom() + 25));
//        painter.paintMatrix(
//            gate.matrixAt(time),
//            new Rect(
//                this.area.x + 55,
//                hintRect.bottom() - 6 * Config.GATE_RADIUS + 10,
//                4 * Config.GATE_RADIUS,
//                4 * Config.GATE_RADIUS));
//        painter.strokeRect(hintRect);
//
//        gate.paint(painter, gateRect, true, true, time, null);
//    };
//
//    /**
//     *
//     * @param {!Point} p
//     *
//     * @returns {?{groupIndex: !int, gateIndex: !int, gate: !Gate}}
//     */
//    findGateAt(p) {
//        for (var groupIndex = 0; groupIndex < Gate.GATE_SET.length; groupIndex++) {
//            var group = Gate.GATE_SET[groupIndex];
//            for (var gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
//                var gate = group.gates[gateIndex];
//                if (gate !== null && this.groupedGateRect(groupIndex, gateIndex).containsPoint(p)) {
//                    return {groupIndex: groupIndex, gateIndex: gateIndex, gate: gate};
//                }
//            }
//        }
//        return null;
//    };
//
//    /**
//     * @param {!Rect} drawArea
//     */
//    updateArea(drawArea) {
//        this.area = drawArea;
//    };
//
//    /**
//     * @param {!Painter} painter
//     * @param {!Hand} hand
//     * @param {!number} time
//     */
//    paint(painter, hand, time) {
//        painter.fillRect(this.area, Config.BACKGROUND_COLOR_TOOLBOX);
//
//        for (var groupIndex = 0; groupIndex < Gate.GATE_SET.length; groupIndex++) {
//            var group = Gate.GATE_SET[groupIndex];
//            painter.printCenteredText(group.hint, this.groupLabelCenter(groupIndex));
//
//            for (var gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
//                var gate = group.gates[gateIndex];
//                if (gate !== null) {
//                    gate.paint(painter, this.groupedGateRect(groupIndex, gateIndex), true, false, time, null);
//                }
//            }
//        }
//
//        if (hand.heldGateBlock === null && hand.pos !== null) {
//            var f = this.findGateAt(Util.notNull(hand.pos));
//            if (f !== null) {
//                this.paintHint(painter, f.groupIndex, f.gateIndex, time);
//            }
//        }
//    };
//
//    /**
//     *
//     * @param {!Hand} hand
//     * @returns {!Hand} newHand
//     */
//    tryGrab(hand) {
//        if (hand.pos === null || hand.heldGateBlock !== null) {
//            return hand;
//        }
//
//        var f = this.findGateAt(Util.notNull(hand.pos));
//        if (f === null) {
//            return hand;
//        }
//
//        var gate = Gate.GATE_SET[f.groupIndex].gates[f.gateIndex];
//        Gate.updateIfFuzzGate(gate);
//        var gateBlock = gate === Gate.SWAP_HALF ? GateBlock.swap(0) : GateBlock.single(gate);
//        return hand.withHeldGate(gateBlock, 0);
//    };
//
//    /**
//     * @param {!Hand} hand
//     * @returns {!boolean}
//     */
//    needsContinuousRedrawAt(hand) {
//        if (hand.pos === null || hand.heldGateBlock !== null) {
//            return false;
//        }
//        var g = this.findGateAt(Util.notNull(hand.pos));
//        return g !== null && g.gate !== null && g.gate.isTimeBased();
//    };
//}
