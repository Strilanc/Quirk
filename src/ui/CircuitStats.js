import Util from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import GateColumn from "src/ui/GateColumn.js"
import Gate from "src/ui/Gate.js"
import CircuitDefinition from "src/ui/CircuitDefinition.js"
import Matrix from "src/math/Matrix.js"
import SuperpositionNode from "src/quantum/SuperpositionNode.js"
import PipelineNode from "src/quantum/PipelineNode.js"

export default class CircuitStats{
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!(!number[])} wireProbabilities
     * @param {!Matrix} finalState
     * @property {!CircuitDefinition} circuitDefinition
     * @property {!(!number[])} wireProbabilities
     * @property {!Matrix} finalState
     */
    constructor(circuitDefinition, wireProbabilities, finalState) {
        this.circuitDefinition = circuitDefinition;
        this.wireProbabilities = wireProbabilities;
        this.finalState = finalState;
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let state = SuperpositionNode.fromClassicalStateInRegisterOfSize(0, circuitDefinition.numWires);
        let p = [];
        p.push(state.controlProbabilityCombinations(0));
        for (let col of circuitDefinition.columns) {
            let mask = col.controls();
            for (let op of col.singleQubitOperationsAt(time)) {
                state = state.withQubitOperationApplied(op.i, op.m, mask)
            }
            for (let op of col.swapPairs()) {
                state = state.withSwap(op[0], op[1], mask);
            }
            p.push(state.controlProbabilityCombinations(mask.desiredValueMask));
        }
        p.push(state);
        let r1 = SuperpositionNode.mergedReadFloats(p);
        let x1 = r1.slice(0, r1.length - 1).map(e => e.asPerQubitProbabilities());
        let x2 = r1[r1.length - 1].asAmplitudes();
        let r2 = PipelineNode.computePipeline(new Seq(x1).concat([x2]).toArray());
        let wireProbabilities = r2.slice(0, r2.length - 1);
        let final = r2[r2.length - 1];
        return new CircuitStats(circuitDefinition, wireProbabilities, final);
    }
}
