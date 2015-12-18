import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GateFactory from "src/ui/GateFactory.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Seq from "src/base/Seq.js"

let Gates = {};
export default Gates;

Gates.Named = {
    Special: {
        Control: new Gate(
            "•",
            Matrix.CONTROL,
            "Control",
            "Conditions on a qubit being ON.",
            "Modifies operations in the same column to only occur in the parts of the superposition where the control " +
                "qubit is ON.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                }
                args.painter.fillCircle(args.rect.center(), 5, "black");
            }),

        AntiControl: new Gate(
            "◦",
            Matrix.ANTI_CONTROL,
            "Anti-Control",
            "Conditions on a qubit being OFF.",
            "Modifies operations in the same column to only occur in the parts of the superposition where the control " +
                "qubit is OFF.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                }
                let p = args.rect.center();
                args.painter.fillCircle(p, 5);
                args.painter.strokeCircle(p, 5);
            }),

        Peek: new Gate(
            "Peek",
            Matrix.identity(2),
            "Peek Gate",
            "Shows the conditional chance that a wire is ON.",
            "The displayed value is P(target GIVEN controls); don't confuse it with P(target AND controls). " +
            "Magically doesn't affect the system in any way: no measurements are simulated.",
            args => {
                if (args.positionInCircuit === null || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                    return;
                }

                let {row, col} = args.positionInCircuit;
                MathPainter.paintProbabilityBox(
                    args.painter,
                    args.stats.probability(row, col, true),
                    args.rect);
            }),

        Tomography: new Gate(
            "State",
            Matrix.identity(2),
            "Tomography Gate",
            "Shows the density matrix of one or more qubits.",
            "The displayed state is conditioned on any controls, and marginalized over any un-involved qubits. " +
            "Magically doesn't affect the system in any way: no measurements are simulated.",
                args => {
                if (args.positionInCircuit === null || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                    return;
                }

                let {row, col} = args.positionInCircuit;
                MathPainter.paintProbabilityBox(
                    args.painter,
                    args.stats.probability(row, col, true),
                    args.rect);
            }),

        Measurement: new Gate(
            "Measure",
            Matrix.identity(2),
            "Measurement Gate",
            "Measures a qubit in the computational basis, along the Z axis.",
            "Decoheres the qubit into a classical bit. " +
                "For simplicity, the simulator blocks non-classical operations on measured qubits.",
                // And by 'simplicity' I mostly mean code-wise and time-cost-wise. Allowing mixed states would square
                // the amount of information being processed; much easier to lean on the deferred measurement principle.
            args => {
                let backColor = Config.GATE_FILL_COLOR;
                if (args.isHighlighted) {
                    backColor = Config.HIGHLIGHT_COLOR_GATE;
                }
                args.painter.fillRect(args.rect, backColor);
                args.painter.strokeRect(args.rect);

                let r = args.rect.w*0.4;
                let {x, y} = args.rect.center();
                y += r*0.6;
                let a = -Math.PI/3;
                let [c, s] = [Math.cos(a)*r*1.5, Math.sin(a)*r*1.5];
                let [p, q] = [x + c, y + s];

                // Draw the dial and shaft.
                args.painter.ctx.beginPath();
                args.painter.ctx.arc(x, y, r, Math.PI, 2*Math.PI);
                args.painter.ctx.moveTo(x, y);
                args.painter.ctx.lineTo(p, q);
                args.painter.ctx.strokeStyle = 'black';
                args.painter.ctx.lineWidth = 1;
                args.painter.ctx.stroke();
                // Draw the indicator head.
                args.painter.fillArrowHead(p, q, r*0.3, a, Math.PI/2, 'black');
            }),

        SwapHalf: new Gate(
            "Swap",
            Matrix.square([1, 0, 0, 0,
                0, 0, 1, 0,
                0, 1, 0, 0,
                0, 0, 0, 1]),
            "Swap Gate [Half]",
            "Swaps the values of two qubits.",
            "Place two swap gate halves in the same column to form a swap gate.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                    return;
                }

                let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
                args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
                args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
            })
    },

    QuarterTurns: {
        Down: new Gate(
            "X^+½",
            Matrix.fromPauliRotation(0.25, 0, 0),
            "Half X Gate (+)",
            "Principle Square Root of Not",
            "A +90\u00B0 rotation around the Bloch Sphere's X axis. " +
                "Apply twice for the same effect as an X gate.",
            GateFactory.POWER_DRAWER),

        Up: new Gate(
            "X^-½",
            Matrix.fromPauliRotation(0.75, 0, 0),
            "Half X Gate (-)",
            "Adjoint Square Root of Not",
            "A -90\u00B0 rotation around the Bloch Sphere's X axis. " +
                "Apply twice for the same effect as an X gate.",
            GateFactory.POWER_DRAWER),

        Right: new Gate(
            "Y^+½",
            Matrix.fromPauliRotation(0, 0.25, 0),
            "Half Y Gate (+)",
            "Principle Square Root of Y.",
            "A +90\u00B0 rotation around the Bloch Sphere's Y axis. " +
                "Apply twice for the same effect as a Y gate.",
            GateFactory.POWER_DRAWER),

        Left: new Gate(
            "Y^-½",
            Matrix.fromPauliRotation(0, 0.75, 0),
            "Half Y Gate (-)",
            "Adjoint Square Root of Y.",
            "A -90\u00B0 rotation around the Bloch Sphere's Y axis. " +
                "Apply twice for the same effect as a Y gate.",
            GateFactory.POWER_DRAWER),

        CounterClockwise: new Gate(
            "Z^+½",
            Matrix.fromPauliRotation(0, 0, 0.25),
            "Half Z Gate (+) ['S' gate]",
            "Principle Square Root of Z.",
            "Phases ON by a factor of i, without affecting OFF. " +
                "A +90\u00B0 rotation around the Bloch Sphere's Z axis. " +
                "Apply twice for the same effect as a Z gate.",
            GateFactory.POWER_DRAWER),

        Clockwise: new Gate(
            "Z^-½",
            Matrix.fromPauliRotation(0, 0, 0.75),
            "Half Z Gate (-)",
            "Adjoint Square Root of Z.",
            "Phases ON by a factor of -i, without affecting OFF. " +
                "A +90\u00B0 rotation around the Bloch Sphere's Z axis. " +
                "Apply twice for the same effect as a Z gate.",
            GateFactory.POWER_DRAWER)
    },
    HalfTurns: {
        X: new Gate(
            "X",
            Matrix.PAULI_X,
            "Not Gate [Pauli X Gate]",
            "Toggles between ON and OFF.",
            "Toggles the qubit's value in the computational basis. " +
                "A 180° turn around the Bloch Sphere's X axis.",
            args => {
                let hasSingleWireControl =
                    args.positionInCircuit !== null &&
                    args.stats.circuitDefinition.colHasSingleWireControl(args.positionInCircuit.col);
                let hasDoubleWireControl =
                    args.positionInCircuit !== null &&
                    args.stats.circuitDefinition.colHasDoubleWireControl(args.positionInCircuit.col);
                if ((!hasSingleWireControl && !hasDoubleWireControl) || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                    return;
                }

                let drawArea = args.rect.scaledOutwardBy(0.6);
                args.painter.fillCircle(drawArea.center(), drawArea.w / 2);
                args.painter.strokeCircle(drawArea.center(), drawArea.w / 2);
                if (hasSingleWireControl) {
                    args.painter.strokeLine(drawArea.topCenter(), drawArea.bottomCenter());
                }
                if (hasDoubleWireControl) {
                    args.painter.strokeLine(drawArea.topCenter().offsetBy(-1, 0), drawArea.bottomCenter().offsetBy(-1, 0));
                    args.painter.strokeLine(drawArea.topCenter().offsetBy(+1, 0), drawArea.bottomCenter().offsetBy(+1, 0));
                }
                let isMeasured = args.stats.circuitDefinition.locIsMeasured(new Point(args.positionInCircuit.col, args.positionInCircuit.row));
                if (isMeasured) {
                    args.painter.strokeLine(drawArea.centerLeft().offsetBy(0, -1), drawArea.centerRight().offsetBy(0, -1));
                    args.painter.strokeLine(drawArea.centerLeft().offsetBy(0, +1), drawArea.centerRight().offsetBy(0, +1));
                } else {
                    args.painter.strokeLine(drawArea.centerLeft(), drawArea.centerRight());
                }
            }),

        Y: new Gate(
            "Y",
            Matrix.PAULI_Y,
            "Pauli Y Gate",
            "A combination of the X and Z gates.",
            "A 180° turn around the Bloch Sphere's Y axis.",
            GateFactory.DEFAULT_DRAWER),

        Z: new Gate(
            "Z",
            Matrix.PAULI_Z,
            "Phase Flip Gate [Pauli Z Gate]",
            "Negates the amplitude of states where the qubit is ON.",
            "A 180° turn around the Bloch Sphere's Z axis.",
            GateFactory.DEFAULT_DRAWER),

        H: new Gate(
            "H",
            Matrix.HADAMARD,
            "Hadamard Gate",
            "Creates/cancels uniform superpositions.",
            "Toggles between ON and ON+OFF; also toggles between OFF and ON-OFF. " +
                "A 180° turn around the Bloch Sphere's diagonal X+Z axis. " +
                "Useful for creating uniform superpositions of all states.",
            GateFactory.DEFAULT_DRAWER)
    },
    Exponentiating: {
        ExpiX: new Gate(
            "e^+iXt",
            t => Matrix.PAULI_X.liftApply(c => c.times(Math.PI * 2 * t).times(Complex.I).exp()),
            "Exponentiating X Gate",
            "A gradual spin around the Bloch Sphere's X axis",
            "Never actually equals X, due to the accumulating phase caused by the matrix exponentiation.",
            GateFactory.CYCLE_DRAWER),

        AntiExpiX: new Gate(
            "e^-iXt",
            t => Matrix.PAULI_X.liftApply(c => c.times(Math.PI * 2 * -t).times(Complex.I).exp()),
            "Inverse Exponentiating X Gate",
            "A gradual counter-spin around the Bloch Sphere's X axis",
            "Never actually equals X, due to the accumulating phase caused by the matrix exponentiation.",
            GateFactory.CYCLE_DRAWER),

        ExpiY: new Gate(
            "e^+iYt",
            t => Matrix.PAULI_Y.liftApply(c => c.times(Math.PI * 2 * t).times(Complex.I).exp()),
            "Exponentiating Y Gate",
            "A gradual spin around the Bloch Sphere's Y axis",
            "Corresponds to real 2x2 rotation matrices. " +
                "Never actually equals Y, due to the accumulating phase caused by the matrix exponentiation.",
            GateFactory.CYCLE_DRAWER),

        AntiExpiY: new Gate(
            "e^-iYt",
            t => Matrix.PAULI_Y.liftApply(c => c.times(Math.PI * 2 * -t).times(Complex.I).exp()),
            "Inverse Exponentiating Y Gate",
            "A gradual counter-spin around the Bloch Sphere's Y axis",
            "Corresponds to real 2x2 rotation matrices. " +
                "Never actually equals Y, due to the accumulating phase caused by the matrix exponentiation.",
            GateFactory.CYCLE_DRAWER),

        ExpiZ: new Gate(
            "e^+iZt",
            t => Matrix.PAULI_Z.liftApply(c => c.times(Math.PI * 2 * t).times(Complex.I).exp()),
            "Exponentiating Z Gate",
            "A gradual spin around the Bloch Sphere's Z axis",
            "Never actually equals Z, due to the accumulating phase caused by the matrix exponentiation.",
            GateFactory.CYCLE_DRAWER),

        AntiExpiZ: new Gate(
            "e^-iZt",
            t => Matrix.PAULI_Z.liftApply(c => c.times(Math.PI * 2 * -t).times(Complex.I).exp()),
            "Inverse Exponentiating Z Gate",
            "A gradual counter-spin around the Bloch Sphere's Z axis",
            "Never actually equals Z, due to the accumulating phase caused by the matrix exponentiation.",
            GateFactory.CYCLE_DRAWER)
    },
    Powering: {
        X: new Gate(
            "X^t",
            t => Matrix.PAULI_X.liftApply(c => c.raisedTo(t * 2)),
            "Evolving X Gate",
            "Interpolates between no-op and the Not Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's X axis.",
            GateFactory.CYCLE_DRAWER),

        AntiX: new Gate(
            "X^-t",
            t => Matrix.PAULI_X.liftApply(c => c.raisedTo(-t * 2)),
            "Evolving Anti X Gate",
            "Interpolates between no-op and the Not Gate over time.",
            "Performs a continuous phase-corrected counter rotation around the Bloch Sphere's X axis.",
            GateFactory.CYCLE_DRAWER),

        Y: new Gate(
            "Y^t",
            t => Matrix.PAULI_Y.liftApply(c => c.raisedTo(t * 2)),
            "Evolving Y Gate",
            "Interpolates between no-op and the Pauli Y Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's Y axis.",
            GateFactory.CYCLE_DRAWER),

        AntiY: new Gate(
            "Y^-t",
            t => Matrix.PAULI_Y.liftApply(c => c.raisedTo(-t * 2)),
            "Evolving Anti Y Gate",
            "Interpolates between no-op and the Pauli Y Gate over time.",
            "Performs a continuous phase-corrected counter rotation around the Bloch Sphere's Y axis.",
            GateFactory.CYCLE_DRAWER),

        Z: new Gate(
            "Z^t",
            t => Matrix.PAULI_Z.liftApply(c => c.raisedTo(t * 2)),
            "Evolving Z Gate",
            "Interpolates between no-op and the Phase Flip Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's Z axis.",
            GateFactory.CYCLE_DRAWER),

        AntiZ: new Gate(
            "Z^-t",
            t => Matrix.PAULI_Z.liftApply(c => c.raisedTo(-t * 2)),
            "Evolving Anti Z Gate",
            "Interpolates between no-op and the Phase Flip Gate over time.",
            "Performs a continuous phase-corrected counter rotation around the Bloch Sphere's Z axis.",
            GateFactory.CYCLE_DRAWER)
    },
    Silly: {
        FUZZ_SYMBOL: "Fuzz",
        FUZZ_MAKER: () => new Gate(
            Gates.Named.Silly.FUZZ_SYMBOL,
            Matrix.square([
                new Complex(Math.random() - 0.5, Math.random() - 0.5),
                new Complex(Math.random() - 0.5, Math.random() - 0.5),
                new Complex(Math.random() - 0.5, Math.random() - 0.5),
                new Complex(Math.random() - 0.5, Math.random() - 0.5)
            ]).closestUnitary(),
            "Fuzz Gate",
            "Differs every time you grab a new one.",
            "",
            GateFactory.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX),

        RESET: new Gate(
            "!Reset",
            Matrix.square([1, 1, 0, 0]),
            "Reset Gate [NOT UNITARY]",
            "Sends all amplitude into the OFF state, then renormalizes.",
            "Bad things happen when the ON and OFF amplitudes destructively interfere. " +
                "Equivalent to post-selection (modulo some Hadamard gates).",
            GateFactory.DEFAULT_DRAWER),

        POST_SELECT: new Gate(
            "!Select",
            Matrix.square([0, 0, 0, 1]),
            "Post-selection Gate",
            "Discards OFF states, then renormalizes.",
            "Search terms: PostBQP, Quantum Suicide, Weak Measurement.",
            GateFactory.DEFAULT_DRAWER),

        VOID: new Gate(
            "!Void",
            Matrix.square([0, 0, 0, 0]),
            "Void Gate [NOT UNITARY]",
            "Zeroes all amplitudes, then renormalizes.",
            "This kills the universe. If you use controls then it post-selects on the controls being met.",
            GateFactory.DEFAULT_DRAWER),

        SPACER: new Gate(
            "…",
            Matrix.identity(2),
            "Spacer",
            "A gate with no effect.",
            "Only useful for affecting the auto-layout of the circuit",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    let backColor = Config.GATE_FILL_COLOR;
                    if (args.isHighlighted) {
                        backColor = Config.HIGHLIGHT_COLOR_GATE;
                    }
                    args.painter.fillRect(args.rect, backColor);
                    args.painter.strokeRect(args.rect);
                } else {
                    let {x, y} = args.rect.center();
                    let r = new Rect(x - 14, y - 2, 28, 4);
                    args.painter.fillRect(r, Config.BACKGROUND_COLOR_CIRCUIT);
                }
                args.painter.fillCircle(args.rect.center().offsetBy(7, 0), 2, "black");
                args.painter.fillCircle(args.rect.center(), 2, "black");
                args.painter.fillCircle(args.rect.center().offsetBy(-7, 0), 2, "black");
            }
        )
    }
};

