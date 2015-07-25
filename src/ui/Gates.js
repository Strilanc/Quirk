import Util from "src/base/Util.js"
import Gate from "src/ui/Gate.js"
import Matrix from "src/math/Matrix.js"
import MathPainter from "src/ui/MathPainter.js"
import Complex from "src/math/Complex.js"
import Config from "src/Config.js"
import Rect from "src/math/Rect.js"

let Gates = {};
export default Gates;

/**
 * @type {{
 *  Special: {Control: !Gate, AntiControl: !Gate, Peek: !Gate, SwapHalf: !Gate},
 *  QuarterTurns: {Down: !Gate, Up: !Gate, Right: !Gate, Left: !Gate, CounterClockwise: !Gate, Clockwise: !Gate},
 *  HalfTurns: {X: !Gate, Y: !Gate, Z: !Gate, H: !Gate}, Evolving: {R: !Gate, H: !Gate, X: !Gate, Y: !Gate, Z: !Gate},
 *  Silly: {FUZZ_SYMBOL: string, FUZZ_MAKER: (!function() : !Gate), CREATION: !Gate, ANNIHILATION: !Gate, RESET: !Gate, DECAY: !Gate,
 *          IDENTITY: !Gate, SAME: !Gate, HOLE: !Gate}
 * }}
 */
