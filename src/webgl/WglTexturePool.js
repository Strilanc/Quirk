import {DetailedError} from "src/base/DetailedError.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {provideWglTexturePoolToWglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {currentShaderCoder} from "src/webgl/ShaderCoders.js"

/** @type {!Array.<!Array.<!WglTexture>>} */
const FLOAT_POOL = [];
const BYTE_POOL = [];
let unreturnedTextureCount = 0;

/**
 * Utilities related to storing and operation on superpositions and other circuit information in WebGL textures.
 */
class WglTexturePool {
    /**
     * @param {!int} sizePower
     * @param {!int} pixelType
     * @returns {!Array.<!WglTexture>}
     * @private
     */
    static _bucketFor(sizePower, pixelType) {
        if (!Number.isInteger(sizePower) || sizePower < 0 || sizePower > 50) {
            throw new DetailedError("Bad sizePower", {sizePower, pixelType});
        }

        let pool = pixelType === WebGLRenderingContext.FLOAT ? FLOAT_POOL : BYTE_POOL;
        while (pool.length <= sizePower) {
            pool.push([])
        }
        return pool[sizePower];
    }

    /**
     * @param {!int} sizePower
     * @param {!int} pixelType
     * @returns {!WglTexture}
     */
    static take(sizePower, pixelType) {
        if (sizePower === -Infinity) {
            return new WglTexture(0, 0, pixelType);
        }

        let bucket = WglTexturePool._bucketFor(sizePower, pixelType);
        unreturnedTextureCount++;
        if (unreturnedTextureCount > 1000) {
            console.warn(`High borrowed texture count: ${unreturnedTextureCount}. (Maybe a leak?)`);
        }

        if (bucket.length > 0) {
            return bucket.pop();
        }
        let {w, h} = WglTexture.preferredWidthHeightForSizePower(sizePower);
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

        let bucket = WglTexturePool._bucketFor(texture.sizePower(), texture.pixelType);
        unreturnedTextureCount--;
        bucket.push(texture.invalidateButMoveToNewInstance(detailsShownWhenUsedAfterDone));
    }

    /**
     * @param {!WglTexture} texture
     * @returns {!WglTexture}
     */
    static takeSame(texture) {
        return WglTexturePool.take(texture.sizePower(), texture.pixelType);
    }

    /**
     * @returns {!int}
     */
    static getUnReturnedTextureCount() {
        return unreturnedTextureCount;
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeRawFloatTex(sizePower) {
        return WglTexturePool.take(
            sizePower,
            WebGLRenderingContext.FLOAT);
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeRawByteTex(sizePower) {
        return WglTexturePool.take(
            sizePower,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeBoolTex(sizePower) {
        return WglTexturePool.take(
            sizePower,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeVec2Tex(sizePower) {
        return WglTexturePool.take(
            sizePower + currentShaderCoder().vec2.powerSizeOverhead,
            currentShaderCoder().vec2.pixelType);
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeVec4Tex(sizePower) {
        return WglTexturePool.take(
            sizePower + currentShaderCoder().vec4.powerSizeOverhead,
            currentShaderCoder().vec4.pixelType);
    }
}

/**
 * @param {undefined|!string=undefined} detailsShownWhenUsedAfterDone
 * @returns {void}
 */
WglTexture.prototype.deallocByDepositingInPool = function(detailsShownWhenUsedAfterDone=undefined) {
    WglTexturePool.deposit(this, detailsShownWhenUsedAfterDone);
};

provideWglTexturePoolToWglConfiguredShader(WglTexturePool);
export {WglTexturePool}
