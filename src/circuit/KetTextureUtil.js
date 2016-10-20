import {CircuitShaders} from "src/circuit/CircuitShaders.js"
import {Config} from "src/Config.js"
import {Controls} from "src/circuit/Controls.js"
import {DetailedError} from "src/base/DetailedError.js"
import {GateShaders} from "src/circuit/GateShaders.js"
import {Matrix} from "src/math/Matrix.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Util} from "src/base/Util.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {seq, Seq} from "src/base/Seq.js"
import {outputShaderCoder, currentShaderCoder} from "src/webgl/ShaderCoders.js"
import {WglTexturePool} from "src/webgl/WglTexturePool.js"
import {WglTextureTrader} from "src/webgl/WglTextureTrader.js"

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
class KetTextureUtil {}

/**
 * @param {!WglTextureTrader} trader
 * @returns {!Float32Array}
 */
KetTextureUtil.tradeTextureForVec2Output = trader => {
    currentShaderCoder().vec2TradePack(trader);
    return KetTextureUtil.tradeTextureForVec4Output(trader);
};

/**
 * @param {!WglTextureTrader} trader
 * @returns {!Float32Array}
 */
KetTextureUtil.tradeTextureForVec4Output = trader => {
    if (outputShaderCoder() === currentShaderCoder()) {
        let result = currentShaderCoder().unpackVec4Data(trader.currentTexture.readPixels());
        trader.currentTexture.deallocByDepositingInPool("tradeTextureForVec4Output");
        return result;
    }

    let sizePower = currentShaderCoder().vec4ArrayPowerSizeOfTexture(trader.currentTexture);
    let adjustedSizePower = sizePower + outputShaderCoder().vec4PowerSizeOverhead;

    trader.shadeAndTrade(
        Shaders.convertVec4CodingForOutput,
        WglTexturePool.take(adjustedSizePower, outputShaderCoder().vecPixelType));
    let result = outputShaderCoder().unpackVec4Data(trader.currentTexture.readPixels());
    trader.currentTexture.deallocByDepositingInPool("tradeTextureForVec4Output");
    return result;
};

/**
 * @param {!Array.<!WglTexture>} textures The textures to read and deallocate as a group.
 * @returns {!Array.<!Float32Array>}
 */
KetTextureUtil.mergedReadFloats = textures => {
    let len = tex => tex.width === 0 ? 0 : 1 << currentShaderCoder().vec4ArrayPowerSizeOfTexture(tex);
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
        return new WglTexture(0, 0, currentShaderCoder().vecPixelType);
    }
    let hasControls = !controls.isEqualTo(Controls.NONE);
    let trader = new WglTextureTrader(stateTex);
    trader.dontDeallocCurrentTexture();
    if (hasControls) {
        let n = currentShaderCoder().vec2ArrayPowerSizeOfTexture(stateTex) - controls.includedBitCount();
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
    let startingQubitCount = currentShaderCoder().vec2ArrayPowerSizeOfTexture(trader.currentTexture);
    let remainingQubitCount = Util.numberOfSetBits(keptBitMask);
    trader.shadeAndTrade(
        tex => CircuitShaders.qubitDensities(tex, keptBitMask),
        WglTexturePool.takeVec4Tex(startingQubitCount - 1 + Math.ceil(Math.log2(remainingQubitCount))));
}

/**
 * @param {!WglTextureTrader} trader
 * @param {!int} outCount The number of interleaved slices being summed.
 * The output will be a single row containing this many results (but padded up to a power of 2).
 */
function _sumDownVec4(trader, outCount) {
    // When the number of kept qubits isn't a power of 2, we have some extra junk results interleaved to ignore.
    let outputSizePower = Math.ceil(Math.log2(Math.max(1, outCount)));
    let curSizePower = currentShaderCoder().vec4ArrayPowerSizeOfTexture(trader.currentTexture);

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

export {KetTextureUtil}
