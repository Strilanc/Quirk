/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {DetailedError} from "../base/DetailedError.js"
import {Gate} from "./Gate.js"
import {GateCheckArgs} from "./GateCheckArgs.js"
import {Gates} from "../gates/AllGates.js"
import {seq, Seq} from "../base/Seq.js"
import {Util} from "../base/Util.js"

/**
 * A column of gates in a circuit with many qubits.
 */
class GateColumn {
    /**
     * A column of gates in a circuit with many qubits.
     *
     * @param {!Array.<undefined|!Gate>} gates The list of gates to apply to each wire, with the i'th gate applying to
     *                                         the i'th wire.
     * Wires without a gate in this column should use undefined instead.
     */
    constructor(gates) {
        /** @type {!Array.<undefined|!Gate>} */
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
        return new GateColumn(new Array(qubitCount).fill(undefined));
    }

    /**
     * @returns {Infinity|!number}
     */
    stableDuration() {
        return Math.min(Infinity, ...this.gates.filter(e => e !== undefined).map(e => e.stableDuration()));
    }

    /**
     * @returns {!boolean}
     */
    isEmpty() {
        return this.gates.every(e => e === undefined);
    }

    /**
     * @param {!int} inputMeasureMask
     * @param {!int} ignoreMask
     * @returns {!boolean}
     */
    hasControl(inputMeasureMask=0, ignoreMask=0) {
        return this.hasCoherentControl(inputMeasureMask | ignoreMask) ||
            this.hasMeasuredControl(inputMeasureMask & ~ignoreMask);
    }

