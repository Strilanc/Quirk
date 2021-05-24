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
import {WglArg} from "../../src/webgl/WglArg.js"
import {WglShader} from "../../src/webgl/WglShader.js"
import {WglTexture} from "../../src/webgl/WglTexture.js"

let suite = new Suite("WglArg");

suite.testUsingWebGLFloatTextures("bool", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform bool arg;
        void main() {
            gl_FragColor = vec4(arg ? 1.0 : -1.0, 0.0, 0.0, 0.0);
        }`);

    shader.withArgs(WglArg.bool("arg", true)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0
    ]));

    shader.withArgs(WglArg.bool("arg", false)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        -1, 0, 0, 0
    ]));
});

suite.testUsingWebGLFloatTextures("float", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform float arg;
        void main() {
            gl_FragColor = vec4(arg, 0.0, 0.0, 0.0);
        }`);

    shader.withArgs(WglArg.float("arg", Math.PI)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        Math.PI, 0, 0, 0
    ]));

    shader.withArgs(WglArg.float("arg", Math.E)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        Math.E, 0, 0, 0
    ]));
});

suite.testUsingWebGLFloatTextures("int", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform int arg;
        void main() {
            gl_FragColor = vec4(float(arg), 0.0, 0.0, 0.0);
        }`);

    shader.withArgs(WglArg.int("arg", 2)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        2, 0, 0, 0
    ]));

    shader.withArgs(WglArg.int("arg", 3)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        3, 0, 0, 0
    ]));
});

suite.testUsingWebGLFloatTextures("vec2", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform vec2 arg;
        void main() {
            gl_FragColor = vec4(arg.x, arg.y, 0.0, 0.0);
        }`);

    shader.withArgs(WglArg.vec2("arg", 2, 3)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        2, 3, 0, 0
    ]));

    shader.withArgs(WglArg.vec2("arg", Math.E, Math.PI)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        Math.E, Math.PI, 0, 0
    ]));
});

suite.testUsingWebGLFloatTextures("vec4", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform vec4 arg;
        void main() {
            gl_FragColor = vec4(arg.r, arg.g, arg.b, arg.a);
        }`);

    shader.withArgs(WglArg.vec4("arg", 2, 3, 5, 7)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        2, 3, 5, 7
    ]));

    shader.withArgs(WglArg.vec4("arg", Math.E, Math.PI, Infinity, NaN)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        Math.E, Math.PI, Infinity, NaN
    ]));
});

suite.testUsingWebGLFloatTextures("mat4", () => {
    let texture = new WglTexture(4, 1);
    let shader = new WglShader(`
        uniform mat4 arg;
        void main() {
            if (gl_FragCoord.x == 0.5) {
                gl_FragColor = arg[0];
            } else if (gl_FragCoord.x == 1.5) {
                gl_FragColor = arg[1];
            } else if (gl_FragCoord.x == 2.5) {
                gl_FragColor = arg[2];
            } else if (gl_FragCoord.x == 3.5) {
                gl_FragColor = arg[3];
            }
        }`);

    let vals = new Float32Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
    shader.withArgs(WglArg.mat4("arg", vals)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(vals);
});

suite.testUsingWebGLFloatTextures("texture", () => {
    let srcTexture = new WglTexture(1, 1);
    new WglShader("void main(){gl_FragColor=vec4(1, 2, 3, 5);}").withArgs().renderTo(srcTexture);
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform sampler2D arg;
        void main() {
            gl_FragColor = texture2D(arg, vec2(0.5, 0.5));
        }`);

    shader.withArgs(WglArg.texture("arg", srcTexture)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        1, 2, 3, 5
    ]));
});

suite.testUsingWebGLFloatTextures("float_array", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform float arg[2];
        void main() {
            gl_FragColor = vec4(arg[0], arg[1], 0.0, 0.0);
        }`);

    shader.withArgs(WglArg.float_array("arg", new Float32Array([2, 3]))).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        2, 3, 0, 0
    ]));
});

suite.testUsingWebGLFloatTextures("vec2_array", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform vec2 arg[2];
        void main() {
            gl_FragColor = vec4(arg[0], arg[1]);
        }`);

    shader.withArgs(WglArg.vec2_array("arg", new Float32Array([2, 3, 5, 7]))).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        2, 3, 5, 7
    ]));
});

suite.testUsingWebGLFloatTextures("vec4_array", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform vec4 arg[1];
        void main() {
            gl_FragColor = arg[0];
        }`);

    shader.withArgs(WglArg.vec4_array("arg", new Float32Array([2, 3, 5, 7]))).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        2, 3, 5, 7
    ]));
});

suite.testUsingWebGLFloatTextures("mat4_array", () => {
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform mat4 arg[2];
        void main() {
            gl_FragColor = arg[0][1];
        }`);

    shader.withArgs(WglArg.mat4_array("arg", new Float32Array([2, 3, 5, 7,
                                                               11, 13, 17, 19,
                                                               23, 29, 31, 37,
                                                               41, 43, 47, 53,
                                                               9, 9, 9, 9,
                                                               9, 9, 9, 9,
                                                               9, 9, 9, 9,
                                                               9, 9, 9, 9]))).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        11, 13, 17, 19
    ]));
});