/** @type {!Array<!{hint: !string, gates: !Array<?Gate>}>} */
Gates.Sets = [
    {
        hint: "Special",
        gates: [
            Gates.Named.Special.Control,
            Gates.Named.Special.Measurement,
            Gates.Named.Special.Peek,
            Gates.Named.Special.AntiControl,
            null,
            Gates.Named.Special.Tomography
        ]
    },
    {
        hint: "Half Turns",
        gates: [
            Gates.Named.HalfTurns.H,
            null,
            Gates.Named.Special.SwapHalf,
            Gates.Named.HalfTurns.X,
            Gates.Named.HalfTurns.Y,
            Gates.Named.HalfTurns.Z
        ]
    },
    {
        hint: "Quarter Turns",
        gates: [
            Gates.Named.QuarterTurns.Down,
            Gates.Named.QuarterTurns.Right,
            Gates.Named.QuarterTurns.CounterClockwise,
            Gates.Named.QuarterTurns.Up,
            Gates.Named.QuarterTurns.Left,
            Gates.Named.QuarterTurns.Clockwise
        ]
    },
    {
        hint: "Powering",
        gates: [
            Gates.Named.Powering.X,
            Gates.Named.Powering.Y,
            Gates.Named.Powering.Z,
            Gates.Named.Powering.AntiX,
            Gates.Named.Powering.AntiY,
            Gates.Named.Powering.AntiZ
        ]
    },
    {
        hint: "Exponentiating",
        gates: [
            Gates.Named.Exponentiating.ExpiX,
            Gates.Named.Exponentiating.ExpiY,
            Gates.Named.Exponentiating.ExpiZ,
            Gates.Named.Exponentiating.AntiExpiX,
            Gates.Named.Exponentiating.AntiExpiY,
            Gates.Named.Exponentiating.AntiExpiZ
        ]
    },
    {
        hint: "Other Z",
        gates: [
            GateFactory.fromPauliRotation(0, 0, 1 / 6, "Z^+⅓"),
            GateFactory.fromPauliRotation(0, 0, 1 / 8, "Z^+¼"),
            GateFactory.fromPauliRotation(0, 0, 1 / 16, "Z^+⅛"),
            GateFactory.fromPauliRotation(0, 0, -1 / 6, "Z^-⅓"),
            GateFactory.fromPauliRotation(0, 0, -1 / 8, "Z^-¼"),
            GateFactory.fromPauliRotation(0, 0, -1 / 16, "Z^-⅛")
        ]
    },
    {
        hint: "Silly",
        gates: [
            Gates.Named.Silly.FUZZ_MAKER(),
            Gates.Named.Silly.SPACER,
            null,
            Gates.Named.Silly.POST_SELECT,
            Gates.Named.Silly.RESET,
            Gates.Named.Silly.VOID
        ]
    }
];

