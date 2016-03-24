import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Config from "src/Config.js"
import PipelineNode from "src/pipeline/PipelineNode.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import QuantumShaders from "src/pipeline/QuantumShaders.js"
import { seq, Seq } from "src/base/Seq.js"
import SuperTex from "src/pipeline/SuperTex.js"
import Util from "src/base/Util.js"
import Matrix from "src/math/Matrix.js"

export default class CircuitStats{
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!(!number[])} wireProbabilityData
     * @param {!(!number[])} conditionalWireProbabilityData
     * @param {!Map.<!String, !Matrix>} knownDensityMatrices
     * @param {!Matrix} finalState
     */
    constructor(circuitDefinition,
                time,
                wireProbabilityData,
                conditionalWireProbabilityData,
                knownDensityMatrices,
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
         * Output density matrices for various groups of wires.
         * @type {!Map.<!String, !Matrix>}
         * @private
         */
        this._knownDensityMatrices = knownDensityMatrices;
        /**
         * The output quantum superposition, as a column vector.
         * @type {!Matrix}
         */
        this.finalState = finalState;
    }

    /**
     * @param {!Array.<!int>} wires
     * @param {!int} colIndex
     * @returns {!Matrix|undefined}
     */
    densityMatrixAfterIfAvailable(wires, colIndex) {
        Util.need(new Seq(wires).min() >= 0, "bad wire index");

        colIndex = Math.min(colIndex, this.circuitDefinition.columns.length);
        colIndex = Math.max(colIndex, 0);

        if (colIndex === 0) {
            let n = 1 << new Seq(wires).distinct().count();
            return Matrix.generate(n, n, (r, c) => r === 0 && c === 0 ? 1 : 0);
        }

        let key = colIndex + ";" + new Seq(wires.map(e => e).sort()).distinct().join(";");
        if (this._knownDensityMatrices.has(key)) {
            return this._knownDensityMatrices.get(key);
        }

        if (wires.length === 1) {
            let p = this.controlledWireProbabilityJustAfter(wires[0], colIndex);
            return Matrix.square([1-p, 0, 0, p]);
        }

        return undefined;
    }

    /**
     * Returns the probability that a wire would be on if it was measured just before a given column.
     *
     * @param {int} wireIndex
     * @param {int|Infinity} colIndex
     * @returns {!number}
     */
    wireProbabilityJustAfter(wireIndex, colIndex) {
        return 0.5;
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
        return 0.5;
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
            this._knownDensityMatrices,
            this.finalState);
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let numWires = circuitDefinition.numWires;
        /** @type {!Array.<!WglTexture>} */
        let stateTextures = Seq.range(circuitDefinition.columns.length).
            scan(
                SuperTex.zero(numWires),
                (stateTex, col) => {
                    let gateCol = circuitDefinition.columns[col];
                    let controlTex = SuperTex.control(numWires, gateCol.controls());
                    stateTex = SuperTex.aggregateWithIntermediateReuse(
                        stateTex,
                        circuitDefinition.singleQubitOperationsInColAt(col, time),
                        (accTex, e) => SuperTex.singleQubitOperation(accTex, controlTex, e.i, e.m));
                    stateTex = SuperTex.aggregateWithReuse(
                        stateTex,
                        gateCol.swapPairs(),
                        (a, e) => SuperTex.afterSwapOperation(a, controlTex, e[0], e[1]));
                    return stateTex;
                }).
            toArray();

        //let masks = circuitDefinition.columns.map(e => e.controls());
        let outputTex = stateTextures[stateTextures.length - 1];

        let textureNodes = {
            outputSuperposition: outputTex,
            //postProbabilities: new Seq(stateTextures).
            //    skip(1).
            //    zip(masks, (stateNode, mask) => stateNode.controlledProbabilities(mask)).
            //    toArray(),
            qubitDensities: SuperTex.superpositionToQubitDensities(outputTex)
            //outputDensityGroups: Seq.range(Config.RIGHT_HAND_DENSITY_MATRIX_DISPLAY_LEVELS).
            //    map(power => 1 << power).
            //    map(groupSize => Seq.range(circuitDefinition.numWires).
            //        partitioned(groupSize).
            //        filter(e => e.length === groupSize).
            //        map(wireGroup => outputTex.densityMatrixForWires(wireGroup, QuantumControlMask.NO_CONTROLS)).
            //        toArray()).
            //    toArray()
        };

        console.log("errr", textureNodes.qubitDensities.readPixels());
        let pixelData = Util.objectifyArrayFunc(SuperTex.mergedReadFloats)(textureNodes);
        console.log("errr2", pixelData.qubitDensities);

        let unity = 1; //pixelData.qubitDensities[0] + pixelData.qubitDensities[3];
        let outputSuperposition = SuperTex.pixelsToAmplitudes(pixelData.outputSuperposition, unity);
        //let wireProbabilities = new Seq(pixelDataNodes.postProbabilities).
        //        zip(masks, (e, m) => e.asRenormalizedPerQubitProbabilities(m, numWires)).
        //        toArray();
        //let conditionalWireProbabilities = new Seq(pixelDataNodes.postProbabilities).
        //        zip(masks, (e, m) => e.asRenormalizedConditionalPerQubitProbabilities(m, numWires)).
        //        toArray();
        let qubitDensities = SuperTex.pixelsToDensityMatrices(pixelData.qubitDensities, numWires);
            //outputDensityGroups: pixelDataNodes.outputDensityGroups.map(g => g.map(e => e.asDensityMatrix()))

        let knownDensityMatrices = seq(qubitDensities).
            mapWithIndex((m, i) => {
                return {
                    key: circuitDefinition.columns.length + ";" + i,
                    val: m
                };
            }).
            toMap(e => e.key, e => e.val);
        //knownDensityMatrices = new Seq(values.outputDensityGroups).
        //    flatMap(g => new Seq(g).
        //        mapWithIndex((m, i) => {
        //            let n = m.width();
        //            let span = Math.round(Math.log2(n));
        //            let measuredMask = Seq.range(span).
        //                map(j => circuitDefinition.wireMeasuredColumns()[i*span + j] < Infinity).
        //                mapWithIndex((b, k) => b ? 1 << k : 0).
        //                sum();
        //            return {
        //                key: circuitDefinition.columns.length + ";" + Seq.range(span).map(e => e + i*span).join(";"),
        //                val: Matrix.generate(n, n, (c, r) => {
        //                    let v = m.cell(c, r);
        //                    return (c & measuredMask) === (r & measuredMask) ?
        //                        v :
        //                        v.times(0); // Note: preserves NaN.
        //                })
        //            };
        //        })).
        //    toMap(e => e.key, e => e.val);

        return new CircuitStats(
            circuitDefinition,
            time,
            undefined, //wireProbabilities,
            undefined, //conditionalWireProbabilities,
            knownDensityMatrices,
            outputSuperposition);
    }
}
