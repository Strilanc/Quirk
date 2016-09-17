import {DetailedError} from "src/base/DetailedError.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglMortalValueSlot} from "src/webgl/WglMortalValueSlot.js"
import { initializedWglContext }  from "src/webgl/WglContext.js"
import {checkGetErrorResult, checkFrameBufferStatusResult} from "src/webgl/WglUtil.js"

/**
 * Stores pixel data for/from the gpu.
 * You can render to and pull data out of it.
 */
class WglTexture {
    /**
     * @param {!int} width
     * @param {!int} height
     * @param {!int} pixelType FLOAT or UNSIGNED_BYTE
     */
    constructor(width, height, pixelType = WebGLRenderingContext.FLOAT) {
        if (width === 0 && height === 0) {
            this.width = 0;
            this.height = 0;
            this.pixelType = pixelType;
            this._hasBeenRenderedTo = true;
            this._textureAndFrameBufferSlot = new WglMortalValueSlot(
                () => { throw new DetailedError("Touched a zero-size texture.", this); },
                () => { throw new DetailedError("Touched a zero-size texture.", this); });
            return;
        }

        if (!Util.isPowerOf2(width) || !Util.isPowerOf2(height)) {
            throw new DetailedError("Sizes must be a power of 2.", {width, height, pixelType});
        }

        /** @type {!int} */
        this.width = width;
        /** @type {!int} */
        this.height = height;
        /** @type {!number} */
        this.pixelType = pixelType;
        /**
         * @type {!boolean}
         * @private
         */
        this._hasBeenRenderedTo = false;
        /**
         * @type {!WglMortalValueSlot.<!{texture: !WebGLTexture, framebuffer: !WebGLFramebuffer}>}
         * @private
         */
        this._textureAndFrameBufferSlot = new WglMortalValueSlot(
            () => this._textureAndFramebufferInitializer(),
            e => WglTexture._deinitialize(e));
    }

    markRendered() {
        this._hasBeenRenderedTo = true;
    }

    /**
     * For catching use-after-free bugs, despite texture pooling.
     * Moves the underlying WebGLTexture to a new instance, and marks this instance as invalidated.
     * @param {*} details
     * @returns {!WglTexture}
     */
    invalidateButMoveToNewInstance(details) {
        let result = new WglTexture(this.width, this.height, this.pixelType);
        result._textureAndFrameBufferSlot = this._textureAndFrameBufferSlot;
        let invalidated = () => { throw new DetailedError("WglTexture's value accessed after invalidation.", details) };
        this._textureAndFrameBufferSlot = new WglMortalValueSlot(invalidated, invalidated);
        return result;
    }

    /**
     * @returns {!WebGLTexture}
     */
    initializedTexture() {
        if (!this._hasBeenRenderedTo) {
            throw new Error("Called initializedTexture on a texture that hasn't been rendered to.");
        }
        return this._textureAndFrameBufferSlot.initializedValue(initializedWglContext().lifetimeCounter).texture;
    }

    /**
     * @returns {!WebGLFramebuffer}
     */
    initializedFramebuffer() {
        return this._textureAndFrameBufferSlot.initializedValue(initializedWglContext().lifetimeCounter).framebuffer;
    }

    /**
     * @private
     */
    static _deinitialize({texture, framebuffer}) {
        let gl = initializedWglContext().gl;
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
    }

    ensureDeinitialized() {
        this._textureAndFrameBufferSlot.ensureDeinitialized();
    }

    /**
     * @returns {!{texture: !WebGLTexture, framebuffer: !WebGLFramebuffer}}
     * @private
     */
    _textureAndFramebufferInitializer() {
        const GL = WebGLRenderingContext;
        let gl = initializedWglContext().gl;

        let result = {
            texture: gl.createTexture(),
            framebuffer: gl.createFramebuffer()
        };

        gl.bindTexture(GL.TEXTURE_2D, result.texture);
        gl.bindFramebuffer(GL.FRAMEBUFFER, result.framebuffer);
        try {
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, this.width, this.height, 0, GL.RGBA, this.pixelType, null);
            checkGetErrorResult(gl, "texImage2D");
            gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, result.texture, 0);
            checkGetErrorResult(gl, "framebufferTexture2D");
            checkFrameBufferStatusResult(gl);
        } finally {
            gl.bindTexture(GL.TEXTURE_2D, null);
            gl.bindFramebuffer(GL.FRAMEBUFFER, null);
        }

        return result;
    }

    /**
     * Performs a blocking read of the pixel color data in this texture.
     * @returns {!Uint8Array|!Float32Array}
     */
    readPixels() {
        const GL = WebGLRenderingContext;
        if (!this._hasBeenRenderedTo) {
            throw new Error("Called readPixels on a texture that hasn't been rendered to.");
        }

        let outputBuffer;
        switch (this.pixelType) {
            case GL.UNSIGNED_BYTE:
                outputBuffer = new Uint8Array(this.width * this.height * 4);
                break;
            case GL.FLOAT:
                outputBuffer = new Float32Array(this.width * this.height * 4);
                break;
            default:
                throw new Error("Unrecognized pixel type.");
        }

        if (this.width === 0 || this.height === 0) {
            return outputBuffer;
        }

        let gl = initializedWglContext().gl;
        gl.bindFramebuffer(GL.FRAMEBUFFER, this.initializedFramebuffer());
        checkGetErrorResult(gl, "framebufferTexture2D", true);
        checkFrameBufferStatusResult(gl, true);
        gl.readPixels(0, 0, this.width, this.height, GL.RGBA, this.pixelType, outputBuffer);
        checkGetErrorResult(gl, `readPixels(..., RGBA, ${this.pixelType}, ...)`, true);

        return outputBuffer;
    }
}

export {WglTexture}
