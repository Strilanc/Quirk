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
import {
    currentShaderCoder,
    Outputs,
    makePseudoShaderWithInputsAndOutputAndCode
} from "../../src/webgl/ShaderCoders.js"
import {WglTexturePool} from "../../src/webgl/WglTexturePool.js"

let suite = new Suite("WglTexturePool");

suite.testUsingWebGL("takeBoolTex", () => {
    let t = WglTexturePool.takeBoolTex(2);
    makePseudoShaderWithInputsAndOutputAndCode(
        [],
        Outputs.bool(),
        `bool outputFor(float k) {
            return k == 2.0;
        }`)().renderTo(t);
    assertThat(t.readPixels()).isEqualTo(new Uint8Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        255, 0, 0, 0,
        0, 0, 0, 0
    ]));
    t.deallocByDepositingInPool();
});

suite.testUsingWebGLFloatTextures("takeVec2Tex", () => {
    let t = WglTexturePool.takeVec2Tex(2);
    makePseudoShaderWithInputsAndOutputAndCode(
        [],
        Outputs.vec2(),
        `vec2 outputFor(float k) {
            return vec2(k / 4.0, k * k);
        }`)().renderTo(t);
    assertThat(currentShaderCoder().vec2.pixelsToData(t.readPixels())).isEqualTo(new Float32Array([
        0, 0,
        0.25, 1,
        0.5, 4,
        0.75, 9
    ]));
    t.deallocByDepositingInPool();
});

suite.testUsingWebGLFloatTextures("takeVec4Tex", () => {
    let t = WglTexturePool.takeVec4Tex(2);
    makePseudoShaderWithInputsAndOutputAndCode(
        [],
        Outputs.vec4(),
        `vec4 outputFor(float k) {
            return vec4(k, k / 4.0, k * k, 5.0);
        }`)().renderTo(t);
    assertThat(currentShaderCoder().vec4.pixelsToData(t.readPixels())).isEqualTo(new Float32Array([
        0, 0, 0, 5,
        1, 0.25, 1, 5,
        2, 0.5, 4, 5,
        3, 0.75, 9, 5
    ]));
    t.deallocByDepositingInPool();
});