/** @type {!(!Gate[])} */
Gates.KnownToSerializer = [
    Gates.Named.Special.Control,
    Gates.Named.Special.SwapHalf,
    Gates.Named.Special.Peek,
    Gates.Named.Special.Tomography,
    Gates.Named.Special.Measurement,
    Gates.Named.Special.AntiControl,
    Gates.Named.Silly.SPACER,
    Gates.Named.Silly.VOID,
    Gates.Named.Silly.RESET,
    Gates.Named.Silly.POST_SELECT,
    Gates.Named.HalfTurns.H,
    Gates.Named.HalfTurns.X,
    Gates.Named.HalfTurns.Y,
    Gates.Named.HalfTurns.Z,
    Gates.Named.QuarterTurns.Down,
    Gates.Named.QuarterTurns.Right,
    Gates.Named.QuarterTurns.CounterClockwise,
    Gates.Named.QuarterTurns.Up,
    Gates.Named.QuarterTurns.Left,
    Gates.Named.QuarterTurns.Clockwise,
    Gates.Named.Powering.X,
    Gates.Named.Powering.Y,
    Gates.Named.Powering.Z,
    Gates.Named.Powering.AntiX,
    Gates.Named.Powering.AntiY,
    Gates.Named.Powering.AntiZ,
    Gates.Named.Exponentiating.ExpiX,
    Gates.Named.Exponentiating.ExpiY,
    Gates.Named.Exponentiating.ExpiZ,
    Gates.Named.Exponentiating.AntiExpiX,
    Gates.Named.Exponentiating.AntiExpiY,
    Gates.Named.Exponentiating.AntiExpiZ
];
