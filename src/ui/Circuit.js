//import Util from "src/base/Util.js"
//
///** @type {!number} */
//let CIRCUIT_OP_HORIZONTAL_SPACING = 10;
///** @type {!number} */
//let CIRCUIT_OP_LEFT_SPACING = 35;
///** @type {!number} */
//let CIRCUIT_OP_RIGHT_SPACING = 5;
//
//class Circuit {
//    /**
//     *
//     * @param {!Rect} area
//     * @param {!int} numWires
//     * @param {!Array<!GateColumn>} columns
//     * @param {?int} compressedColumnIndex
//     * @param {undefined|!function(!int) : !string} wireLabeller
//     *
//     * @property {!Rect} area
//     * @property {!int} numWires
//     * @property {!Array<!GateColumn>} columns;
//     * @property {?int} compressedColumnIndex
//     * @property {!function(!int) : !string} wireLabeller
//     */
//    constructor(area, numWires, columns, compressedColumnIndex, wireLabeller) {
//        Util.need(numWires >= 0, "numWires >= 0", arguments);
//        Util.need(columns.every(e => e instanceof GateColumn), "columns not columns", arguments);
//        Util.need(columns.every(e => e.gates.length === numWires), "columns of correct length", arguments);
//        this.area = area;
//        this.numWires = numWires;
//        this.columns = columns;
//        this.compressedColumnIndex = compressedColumnIndex;
//        this.wireLabeller = wireLabeller || Circuit.DEFAULT_WIRE_LABELLER;
//    }
//
//    /**
//     * @param {!Array<!int>|!int} grouping
//     * @returns {!function() : !string}
//     */
//    static makeWireLabeller(grouping) {
//        let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//        if (grouping === 1) {
//            return i => alphabet[i];
//        }
//
//        if (typeof grouping === 'number') {
//            Util.need(grouping >= 1, "grouping >= 1", arguments);
//            return i => {
//                let g = Math.floor(i / grouping);
//                let e = i % grouping;
//                return alphabet[g] + (e + 1);
//            };
//        }
//
//        if (Array.isArray(grouping)) {
//            let labels = [];
//            for (let g = 0; g < grouping.length; g++) {
//                if (grouping[g] === 1) {
//                    labels.push(alphabet[g]);
//                } else {
//                    for (let i = 0; i < grouping[g]; i++) {
//                        labels.push(alphabet[g] + (i + 1));
//                    }
//                }
//            }
//            return i => labels[i];
//        }
//
//        throw "Unrecognized grouping type: " + grouping;
//    }
//
//
//    /**
//     * @param {!Rect} drawArea
//     */
//    updateArea(drawArea) {
//        this.area = drawArea;
//    }
//
//    isEqualTo(other) {
//        if (this === other) {
//            return true;
//        }
//        let self = this;
//        return other instanceof Circuit &&
//            this.area.isEqualTo(other.area) &&
//            this.numWires === other.numWires &&
//            this.columns.isEqualToBy(other.columns, CUSTOM_IS_EQUAL_TO_EQUALITY) &&
//            this.compressedColumnIndex === other.compressedColumnIndex &&
//            range(this.numWires).every(i => self.wireLabeller(i) === other.wireLabeller(i));
//    }
//
//    toString() {
//        return "Circuit(area: " + this.area +
//            ", numWires: " + this.numWires +
//            ", columns: " + this.columns.toArrayString() +
//            ", compressedColumnIndex: " + this.compressedColumnIndex + ")";
//    }
//
//    /**
//     * Returns the circuit's initial, intermediate, and final states.
//     * @param {!number} time
//     * @returns {!Array<!QuantumState>}
//     */
//    scanStates(time) {
//        return this.columns.
//            map(e => e.matrixAt(time)).
//            scan(
//            QuantumState.zero(this.numWires),
//            arg2(QuantumState.prototype.transformedBy));
//    }
//
//    /**
//     * @param {!int} columnIndex
//     * @param {!number} time
//     * @returns {!Matrix}
//     */
//    getCumulativeOperationUpToBefore(columnIndex, time) {
//        return this.columns.slice(0, columnIndex).
//            map(e => e.matrixAt(time)).
//            reduce((a, e) => e.times(a), Matrix.identity(1 << this.numWires));
//    }
//
//    /**
//     * @returns {!number}
//     */
//    getWireSpacing() {
//        return this.area.h / this.numWires;
//    }
//
//    /**
//     * @param {!int} wireIndex
//     * @returns {!Rect}
//     */
//    wireRect(wireIndex) {
//        Util.need(wireIndex >= 0 && wireIndex < this.numWires, "wireIndex out of range", arguments);
//        let wireHeight = this.getWireSpacing();
//        return this.area.skipTop(wireHeight * wireIndex).takeTop(wireHeight);
//    }
//
//    /**
//     * @param {!Point} p
//     * @returns {?int}
//     */
//    findWireAt(p) {
//        if (!this.area.containsPoint(p)) {
//            return null;
//        }
//
//        return Math.floor((p.y - this.area.y) * this.numWires / this.area.h);
//    }
//
//    /**
//     * @returns {!Array<!string>}}
//     */
//    getLabels() {
//        return range(this.numWires).map(this.wireLabeller);
//    }
//
//    /**
//     * @param {!Point} p
//     * @returns {?number}
//     * @private
//     */
//    findContinuousColumnX(p) {
//        if (!this.area.containsPoint(p)) {
//            return null;
//        }
//
//        let s = (CIRCUIT_OP_HORIZONTAL_SPACING + Config.GATE_RADIUS * 2);
//        let left = this.area.x + CIRCUIT_OP_LEFT_SPACING - CIRCUIT_OP_HORIZONTAL_SPACING / 2;
//        let dg = (p.x - left) / s;
//        return dg - 0.5;
//    }
//
//    /**
//     * @param {!Point} p
//     * @returns {?number}
//     */
//    findOpHalfColumnAt(p) {
//        if (!this.area.containsPoint(p)) {
//            return null;
//        }
//
//        return Math.max(-0.5, Math.round(this.findContinuousColumnX(p) * 2) / 2);
//    }
//
//    /**
//     * @param {!Point} p
//     * @returns {?int}
//     */
//    findExistingOpColumnAt(p) {
//        if (!this.area.containsPoint(p)) {
//            return null;
//        }
//
//        let x = this.findContinuousColumnX(p);
//        let i;
//        if (this.compressedColumnIndex === null || x < this.compressedColumnIndex - 0.75) {
//            i = Math.round(x);
//        } else if (x < this.compressedColumnIndex - 0.25) {
//            i = this.compressedColumnIndex;
//        } else {
//            i = Math.round(x) - 1;
//        }
//
//        if (i < 0 || i >= this.columns.length) {
//            return null;
//        }
//
//        return i;
//    }
//
//    /**
//     * @param {!Hand} hand
//     * @returns {?{ col : !number, row : !number, isInsert : !boolean }}
//     */
//    findModificationIndex(hand) {
//        if (hand.pos === null) {
//            return null;
//        }
//        let halfColIndex = this.findOpHalfColumnAt(Util.notNull(hand.pos));
//        if (halfColIndex === null) {
//            return null;
//        }
//        let wireIndex = Util.notNull(this.findWireAt(Util.notNull(hand.pos)));
//        let colIndex = Math.ceil(halfColIndex);
//        let isInsert = Math.abs(halfColIndex % 1) === 0.5;
//        if (colIndex >= this.columns.length) {
//            return {col: colIndex, row: wireIndex, isInsert: isInsert};
//        }
//
//        if (!isInsert) {
//            let isFree = this.columns[colIndex].gates[wireIndex] === null;
//            if (hand.heldGateBlock !== null) {
//                for (let k = 1; k < hand.heldGateBlock.gates.length; k++) {
//                    if (this.columns[colIndex].gates[wireIndex + k] !== null) {
//                        isFree = false;
//                    }
//                }
//            }
//            if (!isFree) {
//                let isAfter = hand.pos.x > this.opRect(colIndex).center().x;
//                isInsert = true;
//                if (isAfter) {
//                    colIndex += 1;
//                }
//            }
//        }
//
//        return {col: colIndex, row: wireIndex, isInsert: isInsert};
//    }
//
//    /**
//     * @param {!int} operationIndex
//     * @returns {Rect!}
//     */
//    opRect(operationIndex) {
//        let opWidth = Config.GATE_RADIUS * 2;
//        let opSeparation = opWidth + CIRCUIT_OP_HORIZONTAL_SPACING;
//        let tweak = 0;
//        if (this.compressedColumnIndex !== null && operationIndex === this.compressedColumnIndex) {
//            tweak = opSeparation / 2;
//        }
//        if (this.compressedColumnIndex !== null && operationIndex > this.compressedColumnIndex) {
//            tweak = opSeparation;
//        }
//
//        let dx = opSeparation * operationIndex - tweak + CIRCUIT_OP_LEFT_SPACING;
//        return this.area.withX(this.area.x + dx).withW(opWidth);
//    }
//
//    /**
//     * @param {!int} wireIndex
//     * @param {!int} operationIndex
//     */
//    gateRect(wireIndex, operationIndex) {
//        let op = this.opRect(operationIndex);
//        let wire = this.wireRect(wireIndex);
//        return Rect.centeredSquareWithRadius(new Point(op.x + Config.GATE_RADIUS, wire.center().y), Config.GATE_RADIUS);
//    }
//
//    scanStateTextures(time) {
//        if (this.__cacheTime__scanStateTextures === time) {
//            return this.__cache__scanStateTextures;
//        }
//
//        let currentState = SuperpositionNode.fromZeroes(this.numWires);
//        let states = [currentState];
//        for (let i = 0; i < this.columns.length; i++) {
//            let c = this.columns[i];
//            let control = c.fullControlMask();
//            for (let j = 0; j < c.gates.length; j++) {
//                let g = c.gates[j];
//                if (g !== Gate.CONTROL && g !== Gate.ANTI_CONTROL && g !== Gate.PEEK && g !== null) {
//                    currentState = currentState.withQubitOperationApplied(j, g.matrixAt(time), control);
//                }
//            }
//            states.push(currentState);
//        }
//        this.__cache__scanStateTextures = states;
//        this.__cacheTime__scanStateTextures = time;
//        return states;
//    }
//
//    /**
//     * Returns the per-wire probabilities before and after each operation.
//     * @param {!number} time
//     * @returns {!Array<!number>}
//     */
//    scanProbabilities(time) {
//        let wireRange = range(this.numWires);
//        return this.scanStates(time).map(s => wireRange.map(i => s.probability(1 << i, 1 << i)));
//    }
//
//    /**
//     * Returns a per-wire measure of entanglement before and after each operation.
//     * @param {!number} time
//     * @returns {!Array<!number>}
//     */
//    scanPerWireEntanglementMeasure(time) {
//        let maxRatio = (a, b) => {
//            let min = Math.min(a, b);
//            let max = Math.max(a, b);
//            if (max < 0.00000001) {
//                return 1;
//            }
//            if (min < 0.00000001) {
//                return Infinity;
//            }
//            return max / min;
//        };
//
//        let n = this.numWires;
//        return this.scanStates(time).map(s => range(n).map(i => {
//            let otherWiresMask = (1 << n) - (1 << i) - 1;
//            let p = s.probability(1 << i, 1 << i);
//            let pairs = maskCandidates(otherWiresMask).map(e => {
//                return {off: s.coefficient(e), on: s.coefficient(e | (1 << i))};
//            });
//            let bestPair = pairs.maxBy(e => e.off.norm2() + e.on.norm2());
//            let consistency = pairs.map(e => bestPair.off.times(e.on).minus(e.off.times(bestPair.on)).norm2()).max();
//            return consistency * p * (1 - p);
//            //let dependencies = maskCandidates(otherWiresMask).map(function(e) {
//            //    // assuming that the ratio should stay consistent
//            //    // so aOff/aOn = c
//            //    // thus aOff = c * aOn
//            //    let aOff = s.coefficient(e);
//            //    let aOn = s.coefficient(e | (1 << i));
//            //    return maxRatio(
//            //        aOff.norm2() * p + 0.001,
//            //        aOn.norm2() * (1-p) + 0.001);
//            //});
//            //return Math.log(f.max()) * Math.sqrt(p * (1-p));
//        }));
//    }
//
//    /**
//     * @param {!number} time
//     * @param {!Painter} painter
//     * @param {!Hand} hand
//     */
//    paintWireProbabilityCurves(painter, hand, time) {
//        let probabilities = this.scanProbabilities(time);
//        let entanglementMeasures = this.scanPerWireEntanglementMeasure(time);
//        for (let r = 0; r < this.numWires; r++) {
//            for (let c = 0; c <= this.columns.length; c++) {
//                let x1 = c === 0 ? this.area.x + 30 : this.gateRect(r, c - 1).center().x;
//                let x2 = c === this.columns.length ? this.wireRect(r).right() : this.gateRect(r, c).center().x;
//                let y = this.wireRect(r).center().y;
//                let w = 3;
//                let we = 6;
//
//                let curve = new Rect(x1, y - w, x2 - x1, w * 2);
//                let curveWrapper = new Rect(x1, y - we, x2 - x1, we * 2);
//                let p = probabilities[c][r];
//                painter.ctx.globalAlpha = Math.min(entanglementMeasures[c][r] / 3, 0.65);
//                painter.fillRect(curveWrapper, "#F00");
//                painter.ctx.globalAlpha = 1;
//                painter.fillRect(curve.takeTopProportion(1 - p), Config.WIRE_COLOR_OFF);
//                painter.fillRect(curve.takeBottomProportion(p), Config.WIRE_COLOR_ON);
//
//                hand.paintToolTipIfHoveringIn(
//                    painter,
//                    curveWrapper.withX(hand.pos !== null ? hand.pos.x : 0).withW(1),
//                    describeProbability(p, 1));
//            }
//        }
//    }
//
//    /**
//     * @param {!Painter} painter
//     * @param {!Hand} hand
//     * @param {!number} time
//     */
//    paint(painter, hand, time) {
//        painter.fillRect(this.area, Config.BACKGROUND_COLOR_CIRCUIT);
//        let states = this.scanStates(time);
//
//        // Draw labelled wires
//        for (let i = 0; i < this.numWires; i++) {
//            let wireY = this.wireRect(i).center().y;
//            painter.printCenteredText(this.wireLabeller(i) + ":", new Point(this.area.x + 14, wireY));
//            painter.strokeLine(new Point(this.area.x + 30, wireY), new Point(this.area.x + this.area.w, wireY));
//        }
//
//        this.paintWireProbabilityCurves(painter, hand, time);
//
//        // Draw operations
//        for (let i2 = 0; i2 < this.columns.length; i2++) {
//            this.drawCircuitOperation(painter, this.columns[i2], i2, states[i2 + 1], hand, time);
//        }
//    }
//
//    /**
//     * @param {!Painter} painter
//     * @param {!GateColumn} gateColumn
//     * @param {!int} columnIndex
//     * @param {!QuantumState} state A complex column vector.
//     * @param {!Hand} hand
//     * @param {!number} time
//     */
//    drawCircuitOperation(painter, gateColumn, columnIndex, state, hand, time) {
//
//        this.drawColumnControlWires(painter, gateColumn, columnIndex, state);
//
//        for (let i = 0; i < this.numWires; i++) {
//            let b = this.gateRect(i, columnIndex);
//
//            if (gateColumn.gates[i] === null) {
//                continue;
//            }
//            //noinspection JSValidateTypes
//            /** @type {!Gate} */
//            let gate = gateColumn.gates[i];
//
//            //let isHolding = hand.pos !== null && hand.col === columnIndex && hand.row === i;
//            let canGrab = hand.isHoveringIn(b);
//            gate.paint(painter, b, false, canGrab, time, new CircuitContext(gateColumn, i, state));
//        }
//    }
//
//    /**
//     * @param {!Painter} painter
//     * @param {!GateColumn} gateColumn
//     * @param {!int} columnIndex
//     * @param {!QuantumState} state
//     */
//    drawColumnControlWires(painter, gateColumn, columnIndex, state) {
//        let hasControls = gateColumn.gates.indexOf(Gate.CONTROL) > -1;
//        let hasAntiControls = gateColumn.gates.indexOf(Gate.ANTI_CONTROL) > -1;
//        let hasSwaps = gateColumn.gates.indexOf(Gate.SWAP_HALF) > -1;
//
//        if (!hasControls && !hasAntiControls && !hasSwaps) {
//            return;
//        }
//
//        let masks = gateColumn.masks();
//        let p = state.probability(masks.targetMask, masks.inclusionMask);
//        let minIndex;
//        let maxIndex;
//        for (let i = 0; i < gateColumn.gates.length; i++) {
//            if (gateColumn.gates[gateColumn.gates.length - 1 - i] !== null) {
//                minIndex = gateColumn.gates.length - 1 - i;
//            }
//            if (gateColumn.gates[i] !== null) {
//                maxIndex = i;
//            }
//        }
//        let x = this.opRect(columnIndex).center().x;
//        let y1 = this.wireRect(minIndex).center().y;
//        let y2 = this.wireRect(maxIndex).center().y;
//        painter.strokeLine(new Point(x, y1), new Point(x, y2));
//
//        painter.ctx.globalAlpha = Config.CONTROL_WIRE_ACTIVE_GLOW_ALPHA * p;
//        painter.fillRect(new Rect(x - 3, y1, 6, y2 - y1), Config.CONTROL_WIRE_ACTIVE_GLOW_COLOR);
//        painter.ctx.globalAlpha = 1;
//    }
//
//    /**
//     * @param {?{ col : !number, row : !number, isInsert : !boolean }} modificationPoint
//     * @param {!Hand} hand
//     * @returns {!Circuit}
//     */
//    withOpBeingAdded(modificationPoint, hand) {
//        if (modificationPoint === null || hand.heldGateBlock === null) {
//            return this;
//        }
//        let addedGateBlock = notNull(hand.heldGateBlock);
//
//        let newCols = this.columns.map(e => e);
//        let compressedColumnIndex = null;
//        while (newCols.length <= modificationPoint.col) {
//            newCols.push(GateColumn.empty(this.numWires));
//        }
//
//        if (modificationPoint.isInsert) {
//            newCols.insertAt(modificationPoint.col, GateColumn.empty(this.numWires));
//            compressedColumnIndex = modificationPoint.col;
//        }
//
//        newCols[modificationPoint.col] =
//            newCols[modificationPoint.col].withGateAdded(modificationPoint.row, addedGateBlock);
//
//        return new Circuit(
//            this.area,
//            this.numWires,
//            newCols,
//            compressedColumnIndex,
//            this.wireLabeller);
//    }
//
//    withoutEmpties() {
//        return new Circuit(
//            this.area,
//            this.numWires,
//            this.columns.filter(e => !e.isEmpty()),
//            null,
//            this.wireLabeller);
//    }
//
//    /**
//     * @param {!Hand} hand
//     * @returns {!{newCircuit: !Circuit, newHand: !Hand}}
//     */
//    tryGrab(hand) {
//        if (hand.pos === null) {
//            return {newCircuit: this, newHand: hand};
//        }
//
//        let possibleCol = this.findExistingOpColumnAt(Util.notNull(hand.pos));
//        if (possibleCol === null) {
//            return {newCircuit: this, newHand: hand};
//        }
//
//        let c = Util.notNull(possibleCol);
//        let r = Util.notNull(this.findWireAt(Util.notNull(hand.pos)));
//        if (!this.gateRect(r, c).containsPoint(Util.notNull(hand.pos)) || this.columns[c].gates[r] === null) {
//            return {newCircuit: this, newHand: hand};
//        }
//
//        let newCol = this.columns[c].gates.clone();
//        let gate = newCol[r];
//        newCol[r] = null;
//        let newGateBlock = [gate];
//
//        let remainingSwap = newCol.indexOf(Gate.SWAP_HALF);
//        //let isAnchor = gate.isAnchor() &&
//        //    newCol.filter(function (e) { return e !== null && e.isAnchor(); }).length === 1;
//
//        if (gate === Gate.SWAP_HALF && remainingSwap !== -1) {
//            newCol[remainingSwap] = null;
//            while (newGateBlock.length < Math.abs(remainingSwap - r)) {
//                newGateBlock.push(null);
//            }
//            newGateBlock.push(Gate.SWAP_HALF);
//        }
//
//        return {
//            newCircuit: new Circuit(
//                this.area,
//                this.numWires,
//                this.columns.withItemReplacedAtBy(c, new GateColumn(newCol)),
//                null,
//                this.wireLabeller),
//            newHand: hand.withHeldGate(new GateBlock(newGateBlock), 0)
//        };
//    }
//
//    /**
//     * @returns {!boolean}
//     */
//    hasTimeBasedGates() {
//        return this.columns.any(e => e.gates.any(g => g !== null && g.isTimeBased()));
//    }
//
//    /**
//     * @param {!number} time
//     * @returns {!QuantumState}
//     */
//    getOutput(time) {
//        let states = this.scanStateTextures(time);
//        let amps = states[states.length - 1].toAmplitudes();
//        return new QuantumState(Matrix.col(amps));
//
//        return this.columns
//            .map(e => e.matrixAt(time))
//            .reduce(
//                arg2(QuantumState.prototype.transformedBy),
//                QuantumState.zero(this.numWires));
//    }
//
//;
//
//    /**
//     * Draws a peek gate on each wire at the right-hand side of the circuit.
//     *
//     * @param {!Painter} painter
//     * @param {!number} time
//     */
//    drawRightHandPeekGates(painter, time) {
//        let left = this.area.x + this.area.w - Config.GATE_RADIUS * 2 - CIRCUIT_OP_RIGHT_SPACING;
//        let out = this.getOutput(time);
//        for (let i = 0; i < this.numWires; i++) {
//            painter.paintProbabilityBox(
//                out.probability(1 << i, 1 << i),
//                this.gateRect(i, 0).withX(left));
//        }
//    }
//}
//
//Circuit.DEFAULT_WIRE_LABELLER = Circuit.makeWireLabeller(1);
