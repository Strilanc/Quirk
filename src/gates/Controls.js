import Gate from "src/circuit/Gate.js"
import GatePainting from "src/draw/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"

let Controls = {};
export default Controls;

Controls.Control = Gate.fromIdentity(
    "•",
    "Control",
    "Conditions on a qubit being ON.\nGates in the same column only apply to states meeting the condition.").
    withSerializedId("•").
    markedAsControl(true).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        args.painter.fillCircle(args.rect.center(), 5, "black");
    });

Controls.AntiControl = Gate.fromIdentity(
    "◦",
    "Anti-Control",
    "Conditions on a qubit being OFF.\nGates in the same column only apply to states meeting the condition.").
    withSerializedId("◦").
    markedAsControl(false).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
    });

Controls.PlusControl = Gate.withoutKnownMatrix(
    "⊕",
    "Plus Control",
    "Conditions on a qubit being ON+OFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    markedAsControl(false).
    withSerializedId("⊕").
    withCustomShaders([]).
    markedAsStable().
    withSetupShaders(
        [args => GateShaders.matrixOperation(args.stateTexture, Matrix.HADAMARD, args.row, args.controlsTexture)],
        [args => GateShaders.matrixOperation(args.stateTexture, Matrix.HADAMARD, args.row, args.controlsTexture)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
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
    "Conditions on a qubit being ON-OFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    withSerializedId("⊖").
    withCustomShaders([]).
    markedAsControl(true).
    markedAsStable().
    withSetupShaders(
        [args => GateShaders.matrixOperation(args.stateTexture, Matrix.HADAMARD, args.row, args.controlsTexture)],
        [args => GateShaders.matrixOperation(args.stateTexture, Matrix.HADAMARD, args.row, args.controlsTexture)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
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
    "Conditions on a qubit being ON+iOFF.\n" +
        "Gates in the same column only apply to states meeting the condition.").
    markedAsControl(true).
    withSerializedId("⊗").
    withCustomShaders([]).
    markedAsStable().
    withSetupShaders(
        [args => GateShaders.matrixOperation(args.stateTexture, x2, args.row, args.controlsTexture)],
        [args => GateShaders.matrixOperation(args.stateTexture, x1, args.row, args.controlsTexture)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        let r = 5*Math.sqrt(0.5);
        args.painter.strokeLine(p.offsetBy(+r, +r), p.offsetBy(-r, -r));
        args.painter.strokeLine(p.offsetBy(+r, -r), p.offsetBy(-r, +r));
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
        }
    });
Controls.AntiCrossControl = Gate.withoutKnownMatrix(
    "(/)",
    "Anti-Cross Control",
    "Conditions on a qubit being ON-iOFF.\n" +
    "Gates in the same column only apply to states meeting the condition.").
    markedAsControl(true).
    withSerializedId("(/)").
    withCustomShaders([]).
    markedAsStable().
    withSetupShaders(
        [args => GateShaders.matrixOperation(args.stateTexture, x1, args.row, args.controlsTexture)],
        [args => GateShaders.matrixOperation(args.stateTexture, x2, args.row, args.controlsTexture)]).
    withCustomDrawer(args => {
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        }
        let p = args.rect.center();
        args.painter.fillCircle(p, 5);
        args.painter.strokeCircle(p, 5);
        let r = 5*Math.sqrt(0.5)*1.1;
        args.painter.strokeLine(p.offsetBy(+r, -r), p.offsetBy(-r, +r));
        if (args.isInToolbox || args.isHighlighted) {
            GatePainting.paintOutline(args);
        }
    });

Controls.all = [
    Controls.Control,
    Controls.AntiControl,
    Controls.PlusControl,
    Controls.MinusControl,
    Controls.CrossControl,
    Controls.AntiCrossControl
];
