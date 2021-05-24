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
import {SHADER_CODER_FLOATS} from "../../src/webgl/ShaderCoders_intoFloats.js"
import {Shaders} from "../../src/webgl/Shaders.js"

let suite = new Suite("ShaderCoders");

suite.testUsingWebGLFloatTextures("packed", () => {
    assertThat(SHADER_CODER_FLOATS.float.dataToPixels(new Float32Array([1, 2, 3, 4]))).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        2, 0, 0, 0,
        3, 0, 0, 0,
        4, 0, 0, 0
    ]));

    assertThat(SHADER_CODER_FLOATS.vec2.dataToPixels(new Float32Array([1, 2, 3, 4]))).isEqualTo(new Float32Array([
        1, 2, 0, 0,
        3, 4, 0, 0
    ]));

    assertThat(SHADER_CODER_FLOATS.vec4.dataToPixels(new Float32Array([1, 2, 3, 4]))).isEqualTo(new Float32Array([
        1, 2, 3, 4
    ]));
});

suite.testUsingWebGLFloatTextures("input_wrongType", () => {
    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            SHADER_CODER_FLOATS.float.inputPartGetter('a').argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });

    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            SHADER_CODER_FLOATS.vec2.inputPartGetter('a').argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });

    assertThrows(() => {
        let tex = Shaders.data(new Uint8Array([0, 0, 0, 0])).toRawByteTexture(0);
        try {
            SHADER_CODER_FLOATS.vec4.inputPartGetter('a').argsFor(tex);
        } finally {
            tex.deallocByDepositingInPool();
        }
    });
});
