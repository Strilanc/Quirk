import WglArg from "src/webgl/WglArg.js"
import WglCache from "src/webgl/WglCache.js"
import WglUtil from "src/webgl/WglUtil.js"

/**
 * Stores pixel data for/from/on the gpu... or something along those lines. You can render to and pull data out of it.
 */
export default class WglTexture {
    /**
     * @param {!int} width
     * @param {!int} height
     * @param {!int} pixelType WebGLRenderingContext.FLOAT or WebGLRenderingContext.UNSIGNED_BYTE
     */
    constructor(width, height, pixelType = WebGLRenderingContext.FLOAT) {
        /** @type {!int} */
        this.width = width;
        /** @type {!int} */
        this.height = height;
        /** @type {!number} */
        this.pixelType = pixelType;
        /** @type {!ContextStash} */
        this.contextStash = new Map();
    };

    /**
     * Returns, after initializing if necessary, the resources representing this texture bound to the given context.
     * @param {!WglCache} cache
     * @returns {!{texture:*, framebuffer:*, renderbuffer:*}}
     */
    instanceFor(cache) {
        return cache.retrieveOrCreateAssociatedData(this.contextStash, () => {
            const GL = WebGLRenderingContext;
            let gl = cache.gl;

            let result = {
                texture: gl.createTexture(),
                framebuffer: gl.createFramebuffer()
            };

            gl.bindTexture(GL.TEXTURE_2D, result.texture);
            gl.bindFramebuffer(GL.FRAMEBUFFER, result.framebuffer);

            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, this.width, this.height, 0, GL.RGBA, this.pixelType, null);
            WglUtil.checkGetErrorResult(gl.getError(), "texImage2D");
            gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, result.texture, 0);
            WglUtil.checkGetErrorResult(gl.getError(), "framebufferTexture2D");
            WglUtil.checkFrameBufferStatusResult(gl.checkFramebufferStatus(GL.FRAMEBUFFER));

            gl.bindTexture(GL.TEXTURE_2D, null);
            gl.bindFramebuffer(GL.FRAMEBUFFER, null);

            return result;
        });
    }

    /**
     * Binds, after initializing if necessary, the frame buffer representing this texture to the webgl context related
     * to the given cache.
     * @param {!WglCache} cache
     */
    bindFramebufferFor(cache) {
        const GL = WebGLRenderingContext;
        let gl = cache.gl;
        gl.bindFramebuffer(GL.FRAMEBUFFER, this.instanceFor(cache).framebuffer);
        WglUtil.checkGetErrorResult(gl.getError(), "framebufferTexture2D");
        WglUtil.checkFrameBufferStatusResult(gl.checkFramebufferStatus(GL.FRAMEBUFFER));
    }
}