    /**
     * @param {!int} inputMeasureMask
     * @returns {!boolean}
     */
    hasCoherentControl(inputMeasureMask=0) {
        for (let i = 0; i < this.gates.length; i++) {
            if ((inputMeasureMask & (1 << i)) === 0 &&
                    this.gates[i] !== undefined &&
                    this.gates[i].isControl() &&
                    !this.gates[i].isClassicalControl()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {!int} inputMeasureMask
     * @returns {!boolean}
     */
    hasMeasuredControl(inputMeasureMask=0) {
        for (let i = 0; i < this.gates.length; i++) {
            if ((inputMeasureMask & (1 << i)) !== 0 &&
                    this.gates[i] !== undefined &&
                    this.gates[i].definitelyHasNoEffect() &&
                    this.gates[i].isControl()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @returns {!int}
     */
    controlMask() {
        let mask = 0;
        for (let i = 0; i < this.gates.length; i++) {
            if (this.gates[i] !== undefined &&
                    this.gates[i].definitelyHasNoEffect() &&
                    this.gates[i].isControl()) {
                mask |= 1 << i;
            }
        }
        return mask;
    }

    /**
     * @param {!int} inputMeasureMask
     * @param {!int} row
     * @param {!int} outerRowOffset
     * @param {!Map<!string, *>} context
     * @param {!boolean} isNested
     * @returns {undefined|!string}
     * @private
     */
    _disabledReason(inputMeasureMask, row, outerRowOffset, context, isNested) {
        let g = this.gates[row];
        if (g === undefined) {
            return undefined;
        }

        let args = new GateCheckArgs(g, this, outerRowOffset + row, inputMeasureMask, context, isNested);
        return g.customDisableReasonFinder(args) ||
            GateColumn._disabledReason_inputs(args) ||
            this._disabledReason_controlInside(row) ||
            this._disabledReason_remixing(row, inputMeasureMask) ||
            this._disabledReason_overlappingTags(outerRowOffset, row);
    }

    /**
     * @param {!int} outerRow
     * @param {!int} row
     * @returns {undefined|!string}
     * @private
     */
    _disabledReason_overlappingTags(outerRow, row) {
        let keys = new Set(
            this.gates[row].customColumnContextProvider(outerRow + row, this.gates[row]).map(e => e.key));
        if (keys.length === 0) {
            return undefined;
        }

        for (let i = 0; i < row; i++) {
            let g = this.gates[i];
            for (let {key: otherKey} of g === undefined ? [] : g.customColumnContextProvider(outerRow + i, g)) {
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
        if (maskMeasured !== 0 && g.knownBitPermutationFunc === undefined) {
            // Don't try to superpose measured qubits.
            if (g.effectMightCreateSuperpositions()) {
                return "no\nremix\n(sorry)";
            }

            // Don't try to mix measured and coherent qubits, or coherently mix measured qubits.
            if (g.effectMightPermutesStates()) {
                if (maskMeasured !== mask || this.hasCoherentControl(inputMeasureMask)) {
                    return "no\nremix\n(sorry)";
                }
            }
        }

        // Check permutation subgroups for bad mixing of measured and coherent qubits.
        if (g.knownBitPermutationGroupMasks !== undefined) {
            for (let maskGroup of g.knownBitPermutationGroupMasks) {
                let isSingleton = ((maskGroup - 1) & maskGroup) === 0;
                if (isSingleton) {
                    continue;
                }

                maskGroup <<= row;
                let hasCoherentQubits = (maskGroup & inputMeasureMask) !== maskGroup;
                let hasMeasuredQubits = (maskGroup & inputMeasureMask) !== 0;
                let coherentControl = this.hasCoherentControl(inputMeasureMask);
                let controlled = this.hasControl(inputMeasureMask);
                let coherentControlledMixingOfMeasured = hasMeasuredQubits && coherentControl;
                let controlledMixingOfCoherentAndMeasured = hasCoherentQubits && hasMeasuredQubits && controlled;
                if (coherentControlledMixingOfMeasured || controlledMixingOfCoherentAndMeasured) {
                    return "no\nremix\n(sorry)";
                }
            }
        }

        return undefined;
    }

    /**
     * @returns {boolean} Whether there is a gate with a global effect in the column or not.
     */
    hasGatesWithGlobalEffects() {
        for (let i = 0; i < this.gates.length; i++) {
            let gate = this.gates[i];
            if (gate !== undefined && gate.shouldShowAsHavingGlobalEffect()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @returns {undefined|!int} The index of some non-unitary gate in the column, if any.
     */
    indexOfNonUnitaryGate() {
        for (let i = 0; i < this.gates.length; i++) {
            let gate = this.gates[i];
            if (gate !== undefined && !gate.isDefinitelyUnitary()) {
                return i;
            }
        }
        return undefined;
    }

    /**
     * @param {!GateCheckArgs} args
     * @returns {undefined|!string}
     * @private
     */
    static _disabledReason_inputs(args) {
        let rangeVals = [];
        for (let key of args.gate.getUnmetContextKeys()) {
            if (key.startsWith("Input Range ") && args.context.has(key)) {
                rangeVals.push(args.context.get(key));
            }
        }

        return GateColumn._disabledReason_inputs_missing(args) ||
            GateColumn._disabledReason_inputs_inside(args, rangeVals) ||
            GateColumn._disabledReason_inputs_coherenceMismatch(args, rangeVals);
    }

    /**
     * @param {!GateCheckArgs} args
     * @returns {undefined|!string}
     * @private
     */
    static _disabledReason_inputs_missing(args) {
        let missing = [];
        for (let key of args.gate.getUnmetContextKeys()) {
            let altKey = key.
                replace("Input Range ", "Input Default ").
                replace("Input NO_DEFAULT Range ", "Input Range ");
            if (!args.context.has(key) && !args.context.has(altKey) && !args.isNested) {
                missing.push(key);
            }
        }
        if (missing.length > 0) {
            return "Need\nInput\n " + missing.
                map(e => e.replace("Input NO_DEFAULT Range ", "").replace("Input Range ", "")).
                join(", ");
        }

        return undefined;
    }

    /**
     * @param {!GateCheckArgs} args
     * @param {!Array.<!{offset: !int, length: !int}>} rangeVals
     * @returns {undefined|!string}
     * @private
     */
    static _disabledReason_inputs_inside(args, rangeVals) {
        let row = args.outerRow;
        for (let {offset, length} of rangeVals) {
            //noinspection JSUnusedAssignment
            if (offset + length > row && row + args.gate.height > offset) {
                return "input\ninside";
            }
        }
        return undefined;
    }

    /**
     * @param {!GateCheckArgs} args
     * @param {!Array.<!{offset: !int, length: !int}>} rangeVals
     * @returns {undefined|!string}
     * @private
     */
    static _disabledReason_inputs_coherenceMismatch(args, rangeVals) {
        let row = args.outerRow;
        if (args.gate.effectMightPermutesStates()) {
            let hasMeasuredOutputs = ((args.measuredMask >> row) & ((1 << args.gate.height) - 1)) !== 0;
            if (hasMeasuredOutputs) {
                for (let {offset, length} of rangeVals) {
                    //noinspection JSUnusedAssignment
                    if (((~args.measuredMask >> offset) & ((1 << length) - 1)) !== 0) {
                        return "no\nremix\n(sorry)";
                    }
                }
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
            if (this.gates[row + j] !== undefined && this.gates[row + j].isControl()) {
                return "control\ninside";
            }
        }
        return undefined;
    }

    minimumRequiredWireCount() {
        let best = 0;
        for (let i = 0; i < this.gates.length; i++) {
            if (this.gates[i] !== undefined) {
                best = Math.max(best, this.gates[i].height + i);
            }
        }
        return best;
    }

    maximumGateWidth() {
        let best = -Infinity;
        for (let g of this.gates) {
            if (g !== undefined) {
                best = Math.max(best, g.width);
            }
        }
        return best;
    }

    /**
     * @param {!int} inputMeasureMask
     * @param {!int} outerRowOffset
     * @param {!Map.<!string, *>} outerContext
     * @param {!Map.<!string, *>} prevStickyCtx
     * @param {!boolean} isNested
     * @returns {{allReasons: !Array.<undefined|!string>, stickyCtx: !Map<!string, *>}}
     */
    perRowDisabledReasons(inputMeasureMask, outerRowOffset, outerContext, prevStickyCtx, isNested) {
        let context = Util.mergeMaps(outerContext, prevStickyCtx);
        let stickyCtx = new Map(prevStickyCtx);
        for (let row = this.gates.length - 1; row >= 0; row--) {
            let g = this.gates[row];
            if (g !== undefined) {
                for (let {key, val} of g.customColumnContextProvider(row + outerRowOffset, g)) {
                    //noinspection JSUnusedAssignment
                    context.set(key, val);
                    if (!g.isContextTemporary) {
                        stickyCtx.set(key, val);
                    }
                }
            }
        }

        let allReasons = [];
        for (let i = 0; i < this.gates.length; i++) {
            allReasons.push(this._disabledReason(inputMeasureMask, i, outerRowOffset, context, isNested))
        }
        return {allReasons, stickyCtx};
    }

    /**
     * @param {{measureMask: !int, earlierRowWithSwapGate: undefined|!int}} state
     * @param row
     * @param {!Array.<undefined|!string>} disabledReasons
     * @returns {void}
     * @private
     */
    _updateMeasureMask_gateStep(state, row, disabledReasons) {
        if (disabledReasons[row] !== undefined) {
            return;
        }

        let gate = this.gates[row];

        if (gate === undefined) {
            return;
        }

        // The measurement gate measures.
        if (gate === Gates.Special.Measurement) {
            state.measureMask |= 1<<row;
            return;
        }

        // Post-selection gates un-measure (in that the simulator can then do coherent operations on the qubit
        // without getting the wrong answer, at least).
        let hasSingleResult = gate === Gates.PostSelectionGates.PostSelectOn
            || gate === Gates.PostSelectionGates.PostSelectOff
            || gate === Gates.Detectors.ZDetector
            || gate === Gates.Detectors.ZDetectControlClear;
        if (!this.hasControl(0, 1 << row) && hasSingleResult) {
            state.measureMask &= ~(1<<row);
            return;
        }

        GateColumn._updateMeasureMask_swapGate(gate, state, row);
        GateColumn._updateMeasureMask_customPermute(gate, state, row);
    }

    /**
     * @param {!Gate} gate
     * @param {{measureMask: !int, earlierRowWithSwapGate: undefined|!int}} state
     * @param row
     * @returns {void}
     * @private
     */
    static _updateMeasureMask_swapGate(gate, state, row) {
        if (gate !== Gates.Special.SwapHalf) {
            return;
        }

        if (state.earlierRowWithSwapGate === undefined) {
            state.earlierRowWithSwapGate = row;
            return;
        }

        // Swap gate swaps measurement states.
        let other = 1 << state.earlierRowWithSwapGate;
        let d = row - state.earlierRowWithSwapGate;
        let bit = 1 << row;
        state.measureMask = (state.measureMask & ~(other | bit)) |
            ((state.measureMask & other) << d) |
            ((state.measureMask & bit) >> d);
        state.earlierRowWithSwapGate = undefined;
    }

    /**
     * @param {!Gate} gate
     * @param {{measureMask: !int, earlierRowWithSwapGate: undefined|!int}} state
     * @param row
     * @returns {void}
     * @private
     */
    static _updateMeasureMask_customPermute(gate, state, row) {
        if (gate.knownBitPermutationFunc === undefined) {
            return;
        }

        let mask = ((1 << gate.height) - 1) << row;
        let prev = state.measureMask & mask;
        state.measureMask &= ~mask;
        for (let i = 0; i < gate.height; i++) {
            let prevBit = 1 << (row + i);
            if ((prev & prevBit) !== 0) {
                let nextBit = 1 << (row + gate.knownBitPermutationFunc(i));
                state.measureMask |= nextBit;
            }
        }
    }

    /**
     * @param {!int} inputMeasureMask
     * @param {!Array.<undefined|!string>} disabledReasons
     * @returns {!int}
     */
    nextMeasureMask(inputMeasureMask, disabledReasons) {
        let state = {measureMask: inputMeasureMask, earlierRowWithSwapGate: undefined};
        for (let row = 0; row < this.gates.length; row++) {
            this._updateMeasureMask_gateStep(state, row, disabledReasons);
        }
        return state.measureMask;
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

export {GateColumn}
