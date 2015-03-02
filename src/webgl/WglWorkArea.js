import Rect from "src/base/Rect.js"
import WglContext from "src/webgl/WglContext.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let nextUniqueContextId = 0;

/**
 */
export default class WglWorkArea {
    constructor() {
        /**
         * @type {!HTMLCanvasElement}
         * @private
         */
        this.canvas = document.createElement('canvas');

        /**
         * @type {!WebGLRenderingContext}
         * @private
         */
        let g = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        //noinspection JSValidateTypes
        if (g === null) {
            throw 'Error creating WebGL context.';
        }
        if (g.getExtension('OES_texture_float') === undefined) {
            throw new Error("WebGL support for 32-bit floats not present.")
        }

        this.tempContext = new WglContext(g, nextUniqueContextId++, 0);

        /**
         * @private
         * @type {!ContextStash}
         */
        this._renderStash = new Map();

        this.canvas.addEventListener(
            "webglcontextrestored",
            event => {
                event.preventDefault();
                this.tempContext.temporaryIdentifier++;
            },
            false);

        this.canvas.addEventListener(
            'webglcontextlost',
            event => {
                event.preventDefault();
                this.tempContext.temporaryIdentifier++;
            },
            false);
    };

    /**
     * @param {!WglTexture} texture
     * @param {!WglShader} shader
     * @param {!(!WglArg[])} uniformArguments
     */
    render(texture, shader, uniformArguments) {
        this.ensureAttributesAreBound();

        let s = WebGLRenderingContext;
        let t = this.tempContext;
        t.webGLRenderingContext.bindFramebuffer(s.FRAMEBUFFER, texture.instanceFor(t).framebuffer);
        shader.bindInstanceFor(t, uniformArguments);

        t.webGLRenderingContext.drawElements(s.TRIANGLES, 6, s.UNSIGNED_SHORT, 0);
    };

    checkError(previousOp) {
        var e = this.tempContext.webGLRenderingContext.getError();
        var s = WebGLRenderingContext;
        if (e === s.NO_ERROR) {
            return;
        }
        var m = {
            [s.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
            [s.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
            [s.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
            [s.INVALID_ENUM]: "INVALID_ENUM",
            [s.INVALID_VALUE]: "INVALID_VALUE",
            [s.INVALID_OPERATION]: "INVALID_OPERATION",
            [s.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION"
        };
        var d = m[e] !== undefined ? m[e] : "?";
        throw new Error(`gl.getError() returned ${e} (${d}) after ${previousOp}.`);
    };

    /**
     * @param {!WglTexture} texture
     * @param {!Rect=} rect
     * @param {!Uint8Array=} destinationBuffer
     * @returns {!Uint8Array}
     */
    readPixelColorBytes(texture, rect = undefined, destinationBuffer = undefined) {
        rect = rect || new Rect(0, 0, texture.width, texture.height);
        destinationBuffer = destinationBuffer || new Uint8Array(rect.w * rect.h * 4);

        let s = WebGLRenderingContext;
        let t = this.tempContext;
        let g = t.webGLRenderingContext;
        g.bindFramebuffer(s.FRAMEBUFFER, texture.instanceFor(t).framebuffer);
        g.readPixels(rect.x, rect.y, rect.w, rect.h, s.RGBA, s.UNSIGNED_BYTE, destinationBuffer);

        return destinationBuffer;
    };

    /**
     * @param {!WglTexture} texture
     * @param {!Rect=} rect
     * @param {!Float32Array=} destinationBuffer
     * @returns {!Float32Array}
     */
    readPixelColorFloats(texture, rect = undefined, destinationBuffer = undefined) {
        rect = rect || new Rect(0, 0, texture.width, texture.height);
        destinationBuffer = destinationBuffer || new Float32Array(rect.w * rect.h * 4);

        let s = WebGLRenderingContext;
        let t = this.tempContext;
        let g = t.webGLRenderingContext;
        g.bindFramebuffer(s.FRAMEBUFFER, texture.instanceFor(t).framebuffer);
        g.readPixels(rect.x, rect.y, rect.w, rect.h, s.RGBA, s.FLOAT, destinationBuffer);

        return destinationBuffer;
    };

    ensureAttributesAreBound() {
        this.tempContext.retrieveOrCreateAssociatedData(this._renderStash, () => {
            var g = this.tempContext.webGLRenderingContext;
            var result = {
                positionBuffer: g.createBuffer(),
                indexBuffer: g.createBuffer()
            };

            var positions = new Float32Array([
                -1, +1,
                +1, +1,
                -1, -1,
                +1, -1]);
            var s = WebGLRenderingContext;
            g.bindBuffer(s.ARRAY_BUFFER, result.positionBuffer);
            g.bufferData(s.ARRAY_BUFFER, positions, s.STATIC_DRAW);
            // Note: if ARRAY_BUFFER should not be rebound anywhere else.

            var indices = new Uint16Array([
                0, 2, 1,
                2, 3, 1]);
            g.bindBuffer(s.ELEMENT_ARRAY_BUFFER, result.indexBuffer);
            g.bufferData(s.ELEMENT_ARRAY_BUFFER, indices, s.STATIC_DRAW);
            // Note: ELEMENT_ARRAY_BUFFER should not be rebound anywhere else.

            return undefined;
        });
    };
}
