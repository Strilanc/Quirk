import Config from "src/Config.js"
import Complex from "src/math/Complex.js"
import Gate from "src/circuit/Gate.js"
import GateFactory from "src/ui/GateFactory.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"
import Seq from "src/base/Seq.js"

const τ = Math.PI * 2;

let Gates = {};
export default Gates;

Gates.Named = {
    Special: {
        Control: new Gate(
            "•",
            Matrix.identity(2),
            "Control",
            "Conditions on a qubit being ON.\n" +
                "Gates in the same column will only apply to states meeting the condition.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                }
                args.painter.fillCircle(args.rect.center(), 5, "black");
            }),

        AntiControl: new Gate(
            "◦",
            Matrix.identity(2),
            "Anti-Control",
            "Conditions on a qubit being OFF.\n" +
                "Gates in the same column will only apply to states meeting the condition.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    GateFactory.DEFAULT_DRAWER(args);
                }
                let p = args.rect.center();
                args.painter.fillCircle(p, 5);
                args.painter.strokeCircle(p, 5);
            }),

        ChanceDisplay: new Gate(
            "Chance",
            Matrix.identity(2),
            "Probability Display",
            "Shows the chance that measuring a wire would return ON.\n" +
                "Use controls to see conditional probabilities.",
            args => {
                if (args.positionInCircuit === null || args.isHighlighted) {
                    GateFactory.MAKE_HIGHLIGHTED_DRAWER(Config.DISPLAY_GATE_IN_TOOLBOX_FILL_COLOR)(args);
                    return;
                }

                let {row, col} = args.positionInCircuit;
                MathPainter.paintProbabilityBox(
                    args.painter,
                    args.stats.controlledWireProbabilityJustAfter(row, col),
                    args.rect);
            }),

        BlochSphereDisplay: new Gate(
            "Bloch",
            Matrix.identity(2),
            "Bloch Sphere Display",
            "Shows a wire's local state as a point on the Bloch Sphere.\n" +
                "Use controls to see conditional states.",
            args => {
                if (args.positionInCircuit === null || args.isHighlighted) {
                    GateFactory.MAKE_HIGHLIGHTED_DRAWER(Config.DISPLAY_GATE_IN_TOOLBOX_FILL_COLOR)(args);
                    return;
                }

                let {row, col} = args.positionInCircuit;
                let ρ = args.stats.densityMatrixAfterIfAvailable([row], col);
                MathPainter.paintBlochSphere(args.painter, ρ, args.rect);
            }),

        DensityMatrixDisplay: new Gate(
            "Density",
            Matrix.identity(2),
            "Density Matrix Display",
            "Shows a wire's local state as a density matrix.\n" +
                "Use controls to see conditional states.",
            args => {
                if (args.positionInCircuit === null || args.isHighlighted) {
                    GateFactory.MAKE_HIGHLIGHTED_DRAWER(Config.DISPLAY_GATE_IN_TOOLBOX_FILL_COLOR)(args);
                    return;
                }

                let {row, col} = args.positionInCircuit;
                let ρ = args.stats.densityMatrixAfterIfAvailable([row], col);
                MathPainter.paintDensityMatrix(args.painter, ρ, args.rect);
            }),

        Measurement: new Gate(
            "Measure",
            Matrix.identity(2),
            "Measurement Gate",
            "Measures a wire in the computational basis, along the Z axis.",
            args => {
                let backColor = Config.GATE_FILL_COLOR;
                if (args.isHighlighted) {
                    backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
                }
                args.painter.fillRect(args.rect, backColor);
                args.painter.strokeRect(args.rect);

                let r = args.rect.w*0.4;
                let {x, y} = args.rect.center();
                y += r*0.6;
                let a = -τ/6;
                let [c, s] = [Math.cos(a)*r*1.5, Math.sin(a)*r*1.5];
                let [p, q] = [x + c, y + s];

                // Draw the dial and shaft.
                args.painter.trace(trace => {
                    trace.ctx.arc(x, y, r, τ/2, τ);
                    trace.line(x, y, p, q);
                }).thenStroke('black');
                // Draw the indicator head.
                args.painter.trace(trace => trace.arrowHead(p, q, r*0.3, a, τ/4)).thenFill('black');
            }),

        SwapHalf: new Gate(
            "Swap",
            Matrix.square([1, 0, 0, 0,
                0, 0, 1, 0,
                0, 1, 0, 0,
                0, 0, 0, 1]),
            "Swap Gate [Half]",
            "Swaps the values of two qubits.\n" +
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
            "X^½",
            Matrix.fromPauliRotation(0.25, 0, 0),
            "√X Gate",
            "Principle square root of Not.",
            GateFactory.DEFAULT_DRAWER),

        Up: new Gate(
            "X^-½",
            Matrix.fromPauliRotation(0.75, 0, 0),
            "X^-½ Gate",
            "Adjoint square root of Not.",
            GateFactory.DEFAULT_DRAWER),

        Right: new Gate(
            "Y^½",
            Matrix.fromPauliRotation(0, 0.25, 0),
            "√Y Gate",
            "Principle square root of Y.",
            GateFactory.DEFAULT_DRAWER),

        Left: new Gate(
            "Y^-½",
            Matrix.fromPauliRotation(0, 0.75, 0),
            "Y^-½ Gate",
            "Adjoint square root of Y.",
            GateFactory.DEFAULT_DRAWER),

        CounterClockwise: new Gate(
            "Z^½",
            Matrix.fromPauliRotation(0, 0, 0.25),
            "√Z Gate",
            "Principle square root of Z.\nAlso known as the 'S' gate.",
            GateFactory.DEFAULT_DRAWER),

        Clockwise: new Gate(
            "Z^-½",
            Matrix.fromPauliRotation(0, 0, 0.75),
            "Z^-½ Gate",
            "Adjoint square root of Z.",
            GateFactory.DEFAULT_DRAWER)
    },

    OtherZ: {
        Z3: new Gate(
            "Z^⅓",
            Matrix.fromPauliRotation(0, 0, 1 / 6),
            "Z^⅓ Gate",
            "Principle third root of Z.",
            GateFactory.DEFAULT_DRAWER),
        Z3i: new Gate(
            "Z^-⅓",
            Matrix.fromPauliRotation(0, 0, -1 / 6),
            "Z^-⅓ Gate",
            "Adjoint third root of Z.",
            GateFactory.DEFAULT_DRAWER),
        Z4: new Gate(
            "Z^¼",
            Matrix.fromPauliRotation(0, 0, 1 / 8),
            "Z^¼ Gate",
            "Principle fourth root of Z.\nAlso known as the 'T' gate.",
            GateFactory.DEFAULT_DRAWER),
        Z4i: new Gate(
            "Z^-¼",
            Matrix.fromPauliRotation(0, 0, -1 / 8),
            "Z^-¼ Gate",
            "Adjoint fourth root of Z.",
            GateFactory.DEFAULT_DRAWER),
        Z8: new Gate(
            "Z^⅛",
            Matrix.fromPauliRotation(0, 0, 1 / 16),
            "Z^⅛ Gate",
            "Principle eighth root of Z.",
            GateFactory.DEFAULT_DRAWER),
        Z8i: new Gate(
            "Z^-⅛",
            Matrix.fromPauliRotation(0, 0, -1 / 16),
            "Z^-⅛ Gate",
            "Adjoint eighth root of Z.",
            GateFactory.DEFAULT_DRAWER)
    },

    HalfTurns: {
        X: new Gate(
            "X",
            Matrix.PAULI_X,
            "Pauli X Gate",
            "Toggles between ON and OFF.\nAlso known as the Not gate.",
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
            GateFactory.DEFAULT_DRAWER),

        Z: new Gate(
            "Z",
            Matrix.PAULI_Z,
            "Pauli Z Gate",
            "Negates the amplitude of states where the qubit is ON.\nAlso known as the Phase Flip gate.",
            GateFactory.DEFAULT_DRAWER),

        H: new Gate(
            "H",
            Matrix.HADAMARD,
            "Hadamard Gate",
            "The simplest non-classical gate.\n" +
                "Toggles between ON and ON+OFF. Toggles between OFF and ON-OFF.",
            GateFactory.DEFAULT_DRAWER)
    },
    Exponentiating: {
        XForward: new Gate(
            "e^-iXt",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([c, 0, 0, -s, 0, -s, c, 0]));
            },
            "X-Exponentiating Gate (forward)",
            "A continuous right-handed rotation around the X axis.\n" +
                "Passes through ±iX instead of X.",
            GateFactory.CYCLE_DRAWER),

        XBackward: new Gate(
            "e^iXt",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([c, 0, 0, s, 0, s, c, 0]));
            },
            "X-Exponentiating Gate (backward)",
            "A continuous left-handed rotation around the X axis.\n" +
                "Passes through ±iX instead of X.",
            GateFactory.CYCLE_DRAWER),

        YForward: new Gate(
            "e^-iYt",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([c, 0, -s, 0, s, 0, c, 0]));
            },
            "Y-Exponentiating Gate (forward)",
            "A continuous right-handed rotation around the Y axis.\n" +
                "Passes through ±iY instead of Y.",
            GateFactory.CYCLE_DRAWER),

        YBackward: new Gate(
            "e^iYt",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([c, 0, s, 0, -s, 0, c, 0]));
            },
            "Y-Exponentiating Gate (backward)",
            "A continuous left-handed rotation around the Y axis.\n" +
                "Passes through ±iY instead of Y.",
            GateFactory.CYCLE_DRAWER),

        ZForward: new Gate(
            "e^-iZt",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([c, -s, 0, 0, 0, 0, c, s]));
            },
            "Z-Exponentiating Gate (forward)",
            "A continuous right-handed rotation around the Z axis.\n" +
                "Passes through ±iZ instead of Z.",
            GateFactory.CYCLE_DRAWER),

        ZBackward: new Gate(
            "e^iZt",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([c, s, 0, 0, 0, 0, c, -s]));
            },
            "Z-Exponentiating Gate (backward)",
            "A continuous left-handed rotation around the Z axis.\n" +
                "Passes through ±iZ instead of Z.",
            GateFactory.CYCLE_DRAWER)
    },
    Powering: {
        XForward: new Gate(
            "X^t",
            t => {
                let c = Math.cos(τ * t) / 2;
                let s = Math.sin(τ * t) / 2;
                return new Matrix(2, 2, new Float32Array([0.5+c, s, 0.5-c, -s, 0.5-c, -s, 0.5+c, s]));
            },
            "X-Raising Gate (forward)",
            "A continuous right-handed cycle between the X gate and no-op.",
            GateFactory.CYCLE_DRAWER),

        XBackward: new Gate(
            "X^-t",
            t => {
                let c = Math.cos(τ * -t) / 2;
                let s = Math.sin(τ * -t) / 2;
                return new Matrix(2, 2, new Float32Array([0.5+c, s, 0.5-c, -s, 0.5-c, -s, 0.5+c, s]));
            },
            "X-Raising Gate (backward)",
            "A continuous left-handed cycle between the X gate and no-op.",
            GateFactory.CYCLE_DRAWER),

        YForward: new Gate(
            "Y^t",
            t => {
                let c = Math.cos(τ * t) / 2;
                let s = Math.sin(τ * t) / 2;
                return new Matrix(2, 2, new Float32Array([0.5+c, s, -s, c-0.5, s, 0.5-c, 0.5+c, s]));
            },
            "Y-Raising Gate (forward)",
            "A continuous right-handed cycle between the Y gate and no-op.",
            GateFactory.CYCLE_DRAWER),

        YBackward: new Gate(
            "Y^-t",
            t => {
                let c = Math.cos(τ * -t) / 2;
                let s = Math.sin(τ * -t) / 2;
                return new Matrix(2, 2, new Float32Array([0.5+c, s, -s, c-0.5, s, 0.5-c, 0.5+c, s]));
            },
            "Y-Raising Gate (backward)",
            "A continuous left-handed cycle between the Y gate and no-op.",
            GateFactory.CYCLE_DRAWER),

        ZForward: new Gate(
            "Z^t",
            t => {
                let c = Math.cos(τ * t);
                let s = Math.sin(τ * t);
                return new Matrix(2, 2, new Float32Array([1, 0, 0, 0, 0, 0, c, s]));
            },
            "Z-Raising Gate (forward)",
            "A continuous right-handed cycle between the Z gate and no-op.",
            GateFactory.CYCLE_DRAWER),

        ZBackward: new Gate(
            "Z^-t",
            t => {
                let c = Math.cos(τ * -t);
                let s = Math.sin(τ * -t);
                return new Matrix(2, 2, new Float32Array([1, 0, 0, 0, 0, 0, c, s]));
            },
            "Z-Raising Gate (backward)",
            "A continuous left-handed cycle between the Z gate and no-op.",
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
            "Every time you grab this out of the toolbox, you get a different random gate.\n" +
                "Duplicate gates in the circuit by holding shift before dragging.",
            GateFactory.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX),

        POST_SELECT_OFF: new Gate(
            "|0⟩⟨0|",
            Matrix.square([1, 0, 0, 0]),
            "Post-selection Gate [Off]",
            "Keeps OFF states, discards ON states, and renormalizes.\n",
            GateFactory.POST_SELECT_DRAWER),

        POST_SELECT_ON: new Gate(
            "|1⟩⟨1|",
            Matrix.square([0, 0, 0, 1]),
            "Post-selection Gate [On]",
            "Keeps ON states, discards OFF states, and renormalizes.\n",
            GateFactory.POST_SELECT_DRAWER),

        CLOCK: new Gate(
            "X^⌈t⌉",
            t => (t % 1) < 0.5 ? Matrix.identity(2) : Matrix.PAULI_X,
            "Clock Pulse Gate",
            "Xors a square wave into the target wire.",
            GateFactory.SQUARE_WAVE_DRAWER_MAKER(0)),

        CLOCK_QUARTER_PHASE: new Gate(
            "X^⌈t-¼⌉",
            t => ((t+0.75) % 1) < 0.5 ? Matrix.identity(2) : Matrix.PAULI_X,
            "Clock Pulse Gate (Quarter Phase)",
            "Xors a quarter-phased square wave into the target wire.",
            GateFactory.SQUARE_WAVE_DRAWER_MAKER(0.75)),

        SPACER: new Gate(
            "…",
            Matrix.identity(2),
            "Spacer",
            "A gate with no effect.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    let backColor = Config.GATE_FILL_COLOR;
                    if (args.isHighlighted) {
                        backColor = Config.HIGHLIGHTED_GATE_FILL_COLOR;
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
        hint: "Inspection",
        gates: [
            Gates.Named.Special.Control,
            Gates.Named.Special.Measurement,
            Gates.Named.Special.ChanceDisplay,
            Gates.Named.Special.AntiControl,
            Gates.Named.Special.DensityMatrixDisplay,
            Gates.Named.Special.BlochSphereDisplay
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
        hint: "Raising",
        gates: [
            Gates.Named.Powering.XForward,
            Gates.Named.Powering.YForward,
            Gates.Named.Powering.ZForward,
            Gates.Named.Powering.XBackward,
            Gates.Named.Powering.YBackward,
            Gates.Named.Powering.ZBackward
        ]
    },
    {
        hint: "Exponentiating",
        gates: [
            Gates.Named.Exponentiating.XForward,
            Gates.Named.Exponentiating.YForward,
            Gates.Named.Exponentiating.ZForward,
            Gates.Named.Exponentiating.XBackward,
            Gates.Named.Exponentiating.YBackward,
            Gates.Named.Exponentiating.ZBackward
        ]
    },
    {
        hint: "Other Z",
        gates: [
            Gates.Named.OtherZ.Z3,
            Gates.Named.OtherZ.Z4,
            Gates.Named.OtherZ.Z8,
            Gates.Named.OtherZ.Z3i,
            Gates.Named.OtherZ.Z4i,
            Gates.Named.OtherZ.Z8i
        ]
    },
    {
        hint: 'Extra',
        gates: [
            Gates.Named.Silly.SPACER,
            Gates.Named.Silly.FUZZ_MAKER(),
            Gates.Named.Silly.CLOCK,
            Gates.Named.Silly.POST_SELECT_OFF,
            Gates.Named.Silly.POST_SELECT_ON,
            Gates.Named.Silly.CLOCK_QUARTER_PHASE
        ]
    }
];

/** @type {!(!Gate[])} */
Gates.KnownToSerializer = [
    Gates.Named.Special.Control,
    Gates.Named.Special.SwapHalf,
    Gates.Named.Special.ChanceDisplay,
    Gates.Named.Special.DensityMatrixDisplay,
    Gates.Named.Special.BlochSphereDisplay,
    Gates.Named.Special.Measurement,
    Gates.Named.Special.AntiControl,
    Gates.Named.Silly.SPACER,
    Gates.Named.Silly.CLOCK,
    Gates.Named.Silly.CLOCK_QUARTER_PHASE,
    Gates.Named.Silly.POST_SELECT_OFF,
    Gates.Named.Silly.POST_SELECT_ON,
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
    Gates.Named.Powering.XForward,
    Gates.Named.Powering.YForward,
    Gates.Named.Powering.ZForward,
    Gates.Named.Powering.XBackward,
    Gates.Named.Powering.YBackward,
    Gates.Named.Powering.ZBackward,
    Gates.Named.Exponentiating.XBackward,
    Gates.Named.Exponentiating.YBackward,
    Gates.Named.Exponentiating.ZBackward,
    Gates.Named.Exponentiating.XForward,
    Gates.Named.Exponentiating.YForward,
    Gates.Named.Exponentiating.ZForward
];
