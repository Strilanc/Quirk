import {Suite, assertThat} from "test/TestUtil.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglTexture} from "src/webgl/WglTexture.js"
import {Seq} from "src/base/Seq.js"

let suite = new Suite("WglShader");

suite.webGlTest("renderTo_large", () => {
    let tex = new WglTexture(256, 256, WebGLRenderingContext.UNSIGNED_BYTE);
    new WglShader("void main(){gl_FragColor=vec4(3.0,3.0,3.0,3.0)/255.0;}").withArgs().renderTo(tex);
    let expected = new Uint8Array(Seq.repeat(3, 4 * tex.width * tex.height).toArray());
    assertThat(tex.readPixels()).isEqualTo(expected);
});

suite.webGlTest("renderTo_empty", () => {
    let tex = new WglTexture(0, 0);
    new WglShader("void main(){gl_FragColor=vec4(0.0,0.0,0.0,0.0);}").withArgs().renderTo(tex);
    assertThat(tex.readPixels()).isEqualTo(new Float32Array([]));
});

suite.webGlTest("readPixels_bytes_all", () => {
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
