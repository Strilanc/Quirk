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
import {initializedWglContext} from "./WglContext.js"
import {WglShader} from "./WglShader.js"
import {WglConfiguredShader} from "./WglConfiguredShader.js"
import {
    currentShaderCoder,
    Inputs,
    Outputs,
    makePseudoShaderWithInputsAndOutputAndCode
} from "./ShaderCoders.js"

/**
 * Utilities for creating/configuring shaders that render various simple things.
 */
class Shaders {}

/**
 * Returns a configured shader that renders a uniform color over the entire destination texture.
 * @param {!number} r
 * @param {!number} g
 * @param {!number} b
 * @param {!number} a
 * @returns {!WglConfiguredShader}
 */
Shaders.color = (r, g, b, a) => COLOR_SHADER.withArgs(WglArg.vec4("color", r, g, b, a));
const COLOR_SHADER = new WglShader(`
    uniform vec4 color;
    void main() {
        gl_FragColor = color;
    }`);

/**
 * Returns a configured shader that just draws the input texture's contents.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.passthrough = inp => new WglConfiguredShader(dst => {
    if (dst.width !== inp.width || dst.height !== inp.height || dst.pixelType !== inp.pixelType) {
        throw new DetailedError("Expected same-shaped textures.", {inp, dst});
    }
    PASSTHROUGH_SHADER.withArgs(
        WglArg.vec2("textureSize", inp.width, inp.height),
        WglArg.texture("dataTexture", inp)).renderTo(dst);
});
const PASSTHROUGH_SHADER = new WglShader(`
    uniform vec2 textureSize;
    uniform sampler2D dataTexture;
    void main() {
        gl_FragColor = texture2D(dataTexture, gl_FragCoord.xy / textureSize.xy);
    }`);

/**
 * Returns a configured shader that overlays the destination texture with the given data.
 * @param {!Float32Array|!Uint8Array} rgbaData
 * @returns {!WglConfiguredShader}
 */
Shaders.data = rgbaData => new WglConfiguredShader(destinationTexture => {
    let [w, h] = [destinationTexture.width, destinationTexture.height];
    if (rgbaData.length !== w * h * 4) {
        throw new DetailedError("rgbaData.length isn't w * h * 4", {w, h, len: rgbaData.length, rgbaData});
    }

    let GL = WebGLRenderingContext;
    let gl = initializedWglContext().gl;
    let dataTexture = gl.createTexture();
    try {
        gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, dataTexture);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        gl.texImage2D(
            GL.TEXTURE_2D,
            0,
            GL.RGBA,
            w,
            h,
            0,
            GL.RGBA,
            rgbaData instanceof Uint8Array ? GL.UNSIGNED_BYTE : GL.FLOAT,
            rgbaData);
        PASSTHROUGH_SHADER.withArgs(
            WglArg.vec2("textureSize", w, h),
            WglArg.webGlTexture("dataTexture", dataTexture)
        ).renderTo(destinationTexture);
    } finally {
        gl.deleteTexture(dataTexture);
    }
});

/**
 * Returns a configured shader that overlays the destination texture with the given float data.
 * @param {!Float32Array} floats
 * @returns {!WglConfiguredShader}
 */
Shaders.floatData = floats => Shaders.data(currentShaderCoder().float.dataToPixels(floats));

/**
 * Returns a configured shader that overlays the destination texture with the given vec2 data.
 * @param {!Float32Array} floats
 * @returns {!WglConfiguredShader}
 */
Shaders.vec2Data = floats => Shaders.data(currentShaderCoder().vec2.dataToPixels(floats));

/**
 * Returns a configured shader that overlays the destination texture with the given vec4 data.
 * @param {!Float32Array} floats
 * @returns {!WglConfiguredShader}
 */
Shaders.vec4Data = floats => Shaders.data(currentShaderCoder().vec4.dataToPixels(floats));

/**
 * @param {!WglTexture}
 * @returns {!WglConfiguredShader}
 */
Shaders.packFloatIntoVec4 = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.float('input')],
    Outputs.vec4(),
    `vec4 outputFor(float k) {
        return vec4(
            read_input(k*4.0),
            read_input(k*4.0 + 1.0),
            read_input(k*4.0 + 2.0),
            read_input(k*4.0 + 3.0));
    }`);

/**
 * @param {!WglTexture}
 * @returns {!WglConfiguredShader}
 */
Shaders.packVec2IntoVec4 = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec4(),
    'vec4 outputFor(float k) { return vec4(read_input(k*2.0), read_input(k*2.0 + 1.0)); }');

/**
 * Adds the second half of its input into the first half.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldFloat = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.float('input')],
    Outputs.float(),
    `float outputFor(float k) {
         return read_input(k) + read_input(k + len_output());
     }`);

/**
 * Adds the odd half of its input to the even half of its input.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldFloatAdjacents = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.float('input')],
    Outputs.float(),
    `float outputFor(float k) {
         return read_input(k*2.0) + read_input(k*2.0 + 1.0);
     }`);

/**
 * Adds the second half of its input into the first half.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldVec2 = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec2(),
    `vec2 outputFor(float k) {
         return read_input(k) + read_input(k + len_output());
     }`);

/**
 * Adds the odd half of its input to the even half of its input.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldVec2Adjacents = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec2('input')],
    Outputs.vec2(),
    `vec2 outputFor(float k) {
         return read_input(k*2.0) + read_input(k*2.0 + 1.0);
     }`);

/**
 * Adds the second half of its input into the first half.
 * @param {!WglTexture} inp
 * @returns {!WglConfiguredShader}
 */
Shaders.sumFoldVec4 = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4(),
    `vec4 outputFor(float k) {
        return read_input(k) + read_input(k + len_output());
    }`);

/**
 * Packs all the values in a float-pixel type texture into a larger byte-pixel type texture, using an encoding similar
 * to IEEE 754.
 * @param {!WglTexture} inputTexture
 * @returns {!WglConfiguredShader}
 */
Shaders.convertVec4CodingForOutput = makePseudoShaderWithInputsAndOutputAndCode(
    [Inputs.vec4('input')],
    Outputs.vec4WithOutputCoder(),
    'vec4 outputFor(float k) { return read_input(k); }');

export {Shaders}
