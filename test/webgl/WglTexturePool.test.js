import {Suite, assertThat} from "test/TestUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {seq, Seq} from "src/base/Seq.js"
import {
    currentShaderCoder,
    makePseudoShaderWithInputsAndOutputAndCode
} from "src/webgl/ShaderCoders.js"
import {WglTexturePool} from "src/webgl/WglTexturePool.js"

let suite = new Suite("WglTexturePool");

suite.webGlTest("takeBoolTex", () => {
    let t = WglTexturePool.takeBoolTex(2);
    makePseudoShaderWithInputsAndOutputAndCode(
        [],
        currentShaderCoder().boolOutput,
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

suite.webGlTest("takeVec2Tex", () => {
    let t = WglTexturePool.takeVec2Tex(2);
    makePseudoShaderWithInputsAndOutputAndCode(
        [],
        currentShaderCoder().vec2Output,
        `vec2 outputFor(float k) {
            return vec2(k / 4.0, k * k);
        }`)().renderTo(t);
    assertThat(currentShaderCoder().unpackVec2Data(t.readPixels())).isEqualTo(new Float32Array([
        0, 0,
        0.25, 1,
        0.5, 4,
        0.75, 9
    ]));
    t.deallocByDepositingInPool();
});

suite.webGlTest("takeVec4Tex", () => {
    let t = WglTexturePool.takeVec4Tex(2);
    makePseudoShaderWithInputsAndOutputAndCode(
        [],
        currentShaderCoder().vec4Output,
        `vec4 outputFor(float k) {
            return vec4(k, k / 4.0, k * k, 5.0);
        }`)().renderTo(t);
    assertThat(currentShaderCoder().unpackVec4Data(t.readPixels())).isEqualTo(new Float32Array([
        0, 0, 0, 5,
        1, 0.25, 1, 5,
        2, 0.5, 4, 5,
        3, 0.75, 9, 5
    ]));
    t.deallocByDepositingInPool();
});
