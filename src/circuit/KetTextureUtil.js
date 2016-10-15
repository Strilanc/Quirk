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
import {workingShaderCoder, decodeBytesIntoFloats, SHADER_CODER_BYTES} from "src/webgl/ShaderCoders.js"
import {WglTexturePool} from "src/webgl/WglTexturePool.js"

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
class KetTextureUtil {}

/** @type {!Map.<!int, !(!WglTexture[])>} */
const TEXTURE_POOL = new Map();

let allocNewTextureCount = 0;

/**
 * @param {!int} qubitCount
 * @param {!int=0} classicalState
 * @returns {!WglTexture}
 */
KetTextureUtil.classicalKet = (qubitCount, classicalState=0) => {
    let tex = WglTexturePool.takeVec2Tex(qubitCount);
    CircuitShaders.classicalState(classicalState).renderTo(tex);
    return tex;
};

/**
 * @param {!int} qubitCount
 * @param {!Controls} mask
 * @returns {!WglTexture}
 */
KetTextureUtil.control = (qubitCount, mask) => {
    let tex = WglTexturePool.takeBoolTex(qubitCount);
    CircuitShaders.controlMask(mask).renderTo(tex);
    return tex;
};

/**
 * @param {!Array.<!WglTexture>} textures
 * @returns {!Array.<!Float32Array>}
 */
KetTextureUtil.mergedReadFloats = textures => {
    let pixelCounts = textures.map(e => e.width === 0 ? 0 : 1 << workingShaderCoder.vec4Order(e));
    let pixelOffsets = seq(pixelCounts).scan(0, (a, e) => a + e).toArray();
    let lgTotal = Math.round(Math.log2(Util.ceilingPowerOf2(pixelOffsets[pixelOffsets.length - 1])));
    let combinedTex = WglTexturePool.takeVec4Tex(lgTotal);
    Shaders.color(0, 0, 0, 0).renderTo(combinedTex);
    combinedTex = KetTextureUtil.aggregateWithReuse(
        combinedTex,
        Seq.range(textures.length).filter(i => textures[i].width > 0),
        (accTex, i) => {
            let inputTex = textures[i];
            let nextTex = WglTexturePool.takeVec4Tex(lgTotal);
            CircuitShaders.linearOverlay(pixelOffsets[i], inputTex, accTex).renderTo(nextTex);
            inputTex.deallocByDepositingInPool("inputTex in mergedReadFloats");
            return nextTex;
        });

    let combinedPixels;
    if (Config.ENCODE_FLOATS_AS_BYTES_WHEN_READING_PIXELS) {
        combinedPixels = SHADER_CODER_BYTES.readVec4Data(Shaders.encodeFloatsIntoBytes(combinedTex), lgTotal);
    } else {
        combinedPixels = workingShaderCoder.readVec4Data(combinedTex.readPixels(), lgTotal);
    }
    combinedTex.deallocByDepositingInPool("combinedTex in mergedReadFloats");

    return Seq.range(textures.length).map(i => {
        let offset = pixelOffsets[i] * 4;
        let length = pixelCounts[i] * 4;
        return combinedPixels.subarray(offset, offset + length);
    }).toArray();
};

/**
 * @param {!CircuitEvalArgs} circuitEvalArgs
 * @param {!function(!CircuitEvalArgs):!WglConfiguredShader} customShader
 * @returns {!WglTexture}
 */
KetTextureUtil.applyCustomShader = (customShader, circuitEvalArgs) => {
    let result = WglTexturePool.takeSame(circuitEvalArgs.stateTexture);
    customShader(circuitEvalArgs).renderTo(result);
    return result;
};

/**
 * @param {!CircuitEvalArgs} args
 * @param {!Matrix} matrix
 * @returns {!WglTexture}
 */
KetTextureUtil.matrixOperation = (args, matrix) => {
    let result = WglTexturePool.takeSame(args.stateTexture);
    GateShaders.matrixOperation(args, matrix).renderTo(result);
    return result;
};

/**
 * @param {!WglTexture} seedTex
 * @param {!Array.<T>|!Seq.<T>} items
 * @param {!function(!WglTexture, T) : !WglTexture} aggregateFunc
 * @returns {!WglTexture}
 * @template T
 */
KetTextureUtil.aggregateReusingIntermediates = (seedTex, items, aggregateFunc) => {
    let outTex = seq(items).aggregate(seedTex, (prevTex, item) => {
        let nextTex = aggregateFunc(prevTex, item);
        if (prevTex !== seedTex) {
            prevTex.deallocByDepositingInPool("prevTex in aggregateReusingIntermediates");
        }
        return nextTex;
    });
    if (outTex === seedTex) {
        outTex = WglTexturePool.takeSame(seedTex);
        Shaders.passthrough(seedTex).renderTo(outTex);
    }
    return outTex;
};
/**
 * @param {!WglTexture} seedTex
 * @param {!Array.<T>|!Seq.<T>} items
 * @param {!function(!WglTexture, T) : !WglTexture} aggregateFunc
 * @returns {!WglTexture}
 * @template T
 */
