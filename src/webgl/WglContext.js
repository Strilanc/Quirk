import Rect from "src/math/Rect.js"
import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"
import { checkGetErrorResult, checkFrameBufferStatusResult } from "src/webgl/WglUtil.js"

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
