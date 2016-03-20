import Rect from "src/math/Rect.js"
import WglContext from "src/webgl/WglContext.js"
import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglUtil from "src/webgl/WglUtil.js"

/**
 * @type {undefined|!WglContext}
 * @private
 */
let ___sharedContext = undefined;

/**
 * @returns {!WglContext}
 */
function makeWglContext() {
    if (___sharedContext === undefined) {
        // Tests fail if too many contexts are created, and it's wasteful to make so many canvases when only one
        // is required. Not aware of any downsides, other than differing side effects (i.e. number of canvases added
        // to the DOM).
        ___sharedContext = new WglContext();
    }
    return ___sharedContext;
}

/**
 * A context for telling webgl to do useful things with shaders and textures, like rendering.
 */
export default class WglDirector {
    constructor() {
        /**
         * @type {!WglContext}
         */
        this.wglContext = makeWglContext();
    };

    /**
     * Creates an image texture with the given size and pixel data, passes it into the given function, then deletes it.
     * @param {!function(!WebGLTexture)} func
     * @param {!int} width
     * @param {!int} height
     * @param {!Float32Array} pixelColorData
     */
    useRawDataTextureIn(width, height, pixelColorData, func) {
        let GL = WebGLRenderingContext;
        let gl = this.wglContext.gl;
        let t = gl.createTexture();
        try {
            gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, t);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
            gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
            gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, GL.RGBA, GL.FLOAT, pixelColorData);
            func(t);
        } finally {
            gl.deleteTexture(t);
        }
    }

    /**
     * Overwrites the given texture with the output of the given shader when given the given uniform arguments.
     * @param {!WglTexture} texture
     * @param {!WglShader} shader
     * @param {!(!WglArg[])} uniformArguments
     */
    render(texture, shader, uniformArguments) {
        let ctx = this.wglContext;
        if (this._boundPositionAndIndexBuffersSlot === undefined) {
            /**
             * @type {undefined|!WglMortalValueSlot}
             * @private
             */
            this._boundPositionAndIndexBuffersSlot = new WglMortalValueSlot(
                    ctx => WglDirector.ensureAttributesAreBoundInitializer(ctx));
        }
        this._boundPositionAndIndexBuffersSlot.ensureInitialized(ctx);
        texture.bindFramebufferFor(ctx);
        shader.bindInstanceFor(ctx, uniformArguments);

        const GL = WebGLRenderingContext;
        ctx.gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
    };

    /**
     * @param {!WglTexture} texture
     * @param {!Rect=} rect
     * @param {!Uint8Array=} destinationBuffer
     * @returns {!Uint8Array}
     */
    readPixelColorBytes(texture, rect = undefined, destinationBuffer = undefined) {
        const GL = WebGLRenderingContext;
        if (texture.pixelType !== GL.UNSIGNED_BYTE) {
            throw "Asked to read bytes from a texture with non-byte pixels."
        }
        rect = rect || new Rect(0, 0, texture.width, texture.height);
        destinationBuffer = destinationBuffer || new Uint8Array(rect.w * rect.h * 4);

        let ctx = this.wglContext;
        let gl = ctx.gl;
        texture.bindFramebufferFor(ctx);
        gl.readPixels(rect.x, rect.y, rect.w, rect.h, GL.RGBA, GL.UNSIGNED_BYTE, destinationBuffer);
        WglUtil.checkGetErrorResult(gl.getError(), "readPixels(..., RGBA, UNSIGNED_BYTE, ...)");

        return destinationBuffer;
    };

    /**
     * @param {!WglTexture} texture
     * @param {!Rect=} rect
     * @param {!Float32Array=} destinationBuffer
     * @returns {!Float32Array}
     */
    readPixelColorFloats(texture, rect = undefined, destinationBuffer = undefined) {
        const GL = WebGLRenderingContext;
        if (texture.pixelType !== GL.FLOAT) {
            throw "Asked to read floats from a texture with non-float pixels."
        }
        rect = rect || new Rect(0, 0, texture.width, texture.height);
        destinationBuffer = destinationBuffer || new Float32Array(rect.w * rect.h * 4);

        let ctx = this.wglContext;
        let gl = ctx.gl;
        texture.bindFramebufferFor(ctx);
        gl.readPixels(rect.x, rect.y, rect.w, rect.h, GL.RGBA, GL.FLOAT, destinationBuffer);
        WglUtil.checkGetErrorResult(gl.getError(), "readPixels(..., RGBA, FLOAT, ...)");

        return destinationBuffer;
    };


    /**
     * @param {!WglContext} ctx
     * @private
     */
    static ensureAttributesAreBoundInitializer(ctx) {
        const GL = WebGLRenderingContext;
        let gl = ctx.gl;

        let positionBuffer = gl.createBuffer();
        let positions = new Float32Array([
            -1, +1,
            +1, +1,
            -1, -1,
            +1, -1]);
        gl.bindBuffer(GL.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(GL.ARRAY_BUFFER, positions, GL.STATIC_DRAW);
        // Note: ARRAY_BUFFER should not be rebound anywhere else.

        let indexBuffer = gl.createBuffer();
        let indices = new Uint16Array([
            0, 2, 1,
            2, 3, 1]);
        gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.STATIC_DRAW);
        // Note: ELEMENT_ARRAY_BUFFER should not be rebound anywhere else.

        return {positionBuffer, indexBuffer};
    }
}
