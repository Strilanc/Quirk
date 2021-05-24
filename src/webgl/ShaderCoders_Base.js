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

import {WglArg} from "./WglArg.js"

/**
 * A piece of a shader.
 *
 * Because some GPUs don't support float textures very well, inputs and outputs may need to be processed into
 * appropriate forms before computing/storing. Instead of having every shader do it, the conversion functionality is
 * abstracted into decorator instances.
 */
class ShaderPart {
    /**
     * @param {!string} code
     * @param {!Array.<!string>} libs
     * @param {!function(!WglTexture) : !Array.!<WglArg>} argsFor
     */
    constructor(code, libs, argsFor) {
        /** @type {!string} */
        this.code = code;
        /** @type {!Array.<!string>} */
        this.libs = libs;
        /** @type {!function(!WglTexture) : !Array.!<WglArg>} */
        this.argsFor = argsFor;
    }
}

/**
 * A strategy for converting and shading with a specific type of value array.
 */
class SingleTypeCoder {
    /**
     * @param {!function(name: !string) : !ShaderPart} inputPartGetter Determines how values are decoded from the
     *     various given input textures while rendering.
     * @param {!ShaderPart} outputPart Determines how computed values are encoded into the next texture while rendering.
     * @param {!int} powerSizeOverhead This value is the k in the 2^k * N texture area (pixels) it takes to encode N
     *     values.
     * @param {!int} pixelType Determines whether encoding goes into float or byte textures.
     * @param {!function(*) : !Float32Array|!Uint8Array} dataToPixels Converts from tightly packed data into the data
     *     that would be returned by readPixels (or that should be written into a texture encoding the data).
     * @param {!function(!Float32Array|!Uint8Array) : *} pixelsToData Converts from raw pixel data returned by
     *     readPixels into tightly packed data.
     * @param {!boolean} needRearrangingToBeInVec4Format Determines if the encoded values will be spread out instead of
     *     packed together tightly when readPixels is called. Code trying to minimize the time spent blocked on
     *     readPixels uses this as a hint to rearrange the data before reading it.
     */
    constructor(inputPartGetter,
                outputPart,
                powerSizeOverhead,
                pixelType,
                dataToPixels,
                pixelsToData,
                needRearrangingToBeInVec4Format) {
        /** @type {!function(name: !string) : !ShaderPart} */
        this.inputPartGetter = inputPartGetter;
        /** @type {!ShaderPart} */
        this.outputPart = outputPart;
        /** @type {!int} */
        this.powerSizeOverhead = powerSizeOverhead;
        /** @type {!int} */
        this.pixelType = pixelType;
        /** @type {!function(*) : !Float32Array|!Uint8Array} */
        this.dataToPixels = dataToPixels;
        /** @type {!function(!Float32Array|!Uint8Array) : *} */
        this.pixelsToData = pixelsToData;
        /** @type {!boolean} */
        this.needRearrangingToBeInVec4Format = needRearrangingToBeInVec4Format;
    }

    /**
     * @param {!WglTexture} tex
     * @returns {!int}
     */
    arrayPowerSizeOfTexture(tex) {
        return Math.max(0, tex.sizePower() - this.powerSizeOverhead);
    }
}

/**
 * A strategy for converting between values used inside the shader and the textures those values must live in between
 * shaders.
 */
class ShaderCoder {
    /**
     * @param {!SingleTypeCoder} bool
     * @param {!SingleTypeCoder} float
     * @param {!SingleTypeCoder} vec2
     * @param {!SingleTypeCoder} vec4
     */
    constructor(bool, float, vec2, vec4) {
        /** @type {!SingleTypeCoder} */
        this.bool = bool;
        /** @type {!SingleTypeCoder} */
        this.float = float;
        /** @type {!SingleTypeCoder} */
        this.vec2 = vec2;
        /** @type {!SingleTypeCoder} */
        this.vec4 = vec4;
    }
}

/**
 * @param {!string} name
 * @returns {!ShaderPart}
 */
function boolInputPartGetter(name) {
    let pre = `_gen_${name}`;
    return new ShaderPart(`
        ///////////// boolInput(${name}) ////////////
        uniform sampler2D ${pre}_tex;
        uniform vec2 ${pre}_size;

        float read_${name}(float k) {
            vec2 uv = vec2(mod(k, ${pre}_size.x) + 0.5,
                           floor(k / ${pre}_size.x) + 0.5) / ${pre}_size;
            return float(texture2D(${pre}_tex, uv).x == 1.0);
        }

        float len_${name}() {
            return ${pre}_size.x * ${pre}_size.y * 4.0;
        }`,
        [],
        texture => [
            WglArg.texture(`${pre}_tex`, texture),
            WglArg.vec2(`${pre}_size`, texture.width, texture.height)
        ]);
}

const BOOL_OUTPUT_PART = new ShaderPart(`
    ///////////// BOOL_OUTPUT_AS_FLOAT ////////////
    bool outputFor(float k);

    uniform vec2 _gen_output_size;
    uniform float _gen_secret_half;

    float len_output() {
        return _gen_output_size.x * _gen_output_size.y;
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(_gen_secret_half, _gen_secret_half);
        float k = xy.y * _gen_output_size.x + xy.x;
        gl_FragColor = vec4(float(outputFor(k)), 0.0, 0.0, 0.0);
    }`,
    [],
    texture => [
        WglArg.vec2('_gen_output_size', texture.width, texture.height),
        WglArg.float('_gen_secret_half', 0.5)
    ]);

const BOOL_TYPE_CODER = new SingleTypeCoder(
    boolInputPartGetter,
    BOOL_OUTPUT_PART,
    0,
    WebGLRenderingContext.UNSIGNED_BYTE,
    e => e,
    e => e,
    false);

export {SingleTypeCoder, ShaderCoder, ShaderPart, BOOL_TYPE_CODER}
