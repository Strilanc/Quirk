/** @type {!number} */
var CIRCUIT_OP_HORIZONTAL_SPACING = 10;
/** @type {!number} */
var CIRCUIT_OP_LEFT_SPACING = 35;
/** @type {!number} */
var CIRCUIT_OP_RIGHT_SPACING = 5;

/**
 * @param {!Array.<!int>|!int} grouping
 * @returns {!function() : !string}
 */
Circuit.makeWireLabeller = function (grouping) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (grouping === 1) {
        return function(i) {
            return alphabet[i];
        };
    }

    if (typeof grouping === 'number') {
        need(grouping >= 1, "grouping >= 1", arguments);
        return function(i) {
            var g = Math.floor(i / grouping);
            var e = i % grouping;
            return alphabet[g] + (e + 1);
        };
    }

    if (Array.isArray(grouping)) {
        var labels = [];
        for (var g = 0; g < grouping.length; g++) {
            if (grouping[g] === 1) {
                labels.push(alphabet[g]);
            } else {
                for (var i = 0; i < grouping[g]; i++) {
                    labels.push(alphabet[g] + (i + 1));
                }
            }
        }
        return function(i) {
            return labels[i];
        };
    }

    throw "Unrecognized grouping type: " + grouping;
};

Circuit.DEFAULT_WIRE_LABELLER = Circuit.makeWireLabeller(1);

/**
 *
 * @param {!Rect} area
 * @param {!int} numWires
 * @param {!Array.<!GateColumn>} columns
 * @param {?int} compressedColumnIndex
 * @param {undefined|!function(!int) : !string} wireLabeller
 *
 * @property {!Rect} area
 * @property {!int} numWires
 * @property {!Array.<!GateColumn>} columns;
 * @property {?int} compressedColumnIndex
 * @property {!function(!int) : !string} wireLabeller
 *
 * @constructor
 */
function Circuit(area, numWires, columns, compressedColumnIndex, wireLabeller) {
    need(numWires >= 0, "numWires >= 0", arguments);
    need(columns.every(function(e) { return e instanceof GateColumn; }), "columns not columns", arguments);
    need(columns.every(function(e) { return e.gates.length === numWires; }), "columns of correct length", arguments);
    this.area = area;
    this.numWires = numWires;
    this.columns = columns;
    this.compressedColumnIndex = compressedColumnIndex;
    this.wireLabeller = wireLabeller || Circuit.DEFAULT_WIRE_LABELLER;
}

/**
 * @param {!Rect} drawArea
 */
Circuit.prototype.updateArea = function(drawArea) {
    this.area = drawArea;
};

Circuit.prototype.isEqualTo = function(other) {
    if (this === other) {
        return true;
    }
    var self = this;
    return other instanceof Circuit &&
        this.area.isEqualTo(other.area) &&
        this.numWires === other.numWires &&
        this.columns.isEqualToBy(other.columns, CUSTOM_IS_EQUAL_TO_EQUALITY) &&
        this.compressedColumnIndex === other.compressedColumnIndex &&
        range(this.numWires).every(function(i) { return self.wireLabeller(i) === other.wireLabeller(i); });
};

Circuit.prototype.toString = function() {
    return "Circuit(area: " + this.area +
        ", numWires: " + this.numWires +
        ", columns: " + this.columns.toArrayString() +
        ", compressedColumnIndex: " + this.compressedColumnIndex + ")";
};

/**
 * Returns the circuit's initial, intermediate, and final states.
 * @param {!number} time
 * @returns {!Array.<!QuantumState>}
 */
Circuit.prototype.scanStates = function(time) {
    return this.columns.
        map(function(e) { return e.matrixAt(time); }).
        scan(
            QuantumState.zero(this.numWires),
            arg2(QuantumState.prototype.transformedBy));
};

/**
 * @param {!int} columnIndex
 * @param {!number} time
 * @returns {!Matrix}
 */
Circuit.prototype.getCumulativeOperationUpToBefore = function(columnIndex, time) {
    return this.columns.slice(0, columnIndex).
        map(function(e) { return e.matrixAt(time); }).
        reduce(function(a, e) { return e.times(a); }, Matrix.identity(1 << this.numWires));
};

