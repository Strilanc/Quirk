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

import {Suite, assertThat} from "../TestUtil.js"
import {combinedShaderPartsWithCode, shaderWithOutputPartAndArgs} from "../../src/webgl/ShaderCoders.js"
import {currentShaderCoder} from "../../src/webgl/ShaderCoders.js"
import {Shaders} from "../../src/webgl/Shaders.js"

let suite = new Suite("ShaderCoders");

/**
 * @param {!int} length
 * @returns {!Float32Array}
 */
function randomFloat32Array(length) {
    let floats = new Float32Array(length);
    for (let i = 0; i < floats.length; i++) {
        floats[i] = (Math.random() - 0.5)*Math.pow(2, 16) +
            (Math.random() - 0.5) +
            (Math.random() - 0.5) / Math.pow(2, 16);
    }
    return floats;
}

suite.testUsingWebGLFloatTextures("packUnpack", () => {
    let data = randomFloat32Array(64);
    for (let coder of [currentShaderCoder().float, currentShaderCoder().vec2, currentShaderCoder().vec4]) {
        let packed = coder.dataToPixels(data);
        let unpacked = coder.pixelsToData(packed);
        assertThat(unpacked).isEqualTo(data);
    }
});

suite.testUsingWebGLFloatTextures("floatInput", () => {
    let param = currentShaderCoder().float.inputPartGetter('fancy');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = vec4(
                read_fancy(k * 4.0),
                read_fancy(k * 4.0 + 1.0),
                read_fancy(k * 4.0 + 2.0),
                read_fancy(k * 4.0 + 3.0));
        }`);

    let floats = randomFloat32Array(64);
    let spread = currentShaderCoder().float.dataToPixels(floats);

    let texSquare = Shaders.data(spread).toVecFloatTexture(6);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();
});
suite.testUsingWebGLFloatTextures("vec2Input", () => {
    let param = currentShaderCoder().vec2.inputPartGetter('fancy');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            vec2 a1 = read_fancy(k * 2.0);
            vec2 a2 = read_fancy(k * 2.0 + 1.0);
            gl_FragColor = vec4(a1, a2);
        }`);

    let floats = randomFloat32Array(64);
    let spread = currentShaderCoder().vec2.dataToPixels(floats);

    let texSquare = Shaders.data(spread).toVec2Texture(5);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();
});

suite.testUsingWebGLFloatTextures("vec4Input", () => {
    let param = currentShaderCoder().vec4.inputPartGetter('test_input');
    let shader = combinedShaderPartsWithCode([param], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = read_test_input(k);
        }`);

    let floats = randomFloat32Array(64);
    let spread = currentShaderCoder().vec4.dataToPixels(floats);

    let texSquare = Shaders.data(spread).toVec4Texture(4);
    assertThat(shader.withArgs(...param.argsFor(texSquare)).readRawFloatOutputs(4)).isEqualTo(floats);
    texSquare.deallocByDepositingInPool();
});

suite.testUsingWebGL("floatOutput", () => {
    let output = currentShaderCoder().float.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        float outputFor(float k) {
            return k + 0.75;
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readVecFloatOutputs(2)).isEqualTo(new Float32Array([
        0.75, 1.75, 2.75, 3.75
    ]));
});

suite.testUsingWebGL("vec2Output", () => {
    let output = currentShaderCoder().vec2.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        vec2 outputFor(float k) {
            return vec2(k, k + 0.5);
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readVec2Outputs(1)).isEqualTo(new Float32Array([
        0, 0.5,
        1, 1.5
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readVec2Outputs(2)).isEqualTo(new Float32Array([
        0, 0.5,
        1, 1.5,
        2, 2.5,
        3, 3.5
    ]));
});

suite.testUsingWebGL("vec4Output", () => {
    let output = currentShaderCoder().vec4.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        vec4 outputFor(float k) {
            return vec4(k, k + 0.25, k + 0.5, k + 0.75);
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readVec4Outputs(1)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75
    ]));

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readVec4Outputs(2)).isEqualTo(new Float32Array([
        0, 0.25, 0.5, 0.75,
        1, 1.25, 1.5, 1.75,
        2, 2.25, 2.5, 2.75,
        3, 3.25, 3.5, 3.75
    ]));
});
