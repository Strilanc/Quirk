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

import {CircuitShaders} from "./CircuitShaders.js"
import {Controls} from "./Controls.js"
import {DetailedError} from "../base/DetailedError.js"
import {Matrix} from "../math/Matrix.js"
import {Shaders} from "../webgl/Shaders.js"
import {Util} from "../base/Util.js"
import {WglTexture} from "../webgl/WglTexture.js"
import {seq, Seq} from "../base/Seq.js"
import {
    outputShaderCoder,
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode,
    Inputs,
    Outputs
} from "../webgl/ShaderCoders.js"
import {WglTexturePool} from "../webgl/WglTexturePool.js"
import {WglTextureTrader} from "../webgl/WglTextureTrader.js"

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
class KetTextureUtil {}

/**
 * @param {!WglTextureTrader} trader
 * @returns {!Float32Array}
 */
KetTextureUtil.tradeTextureForVec2Output = trader => {
    if (currentShaderCoder().vec2.needRearrangingToBeInVec4Format) {
        trader.shadeHalveAndTrade(Shaders.packVec2IntoVec4);
    }
    return KetTextureUtil.tradeTextureForVec4Output(trader);
};

/**
 * @param {!WglTextureTrader} trader
 * @returns {!Float32Array}
 */
KetTextureUtil.tradeTextureForVec4Output = trader => {
    if (outputShaderCoder() === currentShaderCoder()) {
        let result = currentShaderCoder().vec4.pixelsToData(trader.currentTexture.readPixels());
        trader.currentTexture.deallocByDepositingInPool("tradeTextureForVec4Output");
        return result;
    }

    let sizePower = currentShaderCoder().vec4.arrayPowerSizeOfTexture(trader.currentTexture);
    let adjustedSizePower = sizePower + outputShaderCoder().vec4.powerSizeOverhead;

    trader.shadeAndTrade(
        Shaders.convertVec4CodingForOutput,
        WglTexturePool.take(adjustedSizePower, outputShaderCoder().vec4.pixelType));
    let result = outputShaderCoder().vec4.pixelsToData(trader.currentTexture.readPixels());
    trader.currentTexture.deallocByDepositingInPool("tradeTextureForVec4Output");
    return result;
};

/**
 * @param {!Array.<!WglTexture>} textures The textures to read and deallocate as a group.
 * @returns {!Array.<!Float32Array>}
 */
KetTextureUtil.mergedReadFloats = textures => {
    let len = tex => tex.width === 0 ? 0 : 1 << currentShaderCoder().vec4.arrayPowerSizeOfTexture(tex);
    let totalPowerSize = Math.round(Math.log2(Util.ceilingPowerOf2(
        seq(textures).map(len).sum())));

    let trader = new WglTextureTrader(Shaders.color(0, 0, 0, 0).toVec4Texture(totalPowerSize));
    let offset = 0;
    for (let tex of textures) {
        if (tex.width > 0) {
            trader.shadeAndTrade(acc => CircuitShaders.linearOverlay(offset, tex, acc));
        }
        offset += len(tex);
    }

    let combinedPixels = KetTextureUtil.tradeTextureForVec4Output(trader);

    let result = [];
    let pixelOffset = 0;
    for (let tex of textures) {
        let pixelLen = len(tex) << 2;
        result.push(combinedPixels.subarray(pixelOffset, pixelOffset + pixelLen));
        pixelOffset += pixelLen;
        tex.deallocByDepositingInPool();
    }
    return result;
};

/**
 * @param {!Float32Array} pixels
 * @param {!number} unity
 * @returns {!Matrix}
 */
KetTextureUtil.pixelsToAmplitudes = (pixels, unity) => {
    // Renormalization factor. For better answers when non-unitary gates are used.
    if (unity < 0.000001) {
        unity = NaN;
    }

    let d = Math.sqrt(unity);
    let n = pixels.length >> 1;
    let buf = new Float32Array(n * 2);
    for (let i = 0; i < pixels.length; i++) {
        buf[i] = pixels[i] / d;
    }
    return new Matrix(1, n, buf);
};

/**
 * @param {!WglTexture} stateTex
 * @param {!Controls} controls
 * @param {!int} keptBitMask
 * @returns {!WglTexture}
 */
