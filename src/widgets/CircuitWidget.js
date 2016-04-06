import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import CircuitStats from "src/circuit/CircuitStats.js"
import Config from "src/Config.js"
import GateColumn from "src/circuit/GateColumn.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import GateFactory from "src/ui/GateFactory.js"
import Gates from "src/ui/Gates.js"
import MathPainter from "src/ui/MathPainter.js"
import Point from "src/math/Point.js"
import Matrix from "src/math/Matrix.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"

/** @type {!number} */
let CIRCUIT_OP_HORIZONTAL_SPACING = 10;
/** @type {!number} */
let CIRCUIT_OP_LEFT_SPACING = 35;
/** @type {!number} */
let CIRCUIT_OP_RIGHT_SPACING = 5;

class CircuitWidget {
    /**
     *
     * @param {!Rect} area
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!int|null} compressedColumnIndex
     *
     * @property {!Rect} area
     * @property {!CircuitDefinition} circuitDefinition
     * @property {!int|null} compressedColumnIndex
     * @property {!function(!int) : !string=} wireLabeller
     */
    constructor(area, circuitDefinition, compressedColumnIndex) {
        this.area = area;
        this.circuitDefinition = circuitDefinition;
        this.compressedColumnIndex = compressedColumnIndex;
    }

    static desiredHeight(wireCount) {
        return Math.max(Config.MIN_WIRE_COUNT, wireCount) * Config.WIRE_SPACING + 100;
    }

    desiredWidth() {
        let r = this.opRect(
            this.circuitDefinition.columns.length + // Operations.
            1 + // Spacer.
            2 + // Wire chance and bloch sphere displays.
            1 // Density matrix displays.
        );
        return r.x + CircuitWidget.desiredHeight(this.circuitDefinition.numWires) + 5; // Superposition display.
    }

    /**
     * @param {!Rect} drawArea
     */
    updateArea(drawArea) {
        this.area = drawArea;
    }

    /**
     * @param {!int} wireIndex
     * @returns {!Rect}
     */
    wireRect(wireIndex) {
        Util.need(wireIndex >= 0 && wireIndex < this.circuitDefinition.numWires, "wireIndex out of range", arguments);
        return this.area.skipTop(Config.WIRE_SPACING * wireIndex).takeTop(Config.WIRE_SPACING);
    }

    /**
     * @param {!Point} p
     * @returns {null|!int}
     */
    findWireAt(p) {
        if (!this.area.containsPoint(p)) {
            return null;
        }

        let i = Math.floor((p.y - this.area.y) / Config.WIRE_SPACING);
        if (i < 0 || i >= this.circuitDefinition.numWires) {
            return null;
        }
        return i;
    }

    /**
     * @param {!Point} p
     * @returns {?number}
     * @private
     */
    findContinuousColumnX(p) {
        if (!this.area.containsPoint(p)) {
            return null;
        }

        let s = (CIRCUIT_OP_HORIZONTAL_SPACING + Config.GATE_RADIUS * 2);
        let left = this.area.x + CIRCUIT_OP_LEFT_SPACING - CIRCUIT_OP_HORIZONTAL_SPACING / 2;
        let dg = (p.x - left) / s;
        return dg - 0.5;
    }

    /**
     * @param {!Point} p
     * @returns {?number}
     */
    findOpHalfColumnAt(p) {
        if (!this.area.containsPoint(p)) {
            return null;
        }

        return Math.max(-0.5, Math.round(this.findContinuousColumnX(p) * 2) / 2);
    }

    /**
     * @param {!Point} p
     * @returns {?int}
     */
    findExistingOpColumnAt(p) {
        if (!this.area.containsPoint(p)) {
            return null;
        }

        let x = this.findContinuousColumnX(p);
        let i;
        if (this.compressedColumnIndex === null || x < this.compressedColumnIndex - 0.75) {
            i = Math.round(x);
        } else if (x < this.compressedColumnIndex - 0.25) {
            i = this.compressedColumnIndex;
        } else {
            i = Math.round(x) - 1;
        }

        if (i < 0 || i >= this.circuitDefinition.columns.length) {
            return null;
        }

        return i;
    }

