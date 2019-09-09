// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Config} from "src/Config.js"
import {DisplayedCircuit} from "src/ui/DisplayedCircuit.js"
import {DisplayedToolbox} from "src/ui/DisplayedToolbox.js"
import {GateDrawParams} from "src/draw/GateDrawParams.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Gates} from "src/gates/AllGates.js"
import {Hand} from "src/ui/Hand.js"
import {Painter} from "src/draw/Painter.js"
import {Rect} from "src/math/Rect.js"
import {Serializer} from "src/circuit/Serializer.js"

class DisplayedInspector {
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
        this.displayedToolboxBottom = displayedToolboxBottom.
            withCustomGatesInserted(circuitWidget.circuitDefinition.customGateSet);
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

        this.displayedToolboxTop = this.displayedToolboxTop.withTop(0);
        this.displayedToolboxBottom = this.displayedToolboxBottom.withTop(
            this.drawArea.bottom() - this.displayedToolboxBottom.desiredHeight());
    }

    /**
     * @param {!Rect} drawArea
     * @returns {!DisplayedInspector}
     */
    static empty(drawArea) {
        let topToolbox = new DisplayedToolbox('Toolbox', 0, Gates.TopToolboxGroups, true, 3);
        let displayedCircuit = DisplayedCircuit.empty(topToolbox.desiredHeight());
        let bottomToolbox = new DisplayedToolbox(
            'Toolbox₂',
            displayedCircuit.top + displayedCircuit.desiredHeight(),
            Gates.BottomToolboxGroups,
            false,
            4);
        return new DisplayedInspector(
            drawArea,
            displayedCircuit,
            topToolbox,
            bottomToolbox,
            Hand.EMPTY);
    }

    /**
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     */
    paint(painter, stats) {
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
        drawer(new GateDrawParams(
            painter,
            this.hand,
            false,
            true,
            true,
            false,
            rect,
            gate,
            stats,
            undefined,
            [],
            undefined));
    }

    /**
     * @returns {undefined|!string}
     */
    tryGetHandOverButtonKey() {
        if (this.hand.pos === undefined) {
            return undefined;
        }
        let butBos = this.displayedCircuit.findGateWithButtonContaining(this.hand.pos);
        if (butBos !== undefined) {
            return `gate-button-${butBos.col}:${butBos.row}`;
        }
        let initPos = this.displayedCircuit.findWireWithInitialStateAreaContaining(this.hand.pos);
        if (initPos !== undefined) {
            return `wire-init-${initPos}`;
        }
        return undefined;
    }

    /**
     * @returns {undefined|!DisplayedInspector}
     */
    tryClick() {
        let newDisplayedCircuit = this.displayedCircuit.tryClick(this.hand);
        return newDisplayedCircuit === undefined ? undefined : this.withDisplayedCircuit(newDisplayedCircuit);
    }

    /**
     * @param {!boolean=false} duplicate
     * @param {!boolean=false} wholeCol
     * @param {!boolean=false} ignoreResizeTabs
     * @param {!boolean=false} alt
     * @returns {!DisplayedInspector}
     */
    afterGrabbing(duplicate=false, wholeCol=false, ignoreResizeTabs=false, alt=false) {
        let hand = this.hand;
        let circuit = this.displayedCircuit;

        hand = this.displayedToolboxTop.tryGrab(hand);
        hand = this.displayedToolboxBottom.tryGrab(hand);
        let obj = circuit.tryGrab(hand, duplicate, wholeCol, ignoreResizeTabs, alt);
        hand = obj.newHand;
        circuit = obj.newCircuit;

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
     * @param {!DisplayedCircuit} displayedCircuit
     * @returns {!DisplayedInspector}
     */
    withDisplayedCircuit(displayedCircuit) {
        if (displayedCircuit === this.displayedCircuit) {
            return this;
        }
        return new DisplayedInspector(
            this.drawArea,
            displayedCircuit,
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
        return this.withDisplayedCircuit(this.displayedCircuit.withJustEnoughWires(hand, extraWires));
    }

    /**
    * @returns {!DisplayedInspector}
    */
    afterTidyingUp() {
        return this.withDisplayedCircuit(this.displayedCircuit.afterTidyingUp());
    }

    /**
     * @returns {!DisplayedInspector}
     */
    previewDrop() {
        if (!this.hand.isBusy()) {
            return this;
        }

        let hand = this.hand;
        let circuitWidget = this.displayedCircuit;
        let previewCircuit = circuitWidget.previewDrop(hand);
        let previewHand = previewCircuit === circuitWidget ? hand : hand.withDrop();
        return this.withHand(previewHand).withDisplayedCircuit(previewCircuit);
    }

    /**
     * @returns {!DisplayedInspector}
     */
    afterDropping() {
        return this.
            withDisplayedCircuit(this.displayedCircuit.afterDropping(this.hand)).
            withHand(this.hand.withDrop());
    }

    /**
     * @returns {Infinity|!number}
     */
    stableDuration() {
        return Math.min(
            this.displayedToolboxTop.stableDuration(this.hand),
            this.displayedToolboxBottom.stableDuration(this.hand),
            this.hand.stableDuration(),
            this.displayedCircuit.stableDuration());
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
            DisplayedCircuit.empty(this.displayedToolboxTop.desiredHeight()).withCircuit(newCircuitDefinition),
            this.displayedToolboxTop,
            this.displayedToolboxBottom,
            this.hand.withDrop());
    }

    /**
     * @returns {!number}
     */
    desiredHeight() {
        let minimumDesired =
            this.displayedToolboxBottom.desiredHeight() +
            this.displayedToolboxTop.desiredHeight() +
            this.displayedCircuit.desiredHeight();
        return Math.max(Config.MINIMUM_CANVAS_HEIGHT, minimumDesired);
    }

    /**
     * @returns {!string}
     */
    snapshot() {
        return JSON.stringify(Serializer.toJson(this.displayedCircuit.circuitDefinition), null, 0);
    }

    _drawHint(painter) {
        this._drawHint_dragGatesOntoCircuit(painter);
        this._drawHint_watchOutputsChange(painter);
        this._drawHint_useControls(painter);
    }

    /**
     * @param {!Painter} painter
     * @private
     */
    _drawHint_watchOutputsChange(painter) {
        let visibilityFactor = this._hintVisibility();
        if (visibilityFactor <= 0) {
            return;
        }

        painter.ctx.save();
        painter.ctx.globalAlpha *= Math.min(1, visibilityFactor);
        painter.ctx.translate(this.displayedCircuit.opRect(this.displayedCircuit.clampedCircuitColCount()).x - 280, 15);

        painter.ctx.save();
        painter.ctx.translate(268, 250);
        painter.ctx.rotate(Math.PI * 0.02);
        painter.ctx.fillStyle = 'red';
        painter.ctx.textAlign = 'right';
        painter.ctx.font = '16px sans-serif';
        painter.ctx.fillText("outputs change", 0, 0);
        painter.ctx.restore();

        painter.ctx.beginPath();
        painter.ctx.moveTo(270, 245);
        painter.ctx.bezierCurveTo(
            300, 245,
            315, 235,
            325, 225);
        painter.ctx.strokeStyle = 'red';
        painter.ctx.lineWidth = 3;
        painter.ctx.stroke();

        painter.trace(tracer => {
            tracer.arrowHead(330, 219, 10, Math.PI*-0.265, 1.3);
        }).thenFill('red');

        painter.ctx.restore();
    }

    _hintVisibility() {
        if (this.displayedCircuit.circuitDefinition.columns.length > 0) {
            return 0;
        }
        return this.hand.pos === undefined || !this.hand.isBusy() ? 1.0 :
            this.hand.heldGate !== undefined && this.hand.heldGate.isControl() ? 1.0 :
            (150-this.hand.pos.y)/50;
    }


    /**
     * @param {!Painter} painter
     * @private
     */
    _drawHint_dragGatesOntoCircuit(painter) {
        let visibilityFactor = this._hintVisibility();
        if (visibilityFactor <= 0) {
            return;
        }

        painter.ctx.save();
        painter.ctx.globalAlpha *= Math.min(1, visibilityFactor);

        painter.ctx.save();
        painter.ctx.translate(130, 195);
        painter.ctx.rotate(Math.PI * 0.05);
        painter.ctx.fillStyle = 'red';
        painter.ctx.font = '16px sans-serif';
        painter.ctx.fillText("drag gates onto circuit", 0, 0);
        painter.ctx.restore();

        painter.ctx.beginPath();
        painter.ctx.moveTo(268, 132);
        painter.ctx.bezierCurveTo(
            260, 170,
            235, 175,
            217, 187);
        painter.ctx.strokeStyle = 'red';
        painter.ctx.lineWidth = 3;
        painter.ctx.stroke();

        painter.trace(tracer => {
            tracer.arrowHead(210, 190, 10, Math.PI*0.84, 1.3);
        }).thenFill('red');

        painter.ctx.restore();
    }

    /**
     * @param {!Painter} painter
     * @private
     */
    _drawHint_useControls(painter) {
        let visibilityFactor = this._hintVisibility();
        if (visibilityFactor <= 0) {
            return;
        }
        painter.ctx.save();
        painter.ctx.globalAlpha *= Math.min(1, visibilityFactor);

        let firstSlotAvailable = this.displayedCircuit.circuitDefinition.gateInSlot(0, 0) === undefined;
        let fy = firstSlotAvailable ? 173 : 223;

        painter.ctx.save();
        painter.ctx.translate(70, fy-3);
        painter.ctx.rotate(Math.PI * -0.01);
        painter.ctx.fillStyle = 'red';
        painter.ctx.font = '16px sans-serif';
        painter.ctx.fillText("use controls", 0, 0);
        painter.ctx.restore();

        painter.ctx.beginPath();
        if (firstSlotAvailable) {
            painter.ctx.moveTo(90, 125);
            painter.ctx.bezierCurveTo(
                60, 140,
                48, 160,
                55, fy);
        } else {
            painter.ctx.moveTo(100, 125);
            painter.ctx.bezierCurveTo(
                115, 150,
                105, 170,
                55, fy);
        }
        painter.ctx.strokeStyle = 'red';
        painter.ctx.lineWidth = 3;
        painter.ctx.stroke();
        painter.ctx.beginPath();
        painter.ctx.arc(55, fy, 5, 0, 2 * Math.PI);
        painter.ctx.fillStyle = 'red';
        painter.ctx.fill();

        painter.ctx.restore();
    }
}

export {DisplayedInspector}
