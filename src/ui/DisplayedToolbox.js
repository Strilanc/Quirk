import Util from "src/base/Util.js"
import Gates from "src/gates/AllGates.js"
import GateColumn from "src/circuit/GateColumn.js"
import GateDrawParams from "src/draw/GateDrawParams.js"
import GatePainting from "src/draw/GatePainting.js"
import Rect from "src/math/Rect.js"
import Point from "src/math/Point.js"
import {seq, Seq} from "src/base/Seq.js"
import Config from "src/Config.js"
import Painter from "src/draw/Painter.js"
import WidgetPainter from "src/draw/WidgetPainter.js"
import {MysteryGateSymbol, MysteryGateMaker} from "src/gates/Joke_MysteryGate.js"

class DisplayedToolbox {
    /**
     * That thing showing gates you can grab.
     * @param {!string} name
     * @param {!Rect} area
     * @param {!Array<!{hint: !string, gates: !Array<undefined|!Gate>}>} toolboxGroups
     * @param {!boolean} labelsOnTop
     * @param {undefined|!Array<!{hint: !string, gates: !Array<undefined|!Gate>}>=} originalGroups
     */
    constructor(name, area, toolboxGroups, labelsOnTop, originalGroups=undefined) {
        /** @type {!String} */
        this.name = name;
        /** @type {!Rect} */
        this.area = area;
        /** @type {!Array<!{hint: !string, gates: !Array<undefined|!Gate>}>} */
        this.toolboxGroups = toolboxGroups;
        /** @type {!boolean} */
        this.labelsOnTop = labelsOnTop;
        /** @type {!Array<!{hint: !string, gates: !Array<undefined|!Gate>}>} */
        this._originalGroups = originalGroups || this.toolboxGroups;
    }

    /**
     * @param {!CustomGateSet} customGateSet
     */
    withCustomGatesInserted(customGateSet) {
        let groups = [...this._originalGroups];
        for (let i = 0; i < Math.max(1, customGateSet.gates.length); i += 6) {
            let group = {
                hint: 'Custom Gates',
                gates: [undefined, undefined, undefined, undefined, undefined, undefined]
            };
            for (let j = 0; j < 6 && i + j < customGateSet.gates.length; j++) {
                group.gates[j] = customGateSet.gates[i + j];
            }
            groups.push(group);
        }
        return new DisplayedToolbox(this.name, this.area, groups, this.labelsOnTop, this._originalGroups);
    }

    /**
     * @param {!int} groupIndex
     * @param {!int} gateIndex
     * @returns {!Rect}
     * @private
     */
    gateDrawRect(groupIndex, gateIndex) {
        let dx = gateIndex % 2;
        let dy = Math.floor(gateIndex / 2);

        let x = this.area.x + Config.TOOLBOX_MARGIN_X +
            dx * Config.TOOLBOX_GATE_SPAN +
            groupIndex * Config.TOOLBOX_GROUP_SPAN;
        let y = this.area.y +
            (this.labelsOnTop ? Config.TOOLBOX_MARGIN_Y : 3) +
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
        if (this.labelsOnTop) {
            let r = this.gateDrawRect(groupIndex, 0);
            let c = new Point(r.x + Config.TOOLBOX_GATE_SPAN - Config.TOOLBOX_GATE_SPACING / 2, r.y - 18);
            return new Rect(c.x - Config.TOOLBOX_GATE_SPAN, c.y, Config.TOOLBOX_GATE_SPAN * 2, 20);
        }

        let r = this.gateDrawRect(groupIndex, 4);
        let c = new Point(r.x + Config.TOOLBOX_GATE_SPAN - Config.TOOLBOX_GATE_SPACING / 2, r.bottom());
        return new Rect(c.x - Config.TOOLBOX_GATE_SPAN, c.y+2, Config.TOOLBOX_GATE_SPAN * 2, 20);
    }

    /**
     *
     * @param {undefined|!Point} pt
     *
     * @returns {undefined|!{groupIndex: !int, gateIndex: !int, gate: !Gate}}
     */
    findGateAt(pt) {
        if (pt === undefined) {
            return undefined;
        }
        for (let groupIndex = 0; groupIndex < this.toolboxGroups.length; groupIndex++) {
            let group = this.toolboxGroups[groupIndex];
            for (let gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
                let gate = group.gates[gateIndex];
                if (gate !== undefined && this.gateDrawRect(groupIndex, gateIndex).containsPoint(pt)) {
                    return {groupIndex: groupIndex, gateIndex: gateIndex, gate: gate};
                }
            }
        }
        return undefined;
    }

