/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Several browsers (IE, Safari, Samsung) don't implement slice.
Float32Array.prototype.slice = Float32Array.prototype.slice || function(a, b) {
    return new Float32Array(Array.from(this).slice(a, b));
};
Float64Array.prototype.slice = Float64Array.prototype.slice || function(a, b) {
    return new Float64Array(Array.from(this).slice(a, b));
};
Uint32Array.prototype.slice = Uint32Array.prototype.slice || function(a, b) {
    return new Uint32Array(Array.from(this).slice(a, b));
};
Int32Array.prototype.slice = Int32Array.prototype.slice || function(a, b) {
    return new Int32Array(Array.from(this).slice(a, b));
};
Uint16Array.prototype.slice = Uint16Array.prototype.slice || function(a, b) {
    return new Uint16Array(Array.from(this).slice(a, b));
};
Int16Array.prototype.slice = Int16Array.prototype.slice || function(a, b) {
    return new Int16Array(Array.from(this).slice(a, b));
};
Uint8Array.prototype.slice = Uint8Array.prototype.slice || function(a, b) {
    return new Uint8Array(Array.from(this).slice(a, b));
};
Int8Array.prototype.slice = Int8Array.prototype.slice || function(a, b) {
    return new Int8Array(Array.from(this).slice(a, b));
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
Uint32Array.prototype[Symbol.iterator] = Uint32Array.prototype[Symbol.iterator] || ARRAY_ITER;
Uint16Array.prototype[Symbol.iterator] = Uint16Array.prototype[Symbol.iterator] || ARRAY_ITER;
Uint8Array.prototype[Symbol.iterator] = Uint8Array.prototype[Symbol.iterator] || ARRAY_ITER;
Int32Array.prototype[Symbol.iterator] = Int32Array.prototype[Symbol.iterator] || ARRAY_ITER;
Int16Array.prototype[Symbol.iterator] = Int16Array.prototype[Symbol.iterator] || ARRAY_ITER;
Int8Array.prototype[Symbol.iterator] = Int8Array.prototype[Symbol.iterator] || ARRAY_ITER;

// This was missing on the iPhone I tested.
window.performance = window.performance || {};
window.performance.now = window.performance.now || (() => Date.now());

// Safari only puts properties on instances of WebGLRenderingContext.
const GL = WebGLRenderingContext;
//noinspection JSValidateTypes
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
    if (gl !== null && gl !== undefined) {
        for (let key of keys) {
            GL[key] = GL[key] || gl[key];
        }
    }
}
