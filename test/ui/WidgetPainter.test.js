import { Suite, assertThat } from "test/TestUtil.js"
import Painter from "src/ui/Painter.js"
import WidgetPainter from "src/ui/WidgetPainter.js"
import Rect from "src/base/Rect.js"
import Gates from "src/ui/Gates.js"

let suite = new Suite("WidgetPainter");

suite.canvasAppearanceTest("paintGateTooltip", 100, 100, canvas => {
    let painter = new Painter(canvas);
    WidgetPainter.paintGateTooltip(
        painter,
        new Rect(0, 0, 100, 100),
        Gates.Named.QuarterTurns.Up,
        0);
}, 'data:image/png;base64,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' +
'AAAAASUVORK5CYII='
    , 3000); // Text rendering differs quite a bit from system to system... hard to test it effectively.);
