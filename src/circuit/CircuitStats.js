import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitEvalArgs} from "src/circuit/CircuitEvalArgs.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {KetTextureUtil} from "src/circuit/KetTextureUtil.js"
import {Config} from "src/Config.js"
import {Controls} from "src/circuit/Controls.js"
import {DetailedError} from "src/base/DetailedError.js"
import {Format} from "src/base/Format.js"
import {Gate} from "src/circuit/Gate.js"
import {Gates} from "src/gates/AllGates.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Serializer} from "src/circuit/Serializer.js"
import {Util} from "src/base/Util.js"
import {seq, Seq} from "src/base/Seq.js"
import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"
import {advanceStateWithCircuit} from "src/circuit/CircuitComputeUtil.js"
import {workingShaderCoder} from "src/webgl/ShaderCoders.js"
import {WglTexturePool} from "src/webgl/WglTexturePool.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

class CircuitStats {
    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @param {!Array.<!Array.<!Matrix>>} singleQubitDensities
     * @param {!Matrix} finalState
     * @param {NaN|!number} postSelectionSurvivalRate
     * @param {!Map<!string, *>} customStatsProcessed
     */
    constructor(circuitDefinition,
                time,
                singleQubitDensities,
                finalState,
                postSelectionSurvivalRate,
                customStatsProcessed) {
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
         * The density matrix of individual qubits.
         * (This case is special-cased, instead of using customStats like the other density displays, because
         *  single-qubit displays are so much more common. Also they appear in bulk at the end of the circuit.)
         * @type {!Array.<!Array.<!Matrix>>}
         * @private
         */
        this._qubitDensities = singleQubitDensities;
        /**
         * The output quantum superposition, as a column vector.
         * @type {!Matrix}
         */
        this.finalState = finalState;
        /**
         * @type {NaN|!number}
         */
        this.postSelectionSurvivalRate = postSelectionSurvivalRate;
        /**
         * @type {!Map.<!string, *>}
         * @private
         */
        this._customStatsProcessed = customStatsProcessed;
    }

    /**
     * Returns the density matrix of a qubit at a particular point in the circuit.
     *
     * Note: only available if there was a corresponding display gate at that position. Otherwise result is NaN.
     *
     * @param {!int} colIndex
     * @param {!int} wireIndex
     * @returns {!Matrix}
     */
    qubitDensityMatrix(colIndex, wireIndex) {
        if (wireIndex < 0) {
            throw new DetailedError("Bad wireIndex", {wireIndex, colIndex});
        }

        // The initial state is all-qubits-off.
        if (colIndex < 0 || wireIndex >= this.circuitDefinition.numWires) {
            if (this.qubitDensityMatrix(colIndex, 0).hasNaN()) {
                return Matrix.zero(2, 2).times(NaN);
            }
            let buf = new Float32Array(2*2*2);
            buf[0] = 1;
            return new Matrix(2, 2, buf);
        }

        let col = Math.min(colIndex, this._qubitDensities.length - 1);
        if (col < 0 || wireIndex >= this._qubitDensities[col].length) {
            return Matrix.zero(2, 2).times(NaN);
        }
        return this._qubitDensities[col][wireIndex];
    }

