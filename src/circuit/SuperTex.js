import Matrix from "src/math/Matrix.js"
import CircuitShaders from "src/circuit/CircuitShaders.js"
import { seq, Seq } from "src/base/Seq.js"
import Shaders from "src/webgl/Shaders.js"
import WglTexture from "src/webgl/WglTexture.js"
import Util from "src/base/Util.js"

/**
 * Represents a WebGL texture containing amplitudes or probabilities, to be computed when the pipeline is run.
 *
 * Use mergedReadFloats to get pipeline nodes for the pixel data, instead of the not-so-useful textures.
 */
export default class SuperTex {
}

/** @type {!Map.<!int, !(!WglTexture[])>} */
const TEXTURE_POOL = new Map();

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

    console.warn("texture alloc: " + k);
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
SuperTex.alloc = qubitCount => {
    let w = 1 << Math.ceil(qubitCount / 2);
    let h = 1 << Math.floor(qubitCount / 2);
    return allocTexture(w, h);
};

/**
 * @param {!WglTexture} tex
 * @returns {void}
 */
SuperTex.reuseTexture = tex => {
    reuseTexture(tex);
};

/**
 * @param {!WglTexture} tex
 * @returns {!WglTexture}
 */
SuperTex.allocSame = tex => {
    return allocTexture(tex.width, tex.height);
};

/**
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
SuperTex.zero = qubitCount => {
    let tex = SuperTex.alloc(qubitCount);
    CircuitShaders.classicalState(0).renderTo(tex);
    return tex;
};

/**
 * @param {!int} qubitCount
 * @param {!Controls} mask
 * @returns {!WglTexture}
 */
SuperTex.control = (qubitCount, mask) => {
    let tex = SuperTex.alloc(qubitCount);
    CircuitShaders.controlMask(mask).renderTo(tex);
    return tex;
};

/**
 * @param {!Array.<!WglTexture>} textures
 * @returns {!Array.<!Float32Array>}
 */
SuperTex.mergedReadFloats = textures => {
    let pixelCounts = textures.map(e => e.width * e.height);
    let pixelOffsets = seq(pixelCounts).scan(0, (a, e) => a + e).toArray();
    let lgTotal = Math.log2(Util.ceilingPowerOf2(pixelOffsets[pixelOffsets.length - 1]));
    let combinedTex = SuperTex.alloc(lgTotal);
    Shaders.color(0, 0, 0, 0).renderTo(combinedTex);
    combinedTex = SuperTex.aggregateWithReuse(combinedTex, Seq.range(textures.length), (accTex, i) => {
        let inputTex = textures[i];
        let nextTex = SuperTex.alloc(lgTotal);
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
SuperTex.qubitOperation = (stateTex, controlTex, qubitIndex, qubitOperation) => {
    let result = SuperTex.allocSame(stateTex);
    CircuitShaders.renderQubitOperation(
        result,
        stateTex,
        qubitOperation,
        qubitIndex,
        controlTex);
    return result;
};

/**
 * @param {!WglTexture} seedTex
 * @param {!Array.<T>|!Seq.<T>} items
 * @param {!function(!WglTexture, T) : !WglTexture} aggregateFunc
 * @returns {!WglTexture}
 * @template T
 */
SuperTex.aggregateWithIntermediateReuse = (seedTex, items, aggregateFunc) => {
    let out = seq(items).aggregate(seedTex, (a, e) => {
        let next = aggregateFunc(a, e);
        if (a !== seedTex) {
            reuseTexture(a);
        }
        return next;
    });
    if (out === seedTex) {
        out = SuperTex.allocSame(seedTex);
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
SuperTex.aggregateWithReuse = (seedTex, items, aggregateFunc) => {
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
SuperTex.pixelsToAmplitudes = (pixels, unity) => {
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

SuperTex.qubitCount = superpositionTex => {
    return Math.log2(superpositionTex.width * superpositionTex.height);
};

/**
 * @param {!WglTexture} stateTex
 * @returns {!WglTexture}
 */
SuperTex.superpositionToQubitDensities = stateTex => {
    let n = SuperTex.qubitCount(stateTex);
    let unsummed = SuperTex._superpositionTexToUnsummedQubitDensitiesTex(stateTex);
    let result = SuperTex._powerSum(unsummed, n);
    reuseTexture(unsummed);
    return result;
};

/**
 * @param {!WglTexture} superpositionTex
 * @returns {!WglTexture}
 */
SuperTex._superpositionTexToUnsummedQubitDensitiesTex = superpositionTex => {
    let q = SuperTex.qubitCount(superpositionTex);
    let qu = Util.ceilingPowerOf2(q);
    let inter = SuperTex.alloc(q + Math.log2(qu) - 1);
    CircuitShaders.allQubitDensities(superpositionTex).renderTo(inter);
    let result = SuperTex._powerSum(inter, qu);
    reuseTexture(inter);
    return result;
};

/**
 * @param {!WglTexture} tex
 * @param {!int} qubitCount
 * @returns {!WglTexture}
 */
SuperTex._powerSum = (tex, qubitCount) => {
    let stride = Util.ceilingPowerOf2(qubitCount);
    if (stride > tex.width) {
        throw new Error("Unexpected: summing more than just the first row.");
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
            SuperTex.reuseTexture(cur);
        }
        cur = next;
    }

    if (cur === tex) {
        cur = SuperTex.allocSame(tex);
        Shaders.passthrough(tex).renderTo(cur);
    }

    return cur;
};


SuperTex.pixelsToDensityMatrices = (buffer, qubitCount) => {
    return Seq.range(qubitCount).map(i => {
        i *= 4;
        let a = buffer[i];
        let d = buffer[i + 3];
        let unity = a + d;
        if (unity === 0) {
            return new Matrix(2, 2, new Float32Array([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]));
        }

        let br = buffer[i + 1] / unity;
        let bi = buffer[i + 2] / unity;
        return new Matrix(2, 2, new Float32Array([a / unity, 0, br, bi, br, -bi, d / unity, 0]));
    }).toArray();
};

SuperTex.swap = (stateTex, controlTex, qubitIndex1, qubitIndex2) => {
    let result = SuperTex.allocSame(stateTex);
    CircuitShaders.renderSwapOperation(
        result,
        stateTex,
        qubitIndex1,
        qubitIndex2,
        controlTex);
    return result;
};
