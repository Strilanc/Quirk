import DetailedError from "src/base/DetailedError.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Config from "src/Config.js"
import Controls from "src/circuit/Controls.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import { seq, Seq } from "src/base/Seq.js"
import CircuitTextures from "src/circuit/CircuitTextures.js"
import Util from "src/base/Util.js"
import Matrix from "src/math/Matrix.js"

export default class CircuitStats {
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

    ///**
    // * @param {!Array.<!int>} wires
    // * @param {!int} colIndex
    // * @returns {!Matrix|undefined}
    // */
    //densityMatrixAfterIfAvailable(wires, colIndex) {
    //    Util.need(new Seq(wires).min() >= 0, "bad wire index");
    //
    //    colIndex = Math.min(colIndex, this.circuitDefinition.columns.length);
    //    colIndex = Math.max(colIndex, 0);
    //
    //    if (colIndex === 0) {
    //        let n = 1 << new Seq(wires).distinct().count();
    //        return Matrix.generate(n, n, (r, c) => r === 0 && c === 0 ? 1 : 0);
    //    }
    //
    //    let key = colIndex + ";" + new Seq(wires.map(e => e).sort()).distinct().join(";");
    //    if (this._knownDensityMatrices.has(key)) {
    //        return this._knownDensityMatrices.get(key);
    //    }
    //
    //    if (wires.length === 1) {
    //        let p = this.controlledWireProbabilityJustAfter(wires[0], colIndex);
    //        return Matrix.square([1-p, 0, 0, p]);
    //    }
    //
    //    return undefined;
    //}

    qubitDensityMatrix(wireIndex, colIndex) {
        if (wireIndex < 0 || wireIndex >= this.circuitDefinition.numWires) {
            throw new DetailedError("Bad wireIndex", {wireIndex, colIndex});
        }

        if (colIndex < 0) {
            return 0; // The initial state is all-qubits-off.
        }

        let key = Math.min(colIndex, this.circuitDefinition.columns.length) + ";" + wireIndex;
        let density = this._knownDensityMatrices.get(key);
        return density || new Matrix(2, 2, [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]);
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
        return this.qubitDensityMatrix(wireIndex, colIndex).rawBuffer()[6];
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
        let outputTex = CircuitTextures.aggregateWithReuse(
            CircuitTextures.zero(numWires),
            Seq.range(circuitDefinition.columns.length),
            (stateTex, col) => {
                let gateCol = circuitDefinition.columns[col];
                let controlTex = CircuitTextures.control(numWires, gateCol.controls());
                stateTex = CircuitTextures.aggregateWithIntermediateReuse(
                    stateTex,
                    circuitDefinition.singleQubitOperationsInColAt(col, time),
                    (accTex, {i, m}) => CircuitTextures.qubitOperation(accTex, controlTex, i, m));
                stateTex = CircuitTextures.aggregateWithReuse(
                    stateTex,
                    gateCol.swapPairs(),
                    (accTex, [i1, i2]) => CircuitTextures.swap(accTex, controlTex, i1, i2));
                CircuitTextures.reuseTexture(controlTex);
                return stateTex;
            });

        let textureNodes = {
            outputSuperposition: outputTex,
            qubitDensities: CircuitTextures.superpositionToQubitDensities(outputTex)
        };

        let pixelData = Util.objectifyArrayFunc(CircuitTextures.mergedReadFloats)(textureNodes);

        let unity = pixelData.qubitDensities[0] + pixelData.qubitDensities[3];
        let outputSuperposition = CircuitTextures.pixelsToAmplitudes(pixelData.outputSuperposition, unity);
        let qubitDensities = CircuitTextures.pixelsToDensityMatrices(pixelData.qubitDensities, numWires);

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
