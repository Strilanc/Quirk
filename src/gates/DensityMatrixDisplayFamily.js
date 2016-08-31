import Config from "src/Config.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import DisplayShaders from "src/circuit/DisplayShaders.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import MathPainter from "src/draw/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import ShaderPipeline from "src/circuit/ShaderPipeline.js"
import Shaders from "src/webgl/Shaders.js"
import Util from "src/base/Util.js"

/**
 * @param {!number} w
 * @param {!number} h
 * @param {!Controls} controls
 * @param {!int} rangeOffset
 * @param {!int} rangeLength
 * @returns {!ShaderPipeline} Computes the marginal probabilities for a range of qubits from a superposition texture.
 */
function makeDensityPipeline(w, h, controls, rangeOffset, rangeLength) {
    let result = new ShaderPipeline();

    let areaReduction = Util.numberOfSetBits(controls.inclusionMask);
    let offsetReduction = Util.numberOfSetBits(controls.inclusionMask & ((1<<rangeOffset)-1));
    w >>= Math.floor(areaReduction/2);
    h >>= Math.ceil(areaReduction/2);
    result.addSizedStep(w, h, t => CircuitShaders.controlSelect(controls, t));
    result.addSizedStep(w, h, t => GateShaders.cycleAllBits(t, offsetReduction-rangeOffset));

    w <<= Math.floor(rangeLength/2);
    h <<= Math.ceil(rangeLength/2);
    if (h > w) {
        w <<= 1;
        h >>= 1;
    }
    result.addSizedStep(w, h, t => DisplayShaders.amplitudesToDensities(t, rangeLength));

    let remainingQubitCount = Math.round(Math.log2(w*h));
    for (let i = Math.round(Math.log2(w*h)); i > 2*rangeLength; i--) {
        if (h > 1) {
            h >>= 1;
            result.addSizedStep(w, h, (h=>t=>Shaders.sumFold(t, 0, h))(h));
        } else {
            w >>= 1;
            result.addSizedStep(w, h, (w=>t=>Shaders.sumFold(t, w, 0))(w));
        }
        remainingQubitCount -= 1;
    }

    return result;
}

/**
 * Returns the same density matrix, but without any diagonal terms related to qubits that have been measured.
 * @param {!Matrix} densityMatrix
 * @param {!int} isMeasuredMask A bitmask where each 1 corresponds to a measured qubit position.
 * @returns {!Matrix}
 */
function decohereMeasuredBitsInDensityMatrix(densityMatrix, isMeasuredMask) {
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
 * Post-processes the pixels that come out of makeDensityPipeline into a vector of normalized probabilities.
 * @param {!Float32Array} pixels
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!int} col
 * @param {!int} row
 * @returns {!Matrix}
 */
function densityPixelsToMatrix(pixels, circuitDefinition, col, row) {
    let n = pixels.length/4;
    let d = Math.round(Math.sqrt(n));
    let unity = 0;
    for (let i = 0; i < d; i++) {
        unity += pixels[4*i*(d+1)];
    }
    if (isNaN(unity) || unity < 0.000001) {
        return Matrix.zero(d, d).times(NaN);
    }
    let coefs = new Float32Array(d*d*2);
    for (let i = 0; i < coefs.length; i++) {
        coefs[i*2] = pixels[i*4]/unity;
        coefs[i*2+1] = pixels[i*4+1]/unity;
    }

    let isMeasuredMask = circuitDefinition.colIsMeasuredMask(col) >> row;
    return decohereMeasuredBitsInDensityMatrix(new Matrix(d, d, coefs), isMeasuredMask);
}

function densityMatrixDisplayMaker(span) {
    return Gate.fromIdentity(
        "Density",
        "Density Matrix Display",
        "Shows the density matrix of the local mixed state of some wires.\nUse controls to see conditional states.").
        withSerializedId("Density" + span).
        withWidth(span).
        withHeight(span).
        withCustomDrawer(DENSITY_MATRIX_DRAWER_FROM_CUSTOM_STATS).
        withCustomStatPipelineMaker(args => makeDensityPipeline(
            args.controlsTexture.width,
            args.controlsTexture.height,
            args.controls,
            args.row,
            span)).
        withCustomStatPostProcessor(densityPixelsToMatrix);
}

const DENSITY_MATRIX_DRAWER_FROM_CUSTOM_STATS = GatePainting.makeDisplayDrawer(args => {
    let n = args.gate.height;
    let ρ = args.customStats || Matrix.zero(1<<n, 1<<n).times(NaN);
    MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
});

let SingleWireDensityMatrixDisplay = Gate.fromIdentity(
    "Density",
    "Density Matrix Display",
    "Shows the density matrix of the local mixed state of some wires.\nUse controls to see conditional states.").
    withSerializedId("Density").
    withCustomDrawer(GatePainting.makeDisplayDrawer(args => {
        let {row, col} = args.positionInCircuit;
        let ρ = args.stats.qubitDensityMatrix(row, col);
        MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
    }));

let DensityMatrixDisplayFamily = Gate.generateFamily(1, 8, span =>
    span === 1 ? SingleWireDensityMatrixDisplay :
    densityMatrixDisplayMaker(span));
export default DensityMatrixDisplayFamily;
