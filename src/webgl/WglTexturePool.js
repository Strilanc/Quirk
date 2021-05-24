/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {DetailedError} from "../base/DetailedError.js"
import {WglTexture} from "./WglTexture.js"
import {provideWglTexturePoolToWglConfiguredShader} from "./WglConfiguredShader.js"
import {currentShaderCoder} from "./ShaderCoders.js"

/** @type {!Array.<!Array.<!WglTexture>>} */
const FLOAT_POOL = [];
const BYTE_POOL = [];
let unreturnedTextureCount = 0;

/**
 * Keeps track of a collection of textures of various sizes and types, so they can be used and returned and re-used.
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
     * Allocates a texture with the given pixel type with a total area of 1<<sizePower.
     *
     * If there is a matching texture in the pool, it will be taken instead of initializing a new texture.
     *
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
     * Allocates a texture with the same size and type as the given texture.
     * @param {!WglTexture} texture
     * @returns {!WglTexture}
     */
    static takeSame(texture) {
        return WglTexturePool.take(texture.sizePower(), texture.pixelType);
    }

    /**
     * Determines how many textures have been taken from the pool without yet being given back.
     * @returns {!int}
     */
    static getUnReturnedTextureCount() {
        return unreturnedTextureCount;
    }

    /**
     * Allocates a FLOAT RGBA texture with an area of 1<<sizePower.
     *
     * Some GPUs don't support rendering to and/or reading pixels from float textures. If you want the floats to be
     * encoded into bytes if necessary, use takeVecFloatTex instead.
     *
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeRawFloatTex(sizePower) {
        return WglTexturePool.take(
            sizePower,
            WebGLRenderingContext.FLOAT);
    }

    /**
     * Allocates an UNSIGNED_BYTE RGBA texture with an area of 1<<sizePower.
     *
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeRawByteTex(sizePower) {
        return WglTexturePool.take(
            sizePower,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * Allocates a texture for storing an encoded array of 1<<sizePower booleans (encoded into bytes).
     *
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeBoolTex(sizePower) {
        return WglTexturePool.take(
            sizePower,
            WebGLRenderingContext.UNSIGNED_BYTE);
    }

    /**
     * Allocates a texture for storing an encoded array of 1<<sizePower floats (possibly encoded into bytes).
     *
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeVecFloatTex(sizePower) {
        return WglTexturePool.take(
            sizePower + currentShaderCoder().float.powerSizeOverhead,
            currentShaderCoder().float.pixelType);
    }

    /**
     * Allocates a texture for storing an encoded array of 1<<sizePower float-pairs (possibly encoded into bytes).
     *
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    static takeVec2Tex(sizePower) {
        return WglTexturePool.take(
            sizePower + currentShaderCoder().vec2.powerSizeOverhead,
            currentShaderCoder().vec2.pixelType);
    }

    /**
     * Allocates a texture for storing an encoded array of 1<<sizePower float-quadruplets (possibly encoded into bytes).
     *
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
