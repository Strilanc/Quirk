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

import {DetailedError} from "../base/DetailedError.js"
import {WglArg} from "./WglArg.js"
import {Seq} from "../base/Seq.js"
import {ShaderPart, SingleTypeCoder, ShaderCoder, BOOL_TYPE_CODER} from "./ShaderCoders_Base.js"

/**
 * Exposes an array of single-precision floats as an array of bytes.
 * @param {!Float64Array|!Float32Array} floats
 * @returns {!Uint8Array}
 */
function floatsAsBytes(floats) {
    if (floats instanceof Float64Array) {
        return new Uint8Array(new Float32Array(floats).buffer, 0, floats.length << 2);
    }
    if (floats instanceof Float32Array) {
        return new Uint8Array(floats.buffer, 0, floats.length << 2);
    }
    throw new DetailedError("Not a Float32Array or Float64Array", {type: typeof floats, floats});
}

/**
 * Exposes an array of bytes as an array of single-precision floats.
 * @param {!Uint8Array} bytes
 * @returns {!Float32Array}
 */
function bytesAsFloats(bytes) {
    if (!(bytes instanceof Uint8Array)) {
        throw new DetailedError("Not a Uint8Array", {type: typeof bytes, bytes});
    }
    return new Float32Array(bytes.buffer, 0, bytes.length >> 2);
}

const PACK_FLOAT_INTO_BYTES_CODE = `
    //////////// PACK_FLOAT_INTO_BYTES /////////////
    vec4 _gen_packFloatIntoBytes(float val) {
        if (val == 0.0) {
            // If log2(0) returns -Infinity, then the logic below would work out just right and this IF block
            // wouldn't be needed. Unfortunately, log2(0) isn't guaranteed to do that (it's undefined by the spec).
            return vec4(0.0, 0.0, 0.0, 0.0);
        }

        float mag = abs(val);
        float exponent = floor(log2(mag));
        // Correct log2 approximation errors.
        exponent += float(exp2(exponent) <= mag / 2.0);
        exponent -= float(exp2(exponent) > mag);

        float mantissa;
        if (exponent > 100.0) {
            // Not sure why this needs to be done in two steps for the largest float to work. Best guess is the
            // optimizer is rewriting '/ exp2(e)' into '* exp2(-e)', but exp2(-128.0) is too small to represent.
            mantissa = mag / 1024.0 / exp2(exponent - 10.0) - 1.0;
        } else {
            mantissa = mag / float(exp2(exponent)) - 1.0;
        }

        exponent += 127.0;
        float a = float(val < 0.0) * 128.0 + floor(exponent / 2.0);
        mantissa *= 128.0;
        float b = mod(exponent, 2.0) * 128.0 + floor(mantissa);
        mantissa -= floor(mantissa);
        mantissa *= 256.0;
        float c = floor(mantissa);
        mantissa -= c;
        mantissa *= 256.0;
        float d = floor(mantissa);

        return vec4(d, c, b, a) / 255.0;
    }`;

const UNPACK_BYTES_INTO_FLOAT_CODE = `
    //////////// UNPACK_BYTES_INTO_FLOAT_CODE /////////////
    float _gen_unpackBytesIntoFloat(vec4 v) {
        float d = floor(v.r * 255.0 + 0.5);
        float c = floor(v.g * 255.0 + 0.5);
        float b = floor(v.b * 255.0 + 0.5);
        float a = floor(v.a * 255.0 + 0.5);

        float sign = floor(a / 128.0);
        sign = 1.0 - sign * 2.0;

        float exponent = mod(a, 128.0) * 2.0 + floor(b / 128.0) - 127.0;
        float mantissa = float(exponent > -127.0)
                       + mod(b, 128.0) / 128.0
                       + c / 32768.0
                       + d / 8388608.0;
        return sign * mantissa * exp2(exponent);
    }`;

/**
 * @param {!int} vecSize
 * @param {!string} name
 * @returns {!ShaderPart}
 */
