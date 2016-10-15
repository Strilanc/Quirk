import {DetailedError} from "src/base/DetailedError.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {workingShaderCoder} from "src/webgl/ShaderCoders.js"

/** @type {!Array.<!Array.<!WglTexture>>} */
const FLOAT_POOL = [];
const BYTE_POOL = [];
let unreturnedTextureCount = 0;

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
class WglTexturePool {
    /**
     * @param {!int} order
     * @param {!int} pixelType
     * @returns {!WglTexture}
     * @private
     */
    static _take(order, pixelType) {
        if (order === -Infinity) {
            return new WglTexture(0, 0, pixelType);
        }

        let pool = pixelType === WebGLRenderingContext.FLOAT ? FLOAT_POOL : BYTE_POOL;
        while (pool.length <= order) {
            pool.push([])
        }

        unreturnedTextureCount++;
        let bucket = pool[order];
        if (bucket.length > 0) {
            return bucket.pop();
        }

        if (unreturnedTextureCount > 1000) {
            console.warn(`High borrowed texture count: ${unreturnedTextureCount}. (Maybe a leak?)`);
        }
        let {w, h} = WglTexture.preferredSizeForOrder(order);
        return new WglTexture(w, h, pixelType);
    }

    /**
     * Puts the texture back into the texture pool.
     * @param {!WglTexture} texture
     * @param {*=} detailsShownWhenUsedAfterDone
     * @returns {void}
     */
    static deposit(texture, detailsShownWhenUsedAfterDone='?') {
        if (!(texture instanceof WglTexture)) {
            throw new DetailedError("Not a texture", {texture, detailsShownWhenUsedAfterDone});
        }
        if (texture.width === 0) {
            return;
        }

        let order = texture.order();
        let pool = texture.pixelType === WebGLRenderingContext.FLOAT ? FLOAT_POOL : BYTE_POOL;
        while (pool.length <= order) {
            pool.push([])
        }
        let bucket = pool[order];
        unreturnedTextureCount--;
        bucket.push(texture.invalidateButMoveToNewInstance(detailsShownWhenUsedAfterDone));
    }

    /**
     * @returns {!int}
     */
    static getUnReturnedTextureCount() {
        return unreturnedTextureCount;
    }

    /**
     * @param {!int} power
     * @returns {!WglTexture}
     */
    static takeBoolTex(power) {
        return WglTexturePool._take(
            power,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * @param {!int} power
     * @returns {!WglTexture}
     */
    static takeVec2Tex(power) {
        return WglTexturePool._take(
            power + workingShaderCoder.vec2Overhead,
            workingShaderCoder.vecPixelType);
    }

    /**
     * @param {!int} power
     * @returns {!WglTexture}
     */
    static takeVec4Tex(power) {
        return WglTexturePool._take(
            power + workingShaderCoder.vec4Overhead,
            workingShaderCoder.vecPixelType);
    }

    /**
     * @param {!int} power
     * @param {!function(!WglTexture) : void} borrowFunction
     * @returns {void}
     */
    static borrowBoolTex(power, borrowFunction) {
        let tex = WglTexturePool.takeBoolTex(power);
        try {
            borrowFunction(tex);
        } finally {
            WglTexturePool.deposit(tex, 'WglTexturePool.borrowBoolTex');
        }
    }

    /**
     * @param {!int} power
     * @param {!function(!WglTexture) : void} borrowFunction
     * @returns {void}
     */
    static borrowVec2Tex(power, borrowFunction) {
        let tex = WglTexturePool.takeVec2Tex(power);
        try {
            borrowFunction(tex);
        } finally {
            WglTexturePool.deposit(tex, 'WglTexturePool.borrowVec2Tex');
        }
    }

    /**
     * @param {!int} power
     * @param {!function(!WglTexture) : void} borrowFunction
     * @returns {void}
     */
    static borrowVec4Tex(power, borrowFunction) {
        let tex = WglTexturePool.takeVec4Tex(power);
        try {
            borrowFunction(tex);
        } finally {
            WglTexturePool.deposit(tex, 'WglTexturePool.borrowVec4Tex');
        }
    }
}

export {WglTexturePool}
