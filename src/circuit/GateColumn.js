import DetailedError from "src/base/DetailedError.js"
import Gate from "src/circuit/Gate.js"
import Gates from "src/gates/AllGates.js"
import Matrix from "src/math/Matrix.js"
import Controls from "src/circuit/Controls.js"
import {seq, Seq} from "src/base/Seq.js"
import Util from "src/base/Util.js"

/**
 * A column of gates in a circuit with many qubits.
 */
class GateColumn {
    /**
     * A column of gates in a circuit with many qubits.
     *
     * @param {!Array.<null|!Gate>} gates The list of gates to apply to each wire, with the i'th gate applying to the i'th wire.
     * Wires without a gate in this column should use null instead.
     */
    constructor(gates) {
        /** @type {!Array.<null|!Gate>} */
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
            seq(this.gates).isEqualTo(seq(other.gates), Util.STRICT_EQUALITY);
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
            filter(i => this.gates[i] === Gates.Special.SwapHalf).
            toArray();
        if (swapIndices.length !== 2) {
            return [];
        }
        return [swapIndices];
    }

    hasControl(inputMeasureMask) {
        return this.hasCoherentControl(inputMeasureMask) || this.hasMeasuredControl(inputMeasureMask);
    }

    hasCoherentControl(inputMeasureMask) {
        return Seq.range(this.gates.length).any(i =>
            (inputMeasureMask & (1 << i)) === 0 &&
            this.gates[i] !== null &&
            this.gates[i].isControl());
    }

    hasMeasuredControl(inputMeasureMask) {
        return Seq.range(this.gates.length).any(i =>
            (inputMeasureMask & (1 << i)) !== 0 &&
            this.gates[i] !== null &&
            this.gates[i].definitelyHasNoEffect() &&
            this.gates[i].isControl());
    }

    /**
     * @param {!int} inputMeasureMask
     * @param {!int} row
     * @returns {undefined|!string}
     * @private
     */
    _disabledReason(inputMeasureMask, row) {
        let g = this.gates[row];
        if (g === null) {
            return undefined;
        }

        let customDisableReason = g.customDisableReasonFinder(this, row, inputMeasureMask);
        if (customDisableReason !== undefined) {
            return customDisableReason;
        }

        let disabledInside = this._disabledReason_controlInside(row);
        if (disabledInside !== undefined) {
            return disabledInside;
        }

        let disabledRemix = this._disabledReason_remixing(row, inputMeasureMask);
        if (disabledRemix !== undefined) {
            return disabledRemix;
        }

        let disabledCollision = this._disabledReason_overlappingTags(row);
        if (disabledCollision !== undefined) {
            return disabledCollision;
        }

        return undefined;
    }

    /**
     * @param {!int} row
     * @returns {undefined|!string}
     * @private
     */
    _disabledReason_overlappingTags(row) {
        let keys = new Set(this.gates[row].customColumnContextProvider(row).map(e => e.key));
        if (keys.length === 0) {
            return undefined;
        }

        for (let i = 0; i < row; i++) {
            let g = this.gates[i];
            for (let {key: otherKey} of g === null ? [] : g.customColumnContextProvider(i)) {
                //noinspection JSUnusedAssignment
                if (keys.has(otherKey)) {
                    return "already\ndefined";
                }
            }
        }

        return undefined;
    }

    /**
     * @param {!int} row
     * @param {!int} inputMeasureMask
     * @returns {undefined|!string}
     * @private
     */
    _disabledReason_remixing(row, inputMeasureMask) {
        // Measured qubits can't be re-superposed for implementation simplicity reasons.
        let g = this.gates[row];
        let mask = ((1 << g.height) - 1) << row;
        let maskMeasured = mask & inputMeasureMask;
        if (maskMeasured !== 0) {
            if (g.effectMightCreateSuperpositions()) {
                return "no\nremix\n(sorry)";
            }
            if (g.effectMightPermutesStates() && (maskMeasured !== mask || this.hasCoherentControl(inputMeasureMask))) {
                return "no\nremix\n(sorry)";
            }
        }
        return undefined;
    }

    /**
     * @param {!int} row
     * @returns {undefined|!string}
     * @private
     */
    _disabledReason_controlInside(row) {
        let g = this.gates[row];
        for (let j = 1; j < g.height && row + j < this.gates.length; j++) {
            if (this.gates[row + j] !== null && this.gates[row + j].isControl()) {
                return "control\ninside";
            }
        }
        return undefined;
    }

    minimumRequiredWireCount() {
        let best = 0;
        for (let i = 0; i < this.gates.length; i++) {
            if (this.gates[i] !== null) {
                best = Math.max(best, this.gates[i].height + i);
            }
        }
        return best;
    }

    maximumGateWidth() {
        return seq(this.gates).
            filter(g => g !== null).
            map(g => g.width).
            max(-Infinity);
    }

    disabledReasons(inputMeasureMask) {
        return Seq.range(this.gates.length).map(i => this._disabledReason(inputMeasureMask, i)).toArray();
    }

    nextMeasureMask(inputMeasureMask, disabledReasons) {
        return Seq.range(this.gates.length).aggregate([inputMeasureMask, undefined], ([measureMask, prevSwap], row) => {
            if (disabledReasons[row] !== undefined) {
                return [measureMask, prevSwap];
            }

            let gate = this.gates[row];
            let bit = 1 << row;

            // The measurement gate measures.
            if (gate === Gates.Special.Measurement) {
                return [measureMask | bit, prevSwap];
            }

            // Post-selection gates un-measure (in that the simulator can then do coherent operations on the qubit
            // without getting the wrong answer, at least).
            let hasSingleResult = gate === Gates.PostSelectionGates.PostSelectOn
                || gate === Gates.PostSelectionGates.PostSelectOff;
            if (!this.hasControl() && hasSingleResult) {
                return [measureMask & ~bit, prevSwap];
            }

            // Swap gate swaps measurements.
            if (gate === Gates.Special.SwapHalf) {
                if (prevSwap === undefined) {
                    return [measureMask, row];
                }

                let other = 1 << prevSwap;
                let d = row - prevSwap;
                return [
                    (measureMask & ~(other | bit)) | ((measureMask & other) << d) | ((measureMask & bit) >> d),
                    undefined
                ];
            }

            return [measureMask, prevSwap];
        })[0];
    }

    /**
     * @param {!int} startIndex
     * @param {!GateColumn} insertedCol
     * @returns {!GateColumn}
     */
    withGatesAdded(startIndex, insertedCol) {
        if (!Number.isInteger(startIndex) || startIndex < 0
                || startIndex > this.gates.length- insertedCol.gates.length) {
            throw new DetailedError("Bad start index", {baseCol: this, startIndex, insertedCol});
        }
        let gates = this.gates.map(e => e);
        for (let i = 0; i < insertedCol.gates.length; i++) {
            gates[startIndex + i] = insertedCol.gates[i];
        }
        return new GateColumn(gates);
    }
}

export default GateColumn;
