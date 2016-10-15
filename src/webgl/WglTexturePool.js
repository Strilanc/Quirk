import {DetailedError} from "src/base/DetailedError.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {provideWglTexturePoolToWglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
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
     * @returns {!Array.<!WglTexture>}
     * @private
     */
    static _bucketFor(order, pixelType) {
        if (!Number.isInteger(order) || order < 0 || order > 50) {
            throw new DetailedError("Bad order", {order, pixelType});
        }

        let pool = pixelType === WebGLRenderingContext.FLOAT ? FLOAT_POOL : BYTE_POOL;
        while (pool.length <= order) {
            pool.push([])
        }
        return pool[order];
    }

    /**
     * @param {!int} order
     * @param {!int} pixelType
     * @returns {!WglTexture}
     */
    static take(order, pixelType) {
        if (order === -Infinity) {
            return new WglTexture(0, 0, pixelType);
        }

        let bucket = WglTexturePool._bucketFor(order, pixelType);
        unreturnedTextureCount++;
        if (unreturnedTextureCount > 1000) {
            console.warn(`High borrowed texture count: ${unreturnedTextureCount}. (Maybe a leak?)`);
        }

        if (bucket.length > 0) {
            return bucket.pop();
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
    static deposit(texture, detailsShownWhenUsedAfterDone='[no dealloc details]') {
        if (!(texture instanceof WglTexture)) {
            throw new DetailedError("Not a texture", {texture, detailsShownWhenUsedAfterDone});
        }
        if (texture.width === 0) {
            return;
        }

        let bucket = WglTexturePool._bucketFor(texture.order(), texture.pixelType);
        unreturnedTextureCount--;
        bucket.push(texture.invalidateButMoveToNewInstance(detailsShownWhenUsedAfterDone));
    }

    /**
     * @param {!WglTexture} texture
     * @returns {!WglTexture}
     */
    static takeSame(texture) {
        return WglTexturePool.take(texture.order(), texture.pixelType);
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
        return WglTexturePool.take(
            power,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * @param {!int} power
     * @returns {!WglTexture}
     */
    static takeVec2Tex(power) {
        return WglTexturePool.take(
            power + workingShaderCoder.vec2Overhead,
            workingShaderCoder.vecPixelType);
    }

    /**
     * @param {!int} power
     * @returns {!WglTexture}
     */
    static takeVec4Tex(power) {
        return WglTexturePool.take(
            power + workingShaderCoder.vec4Overhead,
            workingShaderCoder.vecPixelType);
    }
}

WglTexture.prototype.deallocByDepositingInPool = function(detailsShownWhenUsedAfterDone=undefined) {
    WglTexturePool.deposit(this, detailsShownWhenUsedAfterDone);
};

provideWglTexturePoolToWglConfiguredShader(WglTexturePool);
export {WglTexturePool}
