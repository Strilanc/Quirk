/**
 * A column of gates in a circuit with many qubits.
 *
 * @param {!Array.<?Gate>} gates The list of gates to apply to each wire, with the i'th gate applying to the i'th wire.
 * Wires without a gate in this column should use null instead.
 *
 * @property {!Array.<?Gate>} gates
 * @constructor
 */
function GateColumn(gates) {
    this.gates = gates;
}

/**
 * @param {object} json
 * @returns {!GateColumn}
 * @throws
 */
GateColumn.fromJson = function(json) {
    var gates = forceGetProperty(json, "gates");
    if (!Array.isArray(gates)) { throw new Error("gates must be an array."); }
    return new GateColumn(gates.map(wrapFuncToPropagateNull(Gate.fromJson)));
};

/**
 * @returns {!object}
 */
GateColumn.prototype.toJson = function() {
    return { gates: this.gates.map(wrapFuncToPropagateNull(arg1(Gate.prototype.toJson))) };
};

/**
 * @returns {!{targetMask: !int, inclusionMask: !int}}
 */
GateColumn.prototype.masks = function() {
    var targetMask = 0;
    var inclusionMask = 0;
    for (var i = 0; i < this.gates.length; i++) {
        if (this.gates[i] === Gate.CONTROL) {
            inclusionMask |= 1 << i;
            targetMask |= 1 << i;
        } else if (this.gates[i] === Gate.ANTI_CONTROL) {
            inclusionMask |= 1 << i;
        }
    }
    return {targetMask: targetMask, inclusionMask: inclusionMask};
};

/**
 * @param {!GateColumn|*} other
 * @returns {!boolean}
 */
GateColumn.prototype.isEqualTo = function (other) {
    if (this === other) {
        return true;
    }
    return other instanceof GateColumn &&
        this.gates.isEqualToBy(other.gates, STRICT_EQUALITY);
};

GateColumn.prototype.toString = function() {
    return "GateColumn(" + this.gates.toArrayString() + ")";
};

/**
 * @param {!int} size
 * @returns {!GateColumn}
 */
GateColumn.empty = function(size) {
    return new GateColumn(repeat(null, size));
};

/**
 * @returns {!boolean}
 */
GateColumn.prototype.isEmpty = function() {
    return this.gates.every(function(e) { return e === null; });
};

/**
 * Returns the matrix corresponding to the parallel applications of the operations in this circuit column.
 * @param {!number} time
 * @returns {!Matrix}
 */
GateColumn.prototype.matrixAt = function(time) {
    var ops = [];
    var swapIndices = [];
    for (var i = 0; i < this.gates.length; i++) {
        var op;
        if (this.gates[i] === null) {
            op = Matrix.identity(2);
        } else if (this.gates[i] === Gate.SWAP_HALF) {
            swapIndices.push(i);
            op = Matrix.identity(2);
        } else {
            op = this.gates[i].matrixAt(time);
        }
        ops.push(op);
    }

    var result = ops.reduce(function (a, e) { return e.tensorProduct(a); }, Matrix.identity(1));
    if (swapIndices.length === 2) {
        result = Matrix.fromWireSwap(this.gates.length, swapIndices[0], swapIndices[1]).times(result);
    }
    return result;
};

/**
 * @returns {!ControlMask}
 */
GateColumn.prototype.fullControlMask = function() {
    var mask = ControlMask.NO_CONTROLS;
    for (var i = 0; i < this.gates.length; i++) {
        var g = this.gates[i];
        if (g === Gate.CONTROL) {
            mask = mask.combine(ControlMask.fromBitIs(i, true));
        } else if (g === Gate.ANTI_CONTROL) {
            mask = mask.combine(ControlMask.fromBitIs(i, false));
        }
    }
    return mask;
};

/**
 * @param {!int} startIndex
 * @param {!GateBlock} gateBlock
 * @returns {!GateColumn}
 */
GateColumn.prototype.withGateAdded = function(startIndex, gateBlock) {
    need(startIndex >= 0 && startIndex <= this.gates.length - gateBlock.gates.length);
    var gates = this.gates.map(function(e) { return e; });
    for (var i = 0; i < gateBlock.gates.length; i++) {
        gates[startIndex + i] = gateBlock.gates[i];
    }
    return new GateColumn(gates);
};

/**
 * Returns the probability of controls on a column being satisfied and a wire being ON,
 * if that was measured.
 *
 * @param {!int} targetWire
 * @param {!QuantumState} columnState
 * @returns {!{probabilityOfCondition: !number, probabilityOfHitGivenCondition: !number, canDiffer: !boolean}}
 */
GateColumn.prototype.measureProbabilityOn = function (targetWire, columnState) {
    var colMasks = this.masks();
    var wireMask = 1 << targetWire;
    var p = columnState.conditionalProbability(colMasks.targetMask | wireMask, wireMask, colMasks.inclusionMask);
    return {
        probabilityOfCondition: p.probabilityOfCondition,
        probabilityOfHitGivenCondition: p.probabilityOfHitGivenCondition,
        canDiffer: colMasks.inclusionMask !== 0
    };
};