Gates.Named = {
    Special: {
        Control: new Gate(
            "•",
            Matrix.CONTROL,
            "Control",
            "Modifies linked operations to only happen when the control qubit is ON.",
            "The control 'gate' is a modifier of other operations. " +
                "It conditions them to only occur in the parts of the superposition where the control qubit is ON. " +
                "It applies to all operation in the same column.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    Gate.DEFAULT_DRAWER(args);
                }
                args.painter.fillCircle(args.rect.center(), 5, "black");
            }),

        AntiControl: new Gate(
            "◦",
            Matrix.ANTI_CONTROL,
            "Anti-Control",
            "Modifies linked operations to only happen when the control qubit is OFF.",
            "The anti-control 'gate' is a modifier of other operations. " +
                "It conditions them to only occur in the parts of the superposition where the control qubit is OFF (" +
                "the opposite of the usual control gate). " +
                "It applies to all operation in the same column.",
            args => {
                if (args.isInToolbox || args.isHighlighted) {
                    Gate.DEFAULT_DRAWER(args);
                }
                let p = args.rect.center();
                args.painter.fillCircle(p, 5);
                args.painter.strokeCircle(p, 5);
            }),

        Peek: new Gate(
            "Peek",
            Matrix.identity(2),
            "Peek",
            "Shows the chance that a wire is ON.",
            "Peeking does not affect the result or perform a measurement, though that would be required in practice. " +
                "In addition to showing the probability that a measurement of the wire at the gate's position would " +
                "return ON instead of OFF, Peek can show the conditional probability ('t|c') of ON-ness given that " +
                "the controls were satisfied when affected by controls.",
            args => {
                if (args.positionInCircuit === null || args.isHighlighted) {
                    Gate.DEFAULT_DRAWER(args);
                    return;
                }

                //let p = args.circuitContext.gateColumn.measureProbabilityOn(
                //    args.circuitContext.wireIndex,
                //    args.circuitContext.state);
                //if (p.canDiffer) {
                //    MathPainter.paintConditionalProbabilityBox(
                //        args.painter,
                //        p.probabilityOfCondition,
                //        p.probabilityOfHitGivenCondition,
                //        args.rect);
                //} else {
                //    MathPainter.paintProbabilityBox(
                //        args.painter,
                //        p.probabilityOfCondition * p.probabilityOfHitGivenCondition,
                //        args.rect);
                //}
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
                    Gate.DEFAULT_DRAWER(args);
                    return;
                }

                let swapRect = Rect.centeredSquareWithRadius(args.rect.center(), args.rect.w / 6);
                args.painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
                args.painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
            })
    },

    QuarterTurns: {
        Down: new Gate(
            "↓",
            Matrix.fromPauliRotation(0.25, 0, 0),
            "Down Gate",
            "(Another) Half of a Not.",
            "The Down gate cycles through OFF, (1+i)(OFF - i ON), ON, and (1-i)(OFF + i ON). " +
                "It is a 90\u00B0 rotation around the Bloch Sphere's X axis. " +
                "It is a square root of the Pauli X gate, and applying it twice is equivalent to a NOT. " +
                "Its inverse is the Up gate."),

        Up: new Gate(
            "↑",
            Matrix.fromPauliRotation(0.75, 0, 0),
            "Up Gate [Beam Splitter]",
            "Half of a Not. Acts like optical beam splitters.",
            "The Up gate cycles through the states OFF, (1-i)(OFF + i ON), ON, and (1+i)(OFF - i ON). " +
                "It is a 90\u00B0 rotation around the Bloch Sphere's X axis. " +
                "It is a square root of the Pauli X gate, and applying it twice is equivalent to a NOT. " +
                "Its inverse is the Down gate.",
            args => {
                Gate.DEFAULT_DRAWER(args);
                args.painter.ctx.globalAlpha = 0.25;
                args.painter.strokeLine(args.rect.topLeft(), args.rect.bottomRight());
                args.painter.ctx.globalAlpha = 1;
            }),

        Right: new Gate(
            "→",
            Matrix.fromPauliRotation(0, 0.25, 0),
            "Right Gate",
            "Half of a Y Gate.",
            "The Right gate cycles through OFF, (1+i)(OFF + ON), i ON, and (1-i)(OFF - ON). " +
                "It is a 90\u00B0 rotation around the Bloch Sphere's Y axis. " +
                "It is a square root of the Pauli Y gate. " +
                "Its inverse is the Left gate."),

        Left: new Gate(
            "←",
            Matrix.fromPauliRotation(0, 0.75, 0),
            "Left Gate",
            "(Another) Half of a Y Gate.",
            "The Left gate cycles through OFF, (1-i)(OFF - ON), i ON, and (1+i)(OFF + ON). " +
                "It is a 90\u00B0 rotation around the Bloch Sphere's Y axis. " +
                "It is a square root of the Pauli Y gate. " +
                "Its inverse is the Right gate."),

        CounterClockwise: new Gate(
            "↺",
            Matrix.fromPauliRotation(0, 0, 0.25),
            "Counter-Clockwise Phase Gate",
            "Phases ON by a factor of i, without affecting OFF.",
            "The Counter-Clockwise Phase Gate is a 90\u00B0 rotation around the Bloch Sphere's Z axis. " +
                "It is a square root of the Pauli Z gate. " +
                "Its inverse is the Clockwise Phase Gate."),

        Clockwise: new Gate(
            "↻",
            Matrix.fromPauliRotation(0, 0, 0.75),
            "Clockwise Phase Gate",
            "Phases ON by a factor of -i, without affecting OFF.",
            "The Clockwise Phase Gate is a 90\u00B0 rotation around the Bloch Sphere's Z axis. " +
                "It is a square root of the Pauli Z gate. " +
                "Its inverse is the Counter-Clockwise Phase Gate.")
    },
    HalfTurns: {
        X: new Gate(
            "X",
            Matrix.PAULI_X,
            "Not Gate [Pauli X Gate]",
            "Toggles between ON and OFF.",
            "The Not Gate is a 180° turn around the Bloch Sphere's X axis. " +
                "Pairs states that differ only in the value of target qubit, and swaps their amplitudes. " +
                "Combine with Control gates to create Controlled-Not and Toffoli gates.",
            args => {
                let noControlsInColumn =
                    args.positionInCircuit === null ||
                    args.stats.circuitDefinition.columns[args.positionInCircuit.col].gates.every(
                        e => e !== Gates.Named.Special.Control && e !== Gates.Named.Special.AntiControl);
                if (noControlsInColumn || args.isHighlighted) {
                    Gate.DEFAULT_DRAWER(args);
                    return;
                }

                let drawArea = args.rect.scaledOutwardBy(0.6);
                args.painter.fillCircle(drawArea.center(), drawArea.w / 2);
                args.painter.strokeCircle(drawArea.center(), drawArea.w / 2);
                args.painter.strokeLine(drawArea.topCenter(), drawArea.bottomCenter());
                args.painter.strokeLine(drawArea.centerLeft(), drawArea.centerRight());
            }),

        Y: new Gate(
            "Y",
            Matrix.PAULI_Y,
            "Pauli Y Gate",
            "A combination of the X and Z gates.",
            "The Pauli Y gate is a 180° turn around the Bloch Sphere's Y axis. " +
                "It is equivalent to an X gate followed by a Z gate, up to a global phase factor."),

        Z: new Gate(
            "Z",
            Matrix.PAULI_Z,
            "Phase Flip Gate [Pauli Z Gate]",
            "Negates the phase of ON states, without affecting OFF states.",
            "The Phase Flip Gate is a 180° around the Bloch Sphere's Z axis." +
                "Negates the amplitude of parts of the superposition where the target qubit is ON."),

        H: new Gate(
            "H",
            Matrix.HADAMARD,
            "Hadamard Gate",
            "Creates/cancels uniform superpositions.",
            "The Hadamard gate is the simplest non-classical gate. " +
                "Toggles ON to ON+OFF and back, but toggles OFF to ON-OFF and back. " +
                "Applying once to each wire, in the starting state, creates a uniform superposition of all states. " +
                "Corresponds to a 180° around the Bloch Sphere's diagonal X+Z axis.")
    },
    Evolving: {
        R: new Gate(
            "R(t)",
            t => {
                let r = (t % 1) * Math.PI * 2;
                let c = Math.cos(r);
                let s = Math.sin(r);
                return Matrix.square([c, -s, s, c]);
            },
            "Evolving Rotation Gate",
            "Interpolates between no-op and the Not Gate over time, without introducing imaginary factors.",
            "(The downside of not using complex factors is that it takes two turns to get back to the start point. " +
                "After the first turn, there's a global phase factor of -1 leftover.)",
            Gate.CYCLE_DRAWER),

        H: new Gate(
            "H(t)",
            t => {
                let r = (t % 1) / Math.sqrt(2);
                return Matrix.fromPauliRotation(r, 0, r);
            },
            "Evolving Hadamard Gate",
            "Interpolates between no-op and the Hadamard Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's X+Z axis.",
            Gate.CYCLE_DRAWER),

        X: new Gate(
            "X(t)",
            t => Matrix.fromPauliRotation(t % 1, 0, 0),
            "Evolving X Gate",
            "Interpolates between no-op and the Not Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's X axis.",
            Gate.CYCLE_DRAWER),

        Y: new Gate(
            "Y(t)",
            t => Matrix.fromPauliRotation(0, t % 1, 0),
            "Evolving Y Gate",
            "Interpolates between no-op and the Pauli Y Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's Y axis.",
            Gate.CYCLE_DRAWER),

        Z: new Gate(
            "Z(t)",
            t => Matrix.fromPauliRotation(0, 0, t % 1),
            "Evolving Z Gate",
            "Interpolates between no-op and the Phase Flip Gate over time.",
            "Performs a continuous phase-corrected rotation around the Bloch Sphere's Z axis.",
            Gate.CYCLE_DRAWER)
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
            "Replaced by a different unitary operation each time you grab it.",
            "",
            Gate.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX),

        //CREATION: new Gate(
        //    "!Creation",
        //    Matrix.square([0, 1, 0, 0]),
        //    "Creation operator [NOT UNITARY]",
        //    "Increases the value of the wire, increasing false to true and increase true to ... uh...\n" +
        //    "\n" +
        //    "May cause the annihilation of all things.",
        //    true),
        //
        //ANNIHILATION: new Gate(
        //    "!Annihilation",
        //    Matrix.square([0, 0, 1, 0]),
        //    "Annihilation Operator [NOT UNITARY]",
        //    "Decreases the value of the wire, decreasing true to false and decreasing false to ... uh...\n" +
        //    "\n" +
        //    "May cause the annihilation of all things.",
        //    true),

        RESET: new Gate(
            "!Reset",
            Matrix.square([1, 1, 0, 0]),
            "Reset Gate [NOT UNITARY]",
            "Forces a qubit OFF.",
            "May cause double vision or the annihilation of all things."),

        DECAY: new Gate(
            "!Decay",
            Matrix.square([Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]),
            "Decay Gate [NOT UNITARY]",
            "Cuts existence in half.",
            ""),

        IDENTITY: new Gate(
            "",
            Matrix.square([1, 0, 0, 1]),
            "Identity Gate",
            "Has no effect. Does nothing. Wastes space. A nop.",
            ""),

        SAME: new Gate(
            "!Same",
            Matrix.square([Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5)]),
            "Same Gate [NOT UNITARY]",
            "Distributes amplitudes equally in all cases, causing the ON and OFF amplitudes to always end up equal.",
            "What could go wrong?"),

        HOLE: new Gate(
            "!Hole",
            Matrix.square([0, 0, 0, 0]),
            "Hole Gate [NOT UNITARY]",
            "Throws the amplitudes down a hole. ALL of them.",
            "")
    }
};

