import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"

/**
 * Wraps a WebGLRenderingContext with metadata helpers and lifetime information.
 */
export default class WglContext {
    /**
     * @param {!WebGLRenderingContext} webGLRenderingContext
     */
    constructor(webGLRenderingContext) {
        /**
         * The WebGLRenderingContext instance associated with this WglContext.
         * @type {!WebGLRenderingContext}
         */
        this.gl = webGLRenderingContext;
        /**
         * Changed when the webgl context is lost and things need to be re-created.
         * @type {!int}
         */
        this.lifetimeCounter = 0;
        /** @type {Number} */
        this.maxTextureUnits = webGLRenderingContext.getParameter(WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
        /** @type {Number} */
        this.maxTextureSize = webGLRenderingContext.getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE);
    };

    /**
     * @returns {!string}
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
