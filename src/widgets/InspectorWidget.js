import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import CircuitWidget from "src/widgets/CircuitWidget.js"
import Config from "src/Config.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
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
        /** @type {!Rect} */
        this.outputStateHintArea = new Rect(0, 0, 0, 0);

        this.updateArea(drawArea);
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.drawArea = drawArea;

        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;
        this.toolboxWidget.updateArea(drawArea.takeTop(toolboxHeight));
        this.circuitWidget.updateArea(drawArea.skipTop(toolboxHeight).skipBottom(Config.STATE_VIEWING_AREA_HEIGHT));

        let remainder = drawArea.skipTop(this.circuitWidget.area.bottom());
        this.outputStateHintArea = remainder.takeRight(remainder.h);
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
                new CircuitDefinition(numWires, []),
                null),
            new ToolboxWidget(drawArea.takeTop(toolboxHeight)),
            Hand.EMPTY);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @private
     */
    paintOutput(painter, stats) {
        // Wire probabilities
        this.circuitWidget.drawRightHandPeekGates(painter, stats);

       // State amplitudes
        let w = 1 << Math.ceil(this.circuitWidget.circuitDefinition.numWires/2);
        let amps = Matrix.fromRows(new Seq(stats.finalState).partitioned(w).toArray());
        MathPainter.paintMatrix(painter, amps, this.outputStateHintArea, []);
    }

    ///**
    // * @param {!Painter} painter
    // * @param {!number} time
    // * @private
    // */
    //paintFocus(painter, time) {
    //    if (this.hand.pos === null) {
    //        return;
    //    }
    //
    //    let possibleFocusedColumn = this.circuit.findExistingOpColumnAt(notNull(this.hand.pos));
    //    if (possibleFocusedColumn === null) {
    //        return;
    //    }
    //
    //    let c = Util.notNull(possibleFocusedColumn);
    //
    //    // Highlight the column
    //    painter.ctx.globalAlpha = 0.75;
    //    painter.fillRect(this.circuit.opRect(c), "yellow");
    //    painter.ctx.globalAlpha = 1;
    //
    //    painter.paintQuantumStateAsLabelledGrid(
    //        this.circuit.scanStates(time)[c + 1],
    //        this.focusedStateHintArea,
    //        this.circuit.getLabels());
    //
    //    painter.paintMatrix(
    //        this.circuit.columns[c].matrixAt(time),
    //        this.focusedOperationHintArea);
    //
    //    painter.paintMatrix(
    //        this.circuit.getCumulativeOperationUpToBefore(c + 1, time),
    //        this.cumulativeFocusedOperationHintArea);
    //}

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     */
    paint(painter, stats) {
        // Clear
        painter.fillRect(this.drawArea, Config.BACKGROUND_COLOR);

        //this.paintFocus(painter, time);
        this.circuitWidget.paint(painter, this.hand, stats);
        this.paintOutput(painter, stats);
        this.toolboxWidget.paint(painter, stats, this.hand);
        this.paintHand(painter, stats);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @private
     */
    paintHand(painter, stats) {
        let gates = this.hand.heldGates;
        if (this.hand.pos === null || gates === null) {
            return;
        }
        gates = gates.gates;

        let dh = this.circuitWidget.getWireSpacing();
        for (let k = 0; k < gates.length; k++) {
            let p = this.hand.pos.offsetBy(0, dh * (k - gates.length + 1));
            let r = Rect.centeredSquareWithRadius(p, Config.GATE_RADIUS);
            //paint(painter, areaRect, isInToolbox, isHighlighted, time, circuitContext) {
            gates[k].drawer(new GateDrawParams(painter, false, true, r, gates[k], stats, null));
        }
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

    withJustEnoughWires(extra = 0) {
        return this.withCircuitWidget(this.circuitWidget.withJustEnoughWires(extra));
    }

    /**
    * @returns {!InspectorWidget}
    */
    afterTidyingUp() {
        return this.withCircuitWidget(this.circuitWidget.afterTidyingUp());
    }

    previewDrop() {
        if (this.hand.heldGates === null) {
            return this;
        }

        let hand = this.hand;
        let circuitWidget = this.circuitWidget;
        let previewCircuit = circuitWidget.previewDrop(hand);
        let previewHand = previewCircuit == circuitWidget ? hand : hand.withDrop();
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
        //noinspection JSUnresolvedFunction
        return this.toolboxWidget.needsContinuousRedraw(this.hand) ||
            (this.hand.heldGates !== null && new Seq(this.hand.heldGates.gates).any(g => g.isTimeBased()) ||
            this.circuitWidget.needsContinuousRedraw());
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
        let stateHeight = Config.STATE_VIEWING_AREA_HEIGHT;
        let wireHeight = wireCount * 50;
        return toolboxHeight + stateHeight + wireHeight;
    }
}
