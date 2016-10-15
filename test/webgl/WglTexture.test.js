import {Suite, assertThat} from "test/TestUtil.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {seq, Seq} from "src/base/Seq.js"

let suite = new Suite("WglTexture");

suite.test("properties", () => {
    let t = new WglTexture(8, 16, WebGLRenderingContext.UNSIGNED_BYTE);
    assertThat(t.width).isEqualTo(8);
    assertThat(t.height).isEqualTo(16);
    assertThat(t.pixelType).isEqualTo(WebGLRenderingContext.UNSIGNED_BYTE);
    assertThat(t.order()).isEqualTo(7);
    assertThat(t.toString()).isNotEqualTo(undefined);
});

suite.webGlTest("readPixels_bytes", () => {
    let w = 2;
    let h = 2;
    let shader = new WglShader(`
        uniform float v;
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            gl_FragColor = vec4(xy / 255.0, v, 128.0/255.0);
        }`);

    let texture = new WglTexture(w, h, WebGLRenderingContext.UNSIGNED_BYTE);

    shader.withArgs(WglArg.float("v", 10/255)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Uint8Array([
        0, 0, 10, 128,
        1, 0, 10, 128,
        0, 1, 10, 128,
        1, 1, 10, 128
    ]));
});

suite.webGlTest("readPixels_bytes_all", () => {
    let w = 1<<3;
    let h = 1<<3;
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

    assertThat(shader.readSizedByteOutputs(w, h)).isEqualTo(new Uint8Array(
        Seq.range(256).toArray()
    ));
});

suite.webGlTest("readPixels_floats", () => {
    let w = 2;
    let h = 2;
    let shader = new WglShader(`
        uniform float v;
        void main() {
            gl_FragColor = vec4(gl_FragCoord.xy, v, 254.5);
        }`);

    let texture = new WglTexture(w, h);

    shader.withArgs(WglArg.float("v", 192.25)).renderTo(texture);
    assertThat(texture.readPixels()).isEqualTo(new Float32Array([
        0.5, 0.5, 192.25, 254.5,
        1.5, 0.5, 192.25, 254.5,
        0.5, 1.5, 192.25, 254.5,
        1.5, 1.5, 192.25, 254.5
    ]));
});

suite.webGlTest("readPixels_empty", () => {
    assertThat(new WglTexture(0, 0).readPixels()).isEqualTo(new Float32Array([]));
});
