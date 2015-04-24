import describe from "src/base/Describe.js"
import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import CircuitWidget from "src/widgets/CircuitWidget.js"
import CircuitDefinition from "src/ui/CircuitDefinition.js"
import ToolboxWidget from "src/widgets/ToolboxWidget.js"
import Config from "src/Config.js"
import Rect from "src/base/Rect.js"
import Painter from "src/ui/Painter.js"
import Hand from "src/ui/Hand.js"

export default class InspectorWidget {
    /**
     * @param {!Rect} drawArea
     * @param {!CircuitWidget} circuitWidget
     * @param {!ToolboxWidget} toolboxWidget
     * @param {!Hand} hand
     *
     * @property {!Rect} drawArea
     * @property {!CircuitWidget} circuitWidget
     * @property {!ToolboxWidget} toolboxWidget
     * @property {!Hand} hand
     * @property {!Rect} outputStateHintArea
     * @property {!Rect} focusedOperationHintArea
     * @property {!Rect} focusedStateHintArea
     * @property {!Rect} cumulativeFocusedOperationHintArea
     * @property {!Rect} cumulativeOperationHintArea
     */
    constructor(drawArea, circuitWidget, toolboxWidget, hand) {
        this.circuitWidget = circuitWidget;
        this.toolboxWidget = toolboxWidget;
        this.hand = hand;
        this.updateArea(drawArea);
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.drawArea = drawArea;

        let remainder = drawArea.skipTop(this.circuitWidget.area.bottom());
        this.outputStateHintArea = remainder.takeRight(remainder.h);
        this.cumulativeOperationHintArea = this.outputStateHintArea.
            withX(this.outputStateHintArea.x - this.outputStateHintArea.w - 5);
        this.focusedOperationHintArea = remainder.takeLeft(remainder.h);
        this.focusedStateHintArea = this.focusedOperationHintArea.withX(this.focusedOperationHintArea.right() + 5);
        this.cumulativeFocusedOperationHintArea = this.focusedStateHintArea.withX(this.focusedStateHintArea.right() + 5);

        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;
        this.toolboxWidget.updateArea(drawArea.takeTop(toolboxHeight));
        this.circuitWidget.updateArea(drawArea.skipTop(toolboxHeight).takeTop(250));
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

    ///**
    // * @param {!number} time
    // * @param {!Painter} painter
    // * @private
    // */
    //paintOutput(painter, time) {
    //    // Wire probabilities
    //    this.circuit.drawRightHandPeekGates(painter, time);
    //
    //    //let factors = this.circuit.getOutput().contiguousFactorization();
    //    //for (let i = 0; i < factors.length; i++) {
    //    //    painter.paintQuantumStateAsGrid(factors[i], this.focusedStateHintArea.leftHalf().topHalf().withX(i * this.focusedOperationHintArea.w*0.6));
    //    //}
    //
    //    // State amplitudes
    //    painter.paintQuantumStateAsLabelledGrid(
    //        this.circuit.getOutput(time),
    //        this.outputStateHintArea,
    //        this.circuit.getLabels());
    //
    //    painter.paintMatrix(
    //        this.circuit.getCumulativeOperationUpToBefore(this.circuit.columns.length, time),
    //        this.cumulativeOperationHintArea,
    //        this.hand);
    //
    //    //let _ = 0;
    //    //let X = 0;
    //    //painter.paintDisalloweds(
    //    //    Matrix.square([
    //    //        // 1  0  1  0  1  0  1  0  1  0  1  0  1  0  1
    //    //        // 0  1  1  0  0  1  1  0  0  1  1  0  0  1  1
    //    //        // 0  0  0  1  1  1  1  0  0  0  0  1  1  1  1
    //    //        // 0  0  0  0  0  0  0  1  1  1  1  1  1  1  1
    //    //        1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
    //    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _,
    //    //        X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1,
    //    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _,
    //    //        X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1,
    //    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _,
    //    //        X, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1,
    //    //        _, 1, 1, _, 1, _, _, _, 1, _, _, _, _, _, _, _,
    //    //        _, _, _, 1, _, 1, 1, _, _, 1, 1, _, 1, _, _, _,
    //    //        _, _, _, _, _, _, _, 1, _, _, _, 1, _, 1, 1, _
    //    //    ]),
    //    //    this.cumulativeOperationHintArea);
    //}

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
     * @param {!number} time
     * @params {!Hand} hand
     */
    paint(painter, time) {
        // Clear
        painter.fillRect(this.drawArea, Config.BACKGROUND_COLOR);

        //this.paintFocus(painter, time);
        this.circuitWidget.paint(painter, this.hand, time);
        //this.paintOutput(painter, time);
        this.toolboxWidget.paint(painter, time, this.hand.hoverPoints());
        this.paintHand(painter, time);
    }

    /**
     * @param {!Painter} painter
     * @param {!number} time
     * @private
     */
    paintHand(painter, time) {
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
            gates[k].paint(painter, r, false, true, time, null);
        }
    }

