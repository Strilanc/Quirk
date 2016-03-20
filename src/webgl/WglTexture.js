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
            const Ctx = WebGLRenderingContext;
            var ctx = cache.gl;

            var result = {
                texture: ctx.createTexture(),
                framebuffer: ctx.createFramebuffer()
            };

            ctx.bindTexture(Ctx.TEXTURE_2D, result.texture);
            ctx.bindFramebuffer(Ctx.FRAMEBUFFER, result.framebuffer);

            ctx.texParameteri(Ctx.TEXTURE_2D, Ctx.TEXTURE_MAG_FILTER, Ctx.NEAREST);
            ctx.texParameteri(Ctx.TEXTURE_2D, Ctx.TEXTURE_MIN_FILTER, Ctx.NEAREST);
            ctx.texParameteri(Ctx.TEXTURE_2D, Ctx.TEXTURE_WRAP_S, Ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(Ctx.TEXTURE_2D, Ctx.TEXTURE_WRAP_T, Ctx.CLAMP_TO_EDGE);
            ctx.texImage2D(Ctx.TEXTURE_2D, 0, Ctx.RGBA, this.width, this.height, 0, Ctx.RGBA, this.pixelType, null);
            WglUtil.checkErrorCode(ctx.getError(), "texImage2D");
            ctx.framebufferTexture2D(Ctx.FRAMEBUFFER, Ctx.COLOR_ATTACHMENT0, Ctx.TEXTURE_2D, result.texture, 0);
            WglUtil.checkErrorCode(ctx.getError(), "framebufferTexture2D");
            WglUtil.checkFrameBufferStatusCode(ctx.checkFramebufferStatus(Ctx.FRAMEBUFFER));

            ctx.bindTexture(Ctx.TEXTURE_2D, null);
            ctx.bindFramebuffer(Ctx.FRAMEBUFFER, null);

            return result;
        });
    }

    /**
     * Binds, after initializing if necessary, the frame buffer representing this texture to the webgl context related
     * to the given cache.
     * @param {!WglCache} cache
     */
    bindFramebufferFor(cache) {
        const Ctx = WebGLRenderingContext;
        let ctx = cache.gl;
        ctx.bindFramebuffer(Ctx.FRAMEBUFFER, this.instanceFor(cache).framebuffer);
        WglUtil.checkErrorCode(ctx.getError(), "framebufferTexture2D");
        WglUtil.checkFrameBufferStatusCode(ctx.checkFramebufferStatus(Ctx.FRAMEBUFFER));
    }
}