/** @type {!Array<!{hint: !string, gates: !Array<?Gate>}>} */
Gates.Sets = [
    {
        hint: "Special",
        gates: [
            Gates.Named.Special.Control,
            Gates.Named.Special.SwapHalf,
            Gates.Named.Special.Peek,
            Gates.Named.Special.AntiControl
        ]
    },
    {
        hint: "Half Turns",
        gates: [
            Gates.Named.HalfTurns.H,
            null,
            null,
            Gates.Named.HalfTurns.X,
            Gates.Named.HalfTurns.Y,
            Gates.Named.HalfTurns.Z
        ]
    },
    {
        hint: "Quarter Turns (+/-)",
        gates: [
            Gates.Named.QuarterTurns.Up,
            Gates.Named.QuarterTurns.Right,
            Gates.Named.QuarterTurns.CounterClockwise,
            Gates.Named.QuarterTurns.Down,
            Gates.Named.QuarterTurns.Left,
            Gates.Named.QuarterTurns.Clockwise
        ]
    },
    {
        hint: "Evolving",
        gates: [
            Gates.Named.Evolving.X,
            Gates.Named.Evolving.Y,
            Gates.Named.Evolving.Z,
            Gates.Named.Evolving.R,
            Gates.Named.Evolving.H
        ]
    },
    {
        hint: "Targeted",
        gates: [
            Gate.fromTargetedRotation(-1/3, "-1/3"),
            Gate.fromTargetedRotation(-2/3, "-2/3"),
            Gate.fromTargetedRotation(1/3, "+1/3"),
            Gate.fromTargetedRotation(2/3, "+2/3")
        ]
    },
    {
        hint: "Other Z",
        gates: [
            Gate.fromPauliRotation(0, 0, 1 / 3),
            Gate.fromPauliRotation(0, 0, 1 / 8),
            Gate.fromPauliRotation(0, 0, 1 / 16),
            Gate.fromPauliRotation(0, 0, -1 / 3),
            Gate.fromPauliRotation(0, 0, -1 / 8),
            Gate.fromPauliRotation(0, 0, -1 / 16)
        ]
    },
    {
        hint: "Silly",
        gates: [
            Gates.Named.Silly.FUZZ_MAKER(),
            Gates.Named.Silly.RESET,
            Gates.Named.Silly.DECAY,
            Gates.Named.Silly.IDENTITY,
            Gates.Named.Silly.SAME,
            Gates.Named.Silly.HOLE
        ]
    }
];

/** @type {!(!Gate[])} */
Gates.KnownToSerializer = [
    Gates.Named.Special.Control,
    Gates.Named.Special.SwapHalf,
    Gates.Named.Special.Peek,
    Gates.Named.Special.AntiControl,
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
    Gates.Named.Evolving.X,
    Gates.Named.Evolving.Y,
    Gates.Named.Evolving.Z,
    Gates.Named.Evolving.R,
    Gates.Named.Evolving.H
];
