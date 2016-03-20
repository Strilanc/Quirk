import { Suite, assertThat } from "test/TestUtil.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("Wgl");

suite.webGlTest("readPixelColorBytes", ctx => {
    let w = 2;
    let h = 2;
    let shader = new WglShader(`
        uniform float v;
        void main() {
            gl_FragColor = vec4(gl_FragCoord.xy / vec2(255.0, 255.0), v, 0.5);
        }`);

    let texture = new WglTexture(w, h, WebGLRenderingContext.UNSIGNED_BYTE);

    ctx.render(texture, shader, [WglArg.float("v", 10/255)]);
    assertThat(ctx.readPixelColorBytes(texture)).isEqualTo(new Uint8Array([
        0, 0, 10, 128,
        1, 0, 10, 128,
        0, 1, 10, 128,
        1, 1, 10, 128
    ]));
});

suite.webGlTest("readPixelColorFloats", ctx => {
    let w = 2;
    let h = 2;
    let shader = new WglShader(`
        uniform float v;
        void main() {
            gl_FragColor = vec4(gl_FragCoord.xy, v, 254.5);
        }`);

    let texture = new WglTexture(w, h);

    ctx.render(texture, shader, [WglArg.float("v", 192.25)]);
    assertThat(ctx.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        0.5, 0.5, 192.25, 254.5,
        1.5, 0.5, 192.25, 254.5,
        0.5, 1.5, 192.25, 254.5,
        1.5, 1.5, 192.25, 254.5
    ]));
});
