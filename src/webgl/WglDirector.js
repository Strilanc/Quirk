import Rect from "src/math/Rect.js"
import WglCache from "src/webgl/WglCache.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglUtil from "src/webgl/WglUtil.js"

class WglDirectorSharedContext {
    constructor() {
        /** @type {!HTMLCanvasElement} */
        this.canvas = document.createElement('canvas');


        let gl = /** @type {!WebGLRenderingContext} */
            this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        //noinspection JSValidateTypes
        if (gl === null) {
            document.removeChild(this.canvas);
            throw new Error('Error creating WebGL context.');
        }
        if (gl.getExtension('OES_texture_float') === undefined) {
            document.removeChild(this.canvas);
            throw new Error("WebGL support for 32-bit floats not present.")
        }

        /** @type {!WglCache} */
        this.cache = new WglCache(gl, nextUniqueId++, 0);

        this.canvas.addEventListener(
            "webglcontextrestored",
                event => {
                event.preventDefault();
                this.cache.temporaryIdentifier++;
            },
            false);

        this.canvas.addEventListener(
            'webglcontextlost',
                event => {
                event.preventDefault();
                this.cache.temporaryIdentifier++;
            },
            false);
    };
}

let nextUniqueId = 0;
let shared = undefined;

/**
 * A context for telling webgl to do useful things with shaders and textures, like rendering.
 */
export default class WglDirector {
    constructor() {
        if (shared === undefined) {
            // Tests fail if too many directors are created, and it's wasteful to make so many canvases when only one
            // is required. Not aware of any downsides, other than differing side effects (i.e. number of canvases added
            // to the DOM).
            shared = new WglDirectorSharedContext();
        }

        /**
         * @type {!HTMLCanvasElement}
         * @private
         */
        this.canvas = shared.canvas;

        /**
         * @type {!WebGLRenderingContext}
         * @private
         */
        this.g = shared.g;

        /**
         * @type {!WglCache}
         */
        this.cache = shared.cache;
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
        let gl = this.cache.gl;
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
        let c = this.cache;
        c.ensureAttributesAreBound();
        texture.bindFramebufferFor(c);
        shader.bindInstanceFor(c, uniformArguments);

        const GL = WebGLRenderingContext;
        c.gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
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

        let c = this.cache;
        let gl = c.gl;
        texture.bindFramebufferFor(c);
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

        let c = this.cache;
        let gl = c.gl;
        texture.bindFramebufferFor(c);
        gl.readPixels(rect.x, rect.y, rect.w, rect.h, GL.RGBA, GL.FLOAT, destinationBuffer);
        WglUtil.checkGetErrorResult(gl.getError(), "readPixels(..., RGBA, FLOAT, ...)");

        return destinationBuffer;
    };
}
