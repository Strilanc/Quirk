import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import DisplayedCircuit from "src/widgets/DisplayedCircuit.js"
import Config from "src/Config.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import GatePainting from "src/ui/GatePainting.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Hand from "src/ui/Hand.js"
import Painter from "src/ui/Painter.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import ToolboxWidget from "src/widgets/ToolboxWidget.js"
import Util from "src/base/Util.js"

const TOOLBOX_HEIGHT = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;

export default class InspectorWidget {
    /**
     * @param {!Rect} drawArea
     * @param {!DisplayedCircuit} circuitWidget
     * @param {!ToolboxWidget} toolboxWidget
     * @param {!Hand} hand
     */
    constructor(drawArea, circuitWidget, toolboxWidget, hand) {
        /** @type {!DisplayedCircuit} */
        this.displayedCircuit = circuitWidget;
        /** @type {!ToolboxWidget} */
        this.toolboxWidget = toolboxWidget;
        /** @type {!Hand} */
        this.hand = hand;
        /** @type {!Rect} */
        this.drawArea = new Rect(0, 0, 0, 0);

        this.updateArea(drawArea);
    }

    desiredWidth() {
        return Math.max(this.toolboxWidget.desiredWidth(), this.displayedCircuit.desiredWidth());
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.drawArea = drawArea;

        this.toolboxWidget.updateArea(drawArea.takeTop(TOOLBOX_HEIGHT));
    }

    /**
     * @param {!Rect} drawArea
     * @returns {!InspectorWidget}
     */
    static empty(drawArea) {
        return new InspectorWidget(
            drawArea,
            DisplayedCircuit.empty(TOOLBOX_HEIGHT),
            new ToolboxWidget(drawArea.takeTop(TOOLBOX_HEIGHT)),
            Hand.EMPTY);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!boolean} shift
     */
    paint(painter, stats, shift) {
        painter.fillRect(this.drawArea, Config.BACKGROUND_COLOR);

        this.toolboxWidget.paint(painter, stats, this.hand);
        this.displayedCircuit.paint(painter, this.hand, stats, shift);
        this._paintHand(painter, stats);
        this._drawHint(painter);

        // When a gate is being dragged off the bottom, this fades it out instead of clipping it.
        let y1 = this.displayedCircuit.top +
            DisplayedCircuit.desiredHeight(this.displayedCircuit.circuitDefinition.numWires);
        let y2 = this.drawArea.bottom();
        var gradient = painter.ctx.createLinearGradient(0, y1, 0, y2);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, 'white');
        painter.ctx.fillStyle = gradient;
        painter.ctx.fillRect(0, y1, this.drawArea.w, y2-y1);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @private
     */
    _paintHand(painter, stats) {
        if (this.hand.pos === undefined || this.hand.heldGate === undefined) {
            return;
        }

        let gate = this.hand.heldGate;
        let pos = this.hand.pos.minus(this.hand.holdOffset);
        let rect = new Rect(
            Math.round(pos.x - 0.5) + 0.5,
            Math.round(pos.y - 0.5) + 0.5,
            Config.GATE_RADIUS*2 + Config.WIRE_SPACING*(gate.width-1),
            Config.GATE_RADIUS*2 + Config.WIRE_SPACING*(gate.height-1));
        let drawer = gate.customDrawer || GatePainting.DEFAULT_DRAWER;
        drawer(new GateDrawParams(painter, false, true, true, false, rect, gate, stats, undefined, [], undefined));
    }

    /**
     * @param {!boolean} duplicate
     * @returns {!InspectorWidget}
     */
    afterGrabbing(duplicate=false) {
        let hand = this.hand;
        let circuit = this.displayedCircuit;

        hand = this.toolboxWidget.tryGrab(hand);
        let x = circuit.tryGrab(hand, duplicate);
        hand = x.newHand;
        circuit = x.newCircuit;

        return new InspectorWidget(
            this.drawArea,
            circuit,
            this.toolboxWidget,
            hand);
    }

    /**
     * @param {!InspectorWidget|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        //noinspection JSUnresolvedVariable
        return other instanceof InspectorWidget &&
            this.drawArea.isEqualTo(other.drawArea) &&
            this.displayedCircuit.isEqualTo(other.displayedCircuit) &&
            this.toolboxWidget.isEqualTo(other.toolboxWidget) &&
            this.hand.isEqualTo(other.hand);
    }

    /**
     * @param {!DisplayedCircuit} circuitWidget
     * @returns {!InspectorWidget}
     */
    withCircuitWidget(circuitWidget) {
        if (circuitWidget === this.displayedCircuit) {
            return this;
        }
        return new InspectorWidget(this.drawArea, circuitWidget, this.toolboxWidget, this.hand);
    }

