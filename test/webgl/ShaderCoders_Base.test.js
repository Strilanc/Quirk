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

import {BOOL_TYPE_CODER} from "../../src/webgl/ShaderCoders_Base.js"
import {combinedShaderPartsWithCode, shaderWithOutputPartAndArgs} from "../../src/webgl/ShaderCoders.js"
import {Shaders} from "../../src/webgl/Shaders.js"

let suite = new Suite("ShaderCoders_Base");

suite.testUsingWebGLFloatTextures("boolInputs", () => {
    let inp = BOOL_TYPE_CODER.inputPartGetter('a');
    let shader = combinedShaderPartsWithCode([inp], `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            gl_FragColor = vec4(read_a(k), k, 0.0, 0.0);
        }`);

    let tex = Shaders.data(new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0])).toRawByteTexture(2);
    assertThat(shader.withArgs(...inp.argsFor(tex)).readRawFloatOutputs(2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 2, 0, 0,
        1, 3, 0, 0
    ]));
    tex.deallocByDepositingInPool();
});

suite.testUsingWebGL("boolOutputs", () => {
    let output = BOOL_TYPE_CODER.outputPart;
    let shader = combinedShaderPartsWithCode([output], `
        bool outputFor(float k) {
            return floor(mod(k + 0.5, 3.0)) == 1.0;
        }`);

    assertThat(shaderWithOutputPartAndArgs(shader, output, []).readBoolOutputs(3)).isEqualTo(new Uint8Array([
        0, 1, 0, 0, 1, 0, 0, 1
    ]));
});
