/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CircuitShaders} from "../circuit/CircuitShaders.js"
import {Gate, GateBuilder} from "../circuit/Gate.js"
import {GatePainting} from "../draw/GatePainting.js"
import {GateShaders} from "../circuit/GateShaders.js"
import {MathPainter} from "../draw/MathPainter.js"
import {Matrix} from "../math/Matrix.js"
import {Shaders} from "../webgl/Shaders.js"
import {Util} from "../base/Util.js"
import {WglArg} from "../webgl/WglArg.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"
import {
    Inputs,
    Outputs,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode
} from "../webgl/ShaderCoders.js"
import {WglTexturePool} from "../webgl/WglTexturePool.js"
import {WglTextureTrader} from "../webgl/WglTextureTrader.js"

/**
 * @param {!WglTexture} inp
 * @param {!Controls} controls
 * @param {!int} qubitCount
 * @param {!int} rangeOffset
 * @param {!int} rangeLength
 * @returns {!WglTexture}
 */
function densityDisplayStatTexture(inp, qubitCount, controls, rangeOffset, rangeLength) {
    let trader = new WglTextureTrader(inp);
    trader.dontDeallocCurrentTexture();

    // Put into normal form by throwing away areas not satisfying the controls and cycling the offset away.
    let startingQubits = currentShaderCoder().vec2.arrayPowerSizeOfTexture(inp);
    let lostQubits = Util.numberOfSetBits(controls.inclusionMask);
    let lostHeadQubits = Util.numberOfSetBits(controls.inclusionMask & ((1<<rangeOffset)-1));
    trader.shadeAndTrade(
            ket => CircuitShaders.controlSelect(controls, ket),
        WglTexturePool.takeVec2Tex(startingQubits - lostQubits));
    trader.shadeAndTrade(ket => GateShaders.cycleAllBits(ket, lostHeadQubits-rangeOffset));

    // Expand amplitudes into couplings.
    let n = qubitCount - lostQubits + rangeLength;
    trader.shadeAndTrade(e => amplitudesToCouplings(e, rangeLength), WglTexturePool.takeVec2Tex(n));

    // Sum up the density matrices from all combinations of the unincluded qubits' values.
    while (n > 2*rangeLength) {
        n--;
        trader.shadeHalveAndTrade(Shaders.sumFoldVec2);
    }

    if (currentShaderCoder().vec2.needRearrangingToBeInVec4Format) {
        trader.shadeHalveAndTrade(Shaders.packVec2IntoVec4);
    }
    return trader.currentTexture;
}

/**
 * @param {!WglTexture} inputTexture
 * @param {!int} qubitSpan
 * @returns {!WglConfiguredShader}
 */
let amplitudesToCouplings = (inputTexture, qubitSpan) => AMPLITUDES_TO_DENSITIES_SHADER(
    inputTexture,
    WglArg.float('qubitSpan', 1 << qubitSpan));
const AMPLITUDES_TO_DENSITIES_SHADER = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec2(),
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
    let n = pixels.length >> 1;
    let d = Math.round(Math.sqrt(n));
    let unity = 0;
    for (let i = 0; i < d; i++) {
        unity += pixels[2*i*(d+1)];
    }
    if (isNaN(unity) || unity < 0.000001) {
        return Matrix.zero(d, d).times(NaN);
    }
    for (let i = 0; i < pixels.length; i++) {
        pixels[i] /= unity;
    }

    let isMeasuredMask = circuitDefinition.colIsMeasuredMask(col) >> row;
    return decohereMeasuredBitsInDensityMatrix(new Matrix(d, d, pixels), isMeasuredMask).transpose();
}

/**
 * @param {!GateBuilder} builder
 * @returns {!GateBuilder}
 */
function densityMatrixDisplayMaker_shared(builder) {
    return builder.
        setSymbol("Density").
        setTitle("Density Matrix Display").
        setBlurb("Shows the density matrix of the local mixed state of some wires.\n" +
            "Use controls to see conditional states.").
        promiseHasNoNetEffectOnStateVector().
        setExtraDisableReasonFinder(args => args.isNested ? "can't\nnest\ndisplays\n(sorry)" : undefined);
}

/**
 * @param {!GateBuilder} builder
 * @returns {!GateBuilder}
 */
function singleDensityMatrixDisplayMaker(builder) {
    return densityMatrixDisplayMaker_shared(builder).
        setSerializedId("Density").
        markAsDrawerNeedsSingleQubitDensityStats().
        setDrawer(GatePainting.makeDisplayDrawer(args => {
            let {col, row} = args.positionInCircuit;
            let ρ = args.stats.qubitDensityMatrix(col, row).transpose();
            MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
        }));
}

/**
 * @param {!int} span
 * @param {!GateBuilder} builder
 * @returns {!GateBuilder}
 */
function largeDensityMatrixDisplayMaker(span, builder) {
    return densityMatrixDisplayMaker_shared(builder).
        setSerializedId("Density" + span).
        setWidth(span).
        setDrawer(DENSITY_MATRIX_DRAWER_FROM_CUSTOM_STATS).
        setProcessedStatsToJsonFunc(data => {
            return {density_matrix: data.toReadableJson()};
        }).
        setStatTexturesMaker(ctx => densityDisplayStatTexture(
            ctx.stateTrader.currentTexture, ctx.wireCount, ctx.controls, ctx.row, span)).
        setStatPixelDataPostProcessor(densityPixelsToMatrix);
}

/**
 * @param {!GateDrawParams} args
 */
const DENSITY_MATRIX_DRAWER_FROM_CUSTOM_STATS = GatePainting.makeDisplayDrawer(args => {
    let n = args.gate.height;
    let ρ = args.customStats || Matrix.zero(1<<n, 1<<n).times(NaN);
    MathPainter.paintDensityMatrix(args.painter, ρ, args.rect, args.focusPoints);
});

let DensityMatrixDisplayFamily = Gate.buildFamily(1, 8, (span, builder) =>
    span === 1 ?
        singleDensityMatrixDisplayMaker(builder) :
        largeDensityMatrixDisplayMaker(span, builder));
export {DensityMatrixDisplayFamily, amplitudesToCouplings}
