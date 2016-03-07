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
     * @param {!Array.<!Array.<!Matrix>>} outputDensityGroups
     * @param {!((!Complex)[])} finalState
     */
    constructor(circuitDefinition,
                time,
                wireProbabilityData,
                conditionalWireProbabilityData,
                outputDensityGroups,
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
         * Output density matrices for various groups of wires of increasing size.
         * @type {!Array.<!Array.<!Matrix>>}
         * @private
         */
        this._outputDensityGroups = outputDensityGroups;
        /**
         * The output quantum superposition.
         * @type {!((!Complex)[])}
         */
        this.finalState = finalState;
    }

    /**
     * @param {!int} startWire inclusive
     * @param {!int} endWire exclusive
     * @returns {!Matrix|undefined}
     */
    outputDensityMatrixIfAvailable(startWire, endWire = startWire + 1) {
        Util.need(0 <= startWire && startWire < endWire, "bad range");

        let length = endWire - startWire;
        let i = Math.round(Math.log2(length));
        if (!Util.isPowerOf2(length) ||
                endWire > this.circuitDefinition.numWires ||
                startWire % length !== 0 ||
                endWire % length !== 0 ||
                i >= this._outputDensityGroups.length) {
            return undefined;
        }

        return this._outputDensityGroups[i][startWire / length];
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
        return new CircuitStats(circuitDefinition, time, [], [], [], []);
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
            this._outputDensityGroups,
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
            outputDensityGroups: Seq.range(3).
                map(power => 1 << power).
                map(groupSize => Seq.range(circuitDefinition.numWires).
                    partitioned(groupSize).
                    filter(e => e.length === groupSize).
                    map(wireGroup => outputNode.densityMatrixForWires(wireGroup, QuantumControlMask.NO_CONTROLS)).
                    toArray()).
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
            outputDensityGroups: pixelDataNodes.outputDensityGroups.map(g => g.map(e => e.asDensityMatrix()))
        };

        //noinspection JSCheckFunctionSignatures
        let values = Util.objectifyArrayFunc(PipelineNode.computePipeline)(valueNodes);

        let outputDensityGroups = new Seq(values.outputDensityGroups).
            map(g => new Seq(g).
                mapWithIndex((m, i) => {
                    let n = m.width();
                    let span = Math.round(Math.log2(n));
                    let mask = Seq.range(span).
                        map(j => circuitDefinition.wireMeasuredColumns()[i*span + j] < Infinity).
                        mapWithIndex((b, k) => b ? 1 << k : 0).
                        sum();
                    return Matrix.generate(n, n, (c, r) => (c & mask) === (r & mask) ? m.cell(c, r) : 0);
                }).
                toArray()).
            toArray();

        return new CircuitStats(
            circuitDefinition,
            time,
            values.wireProbabilities,
            values.conditionalWireProbabilities,
            outputDensityGroups,
            values.outputSuperposition);
    }
}
