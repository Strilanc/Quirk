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

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
class KetTextureUtil {}

/** @type {!Map.<!int, !(!WglTexture[])>} */
const TEXTURE_POOL = new Map();

let allocNewTextureCount = 0;

/**
 * @param {!int} width
 * @param {!int} height
 * @param {!int} pixelType
 * @returns {!WglTexture}
 */
const allocSizedTexture = (width, height, pixelType = WebGLRenderingContext.FLOAT) => {
    if (width === 0 || height === 0) {
        return new WglTexture(0, 0, pixelType);
    }

    let k = width + ":" + height + ":" + pixelType;

    if (!TEXTURE_POOL.has(k)) {
        TEXTURE_POOL.set(k, []);
    }
    let pool = TEXTURE_POOL.get(k);
    if (pool.length > 0) {
        return pool.pop();
    }

    allocNewTextureCount++;
    if (allocNewTextureCount > 1000) {
        console.warn(`Allocated yet another texture (${k}). Failing to reuse textures?`);
    }
    return new WglTexture(width, height, pixelType);
};

/**
 * @param {!WglTexture} tex
 * @returns {!WglTexture}
 */
const allocSameSizedTexture = tex => {
    return allocSizedTexture(tex.width, tex.height);
};

/**
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
const allocQubitTexture = qubitCount => {
    let w = 1 << Math.ceil(qubitCount / 2);
    let h = 1 << Math.floor(qubitCount / 2);
    return allocSizedTexture(w, h);
};

KetTextureUtil.allocQubitTexture = allocQubitTexture;

/**
 * Puts the texture back into the texture pool.
 * @param {!WglTexture} texture
 * @param {*=} detailsShownWhenUsedAfterDone
 * @returns {void}
 */
KetTextureUtil.doneWithTexture = (texture, detailsShownWhenUsedAfterDone='?') => {
    if (texture.width === 0) {
        return;
    }
    let pool = TEXTURE_POOL.get(texture.width + ":" + texture.height + ":" + texture.pixelType);
    pool.push(texture.invalidateButMoveToNewInstance(detailsShownWhenUsedAfterDone));
};

/**
 * @param {!int} qubitCount
 * @param {!int=0} classicalState
 * @returns {!WglTexture}
 */
KetTextureUtil.classicalKet = (qubitCount, classicalState=0) => {
    let tex = allocQubitTexture(qubitCount);
    CircuitShaders.classicalState(classicalState).renderTo(tex);
    return tex;
};

/**
 * @param {!int} qubitCount
 * @param {!Controls} mask
 * @returns {!WglTexture}
 */
KetTextureUtil.control = (qubitCount, mask) => {
    let tex = allocQubitTexture(qubitCount);
    CircuitShaders.controlMask(mask).renderTo(tex);
    return tex;
};

/**
 * @param {!Array.<!WglTexture>} textures
 * @returns {!Array.<!Float32Array>}
 */
KetTextureUtil.mergedReadFloats = textures => {
    let pixelCounts = textures.map(e => e.width * e.height);
    let pixelOffsets = seq(pixelCounts).scan(0, (a, e) => a + e).toArray();
    let lgTotal = Math.round(Math.log2(Util.ceilingPowerOf2(pixelOffsets[pixelOffsets.length - 1])));
    let combinedTex = allocQubitTexture(lgTotal);
    Shaders.color(0, 0, 0, 0).renderTo(combinedTex);
    combinedTex = KetTextureUtil.aggregateWithReuse(
        combinedTex,
        Seq.range(textures.length).filter(i => textures[i].width > 0),
        (accTex, i) => {
            let inputTex = textures[i];
            let nextTex = allocQubitTexture(lgTotal);
            CircuitShaders.linearOverlay(pixelOffsets[i], inputTex, accTex).renderTo(nextTex);
            KetTextureUtil.doneWithTexture(inputTex, "inputTex in mergedReadFloats");
            return nextTex;
        });

    let combinedPixels;
    if (Config.ENCODE_FLOATS_AS_BYTES_WHEN_READING_PIXELS) {
        let combinedTexBytes = allocSizedTexture(combinedTex.width*2, combinedTex.height*2,
            WebGLRenderingContext.UNSIGNED_BYTE);
        Shaders.encodeFloatsIntoBytes(combinedTex).renderTo(combinedTexBytes);

        let combinedBytePixels = combinedTexBytes.readPixels();
        combinedPixels = Shaders.decodeByteBufferToFloatBuffer(combinedBytePixels);
        KetTextureUtil.doneWithTexture(combinedTexBytes, "combinedTexBytes in mergedReadFloats");
    } else {
        combinedPixels = combinedTex.readPixels();
    }
    KetTextureUtil.doneWithTexture(combinedTex, "combinedTex in mergedReadFloats");


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
    let result = allocSameSizedTexture(circuitEvalArgs.stateTexture);
    customShader(circuitEvalArgs).renderTo(result);
    return result;
};

