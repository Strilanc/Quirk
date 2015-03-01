/**
 * Stores information about the current web gl rendering context.
 *
 * @typedef {!Map<!int, !Map<!string, *>>} ContextStash
 */
export default class WglContext {
    /**
     * @param {!WebGLRenderingContext} webGLRenderingContext
     * @param {!int} permanentIdentifier
     * @param {!int} temporaryIdentifier
     */
    constructor(webGLRenderingContext, permanentIdentifier, temporaryIdentifier) {
        /** @type {!WebGLRenderingContext} */
        this.webGLRenderingContext = webGLRenderingContext;
        /** @type {!int} */
        this.permanentIdentifier = permanentIdentifier;
        /** @type {!int} */
        this.temporaryIdentifier = temporaryIdentifier;

        /** @type {Number} */
        this.maxTextureUnits = webGLRenderingContext.getParameter(WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
        /** @type {Number} */
        this.maxTextureDiameter = webGLRenderingContext.getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE);
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

    getMaximumShaderFloatPrecision() {
        var g = this.webGLRenderingContext;
        var s = WebGLRenderingContext;

        var isHighPrecisionAvailable =
            g.getShaderPrecisionFormat(s.VERTEX_SHADER, s.HIGH_FLOAT).precision > 0 &&
            g.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.HIGH_FLOAT).precision > 0;
        if (isHighPrecisionAvailable) {
            return 'highp';
        }

        console.warn('WebGL high precision not available.');
        var isMediumPrecisionAvailable =
            g.getShaderPrecisionFormat(s.VERTEX_SHADER, s.MEDIUM_FLOAT).precision > 0 &&
            g.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.MEDIUM_FLOAT).precision > 0;
        if (isMediumPrecisionAvailable) {
            return 'mediump';
        }

        console.warn('WebGL medium precision not available.');
        return 'lowp';
    };
}
