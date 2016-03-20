/**
 * Stores information about the current web gl rendering context, and associated resources for shaders and textures and
 * such.
 *
 * @typedef {!Map.<!int, !Map.<!string, *>>} ContextStash
 */
export default class WglCache {
    /**
     * @param {!WebGLRenderingContext} webGLRenderingContext
     * @param {!int} permanentIdentifier
     * @param {!int} temporaryIdentifier
     *
     * @property {!WebGLRenderingContext} gl
     * @property {!int} permanentIdentifier
     * @property {!int} temporaryIdentifier
     * @property {!int} maxTextureUnits
     * @property {!int} maxTextureSize
     */
    constructor(webGLRenderingContext, permanentIdentifier, temporaryIdentifier) {
        /**
         * The WebGLRenderingContext instance associated with this WglCache.
         * @type {!WebGLRenderingContext}
         */
        this.gl = webGLRenderingContext;
        /** @type {!int} */
        this.permanentIdentifier = permanentIdentifier;
        /** @type {!int} */
        this.temporaryIdentifier = temporaryIdentifier;

        /** @type {Number} */
        this.maxTextureUnits = webGLRenderingContext.getParameter(WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
        /** @type {Number} */
        this.maxTextureSize = webGLRenderingContext.getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE);

        /** @type {!ContextStash} */
        this._attributesStash = new Map();
    };

    /**
     * @param {!ContextStash} contextStash
     * @param {!function(): T} initializer
     * @returns {T}
     * @template T
     */
    retrieveOrCreateAssociatedData(contextStash, initializer) {
        if (!contextStash.has(this.permanentIdentifier)) {
            contextStash.set(this.permanentIdentifier, {
                freshness: this.temporaryIdentifier - 1,
                value: undefined
            });
        }
        let stash = contextStash.get(this.permanentIdentifier);

        if (stash.freshness !== this.temporaryIdentifier) {
            stash.freshness = this.temporaryIdentifier;
            stash.value = initializer();
        }

        return stash.value;
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

    ensureAttributesAreBound() {
        this.retrieveOrCreateAssociatedData(this._attributesStash, () => {
            let gl = this.gl;
            let result = {
                positionBuffer: gl.createBuffer(),
                indexBuffer: gl.createBuffer()
            };

            let positions = new Float32Array([
                -1, +1,
                +1, +1,
                -1, -1,
                +1, -1]);
            let GL = WebGLRenderingContext;
            gl.bindBuffer(GL.ARRAY_BUFFER, result.positionBuffer);
            gl.bufferData(GL.ARRAY_BUFFER, positions, GL.STATIC_DRAW);
            // Note: ARRAY_BUFFER should not be rebound anywhere else.

            let indices = new Uint16Array([
                0, 2, 1,
                2, 3, 1]);
            gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, result.indexBuffer);
            gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, indices, GL.STATIC_DRAW);
            // Note: ELEMENT_ARRAY_BUFFER should not be rebound anywhere else.

            return undefined;
        });
    };
}
