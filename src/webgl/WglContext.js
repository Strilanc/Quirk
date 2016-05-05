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
            throw new Error('Error creating WebGL context.');
        }
        if (this.gl.getExtension('OES_texture_float') === undefined) {
            throw new Error("OES_texture_float webgl extension not present.");
        }

        /** @type {!function(void):void} */
        this.onContextRestored = undefined;

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
                this.recomputeProperties();
                if (this.onContextRestored !== undefined) {
                    this.onContextRestored();
                }
            },
            false);
        this.canvas.addEventListener(
            'webglcontextlost',
            event => {
                event.preventDefault();
                this.lifetimeCounter++;
            },
            false);

        this.recomputeProperties();
    }

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
        this.maximumShaderFloatPrecision = this._getMaximumShaderFloatPrecision();
    }

    /**
     * @returns {!string}
     * @private
     */
    _getMaximumShaderFloatPrecision() {
        let gl = this.gl;
        const GL = WebGLRenderingContext;
        let check = (shaderType, precisionType) => {
            let format = gl.getShaderPrecisionFormat(shaderType, precisionType);
            return gl.getError() === GL.NO_ERROR && format !== undefined && format !== null && format.precision > 0;
        };

        let hasHighPrecision = check(GL.VERTEX_SHADER, GL.HIGH_FLOAT) && check(GL.FRAGMENT_SHADER, GL.HIGH_FLOAT);
        if (hasHighPrecision) {
            return 'highp';
        }

        console.warn('WebGL high precision not available.');
        let hasMediumPrecision = check(GL.VERTEX_SHADER, GL.MEDIUM_FLOAT) && check(GL.FRAGMENT_SHADER, GL.MEDIUM_FLOAT);
        if (hasMediumPrecision) {
            return 'mediump';
        }

        console.warn('WebGL medium precision not available.');
        return 'lowp';
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
