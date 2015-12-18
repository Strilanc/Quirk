import Gate from "src/circuit/Gate.js"
import Gates from "src/ui/Gates.js"
import Matrix from "src/math/Matrix.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import Util from "src/base/Util.js"

/**
 * A column of gates in a circuit with many qubits.
 */
class GateColumn {
    /**
     * A column of gates in a circuit with many qubits.
     *
     * @param {!(?Gate[])} gates The list of gates to apply to each wire, with the i'th gate applying to the i'th wire.
     * Wires without a gate in this column should use null instead.
     *
     * @property {!(?Gate[])} gates
     */
    constructor(gates) {
        this.gates = gates;
    }

    /**
     * @param {!GateColumn|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof GateColumn &&
            new Seq(this.gates).isEqualTo(new Seq(other.gates), Util.STRICT_EQUALITY);
    }

    /**
     * @param {!int} qubitCount
     * @returns {!GateColumn}
     */
    static empty(qubitCount) {
        return new GateColumn(Seq.repeat(null, qubitCount).toArray());
    }

    /**
     * @returns {!boolean}
     */
    isEmpty() {
        return this.gates.every(e => e === null);
    }

    /**
     * @returns {!(!(![!int, !int])[])}
     */
    swapPairs() {
        let swapIndices = Seq.
            range(this.gates.length).
            filter(i => this.gates[i] === Gates.Named.Special.SwapHalf).
            toArray();
        if (swapIndices.length !== 2) {
            return [];
        }
        return [swapIndices];
    }

    /**
     * @returns {!QuantumControlMask}
     */
    controls() {
        return Seq.
            range(this.gates.length).
            map(i =>
                this.gates[i] === Gates.Named.Special.Control ? QuantumControlMask.fromBitIs(i, true) :
                this.gates[i] === Gates.Named.Special.AntiControl ? QuantumControlMask.fromBitIs(i, false) :
                QuantumControlMask.NO_CONTROLS).
            aggregate(QuantumControlMask.NO_CONTROLS, (a, e) => a.combine(e));
    }

    /**
     * @param {!int} startIndex
     * @param {!GateColumn} gateCol
     * @returns {!GateColumn}
     */
    withGatesAdded(startIndex, gateCol) {
        Util.need(startIndex >= 0 && startIndex <= this.gates.length - gateCol.gates.length);
        let gates = this.gates.map(e => e);
        for (let i = 0; i < gateCol.gates.length; i++) {
            gates[startIndex + i] = gateCol.gates[i];
        }
        return new GateColumn(gates);
    }
}

export default GateColumn;
