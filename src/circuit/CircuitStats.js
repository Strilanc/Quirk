import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import SuperpositionNode from "src/pipeline/SuperpositionNode.js"

export default class CircuitStats{
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!(!number[])} wireProbabilities
     * @param {!(!number[])} conditionalWireProbabilities
     * @param {!((!Complex)[])} finalState
     */
    constructor(circuitDefinition,
                time,
                wireProbabilities,
                conditionalWireProbabilities,
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
         */
        this.wireProbabilities = wireProbabilities;
        /**
         * Probability that each wire is on, individually, at each slice.
         * @type {!(!number[])}
         */
        this.conditionalWireProbabilities = conditionalWireProbabilities;
        /**
         * The output quantum superposition.
         * @type {!((!Complex)[])}
         */
        this.finalState = finalState;
    }

    probability(wireIndex, colIndex, conditional=false) {
        let stepIndex = colIndex + 1;
        if (stepIndex >= this.wireProbabilities.length) {
            // Steps after the final column have no controls, so use the uncontrolled final column in that case.
            conditional = false;
        }

        let ps = conditional ? this.conditionalWireProbabilities : this.wireProbabilities;
        let t = Math.max(0, Math.min(stepIndex, ps.length - 1));
        return ps[t][wireIndex];
    }

    static emptyAtTime(circuitDefinition, time) {
        return new CircuitStats(circuitDefinition, time, [], [], []);
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let initialState = SuperpositionNode.fromClassicalStateInRegisterOfSize(0, circuitDefinition.numWires);
        let nodes = [];
        nodes.push(initialState.controlProbabilityCombinations(0));
        let masks = [QuantumControlMask.NO_CONTROLS];
        for (let col of circuitDefinition.columns) {
            let mask = col.controls();
            for (let op of col.singleQubitOperationsAt(time)) {
                initialState = initialState.withQubitOperationApplied(op.i, op.m, mask)
            }
            for (let op of col.swapPairs()) {
                initialState = initialState.withSwap(op[0], op[1], mask);
            }
            nodes.push(initialState.controlProbabilityCombinations(mask.desiredValueMask));
            masks.push(mask);
        }
        nodes.push(initialState);

        let merged = SuperpositionNode.mergedReadFloats(nodes);

        let m = merged.slice(0, merged.length - 1);
        let n = m.length;
        let wireProbColsNode = Seq.range(n).map(i => m[i].asRenormalizedPerQubitProbabilities());
        let condWireProbColsNode = Seq.range(n).
            map(i => m[i].asRenormalizedConditionalPerQubitProbabilities(masks[i]));
        let finalStateNode = merged[merged.length - 1].asRenormalizedAmplitudes();
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
