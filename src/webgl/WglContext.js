import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"

/**
 * A WebGLRenderingContext wrapped with metadata helpers and lifetime information.
 */
export default class WglContext {
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
        if (/** @type {null|!WebGLRenderingContext} */ this.gl === null) {
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
}
