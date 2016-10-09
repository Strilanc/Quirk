import {Config} from "src/Config.js"
import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {DetailedError} from "src/base/DetailedError.js"
import {Gate} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {MathPainter} from "src/draw/MathPainter.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {Rect} from "src/math/Rect.js"
import {seq, Seq} from "src/base/Seq.js"
import {ShaderPipeline} from "src/circuit/ShaderPipeline.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglConfiguredShader, WglShader} from "src/webgl/WglShader.js"
import {workingShaderCoder, makePseudoShaderWithInputsAndOutputAndCode} from "src/webgl/ShaderCoders.js"

/**
 * @param {!Controls} controls
 * @param {!int} qubitCount
 * @param {!int} rangeOffset
 * @param {!int} rangeLength
 * @returns {!ShaderPipeline} Computes the marginal probabilities for a range of qubits from a superposition texture.
 */
function makeDensityPipeline(qubitCount, controls, rangeOffset, rangeLength) {

    let forcedQubits = Util.numberOfSetBits(controls.inclusionMask);
    let forcedQubitsAbove = Util.numberOfSetBits(controls.inclusionMask & ((1<<rangeOffset)-1));

    let result = new ShaderPipeline();

    let n = qubitCount - forcedQubits;
    result.addPowerSizedStep(n, t => CircuitShaders.controlSelect(controls, t));
    result.addPowerSizedStep(n, t => GateShaders.cycleAllBits(t, forcedQubitsAbove-rangeOffset));

    n += rangeLength;
    result.addPowerSizedStep(n, t => amplitudesToDensities(t, rangeLength));

    while (n > 2*rangeLength) {
        n--;
        result.addPowerSizedStep(n, t => Shaders.sumFoldVec2(t));
    }

    return result;
}

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} qubitSpan
 * @returns {!WglConfiguredShader}
 */
let amplitudesToDensities = (inputTexture, qubitSpan) => AMPLITUDES_TO_DENSITIES_SHADER(
    inputTexture,
    WglArg.float('qubitSpan', 1 << qubitSpan));
const AMPLITUDES_TO_DENSITIES_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [workingShaderCoder.vec2Input('input')],
    workingShaderCoder.vec2Output,
    `
    uniform float qubitSpan;

    vec2 outputFor(float k) {
        float k_ket = mod(k, qubitSpan);
        float k_bra = mod(floor(k / qubitSpan), qubitSpan);
        float k_rest = floor(k / qubitSpan / qubitSpan);
        float offset = k_rest*qubitSpan;

        vec2 ampKet = read_input(k_ket + offset);
        vec2 ampBra = read_input(k_bra + offset);
        float r = dot(ampKet, ampBra);
        float i = dot(ampKet, vec2(-ampBra.y, ampBra.x));

        return vec2(r, i);
    }`);

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
            args.wireCount,
            args.controls,
            args.row,
            span)).
        withCustomStatPostProcessor(densityPixelsToMatrix).
        withCustomDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined);
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
        let {col, row} = args.positionInCircuit;
        let ρ = args.stats.qubitDensityMatrix(col, row);
        MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
    })).
    withCustomDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined);

let DensityMatrixDisplayFamily = Gate.generateFamily(1, 8, span =>
    span === 1 ? SingleWireDensityMatrixDisplay :
    densityMatrixDisplayMaker(span));
export {DensityMatrixDisplayFamily, amplitudesToDensities}
