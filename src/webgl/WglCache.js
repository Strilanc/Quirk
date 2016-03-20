import WglMortalValueSlot from "src/webgl/WglMortalValueSlot.js"

/**
 * Stores information about the current web gl rendering context, and associated resources for shaders and textures and
 * such.
 */
export default class WglCache {
    /**
     * @param {!WebGLRenderingContext} webGLRenderingContext
     */
    constructor(webGLRenderingContext) {
        /**
         * The WebGLRenderingContext instance associated with this WglCache.
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
        /** @type {!WglMortalValueSlot} */
        this._boundPositionAndIndexBuffersSlot = new WglMortalValueSlot(
            () => this.ensureAttributesAreBoundInitializer());
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

    /**
     * @private
     */
    ensureAttributesAreBoundInitializer() {
        const GL = WebGLRenderingContext;
        let gl = this.gl;

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

    ensureAttributesAreBound() {
        this._boundPositionAndIndexBuffersSlot.initializedValue(this);
    };
}