/**
 * @returns {!number}
 */
Circuit.prototype.getWireSpacing = function() {
    return this.area.h / this.numWires;
};

/**
 * @param {!int} wireIndex
 * @returns {!Rect}
 */
Circuit.prototype.wireRect = function (wireIndex) {
    need(wireIndex >= 0 && wireIndex < this.numWires, "wireIndex out of range", arguments);
    var wireHeight = this.getWireSpacing();
    return this.area.skipTop(wireHeight * wireIndex).takeTop(wireHeight);
};

/**
 * @param {!Point} p
 * @returns {?int}
 */
Circuit.prototype.findWireAt = function (p) {
    if (!this.area.containsPoint(p)) {
        return null;
    }

    return Math.floor((p.y - this.area.y) * this.numWires / this.area.h);
};

/**
 * @returns {!Array.<!string>}}
 */
Circuit.prototype.getLabels = function() {
    return range(this.numWires).map(this.wireLabeller);
};

/**
 * @param {!Point} p
 * @returns {?number}
 * @private
 */
Circuit.prototype.findContinuousColumnX = function(p) {
    if (!this.area.containsPoint(p)) {
        return null;
    }

    var s = (CIRCUIT_OP_HORIZONTAL_SPACING + Config.GATE_RADIUS*2);
    var left = this.area.x + CIRCUIT_OP_LEFT_SPACING - CIRCUIT_OP_HORIZONTAL_SPACING/2;
    var dg = (p.x - left) / s;
    return dg - 0.5;
};

/**
 * @param {!Point} p
 * @returns {?number}
 */
Circuit.prototype.findOpHalfColumnAt = function(p) {
    if (!this.area.containsPoint(p)) {
        return null;
    }

    return Math.max(-0.5, Math.round(this.findContinuousColumnX(p) * 2) / 2);
};

/**
 * @param {!Point} p
 * @returns {?int}
 */
Circuit.prototype.findExistingOpColumnAt = function(p) {
    if (!this.area.containsPoint(p)) {
        return null;
    }

    var x = this.findContinuousColumnX(p);
    var i;
    if (this.compressedColumnIndex === null || x < this.compressedColumnIndex - 0.75) {
        i = Math.round(x);
    } else if (x < this.compressedColumnIndex - 0.25) {
        i = this.compressedColumnIndex;
    } else {
        i = Math.round(x) - 1;
    }

    if (i < 0 || i >= this.columns.length) {
        return null;
    }

    return i;
};

/**
 * @param {!Hand} hand
 * @returns {?{ col : !number, row : !number, isInsert : !boolean }}
 */
Circuit.prototype.findModificationIndex = function (hand) {
    if (hand.pos === null) {
        return null;
    }
    var halfColIndex = this.findOpHalfColumnAt(notNull(hand.pos));
    if (halfColIndex === null) {
        return null;
    }
    var wireIndex = notNull(this.findWireAt(notNull(hand.pos)));
    var colIndex = Math.ceil(halfColIndex);
    var isInsert = Math.abs(halfColIndex % 1) === 0.5;
    if (colIndex >= this.columns.length) {
        return {col: colIndex, row: wireIndex, isInsert: isInsert};
    }

    if (!isInsert) {
        var isFree = this.columns[colIndex].gates[wireIndex] === null;
        if (hand.heldGateBlock !== null) {
            for (var k = 1; k < hand.heldGateBlock.gates.length; k++) {
                if (this.columns[colIndex].gates[wireIndex + k] !== null) {
                    isFree = false;
                }
            }
        }
        if (!isFree) {
            var isAfter = hand.pos.x > this.opRect(colIndex).center().x;
            isInsert = true;
            if (isAfter) {
                colIndex += 1;
            }
        }
    }

    return {col: colIndex, row: wireIndex, isInsert: isInsert};
};

/**
 * @param {!int} operationIndex
 * @returns {Rect!}
 */
