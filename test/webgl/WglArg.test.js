import { Suite, assertThat } from "test/TestUtil.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglDirector from "src/webgl/WglDirector.js"

let suite = new Suite("WglArg");

suite.webGlTest("bool", () => {
    let texture = new WglTexture(1, 1);
    let director = new WglDirector();
    let shader = new WglShader(`
        uniform bool arg;
        void main() {
            gl_FragColor = vec4(arg ? 1.0 : -1.0, 0.0, 0.0, 0.0);
        }`);

    director.render(texture, shader, [WglArg.bool("arg", true)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        1, 0, 0, 0
    ]));

    director.render(texture, shader, [WglArg.bool("arg", false)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        -1, 0, 0, 0
    ]));
});

suite.webGlTest("float", () => {
    let texture = new WglTexture(1, 1);
    let director = new WglDirector();
    let shader = new WglShader(`
        uniform float arg;
        void main() {
            gl_FragColor = vec4(arg, 0.0, 0.0, 0.0);
        }`);

    director.render(texture, shader, [WglArg.float("arg", Math.PI)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        Math.PI, 0, 0, 0
    ]));

    director.render(texture, shader, [WglArg.float("arg", Math.E)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        Math.E, 0, 0, 0
    ]));
});

suite.webGlTest("int", () => {
    let texture = new WglTexture(1, 1);
    let director = new WglDirector();
    let shader = new WglShader(`
        uniform int arg;
        void main() {
            gl_FragColor = vec4(float(arg), 0.0, 0.0, 0.0);
        }`);

    director.render(texture, shader, [WglArg.int("arg", 2)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        2, 0, 0, 0
    ]));

    director.render(texture, shader, [WglArg.int("arg", 3)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        3, 0, 0, 0
    ]));
});

suite.webGlTest("vec2", () => {
    let texture = new WglTexture(1, 1);
    let director = new WglDirector();
    let shader = new WglShader(`
        uniform vec2 arg;
        void main() {
            gl_FragColor = vec4(arg.x, arg.y, 0.0, 0.0);
        }`);

    director.render(texture, shader, [WglArg.vec2("arg", 2, 3)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        2, 3, 0, 0
    ]));

    director.render(texture, shader, [WglArg.vec2("arg", Math.E, Math.PI)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        Math.E, Math.PI, 0, 0
    ]));
});

suite.webGlTest("vec4", () => {
    let texture = new WglTexture(1, 1);
    let director = new WglDirector();
    let shader = new WglShader(`
        uniform vec4 arg;
        void main() {
            gl_FragColor = vec4(arg.r, arg.g, arg.b, arg.a);
        }`);

    director.render(texture, shader, [WglArg.vec4("arg", 2, 3, 5, 7)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        2, 3, 5, 7
    ]));

    director.render(texture, shader, [WglArg.vec4("arg", Math.E, Math.PI, Infinity, NaN)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        Math.E, Math.PI, Infinity, NaN
    ]));
});

suite.webGlTest("mat4", () => {
    let texture = new WglTexture(4, 1);
    let director = new WglDirector();
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
    director.render(texture, shader, [WglArg.mat4("arg", vals)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(vals);
});

suite.webGlTest("texture", () => {
    let director = new WglDirector();
    let srcTexture = new WglTexture(1, 1);
    director.render(srcTexture, new WglShader("void main(){gl_FragColor=vec4(1, 2, 3, 5);}"), []);
    let texture = new WglTexture(1, 1);
    let shader = new WglShader(`
        uniform sampler2D arg;
        void main() {
            gl_FragColor = texture2D(arg, vec2(0.5, 0.5));
        }`);

    director.render(texture, shader, [WglArg.texture("arg", srcTexture, 0)]);
    assertThat(director.readPixelColorFloats(texture)).isEqualTo(new Float32Array([
        1, 2, 3, 5
    ]));
});
