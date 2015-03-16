///**
//* Predefined gates.
//*/
//export default class DefaultGates {
//}
//
///**
// * Gates that require special handling.
// * @type {!{Control: !Gate, AntiControl: !Gate, Peek: !Gate}}
// */
//DefaultGates.Special = {
//    Control: new Gate(
//        "•",
//        Matrix.CONTROL,
//        "Control",
//        "Linked operations apply only when control qubit is ON.\n" +
//        "\n" +
//        "The control 'operation' is really more like a a modifier. It conditions\n" +
//        "other operations (ones in the same column) to only occur when the\n" +
//        "control qubit is true. When the control qubit is in a superposition of\n" +
//        "ON and OFF, the other operations only apply in the parts of the\n" +
//        "superposition control qubit is on.",
//        false,
//        (painter, params) => {
//            if (params.isInToolbox || params.isHighlighted) {
//                Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
//            }
//            painter.fillCircle(params.rect.center(), 5, "black");
//        }),
//
//    AntiControl: new Gate(
//        "◦",
//        Matrix.ANTI_CONTROL,
//        "Anti-Control",
//        "Linked operations apply only when control qubit is OFF.\n" +
//        "\n" +
//        "The anti-control operation like the control operation, except it\n" +
//        "conditions on OFF instead of ON. Linked operations will only apply\n" +
//        "to parts of the superposition where the control qubit is OFF.",
//        false,
//        (painter, params) => {
//            if (params.isInToolbox || params.isHighlighted) {
//                Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
//            }
//            let p = params.rect.center();
//            painter.fillCircle(p, 5);
//            painter.strokeCircle(p, 5);
//        }),
//
//    Peek: new Gate(
//        "Peek",
//        Matrix.identity(2),
//        "Peek",
//        "Shows the odds that a wire WOULD be on, IF it was measured.\n" +
//        "\n" +
//        "When this 'operation' is controlled, it show both the probability that the\n" +
//        "wire is on in the cases where the controls are true (p|c) as well as the\n" +
//        "overall probability of the wire being on and the controls being satisfied\n" +
//        "(p∧c).\n" +
//        "\n" +
//        "(In practice this 'operation' would disturb the result and require\n" +
//        "re-running the computation many times. Here we get to be more\n" +
//        "convenient.)",
//        false,
//        (painter, params) => {
//            if (params.circuitContext === null || params.isHighlighted) {
//                Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
//                return;
//            }
//
//            let p = params.circuitContext.gateColumn.measureProbabilityOn(
//                params.circuitContext.wireIndex,
//                params.circuitContext.state);
//            if (p.canDiffer) {
//                MathPainter.paintConditionalProbabilityBox(
//                    painter,
//                    p.probabilityOfCondition,
//                    p.probabilityOfHitGivenCondition,
//                    params.rect);
//            } else {
//                MathPainter.paintProbabilityBox(
//                    painter,
//                    p.probabilityOfCondition * p.probabilityOfHitGivenCondition,
//                    params.rect);
//            }
//        })
//};
//
///**
// * @type {!{Down: !Gate, Up: !Gate, Right: !Gate, Left: !Gate, CounterClockwise: !Gate, Clockwise: !Gate}}
// */
//DefaultGates.Quarter = {
//    Down: new Gate(
//        "↓",
//        Matrix.fromPauliRotation(0.25, 0, 0),
//        "Down Gate",
//        "Cycles through OFF, (1+i)(OFF - i ON), ON, and (1-i)(OFF + i ON).\n" +
//        "\n" +
//        "The Down gate is a non-standard square-root-of-NOT gate. It's one\n" +
//        "of the four square roots of the Pauli X gate, so applying it twice\n" +
//        "is equivalent to a NOT. The Down gate is the inverse of the Up\n" +
//        "gate.",
//        false),
//
//    Up: new Gate(
//        "↑",
//        Matrix.fromPauliRotation(0.75, 0, 0),
//        "Up Gate / Beam Splitter",
//        "Cycles through OFF, (1-i)(OFF + i ON), ON, and (1+i)(OFF - i ON).\n" +
//        "\n" +
//        "The Up gate's effect is analogous to an optical beam splitter, in\n" +
//        "that it splits and rotates the relative phase the right way. However,\n" +
//        "it does have a different global phase factor so that it can be one of\n" +
//        "the four square roots of the Pauli X gate (so applying it twice is\n" +
//        "equivalent to a NOT). The Up gate is the inverse of the Down gate.",
//        false,
//        (painter, params) => {
//            Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
//            painter.ctx.globalAlpha = 0.25;
//            painter.strokeLine(params.rect.topLeft(), params.rect.bottomRight());
//            painter.ctx.globalAlpha = 1;
//        }),
//
//    Right: new Gate(
//        "→",
//        Matrix.fromPauliRotation(0, 0.25, 0),
//        "Right Gate",
//        "Cycles through OFF, (1+i)(OFF + ON), i On, and (1-i)(OFF - ON).\n" +
//        "\n" +
//        "The Right gate is a non-standard gate. It's one of the four square\n" +
//        "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
//        "Y gate. The Right gate is the inverse of the Left gate.",
//        false),
//
//    Left: new Gate(
//        "←",
//        Matrix.fromPauliRotation(0, 0.75, 0),
//        "Left Gate",
//        "Cycles through OFF, (1-i)(OFF - ON), i On, and (1+i)(OFF + ON).\n" +
//        "\n" +
//        "The Left gate is a non-standard gate. It's one of the four square\n" +
//        "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
//        "Y gate. The Left gate is the inverse of the Right gate.",
//        false),
//
//    CounterClockwise: new Gate(
//        "↺",
//        Matrix.fromPauliRotation(0, 0, 0.25),
//        "Counter Phase Gate",
//        "Multiplies the ON phase by i (without affecting the OFF state).\n" +
//        "\n" +
//        "The Counter Phase gate, sometimes called just 'the phase gate', is one\n" +
//        "of the four square roots of the Pauli Z gate. It is the inverse of the\n" +
//        "Clockwise Phase gate.",
//        false),
//
//    Clockwise: new Gate(
//        "↻",
//        Matrix.fromPauliRotation(0, 0, 0.75),
//        "Clockwise Phase Gate",
//        "Multiplies the ON phase by -i (without affecting the OFF state).\n" +
//        "\n" +
//        "The Clockwise Phase gate is one of the four square roots of the Pauli Z\n" +
//        "gate. It is the inverse of the Counter Phase gate.",
//        false)
//};
//
//
//
//
///**
//* @type {!Gate}
//*/
//DefaultGates.X = new Gate(
//    "X",
//    Matrix.PAULI_X,
//    "Not Gate  /  Pauli X Gate",
//    "Toggles between ON and OFF.\n" +
//    "\n" +
//    "The NOT gate is also known as the Pauli X gate because it corresponds\n" +
//    "to a 180° turn around the X axis of the Block Sphere. It pairs states\n" +
//    "that agree on everything except the value of target qubit, and swaps\n" +
//    "the amplitudes within each pair.",
//    false,
//    (painter, params) => {
//        let isNotControl = e => e === null || !e.isControlModifier();
//        if (params.circuitContext === null || params.circuitContext.gateColumn.gates.every(isNotControl)
//            || params.isHighlighted) {
//            Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
//        } else {
//            let drawArea = params.rect.scaledOutwardBy(0.6);
//            painter.fillCircle(drawArea.center(), drawArea.w/2);
//            painter.strokeCircle(drawArea.center(), drawArea.w/2);
//            painter.strokeLine(drawArea.topCenter(), drawArea.bottomCenter());
//            painter.strokeLine(drawArea.centerLeft(), drawArea.centerRight());
//        }
//    });
//
///**
//* @type {!Gate}
//*/
//DefaultGates.Y = new Gate(
//    "Y",
//    Matrix.PAULI_Y,
//    "Pauli Y Gate",
//    "Toggles with a phase adjustment.\n" +
//    "\n" +
//    "The Pauli Y gate corresponds to a 180° turn around the Y axis of the\n" +
//    "Block Sphere. You can think of it as a combination of the X and Z gates,\n" +
//    "but with an extra 90 degree global phase twist. The Y its own inverse.",
//    false);
//
///**
//* @type {!Gate}
//*/
//DefaultGates.Z = new Gate(
//    "Z",
//    Matrix.PAULI_Z,
//    "Phase Flip Gate / Pauli Z Gate",
//    "Inverts the ON phase (without affecting the OFF state).\n" +
//    "\n" +
//    "The Pauli Z gate corresponds to a 180° turn around the Z axis of the\n" +
//    "Block Sphere. It negates the amplitude of every state where the\n" +
//    "target qubit is ON.",
//    false);
//
///**
//* @type {!Gate}
//*/
//DefaultGates.H = new Gate(
//    "H",
//    Matrix.HADAMARD,
//    "Hadamard Gate",
//    "Cycles ON through ON+OFF, but cycles OFF through ON-OFF.\n" +
//    "\n" +
//    "The Hadamard gate is the simplest quantum gate that can create and\n" +
//    "interfere superpositions. It appears often in many quantum algorithms,\n" +
//    "especially at the start (because applying one to every wire goes from\n" +
//    "a classical state to a uniform superposition of all classical states).\n" +
//    "\n" +
//    "The hadamard operation also corresponds to a 180° turn around the\n" +
//    "X+Z diagonal axis of the Block Sphere, and is its own inverse.",
//    false);
//
///**
//* @type {!Gate}
//*/
//DefaultGates.SWAP_HALF = new Gate(
//    "Swap",
//    Matrix.square([1, 0, 0, 0,
//        0, 0, 1, 0,
//        0, 1, 0, 0,
//        0, 0, 0, 1]),
//    "Swap Gate [Half]",
//    "Swaps the values of two qubits.\n" +
//    "\n" +
//    "(You must place two swap gate halves in a column to do a swap.)",
//    true,
//    (painter, params) => {
//        if (params.isInToolbox || params.isHighlighted) {
//            Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
//            return;
//        }
//
//        let swapRect = Rect.centeredSquareWithRadius(params.rect.center(), params.rect.w/6);
//        painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
//        painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
//    });
//
//
//DefaultGates.EVOLVING_GATES = {
//    R: new Gate(
//        "R(t)",
//            t => {
//            let r = (t % 1) * Math.PI * 2;
//            let c = Math.cos(r);
//            let s = Math.sin(r);
//            return Matrix.square([c, -s, s, c]);
//        },
//        "Evolving Rotation Gate",
//        "A rotation gate where the angle of rotation increases and cycles over\n" +
//        "time.",
//        false,
//        Gate.CYCLE_DRAWER),
//    H: new Gate(
//        "H(t)",
//            t => {
//            let r = (t % 1) / Math.sqrt(2);
//            return Matrix.fromPauliRotation(r, 0, r);
//        },
//        "Evolving Hadamard Gate",
//        "Smoothly interpolates from no-op to the Hadamard gate and back over\n" +
//        "time. A continuous rotation around the X+Z axis of the Block Sphere.",
//        false,
//        Gate.CYCLE_DRAWER),
//    X: new Gate(
//        "X(t)",
//            t => Matrix.fromPauliRotation(t % 1, 0, 0),
//        "Evolving X Gate",
//        "Smoothly interpolates from no-op to the Pauli X gate and back over\n" +
//        "time. A continuous rotation around the X axis of the Block Sphere.",
//        false,
//        Gate.CYCLE_DRAWER),
//    Y: new Gate(
//        "Y(t)",
//            t => Matrix.fromPauliRotation(0, t % 1, 0),
//        "Evolving Y Gate",
//        "Smoothly interpolates from no-op to the Pauli Y gate and back over\n" +
//        "time. A continuous rotation around the Y axis of the Block Sphere.",
//        false,
//        Gate.CYCLE_DRAWER),
//    Z: new Gate(
//        "Z(t)",
//            t => Matrix.fromPauliRotation(0, 0, t % 1),
//        "Evolving Z Gate",
//        "Smoothly interpolates from no-op to the Pauli Z gate and back over\n" +
//        "time. A phase gate where the phase angle increases and cycles over\n" +
//        "time. A continuous rotation around the Z axis of the Block Sphere.",
//        false,
//        Gate.CYCLE_DRAWER)
//};
//
//DefaultGates.WEIRD_GATES = {
//    FUZZ_SYMBOL: "Fuzz",
//    FUZZ_MAKER: () => new Gate(
//        DefaultGates.WEIRD_GATES.FUZZ_SYMBOL,
//        Matrix.square([
//            new Complex(Math.random() - 0.5, Math.random() - 0.5),
//            new Complex(Math.random() - 0.5, Math.random() - 0.5),
//            new Complex(Math.random() - 0.5, Math.random() - 0.5),
//            new Complex(Math.random() - 0.5, Math.random() - 0.5)
//        ]).closestUnitary(),
//        "Fuzz Gate",
//        "Replaced by a different operation each time you grab it.",
//        true,
//        Gate.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX),
//    CREATION: new Gate(
//        "!Creation",
//        Matrix.square([0, 1, 0, 0]),
//        "Creation operator [NOT UNITARY]",
//        "Increases the value of the wire, increasing false to true and increase true to ... uh...\n" +
//        "\n" +
//        "May cause the annihilation of all things.",
//        true),
//    ANNIHILATION: new Gate(
//        "!Annihilation",
//        Matrix.square([0, 0, 1, 0]),
//        "Annihilation Operator [NOT UNITARY]",
//        "Decreases the value of the wire, decreasing true to false and decreasing false to ... uh...\n" +
//        "\n" +
//        "May cause the annihilation of all things.",
//        true),
//    RESET: new Gate(
//        "!Reset",
//        Matrix.square([1, 1, 0, 0]),
//        "Reset Gate [NOT UNITARY]",
//        "Forces a qubit OFF.\n" +
//        "\n" +
//        "May cause double vision or the annihilation of all things.",
//        true),
//    DECAY: new Gate(
//        "!Decay",
//        Matrix.square([Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]),
//        "Decay Gate [NOT UNITARY]",
//        "Cuts existence in half.",
//        true),
//    IDENTITY: new Gate(
//        "",
//        Matrix.square([1, 0, 0, 1]),
//        "Identity Gate",
//        "Has no effect. Does nothing. Wastes space. A nop.",
//        true),
//    SAME: new Gate(
//        "!Same",
//        Matrix.square([Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5)]),
//        "Same Gate [NOT UNITARY]",
//        "Distributes amplitudes equally in all cases, causing the ON and OFF\n" +
//        "amplitudes to always end up equal.\n" +
//        "\n" +
//        "What could go wrong?",
//        true),
//   HOLE: new Gate(
//        "!Hole",
//        Matrix.square([0, 0, 0, 0]),
//        "Hole Gate [NOT UNITARY]",
//        "Throws the amplitudes down a hole. ALL of them.",
//        true)
//};
//
//Gate.TARGETED_ROTATION_GATES = [
//    Gate.fromTargetedRotation(-1/3, "-1/3"),
//    Gate.fromTargetedRotation(-2/3, "-2/3"),
//    Gate.fromTargetedRotation(1/3, "1/3"),
//    Gate.fromTargetedRotation(2/3, "2/3")
//];
//
///** @type {!Array<!{hint: !string, gates: !Array<?Gate>}>} */
//Gate.GATE_SET = [
//    {
//        hint: "Special",
//        gates: [
//            Gate.CONTROL,
//            Gate.SWAP_HALF,
//            Gate.PEEK,
//            Gate.ANTI_CONTROL
//        ]
//    },
//    {
//        hint: "Half Turns",
//        gates: [Gate.H, null, null, Gate.X, Gate.Y, Gate.Z]
//    },
//    {
//        hint: "Quarter Turns (+/-)",
//        gates: [
//            Gate.DOWN,
//            Gate.RIGHT,
//            Gate.COUNTER_CLOCKWISE,
//            Gate.UP,
//            Gate.LEFT,
//            Gate.CLOCKWISE]
//    },
//    {
//        hint: "Evolving",
//        gates: Gate.TIME_BASED_GATES
//    },
//    {
//        hint: "Targeted",
//        gates: Gate.TARGETED_ROTATION_GATES
//    },
//    {
//        hint: "Other Z",
//        gates: [
//            Gate.fromPauliRotation(0, 0, 1 / 3),
//            Gate.fromPauliRotation(0, 0, 1 / 8),
//            Gate.fromPauliRotation(0, 0, 1 / 16),
//            Gate.fromPauliRotation(0, 0, -1 / 3),
//            Gate.fromPauliRotation(0, 0, -1 / 8),
//            Gate.fromPauliRotation(0, 0, -1 / 16)
//        ]
//    },
//    {
//        hint: "Silly",
//        gates: Gate.SILLY_GATES
//    }
//];
//
//
//
///**
//* @param {!GateColumn} gateColumn
//* @param {!int} wireIndex
//* @param {!QuantumState} state
//*
//* @property {!GateColumn} gateColumn
//* @property {!int} wireIndex
//* @property {!QuantumState} state
//*
//* @constructor
//*/
//class CircuitContext {
//    constructor(gateColumn, wireIndex, state) {
//        this.gateColumn = gateColumn;
//        this.wireIndex = wireIndex;
//        this.state = state;
//    }
//}
//
//class GateDrawParams {
//    /**
//     * @param {!boolean} isInToolbox
//     * @param {!boolean} isHighlighted
//     * @param {!Rect} rect
//     * @param {!Gate} gate
//     * @param {!number} time
//     * @param {?CircuitContext} circuitContext
//     *
//     * @property {!boolean} isInToolbox
//     * @property {!boolean} isHighlighted
//     * @property {!Rect} rect
//     * @property {!Gate} gate
//     * @property {?CircuitContext} circuitContext
//     */
//    constructor(isInToolbox, isHighlighted, rect, gate, time, circuitContext) {
//        this.isInToolbox = isInToolbox;
//        this.isHighlighted = isHighlighted;
//        this.rect = rect;
//        this.gate = gate;
//        this.time = time;
//        this.circuitContext = circuitContext;
//    }
//}