    /**
     * @param {!Hand} hand
     * @param {!int} extraWires
     * @returns {!InspectorWidget}
     */
    withJustEnoughWires(hand, extraWires) {
        return this.withCircuitWidget(this.displayedCircuit.withJustEnoughWires(hand, extraWires));
    }

    /**
    * @returns {!InspectorWidget}
    */
    afterTidyingUp() {
        return this.withCircuitWidget(this.displayedCircuit.afterTidyingUp());
    }

    previewDrop() {
        if (!this.hand.isBusy()) {
            return this;
        }

        let hand = this.hand;
        let circuitWidget = this.displayedCircuit;
        let previewCircuit = circuitWidget.previewDrop(hand);
        let previewHand = previewCircuit === circuitWidget ? hand : hand.withDrop();
        return this.withHand(previewHand).withCircuitWidget(previewCircuit);
    }

    /**
     * @returns {!InspectorWidget}
     */
    afterDropping() {
        return this.
            withCircuitWidget(this.displayedCircuit.afterDropping(this.hand)).
            withHand(this.hand.withDrop());
    }

    /**
     * @returns {Infinity|!number}
     */
    stableDuration() {
        return seq([
            this.toolboxWidget.stableDuration(this.hand),
            this.hand.stableDuration(),
            this.displayedCircuit.stableDuration()
        ]).min(Infinity);
    }

    /**
     * @param {!Hand} hand
     * @returns {!InspectorWidget}
     */
    withHand(hand) {
        return new InspectorWidget(
            this.drawArea,
            this.displayedCircuit,
            this.toolboxWidget,
            hand);
    }

    /**
     * @param {!CircuitDefinition} newCircuitDefinition
     * @returns {!InspectorWidget}
     */
    withCircuitDefinition(newCircuitDefinition) {
        return new InspectorWidget(
            this.drawArea,
            DisplayedCircuit.empty(TOOLBOX_HEIGHT).withCircuit(newCircuitDefinition),
            this.toolboxWidget,
            Hand.EMPTY);
    }

    /**
     * @param {undefined|!int=} wireCount
     * @returns {!number}
     */
    static defaultHeight(wireCount = undefined) {
        if (wireCount === undefined) {
            wireCount = Config.MIN_WIRE_COUNT;
        }
        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;
        let circuitHeight = DisplayedCircuit.desiredHeight(wireCount);
        let paddingHeight = 50;
        return Math.max(Config.MINIMUM_CANVAS_HEIGHT, toolboxHeight + circuitHeight + paddingHeight);
    }

    /**
     * @param {!Painter} painter
     * @private
     */
    _drawHint(painter) {
        if (this.displayedCircuit.circuitDefinition.columns.length !== 0) {
            return;
        }
        painter.ctx.save();
        painter.ctx.globalAlpha = this.hand.pos === undefined || !this.hand.isBusy() ?
            1.0 :
            Math.min(1, Math.max(0, (150-this.hand.pos.y)/50));
        painter.ctx.save();
        painter.ctx.translate(70, 190);
        painter.ctx.rotate(Math.PI * 0.05);
        painter.ctx.fillStyle = 'red';
        painter.ctx.font = '12pt Helvetica';
        painter.ctx.fillText("drag gates onto circuit", 0, 0);
        painter.ctx.restore();

        painter.ctx.save();
        painter.ctx.translate(50, 240);
        painter.ctx.rotate(Math.PI * 0.02);
        painter.ctx.fillStyle = 'red';
        painter.ctx.font = '12pt Helvetica';
        painter.ctx.fillText("watch outputs change", 0, 0);
        painter.ctx.restore();

        painter.ctx.beginPath();
        painter.ctx.moveTo(268, 132);
        painter.ctx.bezierCurveTo(
            260, 170,
            235, 175,
            210, 190);
        painter.ctx.moveTo(210, 245);
        painter.ctx.bezierCurveTo(
            275, 245,
            315, 215,
            330, 200);
        painter.ctx.strokeStyle = 'red';
        painter.ctx.lineWidth = 3;
        painter.ctx.stroke();

        painter.trace(tracer => {
            tracer.arrowHead(210, 190, 10, Math.PI*0.84, 1.3);
            tracer.arrowHead(330, 200, 10, Math.PI*-0.23, 1.3);
        }).thenFill('red');

        painter.ctx.restore();
    }
}
