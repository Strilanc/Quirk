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
import Seq from "src/base/Seq.js"
import ToolboxWidget from "src/widgets/ToolboxWidget.js"
import Util from "src/base/Util.js"

export default class InspectorWidget {
    /**
     * @param {!Rect} drawArea
     * @param {!DisplayedCircuit} circuitWidget
     * @param {!ToolboxWidget} toolboxWidget
     * @param {!Hand} hand
     */
    constructor(drawArea, circuitWidget, toolboxWidget, hand) {
        /** @type {!DisplayedCircuit} */
        this.circuitWidget = circuitWidget;
        /** @type {!ToolboxWidget} */
        this.toolboxWidget = toolboxWidget;
        /** @type {!Hand} */
        this.hand = hand;
        /** @type {!Rect} */
        this.drawArea = new Rect(0, 0, 0, 0);

        this.updateArea(drawArea);
    }

    desiredWidth() {
        return Math.max(this.toolboxWidget.desiredWidth(), this.circuitWidget.desiredWidth());
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.drawArea = drawArea;

        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;
        this.toolboxWidget.updateArea(drawArea.takeTop(toolboxHeight));
    }

    /**
     * @param {!int} numWires
     * @param {!Rect} drawArea
     * @returns {!InspectorWidget}
     */
    static empty(numWires, drawArea) {
        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;

        return new InspectorWidget(
            drawArea,
            new DisplayedCircuit(
                toolboxHeight,
                new CircuitDefinition(numWires, [])),
            new ToolboxWidget(drawArea.takeTop(toolboxHeight)),
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
        this.circuitWidget.paint(painter, this.hand, stats, shift);
        this.paintHand(painter, stats);
        this._drawHint(painter);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @private
     */
    paintHand(painter, stats) {
        if (this.hand.pos === undefined || this.hand.heldGate === undefined) {
            return;
        }

        let gate = this.hand.heldGate;
        let pos = this.hand.pos.minus(this.hand.holdOffset);
        let rect = new Rect(
            pos.x,
            pos.y,
            Config.GATE_RADIUS*2 + Config.WIRE_SPACING*(gate.width-1),
            Config.GATE_RADIUS*2 + Config.WIRE_SPACING*(gate.height-1));
        let drawer = gate.customDrawer || GatePainting.DEFAULT_DRAWER;
        drawer(new GateDrawParams(painter, false, true, true, false, rect, gate, stats, null, []));
    }

    /**
     * @param {!boolean} duplicate
     * @returns {!InspectorWidget}
     */
    afterGrabbing(duplicate=false) {
        let hand = this.hand;
        let circuit = this.circuitWidget;

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
            this.circuitWidget.isEqualTo(other.circuitWidget) &&
            this.toolboxWidget.isEqualTo(other.toolboxWidget) &&
            this.hand.isEqualTo(other.hand);
    }

    /**
     * @param {!DisplayedCircuit} circuitWidget
     * @returns {!InspectorWidget}
     */
    withCircuitWidget(circuitWidget) {
        if (circuitWidget === this.circuitWidget) {
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
        return this.withCircuitWidget(this.circuitWidget.withJustEnoughWires(hand, extraWires));
    }

    /**
    * @returns {!InspectorWidget}
    */
    afterTidyingUp() {
        return this.withCircuitWidget(this.circuitWidget.afterTidyingUp());
    }

    previewDrop() {
        if (!this.hand.isBusy()) {
            return this;
        }

        let hand = this.hand;
        let circuitWidget = this.circuitWidget;
        let previewCircuit = circuitWidget.previewDrop(hand);
        let previewHand = previewCircuit === circuitWidget ? hand : hand.withDrop();
        return this.withHand(previewHand).withCircuitWidget(previewCircuit);
    }

    /**
     * @returns {!InspectorWidget}
     */
    afterDropping() {
        return this.
            withCircuitWidget(this.circuitWidget.afterDropping(this.hand)).
            withHand(this.hand.withDrop());
    }

    needsContinuousRedraw() {
        return this.toolboxWidget.needsContinuousRedraw(this.hand) ||
            this.hand.needsContinuousRedraw() ||
            this.circuitWidget.needsContinuousRedraw();
    }

    /**
     * @param {!Hand} hand
     * @returns {!InspectorWidget}
     */
    withHand(hand) {
        return new InspectorWidget(
            this.drawArea,
            this.circuitWidget,
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
            this.circuitWidget.withCircuit(newCircuitDefinition),
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
        return Math.max(Config.MINIMUM_CANVAS_HEIGHT, toolboxHeight + circuitHeight);
    }

    /**
     * @param {!Painter} painter
     * @private
     */
    _drawHint(painter) {
        if (this.circuitWidget.circuitDefinition.columns.length !== 0) {
            return;
        }
        painter.ctx.save();
        painter.ctx.globalAlpha = this.hand.pos === undefined || !this.hand.isBusy() ?
            1.0 :
            Math.min(1, Math.max(0, (150-this.hand.pos.y)/50));
        painter.ctx.save();
        painter.ctx.translate(50, 190);
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
        painter.ctx.moveTo(260, 50);
        painter.ctx.bezierCurveTo(
            250, 85,
            190, 165,
            145, 183);
        painter.ctx.moveTo(210, 245);
        painter.ctx.bezierCurveTo(
            275, 245,
            315, 215,
            330, 200);
        painter.ctx.strokeStyle = 'red';
        painter.ctx.lineWidth = 3;
        painter.ctx.stroke();

        painter.trace(tracer => {
            tracer.arrowHead(143, 185, 10, Math.PI*0.82, 1.3);
            tracer.arrowHead(330, 200, 10, Math.PI*-0.23, 1.3);
        }).thenFill('red');

        painter.ctx.restore();
    }
}