/**
 * @param {!CircuitEvalArgs} args
 * @param {!Matrix} matrix
 * @returns {!WglTexture}
 */
KetTextureUtil.matrixOperation = (args, matrix) => {
    let result = allocSameSizedTexture(args.stateTexture);
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
            KetTextureUtil.doneWithTexture(prevTex, "prevTex in aggregateReusingIntermediates");
        }
        return nextTex;
    });
    if (outTex === seedTex) {
        outTex = allocSameSizedTexture(seedTex);
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
        KetTextureUtil.doneWithTexture(prevTex, "prevTex in aggregateWithReuse");
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
 * Counts the number of qubits in the superposition stored by the given texture, based on its size.
 * @param {!WglTexture} superpositionTex
 * @returns {!int}
 */
KetTextureUtil.qubitCount = superpositionTex => {
    return Math.round(Math.log2(superpositionTex.width * superpositionTex.height));
};

/**
 * @param {!WglTexture} stateTex
 * @param {!Controls} controls
 * @param {!int} keptBitMask
 * @returns {!WglTexture}
 */
KetTextureUtil.superpositionToQubitDensities = (stateTex, controls, keptBitMask) => {
    if (keptBitMask === 0) {
        return new WglTexture(0, 0);
    }
    let hasControls = !controls.isEqualTo(Controls.NONE);
    let reducedTex = stateTex;
    if (hasControls) {
        reducedTex = allocQubitTexture(KetTextureUtil.qubitCount(stateTex) - controls.includedBitCount());
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
        KetTextureUtil.doneWithTexture(reducedTex, "reducedTex in superpositionToQubitDensities");
    }
    let keptQubitCount = Util.numberOfSetBits(keptBitMask);
    let result = KetTextureUtil._sumDown(unsummedTex, keptQubitCount);
    KetTextureUtil.doneWithTexture(unsummedTex, "unsummedTex in superpositionToQubitDensities");
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
    let startingQubitCount = KetTextureUtil.qubitCount(superpositionTex);
    let remainingQubitCount = Util.numberOfSetBits(keptBitMask);
    let inter = allocQubitTexture(startingQubitCount - 1 + Math.ceil(Math.log2(remainingQubitCount)));
    CircuitShaders.qubitDensities(superpositionTex, keptBitMask).renderTo(inter);
    return inter;
};

/**
 * @param {!WglTexture} summandsTex
 * @param {!int} outCount The number of interleaved slices being summed.
 * The output will be a single row containing this many results (but padded up to a power of 2).
 * @returns {!WglTexture}
 */
KetTextureUtil._sumDown = (summandsTex, outCount) => {
    let outSize = Util.ceilingPowerOf2(outCount);
    let outWidth = Math.min(summandsTex.width, outSize);

    return KetTextureUtil.aggregateReusingIntermediates(
        summandsTex,
        Seq.range(Math.round(Math.log2(summandsTex.width * summandsTex.height / outSize))),
        accTex => {
            let [w, h] = accTex.width > Math.max(outWidth, accTex.height) ?
                [accTex.width / 2, 0] :
                [0, accTex.height / 2];
            let halfTex = allocSizedTexture(accTex.width - w, accTex.height - h);
            Shaders.sumFold(accTex, w, h).renderTo(halfTex);
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
 */
KetTextureUtil.evaluatePipelineWithIntermediateCleanup = (seedTex, pipeline) => {
    let skipDoneWithTextureFlag = true;
    let keptResults = [];
    let outTex = seq(pipeline.steps).aggregate(seedTex, (prevTex, {w, h, shaderFunc, keepResult}) => {
        let nextTex = allocSizedTexture(w, h);
        shaderFunc(prevTex).renderTo(nextTex);
        if (!skipDoneWithTextureFlag) {
            KetTextureUtil.doneWithTexture(prevTex, "evaluatePipelineWithIntermediateCleanup");
        }
        skipDoneWithTextureFlag = keepResult;
        if (keepResult) {
            keptResults.push(nextTex);
        }
        return nextTex;
    });
    if (outTex === seedTex) {
        outTex = allocSameSizedTexture(seedTex);
        Shaders.passthrough(seedTex).renderTo(outTex);
    }
    if (keptResults.length === 0) {
        return outTex;
    }
    keptResults.push(outTex);
    return keptResults;
};

export {KetTextureUtil}
