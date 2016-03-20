import Rect from "src/math/Rect.js"
import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"
import { checkGetErrorResult } from "src/webgl/WglUtil.js"

/** @type {!WglMortalValueSlot} */
const ENSURE_ATTRIBUTES_BOUND_SLOT = new WglMortalValueSlot(ctx => {
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
});

/**
 * A WebGLRenderingContext wrapped with metadata helpers, lifetime information, and utility methods.
 */
class WglContext {
    /**
     * Creates and wraps a WebGLRenderingContext.
     */
    constructor() {
        /**
         * A hidden canvas backing the WglContext.
         * @type {!HTMLCanvasElement}
         */
        this.canvas = document.createElement('canvas');

        /**
         * The WebGLRenderingContext instance associated with the WglContext.
         * @type {!WebGLRenderingContext}
         */
        this.gl = /** @type {!WebGLRenderingContext} */
            this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if ((/** @type {null|!WebGLRenderingContext} */ this.gl) === null) {
            document.removeChild(this.canvas);
            throw new Error('Error creating WebGL context.');
        }
        if (this.gl.getExtension('OES_texture_float') === undefined) {
            document.removeChild(this.canvas);
            throw new Error("WebGL support for 32-bit floats not present.")
        }

        /**
         * Changed when the wrapped WebGLRenderingContext is lost/restored and things need to be re-created.
         * @type {!int}
         */
        this.lifetimeCounter = 0;

        // Wire lifetime updates.
        this.canvas.addEventListener(
            "webglcontextrestored",
            event => {
                event.preventDefault();
                this.lifetimeCounter++;
            },
            false);
        this.canvas.addEventListener(
            'webglcontextlost',
            event => {
                event.preventDefault();
                this.recomputeProperties();
            },
            false);

        this.recomputeProperties();
    };

    /**
     * @private
     */
    recomputeProperties() {
        this.lifetimeCounter++;
        /** @type {Number} */
        this.maxTextureUnits = this.gl.getParameter(WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
        /** @type {Number} */
        this.maxTextureSize = this.gl.getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE);
        /** @type {!string} */
        this.maximumShaderFloatPrecision = this.getMaximumShaderFloatPrecision();
    }

    /**
     * @returns {!string}
     * @private
     */
    getMaximumShaderFloatPrecision() {
        let gl = this.gl;
        const GL = WebGLRenderingContext;

        let isHighPrecisionAvailable =
            gl.getShaderPrecisionFormat(GL.VERTEX_SHADER, GL.HIGH_FLOAT).precision > 0 &&
            gl.getShaderPrecisionFormat(GL.FRAGMENT_SHADER, GL.HIGH_FLOAT).precision > 0;
        if (isHighPrecisionAvailable) {
            return 'highp';
        }

        console.warn('WebGL high precision not available.');
        let isMediumPrecisionAvailable =
            gl.getShaderPrecisionFormat(GL.VERTEX_SHADER, GL.MEDIUM_FLOAT).precision > 0 &&
            gl.getShaderPrecisionFormat(GL.FRAGMENT_SHADER, GL.MEDIUM_FLOAT).precision > 0;
        if (isMediumPrecisionAvailable) {
            return 'mediump';
        }

        console.warn('WebGL medium precision not available.');
        return 'lowp';
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
        let gl = this.gl;
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
        ENSURE_ATTRIBUTES_BOUND_SLOT.ensureInitialized(this);
        texture.bindFramebufferFor(this);
        shader.bindInstanceFor(this, uniformArguments);

        const GL = WebGLRenderingContext;
        this.gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
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

        let gl = this.gl;
        texture.bindFramebufferFor(this);
        gl.readPixels(rect.x, rect.y, rect.w, rect.h, GL.RGBA, GL.UNSIGNED_BYTE, destinationBuffer);
        checkGetErrorResult(gl.getError(), "readPixels(..., RGBA, UNSIGNED_BYTE, ...)");

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

        let gl = this.gl;
        texture.bindFramebufferFor(this);
        gl.readPixels(rect.x, rect.y, rect.w, rect.h, GL.RGBA, GL.FLOAT, destinationBuffer);
        checkGetErrorResult(gl.getError(), "readPixels(..., RGBA, FLOAT, ...)");

        return destinationBuffer;
    };
}

// We really only ever want one instance to exist.
// Having more of them just causes problems (e.g. eventually tests start failing).
let __sharedInstance = undefined;
export function initializedWglContext() {
    if (__sharedInstance === undefined) {
        __sharedInstance = new WglContext();
    }
    return __sharedInstance;
}
