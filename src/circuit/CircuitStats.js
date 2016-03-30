import DetailedError from "src/base/DetailedError.js"
import Format from "src/base/Format.js"
import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Config from "src/Config.js"
import Controls from "src/circuit/Controls.js"
import Point from "src/math/Point.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import Shaders from "src/webgl/Shaders.js"
import { seq, Seq } from "src/base/Seq.js"
import CircuitTextures from "src/circuit/CircuitTextures.js"
import Util from "src/base/Util.js"
import Matrix from "src/math/Matrix.js"

export default class CircuitStats {
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!Array.<!Array.<!Matrix>>} qubitDensities
     * @param {!Matrix} finalState
     */
    constructor(circuitDefinition,
                time,
                qubitDensities,
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
         * @type {!Array.<!Array.<!Matrix>>} qubitDensities
         * @private
         */
        this._qubitDensities = qubitDensities;
        /**
         * The output quantum superposition, as a column vector.
         * @type {!Matrix}
         */
        this.finalState = finalState;
    }

    qubitDensityMatrix(wireIndex, colIndex) {
        if (wireIndex < 0 || wireIndex >= this.circuitDefinition.numWires) {
            throw new DetailedError("Bad wireIndex", {wireIndex, colIndex});
        }

        if (colIndex < 0) {
            return 0; // The initial state is all-qubits-off.
        }

        return this._qubitDensities[Math.min(colIndex, this._qubitDensities.length - 1)][wireIndex];
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
            this._qubitDensities,
            this.finalState);
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        let numWires = circuitDefinition.numWires;

        let displayTexes = [];
        let outputTex = CircuitTextures.aggregateWithReuse(
            CircuitTextures.zero(numWires),
            Seq.range(circuitDefinition.columns.length),
            (stateTex, col) => {
                let gateCol = circuitDefinition.columns[col];
                let controls = gateCol.controls();
                let controlTex = CircuitTextures.control(numWires, controls);
                displayTexes.push(CircuitTextures.superpositionToQubitDensities(
                    stateTex,
                    controls,
                    gateCol.wiresWithDisplaysMask()));
                stateTex = CircuitTextures.aggregateReusingIntermediates(
                    stateTex,
                    circuitDefinition.singleQubitOperationsInColAt(col, time),
                    (accTex, {i, m}) => CircuitTextures.qubitOperation(accTex, controlTex, i, m));
                stateTex = CircuitTextures.aggregateWithReuse(
                    stateTex,
                    gateCol.swapPairs(),
                    (accTex, [i1, i2]) => CircuitTextures.swap(accTex, controlTex, i1, i2));
                CircuitTextures.doneWithTexture(controlTex, "controlTex in fromCircuitAtTime");
                return stateTex;
            });
        displayTexes.push(CircuitTextures.superpositionToQubitDensities(outputTex, Controls.NONE, (1 << numWires) - 1));

        let pixelData = Util.objectifyArrayFunc(CircuitTextures.mergedReadFloats)({outputTex, displayTexes});

        let final = pixelData.displayTexes[pixelData.displayTexes.length - 1];
        let unity = final[0] + final[3];
        let outputSuperposition = CircuitTextures.pixelsToAmplitudes(pixelData.outputTex, unity);
        let nanMat = new Matrix(2, 2, new Float32Array([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]));
        let qubitDensities = seq(pixelData.displayTexes).mapWithIndex((pixels, col) => {
            let aCol = circuitDefinition.columns[col];
            let mask = aCol === undefined ? (1 << numWires) - 1 : aCol.wiresWithDisplaysMask();
            let matrices = CircuitTextures.pixelsToDensityMatrices(pixels, Util.numberOfSetBits(mask));
            for (let row = 0; row < numWires; row++) {
                if ((mask & (1 << row)) === 0) {
                    matrices.splice(row, 0, nanMat);
                }
                if (circuitDefinition.locIsMeasured(new Point(col, row))) {
                    let m = matrices[row].rawBuffer();
                    matrices[row] = new Matrix(2, 2, new Float32Array([m[0], 0, 0, 0, 0, 0, m[6], 0]));
                }
            }
            return matrices;
        }).toArray();


        return new CircuitStats(
            circuitDefinition,
            time,
            qubitDensities,
            outputSuperposition);
    }
}
