import { Suite, assertThat, assertThrows } from "test/TestUtil.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglDirector from "src/webgl/WglDirector.js"
import QuantumShaders from "src/pipeline/QuantumShaders.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"
import Seq from "src/base/Seq.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"

let suite = new Suite("QuantumShaders");

suite.webGlTest("renderUniformColor", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    QuantumShaders.renderUniformColor(director, texture2x2, 2, 3, -5, 7.5);
    QuantumShaders.renderUniformColor(director, texture2x4, 1.5, 2, 0, 121);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5,
        2, 3, -5, 7.5
    ]));
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(new Float32Array([
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

suite.webGlTest("renderClassicalState", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    QuantumShaders.renderClassicalState(director, texture2x2, 0);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderClassicalState(director, texture2x2, 1);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderClassicalState(director, texture2x2, 2);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderClassicalState(director, texture2x2, 3);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderClassicalState(director, texture2x4, 0);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderClassicalState(director, texture2x4, 5);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(new Float32Array([
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

suite.webGlTest("renderPixelColorData", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    let data2x2 = new Float32Array(Seq.range(2*2*4).toArray());
    QuantumShaders.renderPixelColorData(director, texture2x2, data2x2);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    QuantumShaders.renderPixelColorData(director, texture2x4, data2x4);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(data2x4);

    assertThrows(() => QuantumShaders.renderPixelColorData(director, texture2x2, data2x4));
});

suite.webGlTest("renderOverlayed", () => {
    let director = new WglDirector();

    let fore = new WglTexture(2, 2);
    let back = new WglTexture(4, 4);
    QuantumShaders.renderPixelColorData(director, fore, new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray()));
    QuantumShaders.renderPixelColorData(director, back, new Float32Array(Seq.range(4*4*4).map(e => -e).toArray()));

    let out = new WglTexture(4, 4);
    QuantumShaders.renderOverlayed(director, out, 0, 0, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        900, 901, 902, 903, 904, 905, 906, 907,  -8,  -9, -10, -11, -12, -13, -14, -15,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderOverlayed(director, out, 1, 0, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3, 900, 901, 902, 903, 904, 905, 906, 907, -12, -13, -14, -15,
        -16, -17, -18, -19, 908, 909, 910, 911, 912, 913, 914, 915, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderOverlayed(director, out, 0, 1, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907, -24, -25, -26, -27, -28, -29, -30, -31,
        908, 909, 910, 911, 912, 913, 914, 915, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderOverlayed(director, out, 2, 1, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, 900, 901, 902, 903, 904, 905, 906, 907,
        -32, -33, -34, -35, -36, -37, -38, -39, 908, 909, 910, 911, 912, 913, 914, 915,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderOverlayed(director, out, 2, 2, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, 900, 901, 902, 903, 904, 905, 906, 907,
        -48, -49, -50, -51, -52, -53, -54, -55, 908, 909, 910, 911, 912, 913, 914, 915
    ]));
});

suite.webGlTest("renderLinearOverlay", () => {
    let director = new WglDirector();

    let fore = new WglTexture(2, 2);
    let back = new WglTexture(4, 4);
    QuantumShaders.renderPixelColorData(director, fore, new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray()));
    QuantumShaders.renderPixelColorData(director, back, new Float32Array(Seq.range(4*4*4).map(e => -e).toArray()));

    let out = new WglTexture(4, 4);
    QuantumShaders.renderLinearOverlay(director, out, 0, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderLinearOverlay(director, out, 1, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,  -1,  -2,  -3,  900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911,
        912, 913, 914, 915, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderLinearOverlay(director, out, 2, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,  -1,  -2,  -3,  -4,  -5,  -6,  -7,  900, 901, 902, 903, 904, 905, 906, 907,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderLinearOverlay(director, out, 4, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907,  908, 909, 910, 911, 912, 913, 914, 915,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]));

    QuantumShaders.renderLinearOverlay(director, out, 12, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        900, 901, 902, 903, 904, 905, 906, 907,  908, 909, 910, 911, 912, 913, 914, 915
    ]));

    QuantumShaders.renderLinearOverlay(director, out, 13, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, 900, 901, 902, 903, 904, 905, 906, 907,  908, 909, 910, 911
    ]));
});

suite.webGlTest("renderSingleBitConstraintControlMask", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x2, 0, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x2, 0, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x2, 1, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x2, 1, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x2, 2, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x2, 2, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x4, 0, false);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x4, 1, false);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x4, 2, false);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(new Float32Array([
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

suite.webGlTest("renderAddBitConstraintToControlMask_fromTrivialMask", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let noControl = new WglTexture(1 << 1, 1 << 1);
    QuantumShaders.renderSingleBitConstraintControlMask(director, noControl, 2, false);

    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 0, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 0, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 1, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 1, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 2, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]));

    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 2, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    // If control is already not allowing anything, result is stuck with it.
    let allControl = new WglTexture(1 << 1, 1 << 1);
    QuantumShaders.renderSingleBitConstraintControlMask(director, allControl, 2, true);
    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, allControl, 0, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x2, allControl, 0, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));
});