KetTextureUtil.superpositionToQubitDensities = (stateTex, controls, keptBitMask) => {
    if (keptBitMask === 0) {
        return new WglTexture(0, 0, currentShaderCoder().vec4.pixelType);
    }
    let hasControls = !controls.isEqualTo(Controls.NONE);
    let trader = new WglTextureTrader(stateTex);
    trader.dontDeallocCurrentTexture();
    if (hasControls) {
        let n = currentShaderCoder().vec2.arrayPowerSizeOfTexture(stateTex) - controls.includedBitCount();
        trader.shadeAndTrade(t => CircuitShaders.controlSelect(controls, t), WglTexturePool.takeVec2Tex(n));
    }

    let p = 1;
    for (let i = 1; i <= controls.inclusionMask; i <<= 1) {
        if ((controls.inclusionMask & i) === 0) {
            p <<= 1;
        } else {
            keptBitMask = (keptBitMask & (p - 1)) | ((keptBitMask & ~(p-1)) >> 1)
        }
    }

    _superpositionTexToUnsummedQubitDensitiesTex(trader, keptBitMask);
    let keptQubitCount = Util.numberOfSetBits(keptBitMask);
    _sumDownVec4(trader, keptQubitCount);

    return trader.currentTexture;
};

/**
 * @param {!WglTextureTrader} trader
 * @param {!int} keptBitMask
 */
function _superpositionTexToUnsummedQubitDensitiesTex(trader, keptBitMask) {
    if (keptBitMask === 0) {
        throw new DetailedError("keptBitMask === 0", {trader, keptBitMask});
    }
    let startingQubitCount = currentShaderCoder().vec2.arrayPowerSizeOfTexture(trader.currentTexture);
    let remainingQubitCount = Util.numberOfSetBits(keptBitMask);
    trader.shadeAndTrade(
        tex => CircuitShaders.qubitDensities(tex, keptBitMask),
        WglTexturePool.takeVec4Tex(startingQubitCount - 1 + Util.ceilLg2(remainingQubitCount)));
}

/**
 * @param {!WglTextureTrader} trader
 * @param {!int} outCount The number of interleaved slices being summed.
 * The output will be a single row containing this many results (but padded up to a power of 2).
 */
function _sumDownVec4(trader, outCount) {
    // When the number of kept qubits isn't a power of 2, we have some extra junk results interleaved to ignore.
    let outputSizePower = Util.ceilLg2(outCount);
    let curSizePower = currentShaderCoder().vec4.arrayPowerSizeOfTexture(trader.currentTexture);

    while (curSizePower > outputSizePower) {
        trader.shadeHalveAndTrade(Shaders.sumFoldVec4);
        curSizePower -= 1;
    }
}

/**
 * @param {!Float32Array} buffer
 * @returns {!Array.<!Matrix>}
 */
KetTextureUtil.pixelsToQubitDensityMatrices = buffer => {
    let qubitCount = buffer.length / 4;
    return Seq.range(qubitCount).map(i => {
        let a = buffer[i*4];
        let d = buffer[i*4 + 3];
        let unity = a + d;
        if (unity < 0.0000001 || isNaN(unity)) {
            return new Matrix(2, 2, new Float32Array([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]));
        }

        let br = buffer[i*4 + 1] / unity;
        let bi = buffer[i*4 + 2] / unity;
        return new Matrix(2, 2, new Float32Array([a / unity, 0, br, bi, br, -bi, d / unity, 0]));
    }).toArray();
};

/**
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
const amplitudesToProbabilities = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.float(),
    `float outputFor(float k) {
        vec2 amp = read_input(k);
        return dot(amp, amp);
    }`);

/**
 * @param {!WglTexture} stateTex
 * @param {!boolean} mayHaveChanged
 * @returns {!WglTexture}
 */
KetTextureUtil.superpositionToNorm = (stateTex, mayHaveChanged) => {
    if (!mayHaveChanged) {
        return new WglTexture(0, 0, currentShaderCoder().vec4.pixelType);
    }
    let trader = new WglTextureTrader(stateTex);
    trader.dontDeallocCurrentTexture();
    let n = currentShaderCoder().vec2.arrayPowerSizeOfTexture(stateTex);

    trader.shadeAndTrade(amplitudesToProbabilities, WglTexturePool.takeVecFloatTex(n));
    while (n > 0) {
        n -= 1;
        trader.shadeHalveAndTrade(Shaders.sumFoldFloat);
    }
    trader.shadeAndTrade(Shaders.packFloatIntoVec4, WglTexturePool.takeVec4Tex(0));
    return trader.currentTexture;
};

export {KetTextureUtil}
