import {Matrix} from "src/math/Matrix.js"
import {WglTexture} from "src/webgl/WglTexture.js"

/** @type {undefined|!ShaderValueCoder} */
let workingShaderCoder = undefined;
let WglTexturePool;
/**
 * @param {!ShaderValueCoder} futureWorkingShaderCoder
 */
function provideWorkingShaderCoderToWglConfiguredShader(futureWorkingShaderCoder) {
    workingShaderCoder = futureWorkingShaderCoder;
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
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    toRawByteTexture(sizeOrder) {
        let texture = WglTexturePool.takeRawByteTex(sizeOrder);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * Renders into a new float texture of the given size, and returns the texture.
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    toRawFloatTexture(sizeOrder) {
        let texture = WglTexturePool.takeRawFloatTex(sizeOrder);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * Renders the result into a float texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} sizeOrder
     * @returns {!Float32Array}
     */
    readRawFloatOutputs(sizeOrder) {
        return this._renderReadDealloc(WglTexturePool.takeRawFloatTex(sizeOrder));
    }

    /**
     * Renders the result into a float texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} sizeOrder
     * @returns {!Uint8Array}
     */
    readRawByteOutputs(sizeOrder) {
        return this._renderReadDealloc(WglTexturePool.takeRawByteTex(sizeOrder));
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!Uint8Array} Each entry represents one of the booleans: 1 for true, 0 for false.
     */
    readBoolOutputs(sizeOrder) {
        let pixels = this._renderReadDealloc(WglTexturePool.takeBoolTex(sizeOrder));
        let result = new Uint8Array(pixels.length >> 2);
        for (let i = 0; i < result.length; i++) {
            result[i] = pixels[i << 2] & 1;
        }
        return result;
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!Float32Array}
     */
    readVec2Outputs(sizeOrder) {
        return workingShaderCoder.unpackVec2Data(
            this._renderReadDealloc(WglTexturePool.takeVec2Tex(sizeOrder)))
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!Matrix}
     */
    readVec2OutputsAsKet(sizeOrder) {
        return new Matrix(1, 1 << sizeOrder, this.readVec2Outputs(sizeOrder));
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!Float32Array}
     */
    readVec4Outputs(sizeOrder) {
        return workingShaderCoder.unpackVec4Data(
            this._renderReadDealloc(WglTexturePool.takeVec4Tex(sizeOrder)))
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    toVec2Texture(sizeOrder) {
        let texture = WglTexturePool.takeVec2Tex(sizeOrder);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    toVec4Texture(sizeOrder) {
        let texture = WglTexturePool.takeVec4Tex(sizeOrder);
        this._renderToElseDealloc(texture);
        return texture;
    }

    /**
     * @param {!int} sizeOrder
     * @returns {!WglTexture}
     */
    toBoolTexture(sizeOrder) {
        let texture = WglTexturePool.takeBoolTex(sizeOrder);
        this._renderToElseDealloc(texture);
        return texture;
    }
}

export {
    WglConfiguredShader,
    provideWorkingShaderCoderToWglConfiguredShader,
    provideWglTexturePoolToWglConfiguredShader
}