KetTextureUtil.aggregateWithReuse = (seedTex, items, aggregateFunc) => {
    return seq(items).aggregate(seedTex, (prevTex, item) => {
        let nextTex = aggregateFunc(prevTex, item);
        prevTex.deallocByDepositingInPool("prevTex in aggregateWithReuse");
        return nextTex;
    });
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
    let n = pixels.length / 4;
    let buf = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
        buf[i * 2] = pixels[i * 4] / d;
        buf[i * 2 + 1] = pixels[i * 4 + 1] / d;
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
        return new WglTexture(0, 0, workingShaderCoder.vecPixelType);
    }
    let hasControls = !controls.isEqualTo(Controls.NONE);
    let reducedTex = stateTex;
    if (hasControls) {
        reducedTex = WglTexturePool.takeVec2Tex(workingShaderCoder.vec2Order(stateTex) - controls.includedBitCount());
        CircuitShaders.controlSelect(controls, stateTex).renderTo(reducedTex);
    }
    let p = 1;
    for (let i = 1; i <= controls.inclusionMask; i <<= 1) {
        if ((controls.inclusionMask & i) === 0) {
            p <<= 1;
        } else {
            keptBitMask = (keptBitMask & (p - 1)) | ((keptBitMask & ~(p-1)) >> 1)
        }
    }
    let unsummedTex = KetTextureUtil._superpositionTexToUnsummedQubitDensitiesTex(reducedTex, keptBitMask);
    if (hasControls) {
        reducedTex.deallocByDepositingInPool("reducedTex in superpositionToQubitDensities");
    }
    let keptQubitCount = Util.numberOfSetBits(keptBitMask);
    let result = KetTextureUtil._sumDownVec4(unsummedTex, keptQubitCount);
    unsummedTex.deallocByDepositingInPool("unsummedTex in superpositionToQubitDensities");
    return result;
};

/**
 * @param {!WglTexture} superpositionTex
 * @param {!int} keptBitMask
 * @returns {!WglTexture}
 */
KetTextureUtil._superpositionTexToUnsummedQubitDensitiesTex = (superpositionTex, keptBitMask) => {
    if (keptBitMask === 0) {
        throw new DetailedError("keptBitMask === 0", {superpositionTex, keptBitMask});
    }
    let startingQubitCount = workingShaderCoder.vec2Order(superpositionTex);
    let remainingQubitCount = Util.numberOfSetBits(keptBitMask);
    let inter = WglTexturePool.takeVec4Tex(startingQubitCount - 1 + Math.ceil(Math.log2(remainingQubitCount)));
    CircuitShaders.qubitDensities(superpositionTex, keptBitMask).renderTo(inter);
    return inter;
};

/**
 * @param {!WglTexture} summandsTex
 * @param {!int} outCount The number of interleaved slices being summed.
 * The output will be a single row containing this many results (but padded up to a power of 2).
 * @returns {!WglTexture}
 */
KetTextureUtil._sumDownVec4 = (summandsTex, outCount) => {
    // When the number of kept qubits isn't a power of 2, we have some extra junk results interleaved to ignore.
    let outputOrder = Math.ceil(Math.log2(Math.max(1, outCount)));
    let inputOrder = workingShaderCoder.vec4Order(summandsTex);

    return KetTextureUtil.aggregateReusingIntermediates(
        summandsTex,
        Seq.range(inputOrder - outputOrder),
        accTex => {
            let halfTex = WglTexturePool.takeVec4Tex(workingShaderCoder.vec4Order(accTex) - 1);
            Shaders.sumFoldVec4(accTex).renderTo(halfTex);
            return halfTex;
        });
};

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
 * @param {!WglTexture} seedTex
 * @param {!ShaderPipeline} pipeline
 * @returns {!WglTexture|!Array.<!WglTexture>}
 */
KetTextureUtil.evaluatePipelineWithIntermediateCleanup = (seedTex, pipeline) => {
    let skipDoneWithTextureFlag = true;
    let keptResults = [];
    let outTex = seq(pipeline.steps).aggregate(seedTex, (prevTex, {outOrder, shaderFunc, keepResult}) => {
        let nextTex = WglTexturePool.take(outOrder, workingShaderCoder.vecPixelType);
        shaderFunc(prevTex).renderTo(nextTex);
        if (!skipDoneWithTextureFlag) {
            prevTex.deallocByDepositingInPool("evaluatePipelineWithIntermediateCleanup");
        }
        skipDoneWithTextureFlag = keepResult;
        if (keepResult) {
            keptResults.push(nextTex);
        }
        return nextTex;
    });
    if (outTex === seedTex) {
        outTex = WglTexturePool.takeSame(seedTex);
        Shaders.passthrough(seedTex).renderTo(outTex);
    }
    if (keptResults.length === 0) {
        return outTex;
    }
    keptResults.push(outTex);
    return keptResults;
};

export {KetTextureUtil}
