import Config from "src/Config.js"
import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import Rect from "src/math/Rect.js"

let SpacerGate = Gate.fromIdentity(
    "…",
    "Spacer",
    "A gate with no effect.").
    withCustomDrawer(args => {
        // Drawn as an ellipsis.
        if (args.isInToolbox || args.isHighlighted) {
            let backColor = Config.GATE_FILL_COLOR;
            if (args.isHighlighted) {
                backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
            }
            args.painter.fillRect(args.rect, backColor);
            GatePainting.paintOutline(args);
        } else {
            // Whitespace for the ellipsis.
            let {x, y} = args.rect.center();
            let r = new Rect(x - 14, y - 2, 28, 4);
            args.painter.fillRect(r, Config.BACKGROUND_COLOR_CIRCUIT);
        }
        args.painter.fillCircle(args.rect.center().offsetBy(7, 0), 2, "black");
        args.painter.fillCircle(args.rect.center(), 2, "black");
        args.painter.fillCircle(args.rect.center().offsetBy(-7, 0), 2, "black");
    });

export default SpacerGate;
