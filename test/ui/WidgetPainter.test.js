import { Suite, assertThat } from "test/TestUtil.js"
import WidgetPainter from "src/ui/WidgetPainter.js"

import Format from "src/base/Format.js"
import Gates from "src/ui/Gates.js"
import Painter from "src/ui/Painter.js"
import Rect from "src/math/Rect.js"
import Complex from "src/math/Complex.js"

let suite = new Suite("WidgetPainter");

suite.canvasAppearanceTest("paintGateTooltip", 100, 100, canvas => {
    let painter = new Painter(canvas);
    WidgetPainter.paintGateTooltip(
        painter,
        new Rect(0, 0, 100, 100),
        Gates.QuarterTurns.SqrtXBackward,
        0);
}, 'data:image/png;base64,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'
    , 6000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);

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
    assertThat(WidgetPainter.describeKet(2, 1, 1, Format.SIMPLIFIED)).isEqualTo('|01⟩');
    assertThat(WidgetPainter.describeKet(2, 2, 1, Format.SIMPLIFIED)).isEqualTo('|10⟩');
    assertThat(WidgetPainter.describeKet(2, 3, 1, Format.SIMPLIFIED)).isEqualTo('|11⟩');

    assertThat(WidgetPainter.describeKet(2, 0, new Complex(-1, 0), Format.SIMPLIFIED)).isEqualTo('-|00⟩');
    assertThat(WidgetPainter.describeKet(2, 1, new Complex(0, 1), Format.SIMPLIFIED)).isEqualTo('i|01⟩');
    assertThat(WidgetPainter.describeKet(2, 2, new Complex(0, -1), Format.SIMPLIFIED)).isEqualTo('-i|10⟩');
    assertThat(WidgetPainter.describeKet(2, 3, new Complex(1, 1), Format.SIMPLIFIED)).isEqualTo('(1+i)·|11⟩');
});
