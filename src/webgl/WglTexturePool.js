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
     * @param {!int} sizeOrder
     * @param {!int} pixelType
     * @returns {!Array.<!WglTexture>}
     * @private
     */
    static _bucketFor(sizeOrder, pixelType) {
        if (!Number.isInteger(sizeOrder) || sizeOrder < 0 || sizeOrder > 50) {
            throw new DetailedError("Bad sizeOrder", {sizeOrder, pixelType});
        }

        let pool = pixelType === WebGLRenderingContext.FLOAT ? FLOAT_POOL : BYTE_POOL;
        while (pool.length <= sizeOrder) {
            pool.push([])
        }
        return pool[sizeOrder];
    }

    /**
     * @param {!int} sizeOrder
     * @param {!int} pixelType
     * @returns {!WglTexture}
     */
    static take(sizeOrder, pixelType) {
        if (sizeOrder === -Infinity) {
            return new WglTexture(0, 0, pixelType);
        }

        let bucket = WglTexturePool._bucketFor(sizeOrder, pixelType);
        unreturnedTextureCount++;
        if (unreturnedTextureCount > 1000) {
            console.warn(`High borrowed texture count: ${unreturnedTextureCount}. (Maybe a leak?)`);
        }

        if (bucket.length > 0) {
            return bucket.pop();
        }
        let {w, h} = WglTexture.preferredSizeForOrder(sizeOrder);
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
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    static takeRawFloatTex(sizeOrder) {
        return WglTexturePool.take(
            sizeOrder,
            WebGLRenderingContext.FLOAT);
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    static takeRawByteTex(sizeOrder) {
        return WglTexturePool.take(
            sizeOrder,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    static takeBoolTex(sizeOrder) {
        return WglTexturePool.take(
            sizeOrder,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    static takeVec2Tex(sizeOrder) {
        return WglTexturePool.take(
            sizeOrder + workingShaderCoder.vec2Overhead,
            workingShaderCoder.vecPixelType);
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    static takeVec4Tex(sizeOrder) {
        return WglTexturePool.take(
            sizeOrder + workingShaderCoder.vec4Overhead,
            workingShaderCoder.vecPixelType);
    }
}

WglTexture.prototype.deallocByDepositingInPool = function(detailsShownWhenUsedAfterDone=undefined) {
    WglTexturePool.deposit(this, detailsShownWhenUsedAfterDone);
};

provideWglTexturePoolToWglConfiguredShader(WglTexturePool);
export {WglTexturePool}
