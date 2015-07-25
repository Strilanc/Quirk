import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import Seq from "src/base/Seq.js"
import SuperpositionNode from "src/pipeline/SuperpositionNode.js"

export default class CircuitStats{
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!(!number[])} wireProbabilities
     * @param {!((!Complex)[])} finalState
     */
    constructor(circuitDefinition, time, wireProbabilities, finalState) {
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
         * The output quantum superposition.
         * @type {!((!Complex)[])}
         */
        this.finalState = finalState;
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let initialState = SuperpositionNode.fromClassicalStateInRegisterOfSize(0, circuitDefinition.numWires);
        let nodes = [];
        nodes.push(initialState.controlProbabilityCombinations(0));
        for (let col of circuitDefinition.columns) {
            let mask = col.controls();
            for (let op of col.singleQubitOperationsAt(time)) {
                initialState = initialState.withQubitOperationApplied(op.i, op.m, mask)
            }
            for (let op of col.swapPairs()) {
                initialState = initialState.withSwap(op[0], op[1], mask);
            }
            nodes.push(initialState.controlProbabilityCombinations(mask.desiredValueMask));
        }
        nodes.push(initialState);

        let merged = SuperpositionNode.mergedReadFloats(nodes);

        let wireProbColsNode = merged.slice(0, merged.length - 1).map(e => e.asPerQubitProbabilities());
        let finalStateNode = merged[merged.length - 1].asAmplitudes();
        let nodeResults = PipelineNode.computePipeline(new Seq(wireProbColsNode).concat([finalStateNode]).toArray());
        let wireProbabilityCols = nodeResults.slice(0, nodeResults.length - 1);
        let finalState = nodeResults[nodeResults.length - 1];

        return new CircuitStats(circuitDefinition, time, wireProbabilityCols, finalState);
    }
}
