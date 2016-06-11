import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"

let Controls = {};
export default Controls;

Controls.Control = Gate.fromIdentity(
    "",
    "Control",
    "Conditions on a qubit being ON.\nGates in the same column will only apply to states meeting the condition.").
    withSerializedId("•").
    markedAsControl(true).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        args.painter.fillCircle(args.rect.center(), 5, "black");
    });

Controls.AntiControl = Gate.fromIdentity(
    "",
    "Anti-Control",
    "Conditions on a qubit being OFF.\nGates in the same column will only apply to states meeting the condition.").
    withSerializedId("◦").
    markedAsControl(false).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
    });

Controls.PlusControl = Gate.withoutKnownMatrix(
    "",
    "Plus Control",
    "Conditions on a qubit being ON+OFF.\nGates in the same column will only apply to states meeting the condition.").
    markedAsControl(false).
    withSerializedId("⊕").
    withCustomShaders([]).
    withSetupShaders(
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)],
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        args.painter.strokeLine(p.offsetBy(0, -5), p.offsetBy(0, +5));
        args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
    });

Controls.MinusControl = Gate.withoutKnownMatrix(
    "",
    "Minus Control",
    "Conditions on a qubit being ON-OFF.\nGates in the same column will only apply to states meeting the condition.").
    withSerializedId("⊖").
    withCustomShaders([]).
    markedAsControl(true).
    withSetupShaders(
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)],
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.DEFAULT_DRAWER(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
    });

Controls.all = [
    Controls.Control,
    Controls.AntiControl,
    Controls.PlusControl,
    Controls.MinusControl
];
