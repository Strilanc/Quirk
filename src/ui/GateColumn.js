import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Gate from "src/ui/Gate.js"
import Matrix from "src/math/Matrix.js"
import Gates from "src/ui/Gates.js"
import describe from "src/base/Describe.js"
import ControlMask from "src/quantum/ControlMask.js"

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

    ///**
    // * Returns the matrix corresponding to the parallel applications of the operations in this circuit column.
    // * @param {!number} time
    // * @returns {!Matrix}
    // */
    //matrixAt(time) {
    //    let ops = [];
    //    let swapIndices = [];
    //    for (let i = 0; i < this.gates.length; i++) {
    //        let op;
    //        if (this.gates[i] === null) {
    //            op = Matrix.identity(2);
    //        } else if (this.gates[i] === Gates.Named.Special.SwapHalf) {
    //            swapIndices.push(i);
    //            op = Matrix.identity(2);
    //        } else {
    //            op = this.gates[i].matrixAt(time);
    //        }
    //        ops.push(op);
    //    }
    //
    //    let result = ops.reduce(function (a, e) {
    //        return e.tensorProduct(a);
    //    }, Matrix.identity(1));
    //    if (swapIndices.length === 2) {
    //        result = Matrix.fromWireSwap(this.gates.length, swapIndices[0], swapIndices[1]).times(result);
    //    }
    //    return result;
    //}

    /**
     * @param {!number} time
     * @returns {!(!{m: !Matrix, i: !int}[])}
     */
    singleQubitOperationsAt(time) {
        let I = Matrix.identity(2);
        return Seq.
            range(this.gates.length).
            filter(i => {
                if (this.gates[i] === null) {
                    return false;
                }
                let m = this.gates[i].matrixAt(time);
                return m.width() === 2 && m.height() === 2 && !m.isEqualTo(I);
            }).
            map(i => ({m: this.gates[i].matrixAt(time), i: i})).
            toArray();
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
     * @returns {!ControlMask}
     */
    controls() {
        return Seq.
            range(this.gates.length).
            map(i =>
                this.gates[i] === Gates.Named.Special.Control ? ControlMask.fromBitIs(i, true) :
                this.gates[i] === Gates.Named.Special.AntiControl ? ControlMask.fromBitIs(i, false) :
                ControlMask.NO_CONTROLS).
            aggregate(ControlMask.NO_CONTROLS, (a, e) => a.combine(e));
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

    ///**
    // * Returns the probability of controls on a column being satisfied and a wire being ON,
    // * if that was measured.
    // *
    // * @param {!int} targetWire
    // * @param {!QuantumState} columnState
    // * @returns {!{probabilityOfCondition: !number, probabilityOfHitGivenCondition: !number, canDiffer: !boolean}}
    // */
    //measureProbabilityOn(targetWire, columnState) {
    //    let colMasks = this.masks();
    //    let wireMask = 1 << targetWire;
    //    let p = columnState.conditionalProbability(colMasks.targetMask | wireMask, wireMask, colMasks.inclusionMask);
    //    return {
    //        probabilityOfCondition: p.probabilityOfCondition,
    //        probabilityOfHitGivenCondition: p.probabilityOfHitGivenCondition,
    //        canDiffer: colMasks.inclusionMask !== 0
    //    };
    //}
}

export default GateColumn;
