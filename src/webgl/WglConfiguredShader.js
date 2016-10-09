import {Matrix} from "src/math/Matrix.js"
import {WglTexture} from "src/webgl/WglTexture.js"

/** @type {undefined|!ShaderValueCoder} */
let workingShaderCoder = undefined;
/**
 * @param {!ShaderValueCoder} futureWorkingShaderCoder
 */
function provideWorkingShaderCoderToWglConfiguredShader(futureWorkingShaderCoder) {
    workingShaderCoder = futureWorkingShaderCoder;
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
     * Renders into a new byte texture of the given size, and returns the texture.
     * @param {!int} width
     * @param {!int} height
     * @returns {!WglTexture}
     */
    toByteTexture(width, height) {
        let texture = new WglTexture(width, height, WebGLRenderingContext.UNSIGNED_BYTE);
        this.renderTo(texture);
        return texture;
    }

    /**
     * Renders into a new float texture of the given size, and returns the texture.
     * @param {!int} width
     * @param {!int} height
     * @returns {!WglTexture}
     */
    toFloatTexture(width, height) {
        let texture = new WglTexture(width, height);
        this.renderTo(texture);
        return texture;
    }

    /**
     * Renders the result into a float texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} width
     * @param {!int} height
     * @returns {!Float32Array}
     */
    readFloatOutputs(width, height) {
        let texture = new WglTexture(width, height);
        try {
            this.renderTo(texture);
            return texture.readPixels();
        } finally {
            texture.ensureDeinitialized();
        }
    }

    /**
     * Renders the result into an unsigned byte texture, reads the pixels, and returns the result.
     * This method is slow (because it uses readPixels) and mainly exists for easy testing.
     * @param {!int} width
     * @param {!int} height
     * @returns {!Uint8Array}
     */
    readByteOutputs(width, height) {
        let texture = this.toByteTexture(width, height);
        try {
            let result = texture.readPixels();
            return result;
        } finally {
            texture.ensureDeinitialized();
        }
    }

    /**
     * @param {!int} order
     * @returns {!Float32Array}
     */
    readVec2Outputs(order) {
        return workingShaderCoder.readVec2Data(this, order);
    }

    /**
     * @param {!int} order
     * @returns {!Matrix}
     */
    readVec2OutputsAsKet(order) {
        return new Matrix(1, 1 << order, this.readVec2Outputs(order));
    }

    /**
     * @param {!int} order
     * @returns {!Uint8Array}
     */
    readBoolOutputs(order) {
        let texture = this.toBoolTexture(order);
        try {
            let result = texture.readPixels();
            for (let i = 0; i < result.length; i++) {
                result[i] &= 1;
            }
            return result;
        } finally {
            texture.ensureDeinitialized();
        }
    }

    /**
     * @param {!int} order
     * @returns {!Float32Array}
     */
    readVec4Outputs(order) {
        return workingShaderCoder.readVec4Data(this, order);
    }

    /**
     * @param {!int} order
     * @returns {!WglTexture}
     */
    toVec2Texture(order) {
        order += workingShaderCoder.vec2Overhead;
        let width = 1 << Math.ceil(order / 2);
        let height = 1 << Math.floor(order / 2);

        let texture = new WglTexture(width, height, workingShaderCoder.vecPixelType);
        this.renderTo(texture);
        return texture;
    }

    /**
     * @param {!int} order
     * @returns {!WglTexture}
     */
    toVec4Texture(order) {
        order += workingShaderCoder.vec4Overhead;
        let width = 1 << Math.ceil(order / 2);
        let height = 1 << Math.floor(order / 2);
        if (width < 4 ) {
            width <<= 1;
            height >>= 1;
        }

        let texture = new WglTexture(width, height, workingShaderCoder.vecPixelType);
        this.renderTo(texture);
        return texture;
    }

    /**
     * @param {!int} order
     * @returns {!WglTexture}
     */
    toBoolTexture(order) {
        let width = 1 << Math.ceil(order / 2);
        let height = 1 << Math.floor(order / 2);

        let texture = new WglTexture(width, height, WebGLRenderingContext.UNSIGNED_BYTE);
        this.renderTo(texture);
        return texture;
    }
}

export {WglConfiguredShader, provideWorkingShaderCoderToWglConfiguredShader}
