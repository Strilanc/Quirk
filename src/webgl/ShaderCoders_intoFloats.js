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
import {ShaderPart, SingleTypeCoder, ShaderCoder, BOOL_TYPE_CODER} from "./ShaderCoders_Base.js"
import {WglArg} from "./WglArg.js"

/**
 * @param {!int} vecSize
 * @param {!string} name
 * @returns {!ShaderPart}
 */
function makeFloatCoderInput(vecSize, name) {
    let type = ['float', 'vec2', 'vec3', 'vec4'][vecSize - 1];
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// makeFloatCoderInput(${vecSize}, ${name}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        ${type} read_${name}(float k) {
            vec2 uv = vec2(mod(k, ${pre}_size.x) + 0.5,
                           floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;
            return texture2D(${pre}_tex, uv).${'xyzw'.substring(0, vecSize)};
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y;
        }`,
        [],
        texture => {
            if (texture.pixelType !== WebGLRenderingContext.FLOAT) {
                throw new DetailedError(`vecInput${vecSize}_Float requires float texture`, {name, texture});
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
function makeFloatCoderOutput(vecSize) {
    let type = ['float', 'vec2', 'vec3', 'vec4'][vecSize - 1];
    let vIntoVec4 = [
        'vec4(v, 0.0, 0.0, 0.0)',
        'vec4(v.x, v.y, 0.0, 0.0)',
        'vec4(v.x, v.y, v.z, 0.0)',
        'v'
    ][vecSize - 1];
    return new ShaderPart(`
        ///////////// makeFloatCoderOutput${vecSize} ////////////
        ${type} outputFor(float k);

        uniform vec2 _gen_output_size;
        uniform float _gen_secret_half;

        float len_output() {
            return _gen_output_size.x * _gen_output_size.y;
        }

        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(_gen_secret_half, _gen_secret_half);
            float k = xy.y * _gen_output_size.x + xy.x;

            ${type} v = outputFor(k);

            gl_FragColor = ${vIntoVec4};
        }`,
        [],
        texture => [
            WglArg.vec2('_gen_output_size', texture.width, texture.height),
            WglArg.float('_gen_secret_half', 0.5)
        ]);
}

/**
 * @param {!Float32Array} vec1Data
 * @returns {!Float32Array}
 */
function spreadFloatVec1(vec1Data) {
    let result = new Float32Array(vec1Data.length << 2);
    for (let i = 0; i < vec1Data.length; i++) {
        result[4*i] = vec1Data[i];
    }
    return result;
}

/**
 * @param {!Float32Array} vec2Data
 * @returns {!Float32Array}
 */
function spreadFloatVec2(vec2Data) {
    let result = new Float32Array(vec2Data.length << 1);
    for (let i = 0; i*2 < vec2Data.length; i++) {
        result[4*i] = vec2Data[2*i];
        result[4*i+1] = vec2Data[2*i+1];
    }
    return result;
}

/**
 * @param {!Float32Array} pixelData
 * @returns {!Float32Array}
 */
function unspreadFloatVec1(pixelData) {
    let result = new Float32Array(pixelData.length >> 2);
    for (let i = 0; i < result.length; i++) {
        result[i] = pixelData[4*i];
    }
    return result;
}

/**
 * @param {!Float32Array} pixelData
 * @returns {!Float32Array}
 */
function unspreadFloatVec2(pixelData) {
    let result = new Float32Array(pixelData.length >> 1);
    for (let i = 0; i*2 < result.length; i++) {
        result[2*i] = pixelData[4*i];
        result[2*i+1] = pixelData[4*i+1];
    }
    return result;
}

const FLOAT_TYPE_CODER = new SingleTypeCoder(
    name => makeFloatCoderInput(1, name),
    makeFloatCoderOutput(1),
    0,
    WebGLRenderingContext.FLOAT,
    spreadFloatVec1,
    unspreadFloatVec1,
    true);

const VEC2_TYPE_CODER = new SingleTypeCoder(
    name => makeFloatCoderInput(2, name),
    makeFloatCoderOutput(2),
    0,
    WebGLRenderingContext.FLOAT,
    spreadFloatVec2,
    unspreadFloatVec2,
    true);

const VEC4_TYPE_CODER = new SingleTypeCoder(
    name => makeFloatCoderInput(4, name),
    makeFloatCoderOutput(4),
    0,
    WebGLRenderingContext.FLOAT,
    e => e,
    e => e,
    false);

/** @type {!ShaderCoder} */
const SHADER_CODER_FLOATS = new ShaderCoder(
    BOOL_TYPE_CODER,
    FLOAT_TYPE_CODER,
    VEC2_TYPE_CODER,
    VEC4_TYPE_CODER);

export {SHADER_CODER_FLOATS}
