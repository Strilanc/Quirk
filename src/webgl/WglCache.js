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
        /** @type {!WebGLRenderingContext} */
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
        var gl = this.gl;
        var s = WebGLRenderingContext;

        var isHighPrecisionAvailable =
            gl.getShaderPrecisionFormat(s.VERTEX_SHADER, s.HIGH_FLOAT).precision > 0 &&
            gl.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.HIGH_FLOAT).precision > 0;
        if (isHighPrecisionAvailable) {
            return 'highp';
        }

        console.warn('WebGL high precision not available.');
        var isMediumPrecisionAvailable =
            gl.getShaderPrecisionFormat(s.VERTEX_SHADER, s.MEDIUM_FLOAT).precision > 0 &&
            gl.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.MEDIUM_FLOAT).precision > 0;
        if (isMediumPrecisionAvailable) {
            return 'mediump';
        }

        console.warn('WebGL medium precision not available.');
        return 'lowp';
    };

    ensureAttributesAreBound() {
        this.retrieveOrCreateAssociatedData(this._attributesStash, () => {
            var g = this.gl;
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
            // Note: ARRAY_BUFFER should not be rebound anywhere else.

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
