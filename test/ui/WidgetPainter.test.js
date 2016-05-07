import { Suite, assertThat } from "test/TestUtil.js"
import WidgetPainter from "src/ui/WidgetPainter.js"

import Format from "src/base/Format.js"
import Gates from "src/ui/Gates.js"
import Painter from "src/ui/Painter.js"
import Rect from "src/math/Rect.js"
import Complex from "src/math/Complex.js"

let suite = new Suite("WidgetPainter");

suite.test("describeAxis", () => {
    let s = Math.sqrt(2);

    assertThat(WidgetPainter.describeAxis([1, 0, 0], Format.SIMPLIFIED)).isEqualTo("X");
    assertThat(WidgetPainter.describeAxis([0, 1, 0], Format.SIMPLIFIED)).isEqualTo("Y");
    assertThat(WidgetPainter.describeAxis([0, 0, 1], Format.SIMPLIFIED)).isEqualTo("Z");

    assertThat(WidgetPainter.describeAxis([s, s, 0], Format.SIMPLIFIED)).isEqualTo("X + Y");
    assertThat(WidgetPainter.describeAxis([0, s, s], Format.SIMPLIFIED)).isEqualTo("Y + Z");
    assertThat(WidgetPainter.describeAxis([s, 0, s], Format.SIMPLIFIED)).isEqualTo("X + Z");

    assertThat(WidgetPainter.describeAxis([-s, s, 0], Format.SIMPLIFIED)).isEqualTo("-X + Y");
    assertThat(WidgetPainter.describeAxis([0, -s, s], Format.SIMPLIFIED)).isEqualTo("-Y + Z");
    assertThat(WidgetPainter.describeAxis([s, 0, -s], Format.SIMPLIFIED)).isEqualTo("X - Z");

    assertThat(WidgetPainter.describeAxis([1, -1, 1], Format.SIMPLIFIED)).isEqualTo("X - Y + Z");

    assertThat(WidgetPainter.describeAxis([1, 0.5, 0.25], Format.SIMPLIFIED)).isEqualTo("X + ½·Y + ¼·Z");
    assertThat(WidgetPainter.describeAxis([1, 0.5, 0.25], Format.CONSISTENT)).isEqualTo("X + 0.50·Y + 0.25·Z");
});

suite.test("describeKet", () => {
    assertThat(WidgetPainter.describeKet(1, 0, 1, Format.SIMPLIFIED)).isEqualTo('|0⟩');
    assertThat(WidgetPainter.describeKet(1, 1, 1, Format.SIMPLIFIED)).isEqualTo('|1⟩');

    assertThat(WidgetPainter.describeKet(2, 0, 1, Format.SIMPLIFIED)).isEqualTo('|00⟩');
    assertThat(WidgetPainter.describeKet(2, 1, 1, Format.SIMPLIFIED)).isEqualTo('|10⟩');
    assertThat(WidgetPainter.describeKet(2, 2, 1, Format.SIMPLIFIED)).isEqualTo('|01⟩');
    assertThat(WidgetPainter.describeKet(2, 3, 1, Format.SIMPLIFIED)).isEqualTo('|11⟩');

    assertThat(WidgetPainter.describeKet(2, 0, new Complex(-1, 0), Format.SIMPLIFIED)).isEqualTo('-|00⟩');
    assertThat(WidgetPainter.describeKet(2, 1, Complex.I, Format.SIMPLIFIED)).isEqualTo('i|10⟩');
    assertThat(WidgetPainter.describeKet(2, 2, new Complex(0, -1), Format.SIMPLIFIED)).isEqualTo('-i|01⟩');
    assertThat(WidgetPainter.describeKet(2, 3, new Complex(1, 1), Format.SIMPLIFIED)).isEqualTo('(1+i)·|11⟩');
});
