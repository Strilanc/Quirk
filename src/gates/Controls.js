import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"

let Controls = {};
export default Controls;

Controls.Control = Gate.fromIdentity(
    "•",
    "Control",
    "Conditions on a qubit being ON.\nGates in the same column will only apply to states meeting the condition.").
    withSerializedId("•").
    markedAsControl(true).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
            GatePainting.paintBackground(args);
        }
        args.painter.fillCircle(args.rect.center(), 5, "black");
    });

Controls.AntiControl = Gate.fromIdentity(
    "◦",
    "Anti-Control",
    "Conditions on a qubit being OFF.\nGates in the same column will only apply to states meeting the condition.").
    withSerializedId("◦").
    markedAsControl(false).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
            GatePainting.paintBackground(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
    });

Controls.PlusControl = Gate.withoutKnownMatrix(
    "⊕",
    "Plus Control",
    "Conditions on a qubit being ON+OFF.\nGates in the same column will only apply to states meeting the condition.").
    markedAsControl(false).
    withSerializedId("⊕").
    withCustomShaders([]).
    markedAsStable().
    withSetupShaders(
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)],
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
            GatePainting.paintBackground(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        args.painter.strokeLine(p.offsetBy(0, -5), p.offsetBy(0, +5));
        args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
    });

Controls.MinusControl = Gate.withoutKnownMatrix(
    "⊖",
    "Minus Control",
    "Conditions on a qubit being ON-OFF.\nGates in the same column will only apply to states meeting the condition.").
    withSerializedId("⊖").
    withCustomShaders([]).
    markedAsControl(true).
    markedAsStable().
    withSetupShaders(
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)],
        [(val, con, bit) => GateShaders.qubitOperation(val, Matrix.HADAMARD, bit, con)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
            GatePainting.paintBackground(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        args.painter.strokeLine(p.offsetBy(-5, 0), p.offsetBy(+5, 0));
    });

let x1 = Matrix.fromPauliRotation(0.25, 0, 0);
let x2 = Matrix.fromPauliRotation(-0.25, 0, 0);
Controls.CrossControl = Gate.withoutKnownMatrix(
    "⊗",
    "Cross Control",
    "Conditions on a qubit being ON+iOFF.\nGates in the same column will only apply to states meeting the condition.").
    markedAsControl(true).
    withSerializedId("⊗").
    withCustomShaders([]).
    markedAsStable().
    withSetupShaders(
        [(val, con, bit) => GateShaders.qubitOperation(val, x2, bit, con)],
        [(val, con, bit) => GateShaders.qubitOperation(val, x1, bit, con)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
            GatePainting.paintBackground(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        let r = 5*Math.sqrt(0.5);
        args.painter.strokeLine(p.offsetBy(+r, +r), p.offsetBy(-r, -r));
        args.painter.strokeLine(p.offsetBy(+r, -r), p.offsetBy(-r, +r));
    });

Controls.all = [
    Controls.Control,
    Controls.AntiControl,
    Controls.PlusControl,
    Controls.MinusControl,
    Controls.CrossControl
];