    /**
     * @param {!DisplayedToolbox|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof DisplayedToolbox &&
            this.name === other.name &&
            this.area.isEqualTo(other.area) &&
            this.toolboxGroups === other.toolboxGroups &&
            this.labelsOnTop === other.labelsOnTop;
    }

    /**
     * @param {!Rect} drawArea
     * @returns {!DisplayedToolbox}
     */
    withArea(drawArea) {
        return new DisplayedToolbox(this.name, drawArea, this.toolboxGroups, this.labelsOnTop, this._originalGroups);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!Hand} hand
     */
    paint(painter, stats, hand) {
        painter.fillRect(this.area, Config.BACKGROUND_COLOR_TOOLBOX);

        for (let groupIndex = 0; groupIndex < this.toolboxGroups.length; groupIndex++) {
            this._paintGroup(painter, groupIndex, stats, hand);
        }

        let r = new Rect(this.area.x, this.area.y, Config.TOOLBOX_MARGIN_X, this.area.h);
        let {x, y} = r.center();
        painter.ctx.save();
        painter.ctx.translate(x, y);
        painter.ctx.rotate(-Math.PI/2);
        painter.printLine(this.name, new Rect(-r.h / 2, -r.w / 2, r.h, r.w), 0.5, 'black', 24);
        painter.ctx.restore();

        this._paintTooltips(painter, stats, hand);
    }

    /**
     * @param {!Painter} painter
     * @param {!int} groupIndex
     * @param {!CircuitStats} stats
     * @param {!Hand} hand
     * @private
     */
    _paintGroup(painter, groupIndex, stats, hand) {
        let group = this.toolboxGroups[groupIndex];
        let r = this.groupLabelRect(groupIndex);
        painter.print(
            group.hint,
            r.x + r.w/2,
            r.y + r.h/2,
            'center',
            'middle',
            'black',
            '16px sans-serif',
            r.w,
            r.h);

        for (let gateIndex = 0; gateIndex < group.gates.length; gateIndex++) {
            let gate = group.gates[gateIndex];
            if (gate === undefined) {
                continue;
            }
            let rect = this.gateDrawRect(groupIndex, gateIndex);
            let isHighlighted = seq(hand.hoverPoints()).any(pt => rect.containsPoint(pt));
            let drawer = gate.customDrawer || GatePainting.DEFAULT_DRAWER;
            painter.noteTouchBlocker({rect, cursor: 'pointer'});
            drawer(new GateDrawParams(
                painter,
                true,
                isHighlighted,
                false,
                false,
                rect,
                Util.notNull(gate),
                stats,
                undefined,
                [],
                undefined));
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!Hand} hand
     * @private
     */
    _paintTooltips(painter, stats, hand) {
        // Draw tooltip when hovering, but also when dragging a gate over its own toolbox spot.
        let f = this.findGateAt(hand.pos);
        if (f !== undefined && (hand.heldGate === undefined || f.gate.symbol === hand.heldGate.symbol)) {
            let gateRect = this.gateDrawRect(f.groupIndex, f.gateIndex);

            painter.ctx.save();
            painter.ctx.globalAlpha = 0;
            let {maxW, maxH} = WidgetPainter.paintGateTooltip(
                painter, new Rect(0, 0, 500, 300), f.gate, stats.time, true);
            let mayNeedToScale = maxW >= 500 || maxH >= 300;
            painter.ctx.restore();

            let hintRect = new Rect(gateRect.right() + 1, gateRect.center().y, maxW, maxH).
                snapInside(painter.paintableArea().skipRight(10).skipBottom(20));
            painter.defer(() => WidgetPainter.paintGateTooltip(painter, hintRect, f.gate, stats.time, mayNeedToScale));
        }
    }

    /**
     * @returns {!number}
     */
    desiredWidth() {
        return this.gateDrawRect(this.toolboxGroups.length - 1, 5).right() + 5;
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
        if (f === undefined) {
            return hand;
        }

        if (f.gate.symbol === MysteryGateSymbol) {
            setTimeout(() => { this.toolboxGroups[f.groupIndex].gates[f.gateIndex] = MysteryGateMaker(); }, 0.1);
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
            filter(e => e !== undefined).
            map(e => e.gate.stableDuration()).
            min(Infinity);
    }
}

export default DisplayedToolbox;