    ///**
    // *
    // * @param {!Painter} painter
    // * @param {!function(!number)} progressCallback
    // * @param {!function(!string)} urlCallback
    // */
    //captureCycle(painter, progressCallback, urlCallback) {
    //    //noinspection JSUnresolvedFunction
    //    let gif = new GIF({
    //        workers: 2,
    //        quality: 10
    //    });
    //    for (let t = 0.001; t < 1; t += 0.02) {
    //        this.paint(painter, t);
    //        gif.addFrame(painter.canvas, {copy: true, delay: 50});
    //        if (!this.needsContinuousRedraw()) {
    //            break;
    //        }
    //    }
    //    gif.on('progress', progressCallback);
    //    gif.on('finished', function (blob) {
    //        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    //        urlCallback(URL.createObjectURL(blob));
    //    });
    //    gif.render();
    //}

    /**
    * @returns {!InspectorWidget}
    */
    afterGrabbing() {
        let hand = this.hand;
        let circuit = this.circuitWidget;

        hand = this.toolboxWidget.tryGrab(hand);
        //let x = circuit.tryGrab(hand);
        //hand = x.newHand;
        //circuit = x.newCircuit;

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
        return new InspectorWidget(this.drawArea, circuitWidget, this.toolboxWidget, this.hand);
    }

    /**
    * @returns {!InspectorWidget}
    */
    afterTidyingUp() {
        return this.withCircuitWidget(this.circuitWidget.afterTidyingUp());
    }

    /**
     * @returns {!InspectorWidget}
     */
    afterDropping() {
        if (this.hand.heldGates === null) {
            return this;
        }

        let hand = this.hand;
        let circuitWidget = this.circuitWidget;
        return this.withHand(this.hand.withDrop());
        let modPt = circuitWidget.findModificationIndex(hand);
        //if (modPt !== null && hand.heldGateBlock === null && modPt.col >= circuit.columns.length) {
        //    modPt = null;
        //}
        //if (modPt === null) {
        //    return this;
        //}
        //
        //circuit = circuit.withOpBeingAdded(modPt, hand);
        //hand = hand.withDrop();
        //
        //return new Inspector(
        //    this.drawArea,
        //    circuit,
        //    this.toolbox,
        //    hand);
    }

    needsContinuousRedraw() {
        //noinspection JSUnresolvedFunction
        return this.toolboxWidget.needsContinuousRedraw(this.hand) ||
            this.hand.heldGates !== null && new Seq(this.hand.heldGates.gates).any(g => g.isTimeBased());
        //return this.previewDrop().circuit.hasTimeBasedGates() ||
        //    this.toolbox.needsContinuousRedrawAt(this.hand);
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

    //exportCircuit() {
    //    return {
    //        wires: this.circuit.numWires,
    //        cols: this.circuit.columns.map(arg1(GateColumn.prototype.toJson))
    //    };
    //}

    ///**
    // * @param {!object} json
    // * @returns {!Inspector}
    // */
    //withImportedCircuit(json) {
    //    let wireCount = forceGetProperty(json, "wires");
    //    if (!isInt(wireCount) || wireCount < 1 || wireCount > Config.MAX_WIRE_COUNT) {
    //        throw new Error("wires must be an int between 1 and " + Config.MAX_WIRE_COUNT);
    //    }
    //
    //    let columns = forceGetProperty(json, "cols");
    //    if (!Array.isArray(columns)) {
    //        throw new Error("cols must be an array.");
    //    }
    //
    //    let gateCols = columns.map(GateColumn.fromJson).map(function (e) {
    //        if (e.gates.length < wireCount) {
    //            return new GateColumn(e.gates.paddedWithTo(null, wireCount));
    //        }
    //        if (e.gates.length > wireCount) {
    //            return new GateColumn(e.gates.slice(0, wireCount));
    //        }
    //        return e;
    //    });
    //
    //    return new Inspector(
    //        this.drawArea,
    //        new Circuit(
    //            this.circuit.area,
    //            wireCount,
    //            gateCols,
    //            null,
    //            this.circuit.wireLabeller),
    //        this.toolbox,
    //        Hand.EMPTY);
    //}
}