    /**
     * @param {!int} col
     * @param {!int} row
     * @returns {undefined|*}
     */
    customStatsForSlot(col, row) {
        let key = col+":"+row;
        return this._customStatsProcessed.has(key) ? this._customStatsProcessed.get(key) : undefined;
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
        return this.qubitDensityMatrix(colIndex, wireIndex).rawBuffer()[6];
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
            this.finalState,
            this.postSelectionSurvivalRate,
            this._customStatsProcessed);
    }

    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @returns {!CircuitStats}
     */
    static withNanDataFromCircuitAtTime(circuitDefinition, time) {
        return new CircuitStats(
            circuitDefinition,
            time,
            [],
            Matrix.zero(1, 1 << circuitDefinition.numWires).times(NaN),
            NaN,
            new Map());
    }

    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @returns {!CircuitStats}
     */
    static fromCircuitAtTime(circuitDefinition, time) {
        try {
            return CircuitStats._fromCircuitAtTime_noFallback(circuitDefinition, time);
        } catch (ex) {
            notifyAboutRecoveryFromUnexpectedError(
                `Defaulted to NaN results. Computing circuit values failed.`,
                {circuitDefinition: Serializer.toJson(circuitDefinition)},
                ex);
            return CircuitStats.withNanDataFromCircuitAtTime(circuitDefinition, time);
        }
    }

    /**
     * Returns the same density matrix, but without any diagonal terms related to qubits that have been measured.
     * @param {!Matrix} densityMatrix
     * @param {!int} isMeasuredMask A bitmask where each 1 corresponds to a measured qubit position.
     * @returns {!Matrix}
     */
    static decohereMeasuredBitsInDensityMatrix(densityMatrix, isMeasuredMask) {
        if (isMeasuredMask === 0) {
            return densityMatrix;
        }

        let buf = new Float32Array(densityMatrix.rawBuffer());
        let n = densityMatrix.width();
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                if (((row ^ col) & isMeasuredMask) !== 0) {
                    let k = (row*n + col)*2;
                    buf[k] = 0;
                    buf[k+1] = 0;
                }
            }
        }
        return new Matrix(n, n, buf);
    }

    /**
     * @param {!Array.<!Matrix>} rawMatrices
     * @param {!int} numWires
     * @param {!int} qubitSpan
     * @param {!int} isMeasuredMask
     * @param {!int} hasDisplayMask
     * @returns {!Array.<!Matrix>}
     */
    static scatterAndDecohereDensities(rawMatrices, numWires, qubitSpan, isMeasuredMask, hasDisplayMask) {
        let nanMat = Matrix.zero(1 << qubitSpan, 1 << qubitSpan).times(NaN);
        let used = 0;
        return Seq.range(numWires - qubitSpan + 1).map(row => {
            if ((hasDisplayMask & (1 << row)) === 0) {
                return nanMat;
            }
            return CircuitStats.decohereMeasuredBitsInDensityMatrix(
                rawMatrices[used++],
                (isMeasuredMask >> row) & ((1 << qubitSpan) - 1));
        }).toArray();
    }

    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @param {!number} time
     * @returns {!CircuitStats}
     */
    static _fromCircuitAtTime_noFallback(circuitDefinition, time) {
        circuitDefinition = circuitDefinition.withMinimumWireCount();
        const numWires = circuitDefinition.numWires;
        const numCols = circuitDefinition.columns.length;

        // Advance state while collecting stats into textures.
        let stateTrader = new WglTextureTrader(CircuitShaders.classicalState(0).toVec2Texture(numWires));
        let controlTex = CircuitShaders.controlMask(Controls.NONE).toBoolTexture(numWires);
        let {colQubitDensities, customStats, customStatsMap} = advanceStateWithCircuit(
            new CircuitEvalArgs(
                time,
                0,
                numWires,
                Controls.NONE,
                controlTex,
                stateTrader,
                new Map()),
            circuitDefinition,
            true);
        controlTex.deallocByDepositingInPool("controlTex in _fromCircuitAtTime_noFallback");
        stateTrader.shadeAndTrade(
            tex => Shaders.vec2AsVec4(tex),
            WglTexturePool.takeVec4Tex(workingShaderCoder.vec2ArrayPowerSizeOfTexture(stateTrader.currentTexture)));

        // Read all texture data.
        let pixelData = Util.objectifyArrayFunc(KetTextureUtil.mergedReadFloats)({
            output: stateTrader.currentTexture,
            colQubitDensities,
            customStats});

        // -- INTERPRET --

        let final = pixelData.colQubitDensities[pixelData.colQubitDensities.length - 1];
        let unity = final[0] + final[3];
        //noinspection JSCheckFunctionSignatures
        let outputSuperposition = KetTextureUtil.pixelsToAmplitudes(pixelData.output, unity);

        let qubitDensities = seq(pixelData.colQubitDensities).mapWithIndex((pixels, col) =>
            CircuitStats.scatterAndDecohereDensities(
                KetTextureUtil.pixelsToQubitDensityMatrices(pixels),
                numWires,
                1,
                circuitDefinition.colIsMeasuredMask(col),
                // All wires have an output display in the after-last column.
                col === numCols ? -1 : circuitDefinition.colHasSingleQubitDisplayMask(col))
        ).toArray();

        let customStatsProcessed = new Map();
        for (let {col, row, out} of customStatsMap) {
            //noinspection JSUnusedAssignment
            let func = circuitDefinition.gateInSlot(col, row).customStatPostProcesser || (e => e);
            //noinspection JSUnusedAssignment
            customStatsProcessed.set(col+":"+row, func(pixelData.customStats[out], circuitDefinition, col, row));
        }

        return new CircuitStats(
            circuitDefinition,
            time,
            qubitDensities,
            outputSuperposition,
            unity,
            customStatsProcessed);
    }
}

export {CircuitStats}
