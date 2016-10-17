import {Matrix} from "src/math/Matrix.js"
import {WglTexture} from "src/webgl/WglTexture.js"

/** @returns {undefined|!ShaderValueCoder} */
let currentShaderCoder = undefined;
let WglTexturePool;
/**
 * @param {!ShaderValueCoder} newCurrentShaderCoder
 */
function provideWorkingShaderCoderToWglConfiguredShader(newCurrentShaderCoder) {
    currentShaderCoder = newCurrentShaderCoder;
}
/**
 * @param {!WglTexturePool} pool
 */
function provideWglTexturePoolToWglConfiguredShader(pool) {
    WglTexturePool = pool;
}

/**
 * A shader with all its arguments provided, ready to render to a texture.
 */
class WglConfiguredShader {
    /**
     * @param {!function(!WglTexture) : void} renderToFunc
     */
    constructor(renderToFunc) {
        /** @type {!function(!WglTexture) : void} */
        this.renderToFunc = renderToFunc;
    }

    /**
     * Runs the configured renderer, placing its outputs into the given texture.
     * @param {!WglTexture} texture
     */
    renderTo(texture) {
        let shouldBeUndefined = this.renderToFunc(texture);
        if (shouldBeUndefined instanceof WglConfiguredShader) {
            throw new Error("Returned a WglConfiguredShader instead of calling renderTo on it.");
        }
    }

    /**
     * @param {!WglTexture} texture
     * @private
     */
    _renderToElseDealloc(texture) {
        let didPass = false;
        try {
            this.renderTo(texture);
            didPass = true;
        } finally {
            if (!didPass) {
                texture.deallocByDepositingInPool("_renderToElseDealloc");
            }
        }
    }

    /**
     * @param {!WglTexture} texture
     * @private
     */
    _renderReadDealloc(texture) {
        try {
            this.renderTo(texture);
            return texture.readPixels();
        } finally {
            texture.deallocByDepositingInPool();
        }
    }

    /**
     * Renders into a new byte texture of the given size, and returns the texture.
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    toRawByteTexture(sizePower) {
        let texture = WglTexturePool.takeRawByteTex(sizePower);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * Renders into a new float texture of the given size, and returns the texture.
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    toRawFloatTexture(sizePower) {
        let texture = WglTexturePool.takeRawFloatTex(sizePower);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * Renders the result into a float texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} sizePower
     * @returns {!Float32Array}
     */
    readRawFloatOutputs(sizePower) {
        return this._renderReadDealloc(WglTexturePool.takeRawFloatTex(sizePower));
    }

    /**
     * Renders the result into a float texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} sizePower
     * @returns {!Uint8Array}
     */
    readRawByteOutputs(sizePower) {
        return this._renderReadDealloc(WglTexturePool.takeRawByteTex(sizePower));
    }

    /**
     * @param {!int} sizePower
     * @returns {!Uint8Array} Each entry represents one of the booleans: 1 for true, 0 for false.
     */
    readBoolOutputs(sizePower) {
        let pixels = this._renderReadDealloc(WglTexturePool.takeBoolTex(sizePower));
        let result = new Uint8Array(pixels.length >> 2);
        for (let i = 0; i < result.length; i++) {
            result[i] = pixels[i << 2] & 1;
        }
        return result;
    }

    /**
     * @param {!int} sizePower
     * @returns {!Float32Array}
     */
    readVec2Outputs(sizePower) {
        return currentShaderCoder().unpackVec2Data(
            this._renderReadDealloc(WglTexturePool.takeVec2Tex(sizePower)))
    }

    /**
     * @param {!int} sizePower
     * @returns {!Matrix}
     */
    readVec2OutputsAsKet(sizePower) {
        return new Matrix(1, 1 << sizePower, this.readVec2Outputs(sizePower));
    }

    /**
     * @param {!int} sizePower
     * @returns {!Float32Array}
     */
    readVec4Outputs(sizePower) {
        return currentShaderCoder().unpackVec4Data(
            this._renderReadDealloc(WglTexturePool.takeVec4Tex(sizePower)))
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    toVec2Texture(sizePower) {
        let texture = WglTexturePool.takeVec2Tex(sizePower);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    toVec4Texture(sizePower) {
        let texture = WglTexturePool.takeVec4Tex(sizePower);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * @param {!int} sizePower
     * @returns {!WglTexture}
     */
    toBoolTexture(sizePower) {
        let texture = WglTexturePool.takeBoolTex(sizePower);
        this._renderToElseDealloc(texture);
        return texture;
    }
}

export {
    WglConfiguredShader,
    provideWorkingShaderCoderToWglConfiguredShader,
    provideWglTexturePoolToWglConfiguredShader
}
