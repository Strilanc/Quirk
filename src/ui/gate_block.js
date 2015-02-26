var force6 = e => e;

/**
 * A combined gate.
 *
 * @param {!Array<!Gate>} gates
 *
 * @property {!Array<!Gate>} gates
 *
 * @constructor
 */
function GateBlock(gates) {
    this.gates = gates;
}

/**
 *
 * @param {!GateBlock|*} other
 * @returns {!boolean}
 */
GateBlock.prototype.isEqualTo = function(other) {
    if (this === other) {
        return true;
    }
    return other instanceof GateBlock &&
        this.gates.isEqualToBy(other.gates, STRICT_EQUALITY);
};

GateBlock.prototype.toString = function() {
    return "GateBlock(" + this.gates.toArrayString() + ")";
};

/**
 * @param {!Gate} gate
 * @returns {!GateBlock}
 */
GateBlock.single = function(gate) {
    return new GateBlock([gate]);
};

/**
 * @param {!int} separation
 * @returns {!GateBlock}
 */
GateBlock.swap = function(separation) {
    var gates = [Gate.SWAP_HALF];
    while (gates.length < separation) {
        gates.push(null);
    }
    gates.push(Gate.SWAP_HALF);
    return new GateBlock(gates);
};
