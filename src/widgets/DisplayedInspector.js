import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import Config from "src/Config.js"
import DisplayedCircuit from "src/widgets/DisplayedCircuit.js"
import DisplayedToolbox from "src/widgets/DisplayedToolbox.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import GatePainting from "src/ui/GatePainting.js"
import Gates from "src/gates/AllGates.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Hand from "src/ui/Hand.js"
import Painter from "src/ui/Painter.js"
import Rect from "src/math/Rect.js"
import Serializer from "src/circuit/Serializer.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"

const TOOLBOX_HEIGHT = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;

export default class DisplayedInspector {
    /**
     * @param {!Rect} drawArea
     * @param {!DisplayedCircuit} circuitWidget
     * @param {!DisplayedToolbox} displayedToolboxTop
     * @param {!DisplayedToolbox} displayedToolboxBottom
     * @param {!Hand} hand
     */
    constructor(drawArea, circuitWidget, displayedToolboxTop, displayedToolboxBottom, hand) {
        /** @type {!DisplayedCircuit} */
        this.displayedCircuit = circuitWidget;
        /** @type {!DisplayedToolbox} */
        this.displayedToolboxTop = displayedToolboxTop;
        /** @type {!DisplayedToolbox} */
        this.displayedToolboxBottom = displayedToolboxBottom;
        /** @type {!Hand} */
        this.hand = hand;
        /** @type {!Rect} */
        this.drawArea = new Rect(0, 0, 0, 0);

        this.updateArea(drawArea);
    }

    desiredWidth() {
        return Math.max(
            this.displayedToolboxTop.desiredWidth(),
            Math.max(
                this.displayedCircuit.desiredWidth(),
                this.displayedToolboxBottom.desiredWidth()));
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.drawArea = drawArea;

        this.displayedToolboxTop = this.displayedToolboxTop.withArea(drawArea.takeTop(TOOLBOX_HEIGHT));
        this.displayedToolboxBottom = this.displayedToolboxBottom.withArea(drawArea.takeBottom(TOOLBOX_HEIGHT));
    }

    /**
     * @param {!Rect} drawArea
     * @returns {!DisplayedInspector}
     */
    static empty(drawArea) {
        return new DisplayedInspector(
            drawArea,
            DisplayedCircuit.empty(TOOLBOX_HEIGHT),
            new DisplayedToolbox('Toolbox', drawArea.takeTop(TOOLBOX_HEIGHT), Gates.TopToolboxGroups, true),
            new DisplayedToolbox('Toolbox₂', drawArea.takeBottom(TOOLBOX_HEIGHT), Gates.BottomToolboxGroups, false),
            Hand.EMPTY);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!boolean} shift
     */
    paint(painter, stats, shift) {
        painter.fillRect(this.drawArea, Config.BACKGROUND_COLOR);

        this.displayedToolboxTop.paint(painter, stats, this.hand);
        this.displayedToolboxBottom.paint(painter, stats, this.hand);
        this.displayedCircuit.paint(painter, this.hand, stats);
        this._paintHand(painter, stats);
        this._drawHint(painter);
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
     * @returns {!DisplayedInspector}
     */
    afterGrabbing(duplicate=false) {
        let hand = this.hand;
        let circuit = this.displayedCircuit;

        hand = this.displayedToolboxTop.tryGrab(hand);
        hand = this.displayedToolboxBottom.tryGrab(hand);
        let x = circuit.tryGrab(hand, duplicate);
        hand = x.newHand;
        circuit = x.newCircuit;

        return new DisplayedInspector(
            this.drawArea,
            circuit,
            this.displayedToolboxTop,
            this.displayedToolboxBottom,
            hand);
    }

    /**
     * @param {!DisplayedInspector|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        //noinspection JSUnresolvedVariable
        return other instanceof DisplayedInspector &&
            this.drawArea.isEqualTo(other.drawArea) &&
            this.displayedCircuit.isEqualTo(other.displayedCircuit) &&
            this.displayedToolboxTop.isEqualTo(other.displayedToolboxTop) &&
            this.displayedToolboxBottom.isEqualTo(other.displayedToolboxBottom) &&
            this.hand.isEqualTo(other.hand);
    }

    /**
     * @param {!DisplayedCircuit} circuitWidget
     * @returns {!DisplayedInspector}
     */
    withCircuitWidget(circuitWidget) {
        if (circuitWidget === this.displayedCircuit) {
            return this;
        }
        return new DisplayedInspector(
            this.drawArea,
            circuitWidget,
            this.displayedToolboxTop,
            this.displayedToolboxBottom,
            this.hand);
    }

    /**
     * @param {!Hand} hand
     * @param {!int} extraWires
     * @returns {!DisplayedInspector}
     */
    withJustEnoughWires(hand, extraWires) {
        return this.withCircuitWidget(this.displayedCircuit.withJustEnoughWires(hand, extraWires));
    }

    /**
    * @returns {!DisplayedInspector}
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
     * @returns {!DisplayedInspector}
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
            this.displayedToolboxTop.stableDuration(this.hand),
            this.displayedToolboxBottom.stableDuration(this.hand),
            this.hand.stableDuration(),
            this.displayedCircuit.stableDuration()
        ]).min(Infinity);
    }

    /**
     * @param {!Hand} hand
     * @returns {!DisplayedInspector}
     */
    withHand(hand) {
        return new DisplayedInspector(
            this.drawArea,
            this.displayedCircuit,
            this.displayedToolboxTop,
            this.displayedToolboxBottom,
            hand);
    }

    /**
     * @param {!CircuitDefinition} newCircuitDefinition
     * @returns {!DisplayedInspector}
     */
    withCircuitDefinition(newCircuitDefinition) {
        return new DisplayedInspector(
            this.drawArea,
            DisplayedCircuit.empty(TOOLBOX_HEIGHT).withCircuit(newCircuitDefinition),
            this.displayedToolboxTop,
            this.displayedToolboxBottom,
            this.hand.withDrop());
    }

    /**
     * @returns {!number}
     */
    desiredHeight() {
        let toolboxHeight = 4 * (Config.GATE_RADIUS * 2 + 2) - Config.GATE_RADIUS;
        let circuitHeight = this.displayedCircuit.desiredHeight();
        return Math.max(Config.MINIMUM_CANVAS_HEIGHT, toolboxHeight*2 + circuitHeight);
    }

    /**
     * @returns {!string}
     */
    snapshot() {
        return JSON.stringify(Serializer.toJson(this.displayedCircuit.circuitDefinition), null, 0);
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
        painter.ctx.font = '16px sans-serif';
        painter.ctx.fillText("drag gates onto circuit", 0, 0);
        painter.ctx.restore();

        painter.ctx.save();
        painter.ctx.translate(50, 240);
        painter.ctx.rotate(Math.PI * 0.02);
        painter.ctx.fillStyle = 'red';
        painter.ctx.font = '16px sans-serif';
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
