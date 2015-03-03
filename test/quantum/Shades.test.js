import { Suite, skipTestIfWebGlNotAvailable, assertThat, assertThrows } from "test/TestUtil.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglDirector from "src/webgl/WglDirector.js"
import Rect from "src/base/Rect.js"
import Shades from "src/quantum/Shades.js"
import Seq from "src/base/Seq.js"

let suite = new Suite("Shades");

suite.webGlTest("renderPixelColorData", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    let data2x2 = new Float32Array(Seq.range(2*2*4).toArray());
    Shades.renderPixelColorData(director, texture2x2, data2x2);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    Shades.renderPixelColorData(director, texture2x4, data2x4);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo(data2x4);

    assertThrows(() => Shades.renderPixelColorData(director, texture2x2, data2x4));
});

suite.webGlTest("renderOverlayed", () => {
    let director = new WglDirector();

    let fore = new WglTexture(2, 2);
    let back = new WglTexture(4, 4);
    Shades.renderPixelColorData(director, fore, new Float32Array(Seq.range(2*2*4).map(e => e + 900).toArray()));
    Shades.renderPixelColorData(director, back, new Float32Array(Seq.range(4*4*4).map(e => -e).toArray()));

    let out = new WglTexture(4, 4);
    Shades.renderOverlayed(director, out, 0, 0, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo([
        900, 901, 902, 903, 904, 905, 906, 907,  -8,  -9, -10, -11, -12, -13, -14, -15,
        908, 909, 910, 911, 912, 913, 914, 915, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]);

    Shades.renderOverlayed(director, out, 1, 0, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo([
        -0,   -1,  -2,  -3, 900, 901, 902, 903, 904, 905, 906, 907, -12, -13, -14, -15,
        -16, -17, -18, -19, 908, 909, 910, 911, 912, 913, 914, 915, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]);

    Shades.renderOverlayed(director, out, 0, 1, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        900, 901, 902, 903, 904, 905, 906, 907, -24, -25, -26, -27, -28, -29, -30, -31,
        908, 909, 910, 911, 912, 913, 914, 915, -40, -41, -42, -43, -44, -45, -46, -47,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]);

    Shades.renderOverlayed(director, out, 2, 1, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, 900, 901, 902, 903, 904, 905, 906, 907,
        -32, -33, -34, -35, -36, -37, -38, -39, 908, 909, 910, 911, 912, 913, 914, 915,
        -48, -49, -50, -51, -52, -53, -54, -55, -56, -57, -58, -59, -60, -61, -62, -63
    ]);

    Shades.renderOverlayed(director, out, 2, 2, fore, back);
    assertThat(director.readPixelColorFloats(out)).isEqualTo([
        -0,   -1,  -2,  -3,  -4,  -5,  -6,  -7,  -8,  -9, -10, -11, -12, -13, -14, -15,
        -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31,
        -32, -33, -34, -35, -36, -37, -38, -39, 900, 901, 902, 903, 904, 905, 906, 907,
        -48, -49, -50, -51, -52, -53, -54, -55, 908, 909, 910, 911, 912, 913, 914, 915
    ]);
});

suite.webGlTest("renderSingleBitConstraintControlMask", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    Shades.renderSingleBitConstraintControlMask(director, texture2x2, 0, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x2, 0, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x2, 1, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x2, 1, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x2, 2, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x2, 2, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x4, 0, false);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x4, 1, false);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(director, texture2x4, 2, false);
    assertThat(director.readPixelColorFloats(texture2x4)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);
});

suite.webGlTest("renderAddBitConstraintToControlMask_fromTrivialMask", () => {
    let director = new WglDirector();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let noControl = new WglTexture(1 << 1, 1 << 1);
    Shades.renderSingleBitConstraintControlMask(director, noControl, 2, false);

    Shades.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 0, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 0, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 1, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 1, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 2, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(director, texture2x2, noControl, 2, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    // If control is already not allowing anything, result is stuck with it.
    let allControl = new WglTexture(1 << 1, 1 << 1);
    Shades.renderSingleBitConstraintControlMask(director, allControl, 2, true);
    Shades.renderAddBitConstraintToControlMask(director, texture2x2, allControl, 0, false);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);
    Shades.renderAddBitConstraintToControlMask(director, texture2x2, allControl, 0, true);
    assertThat(director.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);
});

suite.webGlTest("renderAddBitConstraintToControlMask_buildup", () => {
    let director = new WglDirector();
    let texture2x4_0 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_1 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_2 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_3 = new WglTexture(1 << 2, 1 << 1);
    Shades.renderSingleBitConstraintControlMask(director, texture2x4_0, 0, false);
    Shades.renderAddBitConstraintToControlMask(director, texture2x4_1, texture2x4_0, 1, true);
    Shades.renderAddBitConstraintToControlMask(director, texture2x4_2, texture2x4_1, 2, true);
    Shades.renderAddBitConstraintToControlMask(director, texture2x4_3, texture2x4_2, 1, false);
    assertThat(director.readPixelColorFloats(texture2x4_0)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);
    assertThat(director.readPixelColorFloats(texture2x4_1)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);
    assertThat(director.readPixelColorFloats(texture2x4_2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);
    assertThat(director.readPixelColorFloats(texture2x4_3)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);
});