function makeByteCoderInput(vecSize, name) {
    let type = ['float', 'vec2', 'vec3', 'vec4'][vecSize - 1];
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// makeByteCoderInput(${vecSize}, ${name}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        ${type} read_${name}(float k) {
            k *= ${vecSize}.0;
            vec2 uv = vec2(mod(k, ${pre}_size.x) + 0.5,
                           floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;

            ${Seq.range(vecSize).map(i => `
                vec2 uv${i} = uv + vec2(${i}.0 / ${pre}_size.x, 0.0);
                vec4 bytes${i} = texture2D(${pre}_tex, uv${i});`).join('')}

            return ${type}(${Seq.range(vecSize).map(i => `
                _gen_unpackBytesIntoFloat(bytes${i})`).join(',')});
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y / ${vecSize}.0;
        }`,
        [UNPACK_BYTES_INTO_FLOAT_CODE],
        texture => {
            if (texture.pixelType !== WebGLRenderingContext.UNSIGNED_BYTE) {
                throw new DetailedError("vec2Input_Byte requires byte texture", {name, texture});
            }
            return [
                WglArg.texture(`${pre}_tex`, texture),
                WglArg.vec2(`${pre}_size`, texture.width, texture.height)
            ];
        });
}

/**
 * @param {!int} vecSize
 * @returns {!ShaderPart}
 */
function makeByteCoderOutput(vecSize) {
    let type = ['float', 'vec2', 'vec3', 'vec4'][vecSize - 1];
    return new ShaderPart(`
        ///////////// makeByteCoderOutput${vecSize} ////////////
        ${type} outputFor(float k);

        uniform vec2 _gen_output_size;
        uniform float _gen_secret_half;

        float len_output() {
            return _gen_output_size.x * _gen_output_size.y / ${vecSize}.0;
        }

        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(_gen_secret_half, _gen_secret_half);
            float k = xy.y * _gen_output_size.x + xy.x;
            float r = mod(k, ${vecSize}.0);
            ${vecSize === 1 ?
                'float component = outputFor(k);' :
                `${type} result = outputFor(floor(k / ${vecSize}.0));
                 ${type} picker = ${type}(${Seq.range(vecSize).map(r => `float(r == ${r}.0)`).join(", ")});
                 float component = dot(result, picker);`
            }
            gl_FragColor = _gen_packFloatIntoBytes(component);
        }`,
        [PACK_FLOAT_INTO_BYTES_CODE],
        texture => [
            WglArg.vec2('_gen_output_size', texture.width, texture.height),
            WglArg.float('_gen_secret_half', 0.5)
        ]);
}

const FLOAT_TYPE_CODER = new SingleTypeCoder(
    name => makeByteCoderInput(1, name),
    makeByteCoderOutput(1),
    0,
    WebGLRenderingContext.UNSIGNED_BYTE,
    floatsAsBytes,
    bytesAsFloats,
    false);

const VEC2_TYPE_CODER = new SingleTypeCoder(
    name => makeByteCoderInput(2, name),
    makeByteCoderOutput(2),
    1,
    WebGLRenderingContext.UNSIGNED_BYTE,
    floatsAsBytes,
    bytesAsFloats,
    false);

const VEC4_TYPE_CODER = new SingleTypeCoder(
    name => makeByteCoderInput(4, name),
    makeByteCoderOutput(4),
    2,
    WebGLRenderingContext.UNSIGNED_BYTE,
    floatsAsBytes,
    bytesAsFloats,
    false);

/** @type {!ShaderCoder} */
const SHADER_CODER_BYTES = new ShaderCoder(
    BOOL_TYPE_CODER,
    FLOAT_TYPE_CODER,
    VEC2_TYPE_CODER,
    VEC4_TYPE_CODER);

export {
    SHADER_CODER_BYTES,
    floatsAsBytes,
    bytesAsFloats,
    UNPACK_BYTES_INTO_FLOAT_CODE,
    PACK_FLOAT_INTO_BYTES_CODE
}