suite.webGlTest("renderAddBitConstraintToControlMask_buildup", () => {
    let director = new WglDirector();
    let texture2x4_0 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_1 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_2 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_3 = new WglTexture(1 << 2, 1 << 1);
    QuantumShaders.renderSingleBitConstraintControlMask(director, texture2x4_0, 0, false);
    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x4_1, texture2x4_0, 1, true);
    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x4_2, texture2x4_1, 2, true);
    QuantumShaders.renderAddBitConstraintToControlMask(director, texture2x4_3, texture2x4_2, 1, false);
    assertThat(director.readPixelColorFloats(texture2x4_0)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
    assertThat(director.readPixelColorFloats(texture2x4_1)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
    assertThat(director.readPixelColorFloats(texture2x4_2)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));
    assertThat(director.readPixelColorFloats(texture2x4_3)).isEqualTo(new Float32Array([
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
    let director = new WglDirector();
    let texA = new WglTexture(2, 2);
    let texB = new WglTexture(2, 2);

    let r = QuantumShaders.renderControlMask(director, new QuantumControlMask(0x3, 0x1), texA, texB);
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlMask(director, new QuantumControlMask(0x3, 0x0), texA, texB);
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlMask(director, new QuantumControlMask(0x1, 0x0), texA, texB);
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlMask(director, new QuantumControlMask(0x5, 0x4), new WglTexture(4, 2), new WglTexture(4, 2));
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
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

suite.webGlTest("renderProbabilitiesFromAmplitudes", () => {
    let director = new WglDirector();
    let amps = new WglTexture(4, 2);
    QuantumShaders.renderPixelColorData(director, amps, new Float32Array([
        2, 3, 0, 0,
        0.5, 0.5, 0, 0,
        1, 2, 3, 4,
        0.25, 0.5, 0, 0,
        Math.sqrt(1/2), 0, 0, 0,
        0, Math.sqrt(1/3), 0, 0,
        3/5, 4/5, 0, 0,
        1, 0, 0, 0
    ]));

    let out = new WglTexture(4, 2);
    QuantumShaders.renderProbabilitiesFromAmplitudes(director, out, amps);
    assertThat(director.readPixelColorFloats(out)).isApproximatelyEqualTo(new Float32Array([
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

suite.webGlTest("renderConditionalProbabilitiesPipeline", () => {
    let director = new WglDirector();
    let inp = new WglTexture(4, 2);
    QuantumShaders.renderPixelColorData(director, inp, new Float32Array([
        2, 0, 0, 0,
        3, 0, 0, 0,
        5, 0, 0, 0,
        7, 0, 0, 0,
        11, 0, 0, 0,
        13, 0, 0, 0,
        17, 0, 0, 0,
        19, 0, 0, 0
    ]));

    let mid1 = new WglTexture(4, 2);
    QuantumShaders.renderConditionalProbabilitiesPipeline(director, mid1, inp, 0, true);
    assertThat(director.readPixelColorFloats(mid1)).isEqualTo(new Float32Array([
        5, 0, 0, 0,
        3, 0, 0, 0,
        12, 0, 0, 0,
        7, 0, 0, 0,
        24, 0, 0, 0,
        13, 0, 0, 0,
        36, 0, 0, 0,
        19, 0, 0, 0
    ]));

    QuantumShaders.renderConditionalProbabilitiesPipeline(director, mid1, inp, 0, false);
    assertThat(director.readPixelColorFloats(mid1)).isEqualTo(new Float32Array([
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
    QuantumShaders.renderConditionalProbabilitiesPipeline(director, mid2, mid1, 1, false);
    assertThat(director.readPixelColorFloats(mid2)).isEqualTo(new Float32Array([
        17, 0, 0, 0,
        7, 0, 0, 0,
        5, 0, 0, 0,
        2, 0, 0, 0,
        60, 0, 0, 0,
        28, 0, 0, 0,
        24, 0, 0, 0,
        11, 0, 0, 0
    ]));

    QuantumShaders.renderConditionalProbabilitiesPipeline(director, mid2, mid1, 1, true);
    assertThat(director.readPixelColorFloats(mid2)).isEqualTo(new Float32Array([
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
    QuantumShaders.renderConditionalProbabilitiesPipeline(director, mid3, mid2, 2, false);
    assertThat(director.readPixelColorFloats(mid3)).isEqualTo(new Float32Array([
        77, 0, 0, 0,
        35, 0, 0, 0,
        48, 0, 0, 0,
        22, 0, 0, 0,
        17, 0, 0, 0,
        7, 0, 0, 0,
        12, 0, 0, 0,
        5, 0, 0, 0
    ]));

    QuantumShaders.renderConditionalProbabilitiesPipeline(director, mid3, mid2, 2, true);
    assertThat(director.readPixelColorFloats(mid3)).isEqualTo(new Float32Array([
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
    let director = new WglDirector();
    let inp = new WglTexture(4, 2);
    QuantumShaders.renderPixelColorData(director, inp, new Float32Array([
        0, 1, 0, 0,
        2, 0, 0, 0,
        3, 0, 0, 0,
        4, 0, 0, 0,
        5, 0, 0, 0,
        6, 0, 0, 0,
        7, 0, 0, 0,
        8, 0, 0, 0
    ]));

    let texA = new WglTexture(4, 2);
    let texB = new WglTexture(4, 2);
    let r = QuantumShaders.renderControlCombinationProbabilities(director, texA, texB, -1, inp);
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
        204, 0, 0, 0,
        120, 0, 0, 0,
        138, 0, 0, 0,
        80, 0, 0, 0,
        174, 0, 0, 0,
        100, 0, 0, 0,
        113, 0, 0, 0,
        64, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlCombinationProbabilities(director, texA, texB, 0, inp);
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
        204, 0, 0, 0,
        84, 0, 0, 0,
        66, 0, 0, 0,
        26, 0, 0, 0,
        30, 0, 0, 0,
        10, 0, 0, 0,
        5, 0, 0, 0,
        1, 0, 0, 0
    ]));

    r = QuantumShaders.renderControlCombinationProbabilities(director, texA, texB, 4, inp);
    assertThat(director.readPixelColorFloats(r.result)).isEqualTo(new Float32Array([
        204, 0, 0, 0,
        84, 0, 0, 0,
        66, 0, 0, 0,
        26, 0, 0, 0,
        174, 0, 0, 0,
        74, 0, 0, 0,
        61, 0, 0, 0,
        25, 0, 0, 0
    ]));
});

suite.webGlTest("renderQubitOperation", () => {
    let director = new WglDirector();
    let cnt = new WglTexture(4, 2);
    let out = new WglTexture(4, 2);
    let inp = new WglTexture(4, 2);
    QuantumShaders.renderPixelColorData(director, inp, new Float32Array([
        2, 3, 0, 0,
        4, 5, 0, 0,
        6, 7, 0, 0,
        8, 9, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 3, false);
    QuantumShaders.renderQubitOperation(director, out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        7, -1, 0, 0,
        -7, -3, 0, 0,
        15, -1, 0, 0,
        -15, -3, 0, 0,
        9, -2, 0, 0,
        -8, -5, 0, 0,
        30, -4, 0, 0,
        -30, -8, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 1, false);
    QuantumShaders.renderQubitOperation(director, out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        7, -1, 0, 0,
        -7, -3, 0, 0,
        6, 7, 0, 0,
        8, 9, 0, 0,
        9, -2, 0, 0,
        -8, -5, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 1, true);
    QuantumShaders.renderQubitOperation(director, out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        2, 3, 0, 0,
        4, 5, 0, 0,
        15, -1, 0, 0,
        -15, -3, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        30, -4, 0, 0,
        -30, -8, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 2, false);
    QuantumShaders.renderQubitOperation(director, out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 0, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        7, -1, 0, 0,
        -7, -3, 0, 0,
        15, -1, 0, 0,
        -15, -3, 0, 0,
        2, 3, 0, 0,
        5, 7, 0, 0,
        11, 13, 0, 0,
        17, 19, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 3, false);
    QuantumShaders.renderQubitOperation(director, out, inp, Matrix.square([0, 0, 0, 0]), 0, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 3, false);
    QuantumShaders.renderQubitOperation(director, out, inp, Matrix.square([1, Complex.I.times(-1), Complex.I, -1]), 1, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
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
    let director = new WglDirector();
    let out1 = new WglTexture(2, 1);
    let inp1 = new WglTexture(2, 1);
    let cnt1 = new WglTexture(2, 1);
    QuantumShaders.renderPixelColorData(director, inp1, new Float32Array([
        1, 2, 0, 0,
        3, 27, 0, 0
    ]));
    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt1, 1, false);
    QuantumShaders.renderQubitOperation(director, out1, inp1, Matrix.square([1, 0, 0, 0]), 0, cnt1);
    assertThat(director.readPixelColorFloats(out1)).isEqualTo(new Float32Array([
        1, 2, 0, 0,
        0, 0, 0, 0
    ]));
    QuantumShaders.renderQubitOperation(director, out1, inp1, Matrix.square([0, 1, 0, 0]), 0, cnt1);
    assertThat(director.readPixelColorFloats(out1)).isEqualTo(new Float32Array([
        3, 27, 0, 0,
        0, 0, 0, 0
    ]));
    QuantumShaders.renderQubitOperation(director, out1, inp1, Matrix.square([0, 0, 1, 0]), 0, cnt1);
    assertThat(director.readPixelColorFloats(out1)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        1, 2, 0, 0
    ]));
    QuantumShaders.renderQubitOperation(director, out1, inp1, Matrix.square([0, 0, 0, 1]), 0, cnt1);
    assertThat(director.readPixelColorFloats(out1)).isEqualTo(new Float32Array([
        0, 0, 0, 0,
        3, 27, 0, 0
    ]));
});

suite.webGlTest("renderSwapOperation", () => {
    let director = new WglDirector();
    let out = new WglTexture(1<<2, 1<<1);
    let inp = new WglTexture(1<<2, 1<<1);
    let cnt = new WglTexture(1<<2, 1<<1);
    QuantumShaders.renderPixelColorData(director, inp, new Float32Array([
        11, 12, 13, 14, //000
        21, 22, 23, 24, //001
        31, 32, 33, 34, //010
        41, 42, 43, 44, //011
        51, 52, 53, 54, //100
        61, 62, 63, 64, //101
        71, 72, 73, 74, //110
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.renderUniformColor(director, cnt, 1, 0, 0, 0);
    QuantumShaders.renderSwapOperation(director, out, inp, 0, 1, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        31, 32, 33, 34, //010
        21, 22, 23, 24, //001
        41, 42, 43, 44, //011
        51, 52, 53, 54, //100
        71, 72, 73, 74, //110
        61, 62, 63, 64, //101
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 2, false);
    QuantumShaders.renderSwapOperation(director, out, inp, 0, 1, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        31, 32, 33, 34, //010
        21, 22, 23, 24, //001
        41, 42, 43, 44, //011
        51, 52, 53, 54, //100
        61, 62, 63, 64, //101
        71, 72, 73, 74, //110
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.renderUniformColor(director, cnt, 1, 0, 0, 0);
    QuantumShaders.renderSwapOperation(director, out, inp, 0, 2, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        51, 52, 53, 54, //100
        31, 32, 33, 34, //010
        71, 72, 73, 74, //110
        21, 22, 23, 24, //001
        61, 62, 63, 64, //101
        41, 42, 43, 44, //011
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 1, false);
    QuantumShaders.renderSwapOperation(director, out, inp, 0, 2, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
        11, 12, 13, 14, //000
        51, 52, 53, 54, //100
        31, 32, 33, 34, //010
        41, 42, 43, 44, //011
        21, 22, 23, 24, //001
        61, 62, 63, 64, //101
        71, 72, 73, 74, //110
        81, 82, 83, 84  //111
    ]));

    QuantumShaders.renderSingleBitConstraintControlMask(director, cnt, 1, true);
    QuantumShaders.renderSwapOperation(director, out, inp, 0, 2, cnt);
    assertThat(director.readPixelColorFloats(out)).isEqualTo(new Float32Array([
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
