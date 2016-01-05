import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import SuperpositionNode from "src/pipeline/SuperpositionNode.js"
import Util from "src/base/Util.js"

export default class CircuitStats{
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!(!number[])} wireProbabilityData
     * @param {!(!number[])} conditionalWireProbabilityData
     * @param {!((!Complex)[])} finalState
     */
    constructor(circuitDefinition,
                time,
                wireProbabilityData,
                conditionalWireProbabilityData,
                finalState) {
        /**
         * The circuit that these stats apply to.
         * @type {!CircuitDefinition}
         */
        this.circuitDefinition = circuitDefinition;
        /**
         * The time these stats apply to.
         * @type {!number}
         */
        this.time = time;
        /**
         * Probability that each wire is on, individually, at each slice.
         * @type {!(!number[])}
         * @private
         */
        this._wireProbabilityData = wireProbabilityData;
        /**
         * Probability that each wire is on, individually, at each slice.
         * @type {!(!number[])}
         * @private
         */
        this._conditionalWireProbabilityData = conditionalWireProbabilityData;
        /**
         * The output quantum superposition.
         * @type {!((!Complex)[])}
         */
        this.finalState = finalState;
    }

    /**
     * Returns the probability that a wire would be on if it was measured just before a given column.
     *
     * @param {int} wireIndex
     * @param {int|Infinity} colIndex
     * @returns {!number}
     */
    wireProbabilityJustAfter(wireIndex, colIndex) {
        Util.need(wireIndex >= 0 && wireIndex < this.circuitDefinition.numWires);

        // The initial state is all-qubits-off.
        if (colIndex < 0 || this.circuitDefinition.columns.length === 0) {
            return 0;
        }

        let t = Math.min(colIndex, this._wireProbabilityData.length - 1);
        return this._wireProbabilityData[t][wireIndex];
    }

    /**
     * Returns the probability that a wire would be on if it was measured just before a given column, but conditioned on
     * wires with controls in that column matching their controls.
     * A wire is never conditioned on itself; self-conditions are ignored when computing the probability.
     *
     * @param {int} wireIndex
     * @param {int|Infinity} colIndex
     * @returns {!number}
     */
    controlledWireProbabilityJustAfter(wireIndex, colIndex) {
        Util.need(wireIndex >= 0 && wireIndex < this.circuitDefinition.numWires);

        // The initial state is all-qubits-off.
        if (colIndex < 0 || this.circuitDefinition.columns.length === 0) {
            return 0;
        }

        // After the last column there are no controls to condition on.
        if (colIndex >= this.circuitDefinition.columns.length) {
            return this.wireProbabilityJustAfter(wireIndex, colIndex);
        }

        let t = Math.min(colIndex, this._conditionalWireProbabilityData.length - 1);
        return this._conditionalWireProbabilityData[t][wireIndex];
    }

    static emptyAtTime(circuitDefinition, time) {
        return new CircuitStats(circuitDefinition, time, [], [], []);
    }

    /**
     * @param {!number} time
     * @returns {!CircuitStats}
     */
    withTime(time) {
        return new CircuitStats(
            this.circuitDefinition,
            time,
            this._wireProbabilityData,
            this._conditionalWireProbabilityData,
            this.finalState);
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let nodes = [];
        let masks = [];

        let stateNode = SuperpositionNode.fromClassicalStateInRegisterOfSize(0, circuitDefinition.numWires);
        for (let col of Seq.range(circuitDefinition.columns.length)) {
            let gateCol = circuitDefinition.columns[col];
            let mask = gateCol.controls();
            for (let op of circuitDefinition.singleQubitOperationsInColAt(col, time)) {
                stateNode = stateNode.withQubitOperationApplied(op.i, op.m, mask)
            }
            for (let op of gateCol.swapPairs()) {
                stateNode = stateNode.withSwap(op[0], op[1], mask);
            }
            nodes.push(stateNode.controlProbabilityCombinations(mask));
            masks.push(mask);
        }
        nodes.push(stateNode);

        let merged = SuperpositionNode.mergedReadFloats(nodes);

        let m = merged.slice(0, merged.length - 1);
        let n = m.length;
        let wireProbColsNode = Seq.range(n).
            map(i => m[i].asRenormalizedPerQubitProbabilities(masks[i], circuitDefinition.numWires));
        let condWireProbColsNode = Seq.range(n).
            map(i => m[i].asRenormalizedConditionalPerQubitProbabilities(masks[i], circuitDefinition.numWires));
        let finalStateNode = merged[merged.length - 1].asRenormalizedAmplitudes();
        //noinspection JSCheckFunctionSignatures
        let nodeResults = PipelineNode.computePipeline(
            new Seq(wireProbColsNode).
            concat(condWireProbColsNode).
            concat([finalStateNode]).
            toArray());
        let wireProbabilityCols = nodeResults.slice(0, n);
        let conditionalWireProbabilityCols = nodeResults.slice(n, n*2);
        let finalState = nodeResults[n*2];

        return new CircuitStats(
            circuitDefinition,
            time,
            wireProbabilityCols,
            conditionalWireProbabilityCols,
            finalState);
    }
}
