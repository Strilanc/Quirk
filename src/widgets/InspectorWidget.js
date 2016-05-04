import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import CircuitWidget from "src/widgets/CircuitWidget.js"
import Config from "src/Config.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import GateFactory from "src/ui/GateFactory.js"
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
     * @param {!CircuitWidget} circuitWidget
     * @param {!ToolboxWidget} toolboxWidget
     * @param {!Hand} hand
     */
    constructor(drawArea, circuitWidget, toolboxWidget, hand) {
        /** @type {!CircuitWidget} */
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
        this.circuitWidget.updateArea(drawArea.skipTop(toolboxHeight).
            takeTop(CircuitWidget.desiredHeight(this.circuitWidget.circuitDefinition.numWires)));
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
            new CircuitWidget(
                drawArea.skipTop(toolboxHeight).takeTop(250),
                new CircuitDefinition(numWires, [])),
            new ToolboxWidget(drawArea.takeTop(toolboxHeight)),
            Hand.EMPTY);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     */
    paint(painter, stats) {
        painter.fillRect(this.drawArea, Config.BACKGROUND_COLOR);

        this.toolboxWidget.paint(painter, stats, this.hand);
        this.circuitWidget.paint(painter, this.hand, stats);
        this.paintHand(painter, stats);
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
        let pos = this.hand.pos.minus(this.hand.heldGateOffset);
        let rect = new Rect(
            pos.x,
            pos.y,
            Config.GATE_RADIUS*2 + Config.WIRE_SPACING*(gate.width-1),
            Config.GATE_RADIUS*2 + Config.WIRE_SPACING*(gate.height-1));
        let drawer = gate.customDrawer || GateFactory.DEFAULT_DRAWER;
        drawer(new GateDrawParams(painter, false, true, rect, gate, stats, null, []));
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
     * @param {!CircuitWidget} circuitWidget
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
        if (this.hand.heldGate === undefined) {
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

    static defaultHeight(wireCount = undefined) {
        if (wireCount === undefined) {
            wireCount = Config.MIN_WIRE_COUNT;
        }
        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;
        let circuitHeight = CircuitWidget.desiredHeight(wireCount);
        return Math.max(Config.MINIMUM_CANVAS_HEIGHT, toolboxHeight + circuitHeight);
    }
}
