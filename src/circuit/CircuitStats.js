import DetailedError from "src/base/DetailedError.js"
import Gates from "src/ui/Gates.js"
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
     * @param {!Array.<!Array.<!Matrix>>} qubitPairDensities
     * @param {!Matrix} finalState
     */
    constructor(circuitDefinition,
                time,
                qubitDensities,
                qubitPairDensities,
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
         * @type {!Array.<!Array.<!Matrix>>}
         * @private
         */
        this._qubitDensities = qubitDensities;
        /**
         * @type {!Array.<!Array.<!Matrix>>}
         * @private
         */
        this._qubitPairDensities = qubitPairDensities;
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

        // The initial state is all-qubits-off.
        if (colIndex < 0) {
            let buf = new Float32Array(2*2*2);
            buf[0] = 1;
            return new Matrix(2, 2, buf);
        }

        return this._qubitDensities[Math.min(colIndex, this._qubitDensities.length - 1)][wireIndex];
    }

    qubitPairDensityMatrix(wireIndex, colIndex) {
        if (wireIndex < 0 || wireIndex >= this.circuitDefinition.numWires) {
            throw new DetailedError("Bad wireIndex", {wireIndex, colIndex});
        }

        // The initial state is all-qubits-off.
        if (colIndex < 0) {
            let buf = new Float32Array(4*4*2);
            buf[0] = 1;
            return new Matrix(2, 2, buf);
        }

        return this._qubitPairDensities[Math.min(colIndex, this._qubitPairDensities.length - 1)][wireIndex];
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
            this._qubitPairDensities,
            this.finalState);
    }

    static fromCircuitAtTime(circuitDefinition, time) {
        const numWires = circuitDefinition.numWires;
        const allWiresMask = (1 << numWires) - 1;

        let qubitDensityTexes = [];
        let qubitPairDensityTexes = [];
        let outputTex = CircuitTextures.aggregateWithReuse(
            CircuitTextures.zero(numWires),
            Seq.range(circuitDefinition.columns.length),
            (stateTex, col) => {
                let gateCol = circuitDefinition.columns[col];
                let controls = gateCol.controls();
                let controlTex = CircuitTextures.control(numWires, controls);
                stateTex = CircuitTextures.aggregateReusingIntermediates(
                    stateTex,
                    circuitDefinition.operationShadersInColAt(col, time),
                    (accTex, shaderFunc) => CircuitTextures.applyCustomShader(shaderFunc, accTex, controlTex));
                qubitDensityTexes.push(CircuitTextures.superpositionToQubitDensities(
                    stateTex,
                    controls,
                    gateCol.wiresWithSingleQubitDisplaysMask()));
                qubitPairDensityTexes.push(CircuitTextures.superpositionToQubitPairDensities(
                    stateTex,
                    controls,
                    gateCol.wiresWithTwoQubitDisplaysMask()));
                CircuitTextures.doneWithTexture(controlTex, "controlTex in fromCircuitAtTime");
                return stateTex;
            });
        qubitDensityTexes.push(CircuitTextures.superpositionToQubitDensities(outputTex, Controls.NONE, allWiresMask));
        qubitPairDensityTexes.push(CircuitTextures.superpositionToQubitPairDensities(outputTex, Controls.NONE, 0));
        //console.log({mask, row, col, mat: matrices[row].toString(Format.SIMPLIFIED)});

        let pixelData = Util.objectifyArrayFunc(CircuitTextures.mergedReadFloats)({
            outputTex,
            qubitDensityTexes,
            qubitPairDensityTexes});

        let final = pixelData.qubitDensityTexes[pixelData.qubitDensityTexes.length - 1];
        let unity = final[0] + final[3];
        //noinspection JSCheckFunctionSignatures
        let outputSuperposition = CircuitTextures.pixelsToAmplitudes(pixelData.outputTex, unity);
        let nanMat2 = Matrix.zero(2, 2).times(NaN);
        let nanMat4 = Matrix.zero(4, 4).times(NaN);
        let qubitDensities = seq(pixelData.qubitDensityTexes).mapWithIndex((pixels, col) => {
            let aCol = circuitDefinition.columns[col];
            let mask = aCol === undefined ? allWiresMask : aCol.wiresWithSingleQubitDisplaysMask();
            let matrices = CircuitTextures.pixelsToQubitDensityMatrices(pixels);
            for (let row = 0; row < numWires; row++) {
                if ((mask & (1 << row)) === 0) {
                    matrices.splice(row, 0, nanMat2);
                    continue;
                }
                if (circuitDefinition.locIsMeasured(new Point(col, row))) {
                    let m = matrices[row].rawBuffer();
                    matrices[row] = new Matrix(2, 2, new Float32Array([m[0], 0, 0, 0, 0, 0, m[6], 0]));
                }
            }
            return matrices;
        }).toArray();
        let qubitPairDensities = seq(pixelData.qubitPairDensityTexes).mapWithIndex((pixels, col) => {
            let aCol = circuitDefinition.columns[col];
            let mask = aCol === undefined ? 0 : aCol.wiresWithTwoQubitDisplaysMask();
            let matrices = CircuitTextures.pixelsToQubitPairDensityMatrices(pixels);
            for (let row = 0; row < numWires; row++) {
                if ((mask & (1 << row)) === 0) {
                    matrices.splice(row, 0, nanMat4);
                    continue;
                }
                let b = (circuitDefinition.locIsMeasured(new Point(col, row)) ? 1 : 0) |
                        (circuitDefinition.locIsMeasured(new Point(col, row + 1)) ? 2 : 0);
                let buf = new Float32Array(matrices[row].rawBuffer());
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        if (((i ^ j) & b) !== 0) {
                            buf[i*8 + j*2] = 0;
                            buf[i*8 + j*2 + 1] = 0;
                        }
                    }
                }
                matrices[row] = new Matrix(4, 4, buf);
            }
            return matrices;
        }).toArray();


        return new CircuitStats(
            circuitDefinition,
            time,
            qubitDensities,
            qubitPairDensities,
            outputSuperposition);
    }
}
