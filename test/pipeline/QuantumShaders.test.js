import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import QuantumShaders from "src/pipeline/QuantumShaders.js"

import Complex from "src/math/Complex.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import Matrix from "src/math/Matrix.js"
import WglTexture from "src/webgl/WglTexture.js"

let suite = new Suite("QuantumShaders");

suite.webGlTest("color", () => {
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    QuantumShaders.color(2, 3, -5, 7.5).renderTo(texture2x2);
    QuantumShaders.color(1.5, 2, 0, 121).renderTo(texture2x4);
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

suite.webGlTest("classicalState", () => {
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    QuantumShaders.classicalState(0).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.classicalState(1).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.classicalState(2).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.classicalState(3).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.classicalState(0).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.classicalState(5).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
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
    QuantumShaders.data(data2x2).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    QuantumShaders.data(data2x4).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(data2x4);

    QuantumShaders.data(data2x4).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(data2x4);

    assertThrows(() => QuantumShaders.data(data2x4).renderTo(texture2x2));
});

suite.webGlTest("renderFloatsToBytes", () => {
    let texture2x2 = new WglTexture(2, 2);
    let texture4x4Bytes = new WglTexture(4, 4, WebGLRenderingContext.UNSIGNED_BYTE);

    let data2x2 = new Float32Array([
        0, NaN, Infinity, -Infinity,
        Math.PI, Math.E, Math.sqrt(2), 0.1,
        1, 0.5, -1, -2,
        Math.log(3), Math.sin(5), Math.cos(7), Math.exp(11)
    ]);
    QuantumShaders.data(data2x2).renderTo(texture2x2);
    QuantumShaders.renderFloatsToEncodedBytes(texture4x4Bytes, texture2x2);
    let pixels = texture4x4Bytes.readPixels();
    let pixels2 = QuantumShaders.decodeBytesToFloats(pixels, 2, 2);
    assertThat(pixels2).isEqualTo(data2x2);
});

suite.webGlTest("overlay", () => {
    let fore = new WglTexture(2, 2);
    let back = new WglTexture(4, 4);
    QuantumShaders.data(new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray())).renderTo(fore);
    QuantumShaders.data(new Float32Array(Seq.range(4*4*4).map(e => -e).toArray())).renderTo(back);

    let out = new WglTexture(4, 4);
    QuantumShaders.overlay(0, 0, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        900, 901, 902, 903, 904, 905, 906, 907,  -8,  -9, -10, -11, -12, -13, -14, -15,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.overlay(1, 0, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3, 900, 901, 902, 903, 904, 905, 906, 907, -12, -13, -14, -15,
        -16, -17, -18, -19, 908, 909, 910, 911, 912, 913, 914, 915, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.overlay(0, 1, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907, -24, -25, -26, -27, -28, -29, -30, -31,
        908, 909, 910, 911, 912, 913, 914, 915, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.overlay(2, 1, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, 900, 901, 902, 903, 904, 905, 906, 907,
        -32, -33, -34, -35, -36, -37, -38, -39, 908, 909, 910, 911, 912, 913, 914, 915,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.overlay(2, 2, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, 900, 901, 902, 903, 904, 905, 906, 907,
        -48, -49, -50, -51, -52, -53, -54, -55, 908, 909, 910, 911, 912, 913, 914, 915
    ]));
});

suite.webGlTest("linearOverlay", () => {
    let fore = new WglTexture(2, 2);
    let back = new WglTexture(4, 4);
    QuantumShaders.data(new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray())).renderTo(fore);
    QuantumShaders.data(new Float32Array(Seq.range(4*4*4).map(e => -e).toArray())).renderTo(back);

    let out = new WglTexture(4, 4);
    QuantumShaders.linearOverlay(0, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.linearOverlay(1, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,  -1,  -2,  -3,  900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911,
        912, 913, 914, 915, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.linearOverlay(2, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,  -1,  -2,  -3,  -4,  -5,  -6,  -7,  900, 901, 902, 903, 904, 905, 906, 907,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.linearOverlay(4, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907,  908, 909, 910, 911, 912, 913, 914, 915,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.linearOverlay(12, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        900, 901, 902, 903, 904, 905, 906, 907,  908, 909, 910, 911, 912, 913, 914, 915
    ]));

    QuantumShaders.linearOverlay(13, fore, back).renderTo(out);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, 900, 901, 902, 903, 904, 905, 906, 907,  908, 909, 910, 911
    ]));
});

suite.webGlTest("controlMaskForBit", () => {
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    QuantumShaders.controlMaskForBit(0, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(0, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(1, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(1, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(2, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(2, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(0, false).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(1, false).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(2, false).renderTo(texture2x4);
    assertThat(texture2x4.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
});

suite.webGlTest("controlMaskWithBit_fromTrivialMask", () => {
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let noControl = new WglTexture(1 << 1, 1 << 1);
    QuantumShaders.controlMaskForBit(2, false).renderTo(noControl);

    QuantumShaders.controlMaskWithBit(noControl, 0, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskWithBit(noControl, 0, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.controlMaskWithBit(noControl, 1, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskWithBit(noControl, 1, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.controlMaskWithBit(noControl, 2, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.controlMaskWithBit(noControl, 2, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    // If control is already not allowing anything, result is stuck with it.
    let allControl = new WglTexture(1 << 1, 1 << 1);
    QuantumShaders.controlMaskForBit(2, true).renderTo(allControl);
    QuantumShaders.controlMaskWithBit(allControl, 0, false).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
    QuantumShaders.controlMaskWithBit(allControl, 0, true).renderTo(texture2x2);
    assertThat(texture2x2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
});

suite.webGlTest("controlMaskWithBit_buildup", () => {
    let texture2x4_0 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_1 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_2 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_3 = new WglTexture(1 << 2, 1 << 1);
    QuantumShaders.controlMaskForBit(0, false).renderTo(texture2x4_0);
    QuantumShaders.controlMaskWithBit(texture2x4_0, 1, true).renderTo(texture2x4_1);
    QuantumShaders.controlMaskWithBit(texture2x4_1, 2, true).renderTo(texture2x4_2);
    QuantumShaders.controlMaskWithBit(texture2x4_2, 1, false).renderTo(texture2x4_3);
    assertThat(texture2x4_0.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
    assertThat(texture2x4_1.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
    assertThat(texture2x4_2.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
    assertThat(texture2x4_3.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
});

suite.webGlTest("renderControlMask", () => {
    let texA = new WglTexture(2, 2);
    let texB = new WglTexture(2, 2);

    let r = QuantumShaders.renderControlMask(new QuantumControlMask(0x3, 0x1), texA, texB);
    assertThat(r.result.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlMask(new QuantumControlMask(0x3, 0x0), texA, texB);
    assertThat(r.result.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlMask(new QuantumControlMask(0x1, 0x0), texA, texB);
    assertThat(r.result.readPixels()).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlMask(new QuantumControlMask(0x5, 0x4), new WglTexture(4, 2), new WglTexture(4, 2));
    assertThat(r.result.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
});

suite.webGlTest("squaredMagnitude", () => {
    let amps = new WglTexture(4, 2);
    QuantumShaders.data(new Float32Array([
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
    QuantumShaders.squaredMagnitude(amps).renderTo(out);
    assertThat(out.readPixels()).isApproximatelyEqualTo(new Float32Array([
        13, 0, 0, 0,
        0.5, 0, 0, 0,
        30, 0, 0, 0,
        0.3125, 0, 0, 0,
        0.5, 0, 0, 0,
        1/3, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));
});

suite.webGlTest("scale", () => {
    let amps = new WglTexture(4, 2);
    QuantumShaders.data(new Float32Array([
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
    QuantumShaders.scale(amps, 3).renderTo(out);
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

suite.webGlTest("renderConditionalProbabilitiesPipeline", () => {
    let inp = new WglTexture(4, 2);
    QuantumShaders.data(new Float32Array([
        2, 0, 0, 0,
        3, 0, 0, 0,
        5, 0, 0, 0,
        7, 0, 0, 0,
        11, 0, 0, 0,
        13, 0, 0, 0,
        17, 0, 0, 0,
        19, 0, 0, 0
    ])).renderTo(inp);

    let mid1 = new WglTexture(4, 2);
    QuantumShaders.renderConditionalProbabilitiesPipeline(mid1, inp, 0, true);
    assertThat(mid1.readPixels()).isEqualTo(new Float32Array([
        5, 0, 0, 0,
        3, 0, 0, 0,
        12, 0, 0, 0,
        7, 0, 0, 0,
        24, 0, 0, 0,
        13, 0, 0, 0,
        36, 0, 0, 0,
        19, 0, 0, 0
    ]));

    QuantumShaders.renderConditionalProbabilitiesPipeline(mid1, inp, 0, false);
    assertThat(mid1.readPixels()).isEqualTo(new Float32Array([
        5, 0, 0, 0,
        2, 0, 0, 0,
        12, 0, 0, 0,
        5, 0, 0, 0,
        24, 0, 0, 0,
        11, 0, 0, 0,
        36, 0, 0, 0,
        17, 0, 0, 0
    ]));

    let mid2 = new WglTexture(4, 2);
    QuantumShaders.renderConditionalProbabilitiesPipeline(mid2, mid1, 1, false);
    assertThat(mid2.readPixels()).isEqualTo(new Float32Array([
        17, 0, 0, 0,
        7, 0, 0, 0,
        5, 0, 0, 0,
        2, 0, 0, 0,
        60, 0, 0, 0,
        28, 0, 0, 0,
        24, 0, 0, 0,
        11, 0, 0, 0
    ]));

    QuantumShaders.renderConditionalProbabilitiesPipeline(mid2, mid1, 1, true);
    assertThat(mid2.readPixels()).isEqualTo(new Float32Array([
        17, 0, 0, 0,
        7, 0, 0, 0,
        12, 0, 0, 0,
        5, 0, 0, 0,
        60, 0, 0, 0,
        28, 0, 0, 0,
        36, 0, 0, 0,
        17, 0, 0, 0
    ]));

    let mid3 = new WglTexture(4, 2);
    QuantumShaders.renderConditionalProbabilitiesPipeline(mid3, mid2, 2, false);
    assertThat(mid3.readPixels()).isEqualTo(new Float32Array([
        77, 0, 0, 0,
        35, 0, 0, 0,
        48, 0, 0, 0,
        22, 0, 0, 0,
        17, 0, 0, 0,
        7, 0, 0, 0,
        12, 0, 0, 0,
        5, 0, 0, 0
    ]));

    QuantumShaders.renderConditionalProbabilitiesPipeline(mid3, mid2, 2, true);
    assertThat(mid3.readPixels()).isEqualTo(new Float32Array([
        77, 0, 0, 0,
        35, 0, 0, 0,
        48, 0, 0, 0,
        22, 0, 0, 0,
        60, 0, 0, 0,
        28, 0, 0, 0,
        36, 0, 0, 0,
        17, 0, 0, 0
    ]));
});

suite.webGlTest("renderControlCombinationProbabilities", () => {
    let inp = new WglTexture(4, 2);
    QuantumShaders.data(new Float32Array([
        0, 1, 0, 0,
        2, 0, 0, 0,
        3, 0, 0, 0,
        4, 0, 0, 0,
        5, 0, 0, 0,
        6, 0, 0, 0,
        7, 0, 0, 0,
        8, 0, 0, 0
    ])).renderTo(inp);

    let ta = new WglTexture(4, 2);
    let tb = new WglTexture(4, 2);
    let r = new WglTexture(2, 2);
    QuantumShaders.renderControlCombinationProbabilities(r, ta, tb, new QuantumControlMask(7, 7), inp);
    assertThat(r.readPixels().slice(0, 12)).isEqualTo(new Float32Array([
        204, 120, 64, 113,
        204, 138, 64, 100,
        204, 174, 64, 80
    ]));

    QuantumShaders.renderControlCombinationProbabilities(r, ta, tb, new QuantumControlMask(3, 1), inp);
    assertThat(r.readPixels().slice(0, 12)).isEqualTo(new Float32Array([
        204, 120, 40, 66,
        204, 66, 40, 120,
        204, 30, 40, 4
    ]));

    QuantumShaders.renderControlCombinationProbabilities(r, ta, tb, new QuantumControlMask(1, 1), inp);
    assertThat(r.readPixels().slice(0, 12)).isEqualTo(new Float32Array([
        204, 120, 120, 204,
        204, 66, 120, 40,
        204, 30, 120, 20
    ]));

    QuantumShaders.renderControlCombinationProbabilities(r, ta, tb, QuantumControlMask.NO_CONTROLS, inp);
    assertThat(r.readPixels().slice(0, 12)).isEqualTo(new Float32Array([
        204, 84, 204, 84,
        204, 66, 204, 66,
        204, 30, 204, 30
    ]));

    QuantumShaders.renderControlCombinationProbabilities(r, ta, tb, new QuantumControlMask(4, 4), inp);
    assertThat(r.readPixels().slice(0, 12)).isEqualTo(new Float32Array([
        204, 84, 174, 74,
        204, 66, 174, 61,
        204, 174, 174, 204
    ]));
});

suite.webGlTest("renderConditionalProbabilitiesFinalize", () => {
    let inp = new WglTexture(4, 4);
    let dst = new WglTexture(2, 2);
    QuantumShaders.data(new Float32Array([
        -1, 0, 0, 0,
        1, 0, 0, 0,
        2, 0, 0, 0,
        3, 0, 0, 0,
        4, 0, 0, 0,
        5, 0, 0, 0,
        6, 0, 0, 0,
        7, 0, 0, 0,
        8, 0, 0, 0,
        9, 0, 0, 0,
        10, 0, 0, 0,
        11, 0, 0, 0,
        12, 0, 0, 0,
        13, 0, 0, 0,
        14, 0, 0, 0,
        15, 0, 0, 0
    ])).renderTo(inp);

    QuantumShaders.renderConditionalProbabilitiesFinalize(dst, inp, 0);
    assertThat(dst.readPixels()).isEqualTo(new Float32Array([
        -1, 1, -1, 1,
        -1, 2, -1, 2,
        -1, 4, -1, 4,
        -1, 8, -1, 8
    ]));

    QuantumShaders.renderConditionalProbabilitiesFinalize(dst, inp, 1);
    assertThat(dst.readPixels()).isEqualTo(new Float32Array([
        -1, 1, 1, -1,
        -1, 2, 1, 2+1,
        -1, 4, 1, 4+1,
        -1, 8, 1, 8+1
    ]));

    QuantumShaders.renderConditionalProbabilitiesFinalize(dst, inp, 2);
    assertThat(dst.readPixels()).isEqualTo(new Float32Array([
        -1, 1, 2, 1+2,
        -1, 2, 2, -1,
        -1, 4, 2, 4+2,
        -1, 8, 2, 8+2
    ]));

    QuantumShaders.renderConditionalProbabilitiesFinalize(dst, inp, 5);
    assertThat(dst.readPixels()).isEqualTo(new Float32Array([
        -1, 1, 5, 1+4-1,
        -1, 2, 5, 2+5,
        -1, 4, 5, 4-4+1,
        -1, 8, 5, 8+5
    ]));
});

suite.webGlTest("renderQubitOperation", () => {
    let cnt = new WglTexture(4, 2);
    let out = new WglTexture(4, 2);
    let inp = new WglTexture(4, 2);
    QuantumShaders.data(new Float32Array([
        2, 3, 0, 0,
        4, 5, 0, 0,
        6, 7, 0, 0,
        8, 9, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ])).renderTo(inp);

    QuantumShaders.controlMaskForBit(3, false).renderTo(cnt);
    QuantumShaders.renderQubitOperation(out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        7, -1, 0, 0,
        -7, -3, 0, 0,
        15, -1, 0, 0,
        -15, -3, 0, 0,
        9, -2, 0, 0,
        -8, -5, 0, 0,
        30, -4, 0, 0,
        -30, -8, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(1, false).renderTo(cnt);
    QuantumShaders.renderQubitOperation(out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        7, -1, 0, 0,
        -7, -3, 0, 0,
        6, 7, 0, 0,
        8, 9, 0, 0,
        9, -2, 0, 0,
        -8, -5, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(1, true).renderTo(cnt);
    QuantumShaders.renderQubitOperation(out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        2, 3, 0, 0,
        4, 5, 0, 0,
        15, -1, 0, 0,
        -15, -3, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        30, -4, 0, 0,
        -30, -8, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(2, false).renderTo(cnt);
    QuantumShaders.renderQubitOperation(out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        7, -1, 0, 0,
        -7, -3, 0, 0,
        15, -1, 0, 0,
        -15, -3, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(3, false).renderTo(cnt);
    QuantumShaders.renderQubitOperation(out, inp, Matrix.square([0, 0, 0, 0]), 0, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.controlMaskForBit(3, false).renderTo(cnt);
    QuantumShaders.renderQubitOperation(out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 1, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        9, -3, 0, 0,
        13, -3, 0, 0,
        -9, -5, 0, 0,
        -13, -5, 0, 0,
        15, -8, 0, 0,
        24, -10, 0, 0,
        -14, -11, 0, 0,
        -24, -14, 0, 0
    ]));
});

suite.webGlTest("renderQubitOperation_flows", () => {
    let out1 = new WglTexture(2, 1);
    let inp1 = new WglTexture(2, 1);
    let cnt1 = new WglTexture(2, 1);
    QuantumShaders.data(new Float32Array([
        1, 2, 0, 0,
        3, 27, 0, 0
    ])).renderTo(inp1);
    QuantumShaders.controlMaskForBit(1, false).renderTo(cnt1);
    QuantumShaders.renderQubitOperation(out1, inp1, Matrix.square([1, 0, 0, 0]), 0, cnt1);
    assertThat(out1.readPixels()).isEqualTo(new Float32Array([
        1, 2, 0, 0,
        0, 0, 0, 0
    ]));
    QuantumShaders.renderQubitOperation(out1, inp1, Matrix.square([0, 1, 0, 0]), 0, cnt1);
    assertThat(out1.readPixels()).isEqualTo(new Float32Array([
        3, 27, 0, 0,
        0, 0, 0, 0
    ]));
    QuantumShaders.renderQubitOperation(out1, inp1, Matrix.square([0, 0, 1, 0]), 0, cnt1);
    assertThat(out1.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 2, 0, 0
    ]));
    QuantumShaders.renderQubitOperation(out1, inp1, Matrix.square([0, 0, 0, 1]), 0, cnt1);
    assertThat(out1.readPixels()).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        3, 27, 0, 0
    ]));
});

suite.webGlTest("renderSwapOperation", () => {
    let out = new WglTexture(1<<2, 1<<1);
    let inp = new WglTexture(1<<2, 1<<1);
    let cnt = new WglTexture(1<<2, 1<<1);
    QuantumShaders.data(new Float32Array([
        11, 12, 13, 14, //000
        21, 22, 23, 24, //001
        31, 32, 33, 34, //010
        41, 42, 43, 44, //011
        51, 52, 53, 54, //100
        61, 62, 63, 64, //101
        71, 72, 73, 74, //110
        81, 82, 83, 84  //111
    ])).renderTo(inp);

    QuantumShaders.color(1, 0, 0, 0).renderTo(cnt);
    QuantumShaders.renderSwapOperation(out, inp, 0, 1, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        31, 32, 33, 34, //010
        21, 22, 23, 24, //001
        41, 42, 43, 44, //011
        51, 52, 53, 54, //100
        71, 72, 73, 74, //110
        61, 62, 63, 64, //101
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.controlMaskForBit(2, false).renderTo(cnt);
    QuantumShaders.renderSwapOperation(out, inp, 0, 1, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        31, 32, 33, 34, //010
        21, 22, 23, 24, //001
        41, 42, 43, 44, //011
        51, 52, 53, 54, //100
        61, 62, 63, 64, //101
        71, 72, 73, 74, //110
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.color(1, 0, 0, 0).renderTo(cnt);
    QuantumShaders.renderSwapOperation(out, inp, 0, 2, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        51, 52, 53, 54, //100
        31, 32, 33, 34, //010
        71, 72, 73, 74, //110
        21, 22, 23, 24, //001
        61, 62, 63, 64, //101
        41, 42, 43, 44, //011
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.controlMaskForBit(1, false).renderTo(cnt);
    QuantumShaders.renderSwapOperation(out, inp, 0, 2, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        51, 52, 53, 54, //100
        31, 32, 33, 34, //010
        41, 42, 43, 44, //011
        21, 22, 23, 24, //001
        61, 62, 63, 64, //101
        71, 72, 73, 74, //110
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.controlMaskForBit(1, true).renderTo(cnt);
    QuantumShaders.renderSwapOperation(out, inp, 0, 2, cnt);
    assertThat(out.readPixels()).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        21, 22, 23, 24, //001
        31, 32, 33, 34, //010
        71, 72, 73, 74, //110
        51, 52, 53, 54, //100
        61, 62, 63, 64, //101
        41, 42, 43, 44, //011
        81, 82, 83, 84  //111
    ]));
});

suite.webGlTest("renderSuperpositionToDensityMatrix_randomized", () => {
    let nsize = 4;
    let size1 = 1 << nsize;
    let size2 = 1 << nsize;
    let inp = new WglTexture(size1, size2);
    let out = new WglTexture(size1, size2);

    // Generate a set of random un-normalized superpositions.
    let vecs = Seq.range(size1).
        map(_ => Seq.range(size2).
            map(__ => new Complex(Math.random()*2 - 1, Math.random()*2 - 1)).
            toArray()).
        toArray();

    let expected = new Seq(vecs).
        map(v => Matrix.col(v)).
        map(c => c.times(c.adjoint())).
        fold((m1, m2) => m1.plus(m2));

    let inputPixelData = new Seq(vecs).
        flatten().
        flatMap(e => [e.real, e.imag, 0, 0]).
        toArray();
    QuantumShaders.data(new Float32Array(inputPixelData)).renderTo(inp);
    let kept = Seq.range(nsize).toArray();
    let margined = Seq.range(nsize).map(i => i + nsize).toArray();
    let controlled = QuantumControlMask.NO_CONTROLS;
    QuantumShaders.renderSuperpositionToDensityMatrix(out, inp, kept, margined, controlled);

    let outputPixelData = out.readPixels();
    let computed = Matrix.square(new Seq(outputPixelData).partitioned(4).map(p => new Complex(p[0], p[1])).toArray());
    assertThat(computed).isApproximatelyEqualTo(expected, 0.0001);
});
