/**
 * A combined gate.
 *
 * @param {!Array.<!Gate>} gates
 *
 * @property {!Array.<!Gate>} gates
 *
 * @constructor
 */
function GateBlock(gates) {
    this.gates = gates;
}

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