Circuit.prototype.opRect = function (operationIndex) {
    var opWidth = Config.GATE_RADIUS * 2;
    var opSeparation = opWidth + CIRCUIT_OP_HORIZONTAL_SPACING;
    var tweak = 0;
    if (this.compressedColumnIndex !== null && operationIndex === this.compressedColumnIndex) {
        tweak = opSeparation/2;
    }
    if (this.compressedColumnIndex !== null && operationIndex > this.compressedColumnIndex) {
        tweak = opSeparation;
    }

    var dx = opSeparation * operationIndex - tweak + CIRCUIT_OP_LEFT_SPACING;
    return this.area.withX(this.area.x + dx).withW(opWidth);
};

/**
 * @param {!int} wireIndex
 * @param {!int} operationIndex
 */
Circuit.prototype.gateRect = function (wireIndex, operationIndex) {
    var op = this.opRect(operationIndex);
    var wire = this.wireRect(wireIndex);
    return Rect.centeredSquareWithRadius(new Point(op.x + Config.GATE_RADIUS, wire.center().y), Config.GATE_RADIUS);
};

/**
 * Returns the per-wire probabilities before and after each operation.
 * @param {!number} time
 * @returns {!Array.<!number>}
 */
Circuit.prototype.scanProbabilities = function(time) {
    var wireRange = range(this.numWires);
    return this.scanStates(time).map(function(s) {
        return wireRange.map(function(i) {
            return s.probability(1 << i, 1 << i);
        });
    });
};

/**
 * Returns a per-wire measure of entanglement before and after each operation.
 * @param {!number} time
 * @returns {!Array.<!number>}
 */
Circuit.prototype.scanPerWireEntanglementMeasure = function(time) {
    var maxRatio = function(a, b) {
        var min = Math.min(a, b);
        var max = Math.max(a, b);
        if (max < 0.00000001) {
            return 1;
        }
        if (min < 0.00000001) {
            return Infinity;
        }
        return max / min;
    };

    var n = this.numWires;
    return this.scanStates(time).map(function(s) {
        return range(n).map(function(i) {
            var otherWiresMask = (1 << n) - (1 << i) - 1;
            var p = s.probability(1 << i, 1 << i);
            var pairs = maskCandidates(otherWiresMask).map(function(e) {
                return {off: s.coefficient(e), on: s.coefficient(e | (1 << i))};
            });
            var bestPair = pairs.maxBy(function(e) { return e.off.norm2() + e.on.norm2(); });
            var consistency = pairs.map(function(e) {
                return bestPair.off.times(e.on).minus(e.off.times(bestPair.on)).norm2();
            }).max();
            return consistency * p * (1 - p);
            //var dependencies = maskCandidates(otherWiresMask).map(function(e) {
            //    // assuming that the ratio should stay consistent
            //    // so aOff/aOn = c
            //    // thus aOff = c * aOn
            //    var aOff = s.coefficient(e);
            //    var aOn = s.coefficient(e | (1 << i));
            //    return maxRatio(
            //        aOff.norm2() * p + 0.001,
            //        aOn.norm2() * (1-p) + 0.001);
            //});
            //return Math.log(f.max()) * Math.sqrt(p * (1-p));
        });
    });
};

/**
 * @param {!number} time
 * @param {!Painter} painter
 * @param {!Hand} hand
 */
Circuit.prototype.paintWireProbabilityCurves = function(painter, hand, time) {
    var probabilities = this.scanProbabilities(time);
    var entanglementMeasures = this.scanPerWireEntanglementMeasure(time);
    for (var r = 0; r < this.numWires; r++) {
        for (var c = 0; c <= this.columns.length; c++) {
            var x1 = c === 0 ? this.area.x + 30 : this.gateRect(r, c - 1).center().x;
            var x2 = c === this.columns.length ? this.wireRect(r).right() : this.gateRect(r, c).center().x;
            var y = this.wireRect(r).center().y;
            var w = 3;
            var we = 6;

            var curve = new Rect(x1, y - w, x2 - x1, w * 2);
            var curveWrapper = new Rect(x1, y - we, x2 - x1, we * 2);
            var p = probabilities[c][r];
            painter.ctx.globalAlpha = Math.min(entanglementMeasures[c][r]/3, 0.65);
            painter.fillRect(curveWrapper, "#F00");
            painter.ctx.globalAlpha = 1;
            painter.fillRect(curve.takeTopProportion(1 - p), Config.WIRE_COLOR_OFF);
            painter.fillRect(curve.takeBottomProportion(p), Config.WIRE_COLOR_ON);

            hand.paintToolTipIfHoveringIn(
                painter,
                curveWrapper.withX(hand.pos !== null ? hand.pos.x : 0).withW(1),
                "P(ON) = " + describeProbability(p, 1));
        }
    }
};

