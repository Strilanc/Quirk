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

import {Suite, assertThat, assertThrows} from "../TestUtil.js"
import {Shaders} from "../../src/webgl/Shaders.js"
import {
    Outputs,
    makePseudoShaderWithInputsAndOutputAndCode
} from "../../src/webgl/ShaderCoders.js"
import {WglShader} from "../../src/webgl/WglShader.js"
import {WglTexture} from "../../src/webgl/WglTexture.js"

import {Seq} from "../../src/base/Seq.js"

let suite = new Suite("Shaders");

suite.testUsingWebGLFloatTextures("color", () => {
    assertThat(Shaders.color(2, 3, -5, 7.5).readRawFloatOutputs(2)).isEqualTo(new Float32Array([
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5
    ]));
    assertThat(Shaders.color(1.5, 2, 0, 121).readRawFloatOutputs(3)).isEqualTo(new Float32Array([
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121
    ]));
});

suite.testUsingWebGLFloatTextures("passthrough", () => {
    let coords = new WglShader(`
        void main() {
            gl_FragColor = vec4(gl_FragCoord.x-0.5, gl_FragCoord.y-0.5, 0.0, 0.0);
        }`).withArgs();
    let input = new WglTexture(2, 4, WebGLRenderingContext.FLOAT);
    coords.renderTo(input);

    let result = new WglTexture(2, 4, WebGLRenderingContext.FLOAT);
    Shaders.passthrough(input).renderTo(result);
    assertThat(result.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 1, 0, 0,
        1, 1, 0, 0,
        0, 2, 0, 0,
        1, 2, 0, 0,
        0, 3, 0, 0,
        1, 3, 0, 0
    ]));

    input.ensureDeinitialized();
    result.ensureDeinitialized();
});

suite.testUsingWebGLFloatTextures("data-floats", () => {
    let data2x2 = new Float32Array([
        0, 0.003, 42, -5,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    assertThat(Shaders.data(data2x2).readRawFloatOutputs(2)).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    assertThat(Shaders.data(data2x4).readRawFloatOutputs(3)).isEqualTo(data2x4);

    assertThrows(() => Shaders.data(data2x4).readRawFloatOutputs(2));
});

suite.testUsingWebGL("data-bytes", () => {
    let bytes4x4 = new Uint8Array(Seq.range(4*4*4).map(e => Math.floor(Math.random() * 256)).toArray());
    assertThat(Shaders.data(bytes4x4).readRawByteOutputs(4)).isEqualTo(bytes4x4);
});

suite.testUsingWebGL("sumFold", () => {
    let raws = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.float(), `
        float outputFor(float k) {
            return k*k;
        }
    `)().toVecFloatTexture(3);
    assertThat(Shaders.sumFoldFloat(raws).readVecFloatOutputs(2)).isEqualTo(new Float32Array([
        16,
        1+25,
        4+36,
        9+49
    ]));
    assertThat(Shaders.sumFoldFloatAdjacents(raws).readVecFloatOutputs(2)).isEqualTo(new Float32Array([
        1,
        4+9,
        16+25,
        36+49
    ]));
    raws.deallocByDepositingInPool();

    let coords = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.vec2(), `
        vec2 outputFor(float k) {
            return vec2(mod(k, 2.0), floor(k/2.0));
        }
    `)().toVec2Texture(3);
    assertThat(Shaders.sumFoldVec2(coords).readVec2Outputs(2)).isEqualTo(new Float32Array([
        0,2,
        2,2,
        0,4,
        2,4
    ]));
    assertThat(Shaders.sumFoldVec2Adjacents(coords).readVec2Outputs(2)).isEqualTo(new Float32Array([
        1,0,
        1,2,
        1,4,
        1,6,
    ]));
    coords.deallocByDepositingInPool();

    let solid = makePseudoShaderWithInputsAndOutputAndCode([], Outputs.vec4(), `
        vec4 outputFor(float k) {
            return vec4(2.0, 3.0, 5.0, 7.0);
        }
    `)().toVec4Texture(2);
    assertThat(Shaders.sumFoldVec4(solid).readVec4Outputs(1)).isEqualTo(new Float32Array([
        4,6,10,14,
        4,6,10,14
    ]));
    solid.deallocByDepositingInPool();
});
