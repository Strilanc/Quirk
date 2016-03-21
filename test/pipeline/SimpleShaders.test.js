import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import SimpleShaders from "src/pipeline/SimpleShaders.js"

import Complex from "src/math/Complex.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import Matrix from "src/math/Matrix.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("QuantumShaders");

suite.webGlTest("color", () => {
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    SimpleShaders.color(2, 3, -5, 7.5).renderTo(texture2x2);
    SimpleShaders.color(1.5, 2, 0, 121).renderTo(texture2x4);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5
    ]));
    assertThat(texture2x4.readPixels()).isEqualTo(new Float32Array([
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121,
        1.5, 2, 0, 121
    ]));
});

suite.webGlTest("passthrough", () => {
    let input = new WglTexture(2, 2);
    let output = new WglTexture(2, 2);
    new WglShader('void main(){gl_FragColor=vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 0.0);}').
        withArgs().
        renderTo(input);

    SimpleShaders.passthrough(input).renderTo(output);
    assertThat(output.readPixels()).isEqualTo(new Float32Array([
        0.5, 0.5, 0, 0,
        1.5, 0.5, 0, 0,
        0.5, 1.5, 0, 0,
        1.5, 1.5, 0, 0
    ]));
});

suite.webGlTest("data", () => {
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    let data2x2 = new Float32Array([
        0, NaN, Infinity, -Infinity,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    SimpleShaders.data(data2x2).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    SimpleShaders.data(data2x4).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(data2x4);

    SimpleShaders.data(data2x4).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(data2x4);

    assertThrows(() => SimpleShaders.data(data2x4).renderTo(texture2x2));
});

suite.webGlTest("overlay", () => {
    let fore = new WglTexture(2, 2);
    let back = new WglTexture(4, 4);
    SimpleShaders.data(new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray())).renderTo(fore);
    SimpleShaders.data(new Float32Array(Seq.range(4*4*4).map(e => -e).toArray())).renderTo(back);

    let out = new WglTexture(4, 4);
    SimpleShaders.overlay(0, 0, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        900, 901, 902, 903, 904, 905, 906, 907,  -8,  -9, -10, -11, -12, -13, -14, -15,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    SimpleShaders.overlay(1, 0, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3, 900, 901, 902, 903, 904, 905, 906, 907, -12, -13, -14, -15,
        -16, -17, -18, -19, 908, 909, 910, 911, 912, 913, 914, 915, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    SimpleShaders.overlay(0, 1, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907, -24, -25, -26, -27, -28, -29, -30, -31,
        908, 909, 910, 911, 912, 913, 914, 915, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    SimpleShaders.overlay(2, 1, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, 900, 901, 902, 903, 904, 905, 906, 907,
        -32, -33, -34, -35, -36, -37, -38, -39, 908, 909, 910, 911, 912, 913, 914, 915,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    SimpleShaders.overlay(2, 2, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, 900, 901, 902, 903, 904, 905, 906, 907,
        -48, -49, -50, -51, -52, -53, -54, -55, 908, 909, 910, 911, 912, 913, 914, 915
    ]));
});

suite.webGlTest("scale", () => {
    let amps = new WglTexture(4, 2);
    SimpleShaders.data(new Float32Array([
        2, 3, 0, 0,
        0.5, 0.5, 0, 0,
        1, 2, 3, 4,
        0.25, 0.5, 0, 0,
        Math.sqrt(1/2), 0, 0, 0,
        0, Math.sqrt(1/3), 0, 0,
        3/5, 4/5, 0, 0,
        1, 0, 0, 0
    ])).renderTo(amps);

    let out = new WglTexture(4, 2);
    SimpleShaders.scale(amps, 3).renderTo(out);
    assertThat(out.readPixels()).isApproximatelyEqualTo(new Float32Array([
        6, 9, 0, 0,
        1.5, 1.5, 0, 0,
        3, 6, 9, 12,
        0.75, 1.5, 0, 0,
        Math.sqrt(9/2), 0, 0, 0,
        0, Math.sqrt(3), 0, 0,
        9/5, 12/5, 0, 0,
        3, 0, 0, 0
    ]));
});

suite.webGlTest("encodeFloatsIntoBytes_vs_decodeByteBufferToFloatBuffer", () => {
    let texture2x2 = new WglTexture(2, 2);
    let texture4x4Bytes = new WglTexture(4, 4, WebGLRenderingContext.UNSIGNED_BYTE);

    let data2x2 = new Float32Array([
        0, NaN, Infinity, -Infinity,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    SimpleShaders.data(data2x2).renderTo(texture2x2);
    SimpleShaders.encodeFloatsIntoBytes(texture2x2).renderTo(texture4x4Bytes);
    let pixels = texture4x4Bytes.readPixels();
    let pixels2 = SimpleShaders.decodeByteBufferToFloatBuffer(pixels, 2, 2);
    assertThat(pixels2).isEqualTo(data2x2);
});