    /**
     * @param {!Hand} hand
     * @returns {?{ col : !number, row : !number, isInsert : !boolean }}
     */
    findModificationIndex(hand) {
        if (hand.pos === null) {
            return null;
        }
        let halfColIndex = this.findOpHalfColumnAt(Util.notNull(hand.pos));
        let wireIndex = this.findWireAt(Util.notNull(hand.pos));
        if (halfColIndex === null || wireIndex === null) {
            return null;
        }
        let colIndex = Math.ceil(halfColIndex);
        let isInsert = Math.abs(halfColIndex % 1) === 0.5;
        if (colIndex >= this.circuitDefinition.columns.length) {
            return {col: colIndex, row: wireIndex, isInsert: isInsert};
        }

        if (!isInsert) {
            let isFree = this.circuitDefinition.columns[colIndex].gates[wireIndex] === null;
            if (hand.heldGates !== null) {
                for (let k = 0; k < hand.heldGates.gates.length; k++) {
                    if (this.circuitDefinition.columns[colIndex].gates[wireIndex + k] !== null) {
                        isFree = false;
                    }
                }
            }
            if (!isFree) {
                let isAfter = hand.pos.x > this.opRect(colIndex).center().x;
                isInsert = true;
                if (isAfter) {
                    colIndex += 1;
                }
            }
        }

        return {col: colIndex, row: wireIndex, isInsert: isInsert};
    }

    /**
     * @param {!int} operationIndex
     * @returns {Rect!}
     */
    opRect(operationIndex) {
        let opWidth = Config.GATE_RADIUS * 2;
        let opSeparation = opWidth + CIRCUIT_OP_HORIZONTAL_SPACING;
        let tweak = 0;
        if (this.compressedColumnIndex !== null && operationIndex === this.compressedColumnIndex) {
            tweak = opSeparation / 2;
        }
        if (this.compressedColumnIndex !== null && operationIndex > this.compressedColumnIndex) {
            tweak = opSeparation;
        }

        let dx = opSeparation * operationIndex - tweak + CIRCUIT_OP_LEFT_SPACING;
        return this.area.withX(this.area.x + dx).withW(opWidth);
    }

    /**
     * @param {!int} wireIndex
     * @param {!int} operationIndex
     */
    gateRect(wireIndex, operationIndex) {
        let op = this.opRect(operationIndex);
        let wire = this.wireRect(wireIndex);
        let r = Rect.centeredSquareWithRadius(
            new Point(op.x + Config.GATE_RADIUS, wire.center().y),
            Config.GATE_RADIUS);
        return new Rect(Math.round(r.x - 0.5) + 0.5, Math.round(r.y - 0.5) + 0.5, Math.round(r.w), Math.round(r.h));
    }

    afterTidyingUp() {
        return this.withCircuit(this.circuitDefinition.withoutEmpties());
    }

    /**
     * @param {!CircuitWidget|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof CircuitWidget &&
            this.area.isEqualTo(other.area) &&
            this.circuitDefinition.isEqualTo(other.circuitDefinition) &&
            this.compressedColumnIndex === other.compressedColumnIndex;
    }

    /**
     * @param {!Painter} painter
     * @param {!Hand} hand
     * @param {!CircuitStats} stats
     */
    paint(painter, hand, stats) {
        painter.fillRect(this.area, Config.BACKGROUND_COLOR_CIRCUIT);

        // Draw labelled wires
        for (let row = 0; row < this.circuitDefinition.numWires; row++) {
            let wireRect = this.wireRect(row);
            painter.printParagraph("|0⟩", wireRect.takeLeft(20), new Point(1, 0.5));
        }
        painter.trace(trace => {
            for (let row = 0; row < this.circuitDefinition.numWires; row++) {
                let wireRect = this.wireRect(row);
                let y = Math.round(wireRect.center().y - 0.5) + 0.5;
                let lastX = this.area.x + 25;
                //noinspection ForLoopThatDoesntUseLoopVariableJS
                for (let col = 0; lastX < this.area.right(); col++) {
                    let x = this.opRect(col).center().x;
                    if (this.circuitDefinition.locIsMeasured(new Point(col, row))) {
                        trace.line(lastX, y-1, x, y-1);
                        trace.line(lastX, y+1, x, y+1);
                    } else {
                        trace.line(lastX, y, x, y);
                    }
                    lastX = x;
                }
            }
        }).thenStroke('black');

        // Draw operations
        for (let col = 0; col < this.circuitDefinition.columns.length; col++) {
            this.drawCircuitOperation(painter, this.circuitDefinition.columns[col], col, hand, stats);
        }

        // Draw output displays.
        this.drawOutputDisplays(painter, stats);
    }

