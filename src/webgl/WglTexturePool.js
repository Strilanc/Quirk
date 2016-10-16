import {DetailedError} from "src/base/DetailedError.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {provideWglTexturePoolToWglConfiguredShader} from "src/webgl/WglConfiguredShader.js"
import {workingShaderCoder} from "src/webgl/ShaderCoders.js"
import {Shaders} from "src/webgl/Shaders.js"

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
            sizePower + workingShaderCoder.vec2PowerSizeOverhead,
            workingShaderCoder.vecPixelType);
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeVec4Tex(sizePower) {
        return WglTexturePool.take(
            sizePower + workingShaderCoder.vec4PowerSizeOverhead,
            workingShaderCoder.vecPixelType);
    }
}

/**
 * A mechanism, for applying a series of shaders to textures, that handles tedious deallocation for you.
 */
class WglTextureTrader {

    /**
     * @param {!WglTexture} texture
     */
    constructor(texture) {
        /** @type {!WglTexture} */
        this.currentTexture = texture;
        /**
         * @type {!boolean}
         * @private
         */
        this._dontDeallocFlag = false;
    }

    /**
     * @returns {!WglTexture}
     */
    copyOfCurrentTexture() {
        let result = WglTexturePool.takeSame(this.currentTexture);
        let didFinish = false;
        try {
            Shaders.passthrough(this.currentTexture).renderTo(result);
            didFinish = true;
            return result;
        } finally {
            if (!didFinish) {
                result.deallocByDepositingInPool();
            }
        }
    }

    /**
     * Tells the texture trader that when it trades away the current texture it shouldn't dealloc it.
     *
     * @returns {!WglTexture} The current texture. You're responsible for it now, caller.
     */
    dontDeallocCurrentTexture() {
        this._dontDeallocFlag = true;
        return this.currentTexture;
    }

    /**
     * Applies the given shader function to the trader's old texture, renders it onto a new texture, deallocs the old
     * texture, and finally holds on to the new texture.
     *
     * @param {!function(!WglTexture) : !WglConfiguredShader} shaderFunc
     * @param {undefined|!WglTexture} newTexture The texture to take and shade. If undefined, a texture matching the old
     * texture is taken from the texture pool.
     */
    shadeAndTrade(shaderFunc, newTexture=undefined) {
        let input = this.currentTexture;
        let deallocInput = !this._dontDeallocFlag;

        this._dontDeallocFlag = false;
        this.currentTexture = newTexture || WglTexturePool.takeSame(input);

        try {
            shaderFunc(input).renderTo(this.currentTexture);
        } finally {
            if (deallocInput) {
                input.deallocByDepositingInPool('WglTexturePool shadeAndTrade');
            }
        }
    }

    /**
     * @param {!function(!WglTexture) : !WglConfiguredShader} reducingShaderFunc
     */
    shadeHalveAndTrade(reducingShaderFunc) {
        this.shadeAndTrade(
            reducingShaderFunc,
            WglTexturePool.take(this.currentTexture.sizePower() - 1, this.currentTexture.pixelType))
    }
}

/**
 * @param {undefined|!string=undefined} detailsShownWhenUsedAfterDone
 * @returns {void}
 */
WglTexture.prototype.deallocByDepositingInPool = function(detailsShownWhenUsedAfterDone=undefined) {
    WglTexturePool.deposit(this, detailsShownWhenUsedAfterDone);
};

/**
 * @param {!function(!WglTextureTrader) : void} traderFunc
 * @param {!boolean=false} keepInput Determines if the receiving texture is deallocated by the trading process.
 * @returns {!WglTexture}
 */
WglTexture.prototype.tradeThrough = function(traderFunc, keepInput=false) {
    let t = new WglTextureTrader(this);
    if (keepInput) {
        t.dontDeallocCurrentTexture();
    }
    traderFunc(t);
    return t.currentTexture;
};

provideWglTexturePoolToWglConfiguredShader(WglTexturePool);
export {WglTexturePool, WglTextureTrader}
