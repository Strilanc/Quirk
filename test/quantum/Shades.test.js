import { Suite, skipTestIfWebGlNotAvailable, assertThat, assertThrows } from "test/TestUtil.js"
import WglArg from "src/webgl/WglArg.js"
import WglShader from "src/webgl/WglShader.js"
import WglTexture from "src/webgl/WglTexture.js"
import WglWorkArea from "src/webgl/WglWorkArea.js"
import Rect from "src/base/Rect.js"
import Shades from "src/quantum/Shades.js"
import Seq from "src/base/Seq.js"

let suite = new Suite("Shades");

suite.webGlTest("renderPixelColorData", () => {
    let workArea = new WglWorkArea();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    let data2x2 = new Float32Array(Seq.range(2*2*4).toArray());
    Shades.renderPixelColorData(workArea, texture2x2, data2x2);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo(data2x2);

    let data2x4 = new Float32Array(Seq.range(2*4*4).map(e => e*e + (e - Math.sqrt(2)) / 3).toArray());
    Shades.renderPixelColorData(workArea, texture2x4, data2x4);
    assertThat(workArea.readPixelColorFloats(texture2x4)).isEqualTo(data2x4);

    assertThrows(() => Shades.renderPixelColorData(workArea, texture2x2, data2x4));
});

suite.webGlTest("renderSingleBitConstraintControlMask", () => {
    let workArea = new WglWorkArea();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let texture2x4 = new WglTexture(1 << 2, 1 << 1);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x2, 0, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x2, 0, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x2, 1, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x2, 1, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x2, 2, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x2, 2, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x4, 0, false);
    assertThat(workArea.readPixelColorFloats(texture2x4)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x4, 1, false);
    assertThat(workArea.readPixelColorFloats(texture2x4)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderSingleBitConstraintControlMask(workArea, texture2x4, 2, false);
    assertThat(workArea.readPixelColorFloats(texture2x4)).isEqualTo([
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
    let workArea = new WglWorkArea();
    let texture2x2 = new WglTexture(1 << 1, 1 << 1);
    let noControl = new WglTexture(1 << 1, 1 << 1);
    Shades.renderSingleBitConstraintControlMask(workArea, noControl, 2, false);

    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, noControl, 0, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, noControl, 0, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, noControl, 1, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, noControl, 1, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, noControl, 2, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0
    ]);

    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, noControl, 2, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);

    // If control is already not allowing anything, result is stuck with it.
    let allControl = new WglTexture(1 << 1, 1 << 1);
    Shades.renderSingleBitConstraintControlMask(workArea, allControl, 2, true);
    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, allControl, 0, false);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);
    Shades.renderAddBitConstraintToControlMask(workArea, texture2x2, allControl, 0, true);
    assertThat(workArea.readPixelColorFloats(texture2x2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]);
});

suite.webGlTest("renderAddBitConstraintToControlMask_buildup", () => {
    let workArea = new WglWorkArea();
    let texture2x4_0 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_1 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_2 = new WglTexture(1 << 2, 1 << 1);
    let texture2x4_3 = new WglTexture(1 << 2, 1 << 1);
    Shades.renderSingleBitConstraintControlMask(workArea, texture2x4_0, 0, false);
    Shades.renderAddBitConstraintToControlMask(workArea, texture2x4_1, texture2x4_0, 1, true);
    Shades.renderAddBitConstraintToControlMask(workArea, texture2x4_2, texture2x4_1, 2, true);
    Shades.renderAddBitConstraintToControlMask(workArea, texture2x4_3, texture2x4_2, 1, false);
    assertThat(workArea.readPixelColorFloats(texture2x4_0)).isEqualTo([
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);
    assertThat(workArea.readPixelColorFloats(texture2x4_1)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);
    assertThat(workArea.readPixelColorFloats(texture2x4_2)).isEqualTo([
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0
    ]);
    assertThat(workArea.readPixelColorFloats(texture2x4_3)).isEqualTo([
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
