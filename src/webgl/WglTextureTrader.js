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

import {WglConfiguredShader} from "./WglConfiguredShader.js"
import {WglTexture} from "./WglTexture.js"
import {WglTexturePool} from "./WglTexturePool.js"

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
     * @param {!WglConfiguredShader|!function(!WglTexture) : !WglConfiguredShader} shaderFunc
     * @param {undefined|!WglTexture} newTexture The texture to take and shade. If undefined, a texture matching the old
     * texture is taken from the texture pool.
     * @returns {void}
     */
    shadeAndTrade(shaderFunc, newTexture=undefined) {
        let src = this.currentTexture;
        let deallocSrc = !this._dontDeallocFlag;
        let dst = newTexture || WglTexturePool.takeSame(src);

        let configuredShader = shaderFunc instanceof WglConfiguredShader ? shaderFunc : shaderFunc(src);
        configuredShader.renderTo(dst);

        this.currentTexture = dst;
        this._dontDeallocFlag = false;
        if (deallocSrc) {
            src.deallocByDepositingInPool('WglTexturePool shadeAndTrade');
        }
    }

    /**
     * Renders to a texture that's a half the size of the current texture, then uses the rendered texture as the new
     * current texture.
     *
     * @param {!function(!WglTexture) : !WglConfiguredShader} reducingShaderFunc
     */
    shadeHalveAndTrade(reducingShaderFunc) {
        this.shadeAndTrade(
            reducingShaderFunc,
            WglTexturePool.take(Math.max(0, this.currentTexture.sizePower() - 1), this.currentTexture.pixelType))
    }

    /**
     * Renders to a texture that's a quarter of the size of the current texture, then uses the rendered texture as the
     * new current texture.
     *
     * @param {!function(!WglTexture) : !WglConfiguredShader} reducingShaderFunc
     */
    shadeQuarterAndTrade(reducingShaderFunc) {
        this.shadeAndTrade(
            reducingShaderFunc,
            WglTexturePool.take(Math.max(0, this.currentTexture.sizePower() - 2), this.currentTexture.pixelType))
    }
}

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

export {WglTextureTrader}
