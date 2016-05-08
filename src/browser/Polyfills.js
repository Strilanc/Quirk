// Several browsers (IE, Safari, Samsung) don't implement slice.
Float32Array.prototype.slice = Float32Array.prototype.slice || function(a, b, c) {
    return new Float32Array(Array.from(this).slice(a, b, c));
};
Float64Array.prototype.slice = Float64Array.prototype.slice || function(a, b, c) {
    return new Float64Array(Array.from(this).slice(a, b, c));
};
const ARRAY_ITER = function() {
    let self = this;
    return function*() {
        for (let i = 0; i < self.length; i++) {
            yield self[i];
        }
    }();
};
Float32Array.prototype[Symbol.iterator] = Float32Array.prototype[Symbol.iterator] || ARRAY_ITER;
Float64Array.prototype[Symbol.iterator] = Float64Array.prototype[Symbol.iterator] || ARRAY_ITER;

// This was missing on the iPhone I tested.
window.performance = window.performance || {};
window.performance.now = window.performance.now || (() => Date.now());

// Safari only puts properties on instances of WebGLRenderingContext.
const GL = WebGLRenderingContext;
if (GL !== undefined && GL.INVALID_ENUM === undefined) {
    let keys = [
        'ARRAY_BUFFER',
        'CLAMP_TO_EDGE',
        'COLOR_ATTACHMENT0',
        'COMPILE_STATUS',
        'ELEMENT_ARRAY_BUFFER',
        'FLOAT',
        'FRAGMENT_SHADER',
        'FRAMEBUFFER',
        'FRAMEBUFFER_COMPLETE',
        'HIGH_FLOAT',
        'LINK_STATUS',
        'MAX_TEXTURE_IMAGE_UNITS',
        'MAX_TEXTURE_SIZE',
        'MEDIUM_FLOAT',
        'NEAREST',
        'NO_ERROR',
        'RGBA',
        'STATIC_DRAW',
        'TEXTURE_2D',
        'TEXTURE_MAG_FILTER',
        'TEXTURE_MIN_FILTER',
        'TEXTURE_WRAP_S',
        'TEXTURE_WRAP_T',
        'TEXTURE0',
        'TRIANGLES',
        'UNSIGNED_SHORT',
        'UNSIGNED_BYTE',
        'VALIDATE_STATUS',
        'VERTEX_SHADER'
    ];
    let gl = document.createElement('canvas').getContext('webgl');
    for (let key of keys) {
        GL[key] = GL[key] || gl[key];
    }
}
