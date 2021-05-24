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
import {WglShader} from "../../src/webgl/WglShader.js"
import {WglTexture} from "../../src/webgl/WglTexture.js"
import {Seq} from "../../src/base/Seq.js"
import {initializedWglContext} from "../../src/webgl/WglContext.js"

let suite = new Suite("WglShader");

suite.testUsingWebGL("renderTo_large", () => {
    let tex = new WglTexture(256, 256, WebGLRenderingContext.UNSIGNED_BYTE);
    new WglShader("void main(){gl_FragColor=vec4(3.0,3.0,3.0,3.0)/255.0;}").withArgs().renderTo(tex);
    let expected = new Uint8Array(Seq.repeat(3, 4 * tex.width * tex.height).toArray());
    assertThat(tex.readPixels()).isEqualTo(expected);
});

suite.testUsingWebGLFloatTextures("renderTo_empty", () => {
    let tex = new WglTexture(0, 0);
    new WglShader("void main(){gl_FragColor=vec4(0.0,0.0,0.0,0.0);}").withArgs().renderTo(tex);
    assertThat(tex.readPixels()).isEqualTo(new Float32Array([]));
});

suite.testUsingWebGL("readPixels_bytes_all", () => {
    let shader = new WglShader(`
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float s = (xy.y*8.0 + xy.x)*4.0;
            gl_FragColor = vec4(
                (s+0.0)/255.0,
                (s+1.0)/255.0,
                (s+2.0)/255.0,
                (s+3.0)/255.0);
        }`).withArgs();

    let tex = new WglTexture(8, 8, WebGLRenderingContext.UNSIGNED_BYTE);
    shader.renderTo(tex);
    assertThat(tex.readPixels()).isEqualTo(new Uint8Array(
        Seq.range(256).toArray()
    ));
    tex.ensureDeinitialized();
});

suite.testUsingWebGLFloatTextures("changeSourceAfterInvalidate", () => {
    let tex = new WglTexture(1, 1);
    let flag = true;
    let shader = new WglShader(() => flag ?
        "void main(){gl_FragColor=vec4(-5.0,-6.0,7.0,8.0);}" :
        "void main(){gl_FragColor=vec4(1.0,2.0,3.0,4.0);}");

    shader.withArgs().renderTo(tex);
    assertThat(tex.readPixels()).isEqualTo(new Float32Array([-5, -6, 7, 8]));

    flag = false;
    initializedWglContext().invalidateExistingResources();

    shader.withArgs().renderTo(tex);
    assertThat(tex.readPixels()).isEqualTo(new Float32Array([1, 2, 3, 4]));
});
