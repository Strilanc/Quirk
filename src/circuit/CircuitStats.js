import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import SuperpositionNode from "src/pipeline/SuperpositionNode.js"
import Util from "src/base/Util.js"
import Matrix from "src/math/Matrix.js"

export default class CircuitStats{
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!(!number[])} wireProbabilityData
     * @param {!(!number[])} conditionalWireProbabilityData
     * @param densityNodes1
     * @param densityNodes2
     * @param {!((!Complex)[])} finalState
     */
    constructor(circuitDefinition,
                time,
                wireProbabilityData,
                conditionalWireProbabilityData,
                densityNodes1,
                densityNodes2,
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
        this._densityNodes1 = densityNodes1;
        this._densityNodes2 = densityNodes2;
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
        return new CircuitStats(circuitDefinition, time, [], [], [], [], []);
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
            this._densityNodes1,
            this._densityNodes2,
            this.finalState);
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let stateScanNodes = Seq.range(circuitDefinition.columns.length).
            scan(
                SuperpositionNode.fromClassicalStateInRegisterOfSize(0, circuitDefinition.numWires),
                (stateNode, col) => {
                    let gateCol = circuitDefinition.columns[col];
                    let mask = gateCol.controls();
                    for (let op of circuitDefinition.singleQubitOperationsInColAt(col, time)) {
                        stateNode = stateNode.withQubitOperationApplied(op.i, op.m, mask)
                    }
                    for (let op of gateCol.swapPairs()) {
                        stateNode = stateNode.withSwap(op[0], op[1], mask);
                    }
                    return stateNode;
                }).
            toArray();

        let masks = circuitDefinition.columns.map(e => e.controls());
        let outputNode = stateScanNodes[stateScanNodes.length - 1];

        let textureNodes = {
            outputSuperposition: outputNode,
            postProbabilities: new Seq(stateScanNodes).
                skip(1).
                zip(masks, (stateNode, mask) => stateNode.controlledProbabilities(mask)).
                toArray(),
            dNodes: Seq.range(circuitDefinition.numWires).
                map(i => outputNode.densityMatrixForWires([i], QuantumControlMask.NO_CONTROLS)).
                toArray(),
            dNodes2: Seq.range(circuitDefinition.numWires).
                partitioned(2).
                filter(e => e.length === 2).
                map(i => outputNode.densityMatrixForWires(i, QuantumControlMask.NO_CONTROLS)).
                toArray()
        };

        let pixelDataNodes = Util.objectifyArrayFunc(SuperpositionNode.mergedReadFloats)(textureNodes);

        let valueNodes = {
            outputSuperposition: pixelDataNodes.outputSuperposition.asRenormalizedAmplitudes(),
            wireProbabilities: new Seq(pixelDataNodes.postProbabilities).
                zip(masks, (e, m) => e.asRenormalizedPerQubitProbabilities(m, circuitDefinition.numWires)).
                toArray(),
            conditionalWireProbabilities: new Seq(pixelDataNodes.postProbabilities).
                zip(masks, (e, m) => e.asRenormalizedConditionalPerQubitProbabilities(m, circuitDefinition.numWires)).
                toArray(),
            densityNodes: pixelDataNodes.dNodes.map(e => e.asDensityMatrix()),
            densityNodes2: pixelDataNodes.dNodes2.map(e => e.asDensityMatrix())
        };

        //noinspection JSCheckFunctionSignatures
        let values = Util.objectifyArrayFunc(PipelineNode.computePipeline)(valueNodes);

        let densityNodeResults = values.densityNodes;
        let densityNodeResults2 = values.densityNodes2;
        for (let i = 0; i < densityNodeResults.length; i++) {
            if (circuitDefinition.wireMeasuredColumns()[i] < Infinity) {
                densityNodeResults[i] = Matrix.generate(2, 2, (c, r) =>
                    c === r ? densityNodeResults[i].cell(c, r) : 0);
            }
        }
        for (let i = 0; i < densityNodeResults2.length; i++) {
            let b1 = circuitDefinition.wireMeasuredColumns()[i*2] < Infinity;
            let b2 = circuitDefinition.wireMeasuredColumns()[i*2+1] < Infinity;
            let m = (b1 ? 1 : 0) + (b2 ? 2 : 0);
            densityNodeResults2[i] = Matrix.generate(4, 4, (c, r) =>
                (c & m) === (r & m) ? densityNodeResults2[i].cell(c, r) : 0);
        }

        return new CircuitStats(
            circuitDefinition,
            time,
            values.wireProbabilities,
            values.conditionalWireProbabilities,
            densityNodeResults,
            densityNodeResults2,
            values.outputSuperposition);
    }
}