    /**
     * @param {!Painter} painter
     * @param {!GateColumn} gateColumn
     * @param {!int} col
     * @param {!Hand} hand
     * @param {!CircuitStats} stats
     */
    drawCircuitOperation(painter, gateColumn, col, hand, stats) {
        this.drawColumnControlWires(painter, gateColumn, col, stats);

        for (let row = 0; row < this.circuitDefinition.numWires; row++) {
            let r = this.gateRect(row, col);

            if (gateColumn.gates[row] === null) {
                continue;
            }
            /** @type {!Gate} */
            let gate = gateColumn.gates[row];

            let canGrab =
                (new Seq(hand.hoverPoints()).any(pt => r.containsPoint(pt)) && this.compressedColumnIndex === null) ||
                this.compressedColumnIndex === col;
            let drawer = gate.customDrawer || GateFactory.DEFAULT_DRAWER;
            drawer(new GateDrawParams(painter, false, canGrab, r, gate, stats, {row, col}));
            let isDisabledReason = this.circuitDefinition.gateAtLocIsDisabledReason(new Point(col, row));
            if (isDisabledReason !== undefined) {
                if (canGrab) {
                    painter.ctx.globalAlpha /= 2;
                }
                painter.strokeLine(r.topLeft(), r.bottomRight(), 'orange', 3);
                painter.ctx.globalAlpha /= 2;
                painter.fillRect(r.paddedBy(5), 'yellow');
                painter.ctx.globalAlpha *= 2;
                painter.printParagraph(isDisabledReason, r.paddedBy(5), new Point(0.5, 0.5), 'red');
                if (canGrab) {
                    painter.ctx.globalAlpha *= 2;
                }
            }
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!GateColumn} gateColumn
     * @param {!int} columnIndex
     * @param {!CircuitStats} stats
     */
    drawColumnControlWires(painter, gateColumn, columnIndex, stats) {
        let n = gateColumn.gates.length;
        let gs = gateColumn.gates;

        let hasTwoSwaps = stats.circuitDefinition.colHasPairedSwapGate(columnIndex);

        let canBeControlled =
            i => stats.circuitDefinition.locHasControllableGate(new Point(columnIndex, i));

        let causesSingleWire =
            i => this.circuitDefinition.locStartsSingleControlWire(new Point(columnIndex, i));

        let causesDoubleWire =
            i => this.circuitDefinition.locStartsDoubleControlWire(new Point(columnIndex, i));

        let isMatchedSwap = i =>
            hasTwoSwaps && gs[i] === Gates.Special.SwapHalf;

        let t1 = Seq.range(n).filter(canBeControlled).first(null);
        let t2 = Seq.range(n).filter(canBeControlled).last(null);
        let c1 = Seq.range(n).filter(causesSingleWire).first(null);
        let c2 = Seq.range(n).filter(causesSingleWire).last(null);
        let cc1 = Seq.range(n).filter(causesDoubleWire).first(null);
        let cc2 = Seq.range(n).filter(causesDoubleWire).last(null);
        let s1 = Seq.range(n).filter(isMatchedSwap).first(null);
        let s2 = Seq.range(n).filter(isMatchedSwap).last(null);

        let x = Math.round(this.opRect(columnIndex).center().x - 0.5) + 0.5;
        if (c1 !== null && t1 !== null) {
            let y1 =  this.wireRect(Math.min(t1, c1)).center().y;
            let y2 = this.wireRect(Math.max(t2, c2)).center().y;
            painter.strokeLine(new Point(x,y1), new Point(x, y2));
        }
        if (s1 !== null) {
            let y1 =  this.wireRect(s1).center().y;
            let y2 = this.wireRect(s2).center().y;
            painter.strokeLine(new Point(x,y1), new Point(x, y2));
        }
        if (cc1 !== null && t1 !== null) {
            let y1 =  this.wireRect(Math.min(t1, cc1)).center().y;
            let y2 = this.wireRect(Math.max(t2, cc2)).center().y;
            painter.strokeLine(new Point(x+1, y1), new Point(x+1, y2));
            painter.strokeLine(new Point(x-1, y1), new Point(x-1, y2));
        }
    }

    static _shiftGateAhead(cols, row, oldCol, minCol) {
        let gate = cols[oldCol].gates[row];
        let newCol = Seq.
            range(cols.length).
            skip(minCol).
            skipWhile(c => cols[c].gates[row] !== null).
            first(cols.length);
        return seq(cols).
            padded(cols.length + 1, GateColumn.empty(cols[0].gates.length)).
            withTransformedItem(oldCol, c => c.withGatesAdded(row, new GateColumn([null]))).
            withTransformedItem(newCol, c => c.withGatesAdded(row, new GateColumn([gate]))).
            toArray();
    }

    /**
     * @param {!Hand} hand
     * @returns {!CircuitWidget}
     */
    previewDrop(hand) {
        let modificationPoint = this.findModificationIndex(hand);
        if (modificationPoint === null || hand.heldGates === null) {
            return this;
        }
        let addedGateBlock = Util.notNull(hand.heldGates);

        let emptyCol = GateColumn.empty(this.circuitDefinition.numWires);
        let i = modificationPoint.col;
        let isInserting = modificationPoint.isInsert;
        let row = Math.min(
            Math.max(
                modificationPoint.row - hand.heldGatesGrabInset,
                0),
            this.circuitDefinition.numWires - hand.heldGates.gates.length);
        let newCols = seq(this.circuitDefinition.columns).
            padded(i, emptyCol).
            ifThen(isInserting, s => s.withInsertedItem(i, emptyCol)).
            padded(i + 1, emptyCol).
            withTransformedItem(i, c => c.withGatesAdded(row, addedGateBlock)).
            toArray();

        let result = this.withCircuit(this.circuitDefinition.withColumns(newCols));
        result.compressedColumnIndex = isInserting ? i : null;
        return result;
    }

    afterDropping(hand) {
        let r = this.previewDrop(hand);
        r.compressedColumnIndex = null;
        return r;
    }

    withCircuit(circuitDefinition) {
        if (circuitDefinition.isEqualTo(this.circuitDefinition)) {
            return this;
        }
        return new CircuitWidget(
            this.area,
            circuitDefinition,
            this.compressedColumnIndex);
    }

    withJustEnoughWires(extra = 0) {
        let maxUsedWire = seq(this.circuitDefinition.columns).
            map(c => Seq.range(this.circuitDefinition.numWires).filter(i => c.gates[i] !== null).last(0)).
            max(0);
        let desiredWireCount = maxUsedWire + 1 + extra;
        desiredWireCount = Math.min(Config.MAX_WIRE_COUNT, Math.max(Config.MIN_WIRE_COUNT, desiredWireCount));
        return this.withCircuit(this.circuitDefinition.withWireCount(desiredWireCount));
    }

    /**
     * @param {!Hand} hand
     * @param {!boolean} duplicate
     * @returns {!{newCircuit: !CircuitWidget, newHand: !Hand}}
     */
    tryGrab(hand, duplicate=false) {
        if (hand.pos === null) {
            return {newCircuit: this, newHand: hand};
        }

        let possibleCol = this.findExistingOpColumnAt(Util.notNull(hand.pos));
        if (possibleCol === null) {
            return {newCircuit: this, newHand: hand};
        }

        let c = Util.notNull(possibleCol);
        let r = this.findWireAt(Util.notNull(hand.pos));
        if (r === null ||
                !this.gateRect(r, c).containsPoint(Util.notNull(hand.pos)) ||
                this.circuitDefinition.columns[c].gates[r] === null) {
            return {newCircuit: this, newHand: hand};
        }

        let gate = this.circuitDefinition.columns[c].gates[r];
        let remainingGates = seq(this.circuitDefinition.columns[c].gates).toArray();
        if (!duplicate) {
            remainingGates[r] = null;
        }
        let grabbedGates = [gate];

        let grabInset = 0;
        let newCols = seq(this.circuitDefinition.columns).
            withOverlayedItem(c, new GateColumn(remainingGates)).
            toArray();
        return {
            newCircuit: new CircuitWidget(
                this.area,
                this.circuitDefinition.withColumns(newCols),
                null),
            newHand: hand.withHeldGates(new GateColumn(grabbedGates), grabInset)
        };
    }

    /**
     * @returns {!boolean}
     */
    needsContinuousRedraw() {
        return this.circuitDefinition.isTimeDependent();
    }

    importantWireCount() {
        let usedWireCount = 1 + seq(this.circuitDefinition.columns).
            flatMap(col => seq(col.gates).mapWithIndex((gate, i) => gate !== null ? i : -Infinity)).
            max(-Infinity);
        return Math.max(this.circuitDefinition.numWires - 1, Math.max(Config.MIN_WIRE_COUNT, usedWireCount));
    }

    /**
     * Draws a peek gate on each wire at the right-hand side of the circuit.
     *
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     */
    drawOutputDisplays(painter, stats) {
        let colCount = this.circuitDefinition.columns.length + 1;
        let numWire = this.importantWireCount();

        for (let i = 0; i < numWire; i++) {
            let p = stats.controlledWireProbabilityJustAfter(i, Infinity);
            MathPainter.paintProbabilityBox(painter, p, this.gateRect(i, colCount));
            let m = stats.qubitDensityMatrix(i, Infinity);
            if (m !== undefined) {
                MathPainter.paintBlochSphere(painter, m, this.gateRect(i, colCount+1));
            }
        }

        let offset = colCount+2;
        for (let i = 0; i + 1 <= numWire; i++) {
            let m = stats.qubitDensityMatrix(i, Infinity);
            let topLeft = this.gateRect(i, offset).topLeft();
            let wh = this.gateRect(i, offset).bottom() - topLeft.y;
            let r = new Rect(topLeft.x, topLeft.y, wh, wh);
            MathPainter.paintDensityMatrix(painter, m, r);
        }
        offset += 1;

        let bottom = this.wireRect(numWire-1).bottom();
        let right = this.opRect(this.circuitDefinition.columns.length).x;
        painter.printParagraph(
            "Local wire states\n(Chance/Bloch/Density)",
            new Rect(right+25, bottom+4, 190, 40),
            new Point(0.5, 0),
            'gray');

        this.drawOutputSuperpositionDisplay(painter, stats, offset);
    }

    /**
     * Draws a peek gate on each wire at the right-hand side of the circuit.
     *
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!int} col
     */
    drawOutputSuperpositionDisplay(painter, stats, col) {
        let numWire = this.importantWireCount();
        if (numWire >= Config.NO_SUPERPOSITION_DRAWING_WIRE_THRESHOLD) {
            return;
        }

        let [colWires, rowWires] = [Math.floor(numWire/2), Math.ceil(numWire/2)];
        let [colCount, rowCount] = [1 << colWires, 1 << rowWires];
        let outputStateBuffer = stats.finalState.rawBuffer();
        if (stats.circuitDefinition.numWires !== this.importantWireCount()) {
            outputStateBuffer = outputStateBuffer.slice(0, outputStateBuffer.length/2);
        }
        let amplitudeGrid = new Matrix(colCount, rowCount, outputStateBuffer);

        let topRect = this.gateRect(0, col);
        let bottomRect = this.gateRect(numWire-1, col);
        let gridRect = new Rect(topRect.x, topRect.y, 0, bottomRect.bottom() - topRect.y);
        gridRect = gridRect.withW(gridRect.h * (colCount/rowCount));
        MathPainter.paintMatrix(
            painter,
            amplitudeGrid,
            gridRect,
            numWire < Config.SIMPLE_SUPERPOSITION_DRAWING_WIRE_THRESHOLD ? Config.SUPERPOSITION_MID_COLOR : undefined,
            'black',
            numWire < Config.SIMPLE_SUPERPOSITION_DRAWING_WIRE_THRESHOLD ? Config.SUPERPOSITION_FORE_COLOR : undefined,
            Config.SUPERPOSITION_BACK_COLOR);

        let expandedRect = gridRect.withW(gridRect.w + 50).withH(gridRect.h + 50);
        let [dw, dh] = [gridRect.w / colCount, gridRect.h / rowCount];
        let bin = (val, pad) => ("0".repeat(pad) + val.toString(2)).slice(-pad).split("").reverse().join("");

        // Row labels.
        for (let i = 0; i < rowCount; i++) {
            let label = "_".repeat(colWires) + bin(i, rowWires);
            let x = gridRect.right();
            let y = expandedRect.y + dh*(i+0.5);
            painter.print(label, x + 2, y, 'left', 'middle', 'black', '12px monospace', 50, dh, (w, h) => {
                painter.fillRect(new Rect(x, y-h/2, w + 4, h), 'lightgray');
            });
        }

        // Column labels.
        painter.ctx.save();
        painter.ctx.rotate(Math.PI/2);
        let maxY = 0;
        for (let i = 0; i < colCount; i++) {
            let labelRect = expandedRect.skipTop(gridRect.h + 2).skipLeft(dw*i).skipBottom(2).withW(dw);
            labelRect = new Rect(labelRect.y, -labelRect.x-labelRect.w, labelRect.h, labelRect.w);

            let label = bin(i, colWires) + "_".repeat(rowWires);
            let x = expandedRect.x + dw*(i+0.5);
            let y = gridRect.bottom();
            painter.print(label, y + 2, -x, 'left', 'middle', 'black', '12px monospace', 50, dw, (w, h) => {
                painter.fillRect(new Rect(y, -x-h/2, w + 4, h), 'lightgray');
                maxY = Math.max(maxY, w + 8);
            });
        }
        painter.ctx.restore();

        // Hint text.
        painter.printParagraph(
            "Final amplitudes\n(deferring measurement)",
            expandedRect.withY(gridRect.bottom() + maxY).withH(40).withW(200),
            new Point(0, 0),
            'gray');
    }
}

export default CircuitWidget;