/**
 * @param {!Painter} painter
 * @param {!Hand} hand
 * @param {!number} time
 */
Circuit.prototype.paint = function(painter, hand, time) {
    painter.fillRect(this.area, Config.BACKGROUND_COLOR_CIRCUIT);
    var states = this.scanStates(time);

    // Draw labelled wires
    for (var i = 0; i < this.numWires; i++) {
        var wireY = this.wireRect(i).center().y;
        painter.printCenteredText(this.wireLabeller(i) + ":", new Point(this.area.x + 14, wireY));
        painter.strokeLine(new Point(this.area.x + 30, wireY), new Point(this.area.x + this.area.w, wireY));
    }

    this.paintWireProbabilityCurves(painter, hand, time);

    // Draw operations
    for (var i2 = 0; i2 < this.columns.length; i2++) {
        this.drawCircuitOperation(painter, this.columns[i2], i2, states[i2 + 1], hand, time);
    }
};

/**
 * @param {!Painter} painter
 * @param {!GateColumn} gateColumn
 * @param {!int} columnIndex
 * @param {!QuantumState} state A complex column vector.
 * @param {!Hand} hand
 * @param {!number} time
 */
Circuit.prototype.drawCircuitOperation = function (painter, gateColumn, columnIndex, state, hand, time) {

    this.drawColumnControlWires(painter, gateColumn, columnIndex, state);

    for (var i = 0; i < this.numWires; i++) {
        var b = this.gateRect(i, columnIndex);

        if (gateColumn.gates[i] === null) {
            continue;
        }
        //noinspection JSValidateTypes
        /** @type {!Gate} */
        var gate = gateColumn.gates[i];

        //var isHolding = hand.pos !== null && hand.col === columnIndex && hand.row === i;
        var canGrab = hand.isHoveringIn(b);
        gate.paint(painter, b, false, canGrab, time, new CircuitContext(gateColumn, i, state));
    }
};

/**
 * @param {!Painter} painter
 * @param {!GateColumn} gateColumn
 * @param {!int} columnIndex
 * @param {!QuantumState} state
 */
Circuit.prototype.drawColumnControlWires = function (painter, gateColumn, columnIndex, state) {
    var hasControls = gateColumn.gates.indexOf(Gate.CONTROL) > -1;
    var hasAntiControls = gateColumn.gates.indexOf(Gate.ANTI_CONTROL) > -1;
    var hasSwaps = gateColumn.gates.indexOf(Gate.SWAP_HALF) > -1;

    if (!hasControls && !hasAntiControls && !hasSwaps) {
        return;
    }

    var masks = gateColumn.masks();
    var p = state.probability(masks.targetMask, masks.inclusionMask);
    var minIndex;
    var maxIndex;
    for (var i = 0; i < gateColumn.gates.length; i++) {
        if (gateColumn.gates[gateColumn.gates.length - 1 - i] !== null) {
            minIndex = gateColumn.gates.length - 1 - i;
        }
        if (gateColumn.gates[i] !== null) {
            maxIndex = i;
        }
    }
    var x = this.opRect(columnIndex).center().x;
    var y1 = this.wireRect(minIndex).center().y;
    var y2 = this.wireRect(maxIndex).center().y;
    painter.strokeLine(new Point(x, y1), new Point(x, y2));

    painter.ctx.globalAlpha = Config.CONTROL_WIRE_ACTIVE_GLOW_ALPHA * p;
    painter.fillRect(new Rect(x - 3, y1, 6, y2 - y1), Config.CONTROL_WIRE_ACTIVE_GLOW_COLOR);
    painter.ctx.globalAlpha = 1;
};

