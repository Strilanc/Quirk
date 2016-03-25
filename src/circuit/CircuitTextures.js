import DetailedError from "src/base/DetailedError.js"
import Matrix from "src/math/Matrix.js"
import Controls from "src/circuit/Controls.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import { seq, Seq } from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import WglTexture from "src/webgl/WglTexture.js"
import Util from "src/base/Util.js"

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
export default class CircuitTextures {
}

/** @type {!Map.<!int, !(!WglTexture[])>} */
const TEXTURE_POOL = new Map();

let allocNewTextureCount = 0;

/**
 * @param {!int} width
 * @param {!int} height
 * @param {!int} pixelType
 * @returns {!WglTexture}
 */
const allocTexture = (width, height, pixelType = WebGLRenderingContext.FLOAT) => {
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
 * @param {!WglTexture} texture
 */
const reuseTexture = texture => {
    let pool = TEXTURE_POOL.get(texture.width + ":" + texture.height + ":" + texture.pixelType);
    pool.push(texture);
};

/**
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
CircuitTextures.alloc = qubitCount => {
    let w = 1 << Math.ceil(qubitCount / 2);
    let h = 1 << Math.floor(qubitCount / 2);
    return allocTexture(w, h);
};

/**
 * @param {!WglTexture} tex
 * @returns {void}
 */
CircuitTextures.reuseTexture = tex => {
    reuseTexture(tex);
};

/**
 * @param {!WglTexture} tex
 * @returns {!WglTexture}
 */
CircuitTextures.allocSame = tex => {
    return allocTexture(tex.width, tex.height);
};

/**
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
CircuitTextures.zero = qubitCount => {
    let tex = CircuitTextures.alloc(qubitCount);
    CircuitShaders.classicalState(0).renderTo(tex);
    return tex;
};

/**
 * @param {!int} qubitCount
 * @param {!Controls} mask
 * @returns {!WglTexture}
 */
CircuitTextures.control = (qubitCount, mask) => {
    let tex = CircuitTextures.alloc(qubitCount);
    CircuitShaders.controlMask(mask).renderTo(tex);
    return tex;
};

/**
 * @param {!Array.<!WglTexture>} textures
 * @returns {!Array.<!Float32Array>}
 */
CircuitTextures.mergedReadFloats = textures => {
    let pixelCounts = textures.map(e => e.width * e.height);
    let pixelOffsets = seq(pixelCounts).scan(0, (a, e) => a + e).toArray();
    let lgTotal = Math.log2(Util.ceilingPowerOf2(pixelOffsets[pixelOffsets.length - 1]));
    let combinedTex = CircuitTextures.alloc(lgTotal);
    Shaders.color(0, 0, 0, 0).renderTo(combinedTex);
    combinedTex = CircuitTextures.aggregateWithReuse(combinedTex, Seq.range(textures.length), (accTex, i) => {
        let inputTex = textures[i];
        let nextTex = CircuitTextures.alloc(lgTotal);
        CircuitShaders.linearOverlay(pixelOffsets[i], inputTex, accTex).renderTo(nextTex);
        reuseTexture(inputTex);
        return nextTex;
    });

    let combinedPixels = combinedTex.readPixels();
    reuseTexture(combinedTex);

    return Seq.range(textures.length).map(i => {
        let offset = pixelOffsets[i] * 4;
        let length = pixelCounts[i] * 4;
        return combinedPixels.subarray(offset, offset + length);
    }).toArray();
};

/**
 * @param {!WglTexture} stateTex
 * @param {!WglTexture} controlTex
 * @param {!int} qubitIndex
 * @param {!Matrix} qubitOperation
 * @returns {!WglTexture}
 */
CircuitTextures.qubitOperation = (stateTex, controlTex, qubitIndex, qubitOperation) => {
    let result = CircuitTextures.allocSame(stateTex);
    CircuitShaders.qubitOperation(stateTex, qubitOperation, qubitIndex, controlTex).renderTo(result);
    return result;
};

/**
 * @param {!WglTexture} seedTex
 * @param {!Array.<T>|!Seq.<T>} items
 * @param {!function(!WglTexture, T) : !WglTexture} aggregateFunc
 * @returns {!WglTexture}
 * @template T
 */
CircuitTextures.aggregateWithIntermediateReuse = (seedTex, items, aggregateFunc) => {
    let out = seq(items).aggregate(seedTex, (a, e) => {
        let next = aggregateFunc(a, e);
        if (a !== seedTex) {
            reuseTexture(a);
        }
        return next;
    });
    if (out === seedTex) {
        out = CircuitTextures.allocSame(seedTex);
        Shaders.passthrough(seedTex).renderTo(out);
    }
    return out;
};
/**
 * @param {!WglTexture} seedTex
 * @param {!Array.<T>|!Seq.<T>} items
 * @param {!function(!WglTexture, T) : !WglTexture} aggregateFunc
 * @returns {!WglTexture}
 * @template T
 */
CircuitTextures.aggregateWithReuse = (seedTex, items, aggregateFunc) => {
    return seq(items).aggregate(seedTex, (a, e) => {
        let next = aggregateFunc(a, e);
        reuseTexture(a);
        return next;
    });
};

/**
 * @param {!Float32Array} pixels
 * @param {!number} unity
 * @returns {!Matrix}
 */
CircuitTextures.pixelsToAmplitudes = (pixels, unity) => {
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

CircuitTextures.qubitCount = superpositionTex => {
    return Math.log2(superpositionTex.width * superpositionTex.height);
};

/**
 * @param {!WglTexture} stateTex
 * @param {!Controls} controls
 * @param {!int} keptBitMask
 * @returns {!WglTexture}
 */
CircuitTextures.superpositionToQubitDensities = (stateTex, controls, keptBitMask) => {
    if (keptBitMask === 0) {
        return CircuitTextures.alloc(0);
    }
    let hasControls = !controls.isEqualTo(Controls.NONE);
    let reducedTex = stateTex;
    if (hasControls) {
        reducedTex = CircuitTextures.alloc(CircuitTextures.qubitCount(stateTex) - controls.includedBitCount());
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
    let unsummed = CircuitTextures._superpositionTexToUnsummedQubitDensitiesTex(reducedTex, keptBitMask);
    if (hasControls) {
        reuseTexture(reducedTex);
    }
    let keptQubitCount = Util.numberOfSetBits(keptBitMask);
    let result = CircuitTextures._powerSum(unsummed, keptQubitCount);
    reuseTexture(unsummed);
    return result;
};

/**
 * @param {!WglTexture} superpositionTex
 * @param {!int} keptBitMask
 * @returns {!WglTexture}
 */
CircuitTextures._superpositionTexToUnsummedQubitDensitiesTex = (superpositionTex, keptBitMask) => {
    if (keptBitMask === 0) {
        throw new DetailedError("keptBitMask === 0", {superpositionTex, keptBitMask});
    }
    let startingQubitCount = CircuitTextures.qubitCount(superpositionTex);
    let remainingQubitCount = Util.numberOfSetBits(keptBitMask);
    let inter = CircuitTextures.alloc(startingQubitCount - 1 + Math.ceil(Math.log2(remainingQubitCount)));
    CircuitShaders.allQubitDensities(superpositionTex, keptBitMask).renderTo(inter);
    return inter;
};

/**
 * @param {!WglTexture} tex
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
CircuitTextures._powerSum = (tex, qubitCount) => {
    let stride = Util.ceilingPowerOf2(qubitCount);
    if (stride > tex.width) {
        throw new DetailedError("Unexpected: summing more than just the first row.", {tex, qubitCount, stride});
    }

    let cur = tex;
    while (cur.height > 1 || cur.width > stride) {
        let next;
        if (cur.width > Math.max(stride, cur.height)) {
            let h = cur.width / 2;
            next = allocTexture(h, cur.height);
            Shaders.sumFold(cur, h, 0).renderTo(next);
        } else {
            let h = cur.height / 2;
            next = allocTexture(cur.width, h);
            Shaders.sumFold(cur, 0, h).renderTo(next);
        }
        if (cur !== tex) {
            CircuitTextures.reuseTexture(cur);
        }
        cur = next;
    }

    if (cur === tex) {
        cur = CircuitTextures.allocSame(tex);
        Shaders.passthrough(tex).renderTo(cur);
    }

    return cur;
};


CircuitTextures.pixelsToDensityMatrices = (buffer, qubitCount) => {
    return Seq.range(qubitCount).map(i => {
        let a = buffer[i*4];
        let d = buffer[i*4 + 3];
        let unity = a + d;
        if (unity === 0 || isNaN(unity)) {
            return new Matrix(2, 2, new Float32Array([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]));
        }

        let br = buffer[i*4 + 1] / unity;
        let bi = buffer[i*4 + 2] / unity;
        return new Matrix(2, 2, new Float32Array([a / unity, 0, br, bi, br, -bi, d / unity, 0]));
    }).toArray();
};

CircuitTextures.swap = (stateTex, controlTex, qubitIndex1, qubitIndex2) => {
    let result = CircuitTextures.allocSame(stateTex);
    CircuitShaders.swap(stateTex, qubitIndex1, qubitIndex2, controlTex).renderTo(result);
    return result;
};
