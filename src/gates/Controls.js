import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"

let Controls = {};
export default Controls;

Controls.Control = Gate.fromIdentity(
    "•",
    "Control",
    "Conditions on a qubit being ON.\nGates in the same column will only apply to states meeting the condition.").
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        args.painter.fillCircle(args.rect.center(), 5, "black");
    });

Controls.AntiControl = Gate.fromIdentity(
    "◦",
    "Anti-Control",
    "Conditions on a qubit being OFF.\nGates in the same column will only apply to states meeting the condition.").
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
    });

Controls.all = [
    Controls.Control,
    Controls.AntiControl
];