/**
 * @param {?{ col : !number, row : !number, isInsert : !boolean }} modificationPoint
 * @param {!Hand} hand
 * @returns {!Circuit}
 */
Circuit.prototype.withOpBeingAdded = function(modificationPoint, hand) {
    if (modificationPoint === null || hand.heldGateBlock === null) {
        return this;
    }
    var addedGateBlock = notNull(hand.heldGateBlock);

    var newCols = this.columns.map(function(e) { return e; });
    var compressedColumnIndex = null;
    while (newCols.length <= modificationPoint.col) {
        newCols.push(GateColumn.empty(this.numWires));
    }

    if (modificationPoint.isInsert) {
        newCols.insertAt(modificationPoint.col, GateColumn.empty(this.numWires));
        compressedColumnIndex = modificationPoint.col;
    }

    newCols[modificationPoint.col] =
        newCols[modificationPoint.col].withGateAdded(modificationPoint.row, addedGateBlock);

    return new Circuit(
        this.area,
        this.numWires,
        newCols,
        compressedColumnIndex,
        this.wireLabeller);
};

Circuit.prototype.withoutEmpties = function() {
    return new Circuit(
        this.area,
        this.numWires,
        this.columns.filter(function (e) { return !e.isEmpty();}),
        null,
        this.wireLabeller);
};

/**
 * @param {!Hand} hand
 * @returns {!{newCircuit: !Circuit, newHand: !Hand}}
 */
Circuit.prototype.tryGrab = function(hand) {
    if (hand.pos === null) {
        return {newCircuit: this, newHand: hand};
    }

    var possibleCol = this.findExistingOpColumnAt(notNull(hand.pos));
    if (possibleCol === null) {
        return {newCircuit: this, newHand: hand};
    }

    var c = notNull(possibleCol);
    var r = notNull(this.findWireAt(notNull(hand.pos)));
    if (!this.gateRect(r, c).containsPoint(notNull(hand.pos)) || this.columns[c].gates[r] === null) {
        return {newCircuit: this, newHand: hand};
    }

    var newCol = this.columns[c].gates.clone();
    var gate = newCol[r];
    newCol[r] = null;
    var newGateBlock = [gate];

    var remainingSwap = newCol.indexOf(Gate.SWAP_HALF);
    //var isAnchor = gate.isAnchor() &&
    //    newCol.filter(function (e) { return e !== null && e.isAnchor(); }).length === 1;

    if (gate === Gate.SWAP_HALF && remainingSwap !== -1) {
        newCol[remainingSwap] = null;
        while (newGateBlock.length < Math.abs(remainingSwap - r)) {
            newGateBlock.push(null);
        }
        newGateBlock.push(Gate.SWAP_HALF);
    }

    return {
        newCircuit: new Circuit(
            this.area,
            this.numWires,
            this.columns.withItemReplacedAtBy(c, new GateColumn(newCol)),
            null,
            this.wireLabeller),
        newHand: hand.withHeldGate(new GateBlock(newGateBlock), 0)
    };
};

/**
 * @returns {!boolean}
 */
Circuit.prototype.hasTimeBasedGates = function () {
    return this.columns.any(function (e) {
        return e.gates.any(function(g) {
            return g !== null && g.isTimeBased();
        });
    });
};

/**
 * @param {!number} time
 * @returns {!QuantumState}
 */
Circuit.prototype.getOutput = function(time) {
    return this.columns
        .map(function(e) { return e.matrixAt(time); })
        .reduce(
            arg2(QuantumState.prototype.transformedBy),
            QuantumState.zero(this.numWires));
};

/**
 * Draws a peek gate on each wire at the right-hand side of the circuit.
 *
 * @param {!Painter} painter
 * @param {!number} time
 */
Circuit.prototype.drawRightHandPeekGates = function (painter, time) {
    var left = this.area.x + this.area.w - Config.GATE_RADIUS*2 - CIRCUIT_OP_RIGHT_SPACING;
    var out = this.getOutput(time);
    for (var i = 0; i < this.numWires; i++) {
        painter.paintProbabilityBox(
            out.probability(1 << i, 1 << i),
            this.gateRect(i, 0).withX(left));
    }
};
