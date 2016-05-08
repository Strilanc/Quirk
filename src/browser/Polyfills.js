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
