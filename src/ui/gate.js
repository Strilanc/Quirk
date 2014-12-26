/** @type {!number} */
var GATE_RADIUS = 20;

/**
 * A named single-qubit quantum operation.
 *
 * @param {!string} symbol The text shown inside the gate's box when drawn on the circuit.
 * @param {!Matrix} matrix The operation the gate applies.
 * @param {!string} name A helpful human-readable name for the operation.
 * @param {!string} description A helpful description of what the operation does.
 * @param {=function} symbolDrawer
 *
 * @property {!string} symbol
 * @property {!Matrix} matrix
 * @property {!string} name
 * @property {!string} description
 * @property {!function} symbolDrawer
 *
 * @constructor
 */
function Gate(symbol, matrix, name, description, symbolDrawer) {
    this.symbol = symbol;
    this.matrix = matrix;
    this.name = name;
    this.description = description;
    this.symbolDrawer = symbolDrawer || Gate.DEFAULT_SYMBOL_DRAWER;
}

Gate.prototype.toString = function() {
    return this.symbol;
};

/**
 * Returns the probability of controls on a column being satisfied and a wire being ON,
 * if that was measured.
 *
 * @param {!GateColumn} gateColumn
 * @param {!int} targetWire
 * @param {!QuantumState} columnState
 * @returns {!{probabilityOfCondition: !number, probabilityOfHitGivenCondition: !number, canDiffer: !boolean}}
 */
var measureGateColumnProbabilityOn = function (gateColumn, targetWire, columnState) {
    var wireMask = 1 << targetWire;
    var matchMask = wireMask;
    var conditionMask = 0;
    for (var i = 0; i < gateColumn.gates.length; i++) {
        if (gateColumn.gates[i] === Gate.CONTROL) {
            conditionMask |= 1 << i;
            matchMask |= 1 << i;
        } else if (gateColumn.gates[i] === Gate.ANTI_CONTROL) {
            conditionMask |= 1 << i;
        }
    }

    var p = columnState.conditionalProbability(matchMask, wireMask, conditionMask);
    return {
        probabilityOfCondition: p.probabilityOfCondition,
        probabilityOfHitGivenCondition: p.probabilityOfHitGivenCondition,
        canDiffer: conditionMask !== 0
    };
};

/**
 * @param {!boolean} isInToolbox
 * @param {!boolean} isHighlighted
 * @param {!Rect} rect
 * @param {!Gate} gate
 * @param {?CircuitContext} circuitContext
 *
 * @property {!boolean} isInToolbox
 * @property {!boolean} isHighlighted
 * @property {!Rect} rect
 * @property {!Gate} gate
 * @property {?CircuitContext} circuitContext
 *
 * @constructor
 */
function GateDrawParams(isInToolbox, isHighlighted, rect, gate, circuitContext) {
    this.isInToolbox = isInToolbox;
    this.isHighlighted = isHighlighted;
    this.rect = rect;
    this.gate = gate;
    this.circuitContext = circuitContext;
}

/**
 * @param {!GateColumn} gateColumn
 * @param {!int} rowIndex
 * @param {!QuantumState} state
 *
 * @property {!GateColumn} gateColumn
 * @property {!int} rowIndex
 * @property {!QuantumState} state
 *
 * @constructor
 */
function CircuitContext(gateColumn, rowIndex, state) {
    this.gateColumn = gateColumn;
    this.rowIndex = rowIndex;
    this.state = state;
}

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.DEFAULT_SYMBOL_DRAWER = function(painter, params) {
    var backColor = "white";
    if (!params.isInToolbox && !params.gate.matrix.isApproximatelyUnitary(0.001)) {
        backColor = "red";
    }
    if (params.isHighlighted) {
        backColor = "orange";
    }
    painter.fillRect(params.rect, backColor);
    painter.strokeRect(params.rect);
    painter.printCenteredText(params.gate.symbol, params.rect.center());
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.NOT_SYMBOL_DRAWER = function(painter, params) {
    var isNotControl = function(e) { return e === null || !e.isControlModifier()};
    if (params.circuitContext === null || params.circuitContext.gateColumn.gates.every(isNotControl)
            || params.isHighlighted) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
    } else {
        var drawArea = params.rect.scaledOutwardBy(0.6);
        painter.fillCircle(drawArea.center(), drawArea.w/2);
        painter.strokeCircle(drawArea.center(), drawArea.w/2);
        painter.strokeLine(drawArea.topCenter(), drawArea.bottomCenter());
        painter.strokeLine(drawArea.centerLeft(), drawArea.centerRight());
    }
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.MATRIX_SYMBOL_DRAWER = function (painter, params) {
    painter.paintMatrix(
        params.gate.matrix,
        params.rect,
        params.isHighlighted ? "orange" : undefined);
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX = function (painter, params) {
    if (params.isInToolbox) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
        return;
    }
    Gate.MATRIX_SYMBOL_DRAWER(painter, params);
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.DRAW_CONTROL_SYMBOL = function(painter, params) {
    if (params.isInToolbox || params.isHighlighted) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
    }
    painter.fillCircle(params.rect.center(), 5, "black");
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.DRAW_ANTI_CONTROL_SYMBOL = function(painter, params) {
    if (params.isInToolbox || params.isHighlighted) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
    }
    var p = params.rect.center();
    painter.fillCircle(p, 5);
    painter.strokeCircle(p, 5);
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.PEEK_SYMBOL_DRAWER = function(painter, params) {
    if (params.circuitContext === null) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
        return;
    }

    var p = measureGateColumnProbabilityOn(
        params.circuitContext.gateColumn,
        params.circuitContext.rowIndex,
        params.circuitContext.state);
    if (p.canDiffer) {
        painter.paintConditionalProbabilityBox(
            p.probabilityOfCondition,
            p.probabilityOfHitGivenCondition,
            params.rect,
        params.isHighlighted ? "orange" : undefined);
    } else {
        painter.paintProbabilityBox(
            p.probabilityOfCondition * p.probabilityOfHitGivenCondition,
            params.rect,
            params.isHighlighted ? "orange" : undefined);
    }
};

/**
 * @param {!Painter} painter
 * @param {!GateDrawParams} params
 */
Gate.SWAP_SYMBOL_DRAWER = function (painter, params) {
    if (params.isInToolbox || params.isHighlighted) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
        return;
    }

    var swapRect = Rect.centeredSquareWithRadius(params.rect.center(), params.rect.w/6);
    painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
    painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
};

/**
 * @returns {!string}
 */
Gate.prototype.toString = function() {
    return this.name;
};

Gate.prototype.isTimeBased = function() {
    return Gate.EVOLVING_GATES.indexOf(this) !== -1;
};

Gate.prototype.isAnchor = function() {
    return this !== Gate.CONTROL && this !== Gate.ANTI_CONTROL && this !== Gate.SWAP_HALF;
};

Gate.prototype.isControlModifier = function() {
    return this === Gate.CONTROL || this === Gate.ANTI_CONTROL;
};

    /**
 * @type {!Gate}
 */
Gate.CONTROL = new Gate(
    "•",
    Matrix.CONTROL,
    "Control",
    "Linked operations apply only when control qubit is ON.\n" +
    "\n" +
    "The control 'operation' is really more like a a modifier. It conditions\n" +
    "other operations (ones in the same column) to only occur when the\n" +
    "control qubit is true. When the control qubit is in a superposition of\n" +
    "ON and OFF, the other operations only apply in the parts of the\n" +
    "superposition control qubit is on.",
    Gate.DRAW_CONTROL_SYMBOL);

/**
 * @type {!Gate}
 */
Gate.ANTI_CONTROL = new Gate(
    "◦",
    Matrix.ANTI_CONTROL,
    "Anti-Control",
    "Linked operations apply only when control qubit is OFF.\n" +
    "\n" +
    "The anti-control operation like the control operation, except it\n" +
    "conditions on OFF instead of ON. Linked operations will only apply\n" +
    "to parts of the superposition where the control qubit is OFF.",
    Gate.DRAW_ANTI_CONTROL_SYMBOL);

/**
 * A visualization gate with no effect.
 *
 * @type {!Gate}
 */
Gate.PEEK = new Gate(
    "Peek",
    Matrix.identity(2),
    "Peek",
    "Shows the odds that a wire WOULD be on, IF it was measured.\n" +
    "\n" +
    "When this 'operation' is controlled, it show both the probability that the\n" +
    "wire is on in the cases where the controls are true (p|c) as well as the\n" +
    "overall probability of the wire being on and the controls being satisfied\n" +
    "(p∧c).\n" +
    "\n" +
    "(In practice this 'operation' would disturb the result and require\n" +
    "re-running the computation many times. Here we get to be more\n" +
    "convenient.)",
    Gate.PEEK_SYMBOL_DRAWER);

/**
 * @type {!Gate}
 */
Gate.DOWN = new Gate(
    "↓",
    Matrix.fromPauliRotation(0.25, 0, 0),
    "Down Gate",
    "Cycles through OFF, (1+i)(OFF - i ON), ON, and (1-i)(OFF + i ON).\n" +
    "\n" +
    "The Down gate is a non-standard square-root-of-NOT gate. It's one\n" +
    "of the four square roots of the Pauli X gate, so applying it twice\n" +
    "is equivalent to a NOT. The Down gate is the inverse of the Up\n" +
    "gate.");

/**
 * @type {!Gate}
 */
Gate.UP = new Gate(
    "↑",
    Matrix.fromPauliRotation(0.75, 0, 0),
    "Up Gate / Beam Splitter",
    "Cycles through OFF, (1-i)(OFF + i ON), ON, and (1+i)(OFF - i ON).\n" +
    "\n" +
    "The Up gate's effect is analogous to an optical beam splitter, in\n" +
    "that it splits and rotates the relative phase the right way. However,\n" +
    "it does have a different global phase factor so that it can be one of\n" +
    "the four square roots of the Pauli X gate (so applying it twice is\n" +
    "equivalent to a NOT). The Up gate is the inverse of the Down gate.",
    function(painter, params) {
        Gate.DEFAULT_SYMBOL_DRAWER(painter, params);
        painter.ctx.globalAlpha = 0.25;
        painter.strokeLine(params.rect.topLeft(), params.rect.bottomRight());
        painter.ctx.globalAlpha = 1;
    });

/**
 * @type {!Gate}
 */
Gate.X = new Gate(
    "X",
    Matrix.PAULI_X,
    "Not Gate  /  Pauli X Gate",
    "Toggles between ON and OFF.\n" +
    "\n" +
    "The NOT gate is also known as the Pauli X gate because it corresponds\n" +
    "to a 180° turn around the X axis of the Block Sphere. It pairs states\n" +
    "that agree on everything except the value of target qubit, and swaps\n" +
    "the amplitudes within each pair.",
    Gate.NOT_SYMBOL_DRAWER);

/**
 * @type {!Gate}
 */
Gate.RIGHT = new Gate(
    "→",
    Matrix.fromPauliRotation(0, 0.25, 0),
    "Right Gate",
    "Cycles through OFF, (1+i)(OFF + ON), i On, and (1-i)(OFF - ON).\n" +
    "\n" +
    "The Right gate is a non-standard gate. It's one of the four square\n" +
    "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
    "Y gate. The Right gate is the inverse of the Left gate.");

/**
 * @type {!Gate}
 */
Gate.LEFT = new Gate(
    "←",
    Matrix.fromPauliRotation(0, 0.75, 0),
    "Left Gate",
    "Cycles through OFF, (1-i)(OFF - ON), i On, and (1+i)(OFF + ON).\n" +
    "\n" +
    "The Left gate is a non-standard gate. It's one of the four square\n" +
    "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
    "Y gate. The Left gate is the inverse of the Right gate.");

/**
 * @type {!Gate}
 */
Gate.Y = new Gate(
    "Y",
    Matrix.PAULI_Y,
    "Pauli Y Gate",
    "Toggles with a phase adjustment.\n" +
    "\n" +
    "The Pauli Y gate corresponds to a 180° turn around the Y axis of the\n" +
    "Block Sphere. You can think of it as a combination of the X and Z gates,\n" +
    "but with an extra 90 degree global phase twist. The Y its own inverse.");

/**
 * @type {!Gate}
 */
Gate.COUNTER_CLOCKWISE = new Gate(
    "↺",
    Matrix.fromPauliRotation(0, 0, 0.25),
    "Counter Phase Gate",
    "Multiplies the ON phase by i (without affecting the OFF state).\n" +
    "\n" +
    "The Counter Phase gate, sometimes called just 'the phase gate', is one\n" +
    "of the four square roots of the Pauli Z gate. It is the inverse of the\n" +
    "Clockwise Phase gate.");

/**
 * @type {!Gate}
 */
Gate.CLOCKWISE = new Gate(
    "↻",
    Matrix.fromPauliRotation(0, 0, 0.75),
    "Clockwise Phase Gate",
    "Multiplies the ON phase by -i (without affecting the OFF state).\n" +
    "\n" +
    "The Clockwise Phase gate is one of the four square roots of the Pauli Z\n" +
    "gate. It is the inverse of the Counter Phase gate.");

/**
 * @type {!Gate}
 */
Gate.Z = new Gate(
    "Z",
    Matrix.PAULI_Z,
    "Phase Flip Gate / Pauli Z Gate",
    "Inverts the ON phase (without affecting the OFF state).\n" +
    "\n" +
    "The Pauli Z gate corresponds to a 180° turn around the Z axis of the\n" +
    "Block Sphere. It negates the amplitude of every state where the\n" +
    "target qubit is ON.");

/**
 * @type {!Gate}
 */
Gate.H = new Gate(
    "H",
    Matrix.HADAMARD,
    "Hadamard Gate",
    "Cycles ON through ON+OFF, but cycles OFF through ON-OFF.\n" +
    "\n" +
    "The Hadamard gate is the simplest quantum gate that can create and\n" +
    "interfere superpositions. It appears often in many quantum algorithms,\n" +
    "especially at the start (because applying one to every wire goes from\n" +
    "a classical state to a uniform superposition of all classical states).\n" +
    "\n" +
    "The hadamard operation also corresponds to a 180° turn around the\n" +
    "X+Z diagonal axis of the Block Sphere, and is its own inverse.");

/**
 * @type {!Gate}
 */
Gate.SWAP_HALF = new Gate(
    "Swap",
    Matrix.square([1, 0, 0, 0,
                   0, 0, 1, 0,
                   0, 1, 0, 0,
                   0, 0, 0, 1]),
    "Swap Gate [Half]",
    "Swaps the values of two qubits.\n" +
    "\n" +
    "(You must place two swap gate halves in a column to do a swap.)",
    Gate.SWAP_SYMBOL_DRAWER);

/**
 * @param {!number} fraction
 * @param {!string} symbol
 * @returns {!Gate}
 */
Gate.fromPhaseRotation = function(fraction, symbol) {
    var mod = function(n, d) { return ((n % d) + d) % d; };
    var dif_mod = function(n, d) { return mod(n + d/2, d) - d/2; };
    var deg = dif_mod(fraction, 1) * 360;
    var deg_desc = (Math.round(deg*64)/64).toString();
    var name_desc =
          fraction === 1/3 ? "/3"
        : fraction === -1/3 ? "-/3"
        : fraction === 1/8 ? "/8"
        : fraction === -1/8 ? "-/8"
        : fraction === 1/16 ? "/16"
        : fraction === -1/16 ? "-/16"
        : (Math.round(deg*64)/64).toString() + "°";

    return new Gate(
        symbol || "Z(" + name_desc + ")",
        Matrix.fromPauliRotation(0, 0, fraction),
        deg_desc + "° Phase Gate",
        "Rotates the phase of a qubit's ON state by " + deg_desc + " degrees,\n" +
        "while leaving its OFF state alone. The standard Pauli Z gate\n" +
        "corresponds to Z(180°).");
};

/**
 * @param {!number} x
 * @param {!number} y
 * @param {!number} z
 * @param {=string} symbol
 * @returns {!Gate}
 */
Gate.fromPauliRotation = function(x, y, z, symbol) {
    if (x === 0 && y === 0) {
        return Gate.fromPhaseRotation(z, symbol);
    }

    var n = Math.sqrt(x*x + y*y + z*z);
    var deg = n*360;
    return new Gate(
        symbol || "", // special character that means "render the matrix"
        Matrix.fromPauliRotation(x, y, z),
        deg +  "° around <" + x/n + ", " + y/n + ", " + z/n + ">",
        "A custom operation based on a rotation.",
        symbol === undefined ? Gate.MATRIX_SYMBOL_DRAWER : undefined);
};

/**
 * @param {!Matrix} matrix
 * @returns {!Gate}
 */
Gate.fromCustom = function(matrix) {
    return new Gate(
        "",
        matrix,
        matrix.toString(),
        "A custom operation.",
        Gate.MATRIX_SYMBOL_DRAWER);
};

/** @type {!Gate} */
Gate.EVOLVING_R = new Gate(
    "R(t)",
    Matrix.identity(2),
    "Evolving Rotation Gate",
    "A rotation gate where the angle of rotation increases and cycles over\n" +
    "time.");
/** @type {!Gate} */
Gate.EVOLVING_H = new Gate(
    "H(t)",
    Matrix.identity(2),
    "Evolving Hadamard Gate",
    "Smoothly interpolates from no-op to the Hadamard gate and back over\n" +
    "time. A continuous rotation around the X+Z axis of the Block Sphere.");
/** @type {!Gate} */
Gate.EVOLVING_X = new Gate(
    "X(t)",
    Matrix.identity(2),
    "Evolving X Gate",
    "Smoothly interpolates from no-op to the Pauli X gate and back over\n" +
    "time. A continuous rotation around the X axis of the Block Sphere.");
/** @type {!Gate} */
Gate.EVOLVING_Y = new Gate(
    "Y(t)",
    Matrix.identity(2),
    "Evolving Y Gate",
    "Smoothly interpolates from no-op to the Pauli Y gate and back over\n" +
    "time. A continuous rotation around the Y axis of the Block Sphere.");
/** @type {!Gate} */
Gate.EVOLVING_Z = new Gate(
    "Z(t)",
    Matrix.identity(2),
    "Evolving Z Gate",
    "Smoothly interpolates from no-op to the Pauli Z gate and back over\n" +
    "time. A phase gate where the phase angle increases and cycles over\n" +
    "time. A continuous rotation around the Z axis of the Block Sphere.");
/** @type {!Gate} */
Gate.EVOLVING_NOISE = new Gate(
    "Err(t)",
    Matrix.identity(2),
    "Evolving Noise Gate",
    "Jitters around randomly.");
/** @type {!Array.<!Gate>} */
Gate.EVOLVING_GATES = [
    Gate.EVOLVING_X,
    Gate.EVOLVING_Y,
    Gate.EVOLVING_Z,
    Gate.EVOLVING_R,
    Gate.EVOLVING_H,
    Gate.EVOLVING_NOISE
];

Gate.updateTimeGates = function (t) {
    var r = t % 1;
    var u = t;
    var u2 = u / Math.sqrt(2);
    var c = Math.cos(r * Math.PI * 2);
    var s = Math.sin(r * Math.PI * 2);

    Gate.EVOLVING_R.matrix = Matrix.square([c, -s, s, c]);
    Gate.EVOLVING_X.matrix = Matrix.fromPauliRotation(u, 0, 0);
    Gate.EVOLVING_Y.matrix = Matrix.fromPauliRotation(0, u, 0);
    Gate.EVOLVING_Z.matrix = Matrix.fromPauliRotation(0, 0, u);
    Gate.EVOLVING_H.matrix = Matrix.fromPauliRotation(u2, 0, u2);

    var drift = function() { return new Complex(Math.random()/10-0.05, Math.random()/10-0.05); };
    Gate.EVOLVING_NOISE.matrix = Matrix.square([drift().plus(1), drift(), drift(), drift().plus(1)]).closestUnitary();
};

Gate.makeFuzzGate = function () {
    return new Gate(
        "Fuzz",
        Matrix.square([
            new Complex(Math.random() - 0.5, Math.random() - 0.5),
            new Complex(Math.random() - 0.5, Math.random() - 0.5),
            new Complex(Math.random() - 0.5, Math.random() - 0.5),
            new Complex(Math.random() - 0.5, Math.random() - 0.5)
        ]).closestUnitary(),
        "Fuzz Gate",
        "Replaced by a different operation each time you grab it.",
        Gate.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX);
};

Gate.SILLY_GATES = [
    Gate.makeFuzzGate(),
    new Gate(
        "!Reset",
        Matrix.square([1, 1, 0, 0]),
        "Reset Gate [NOT UNITARY]",
        "Forces a qubit OFF.\n" +
        "\n" +
        "May cause double vision or the annihilation of all things."
    ),
    new Gate(
        "!Decay",
        Matrix.square([Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)]),
        "Decay Gate [NOT UNITARY]",
        "Cuts existence in half."
    ),
    new Gate(
        "",
        Matrix.square([1, 0, 0, 1]),
        "Identity Gate",
        "Has no effect. Does nothing. Wastes space. A nop."
    ),
    new Gate(
        "!Same",
        Matrix.square([Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5)]),
        "Same Gate [NOT UNITARY]",
        "Distributes amplitudes equally in all cases, causing the ON and OFF\n" +
        "amplitudes to always end up equal.\n" +
        "\n" +
        "What could go wrong?"
    ),
    new Gate(
        "!Hole",
        Matrix.square([0, 0, 0, 0]),
        "Hole Gate [NOT UNITARY]",
        "Throws the amplitudes down a hole. ALL of them."
    )
];

/**
 *
 * @param {!number} p
 * @param {!string} fractionLabel
 * @param {=string} fractionSymbol
 * @returns {!Gate}
 */
Gate.fromTargetedRotation = function(p, fractionLabel, fractionSymbol) {
    need(p >= -1 && p <= 1);
    var c = Math.sqrt(1 - Math.abs(p));
    var s = (p < 0 ? -1 : +1) * Math.sqrt(Math.abs(p));
    return new Gate(
        "∠" + (fractionSymbol || fractionLabel),
        Matrix.square([c, -s, s, c]),
        "" + fractionLabel + " Target Rotation Gate",
        "A rotation gate tuned to transition an initially-OFF qubit to\n" +
        "having a " + fractionLabel + "s probability of being ON.\n\n" +
        "Equivalent to R(acos(√(" + fractionLabel + "))).");
};

Gate.TARGETED_ROTATION_GATES = [
    Gate.fromTargetedRotation(-1/3, "-1/3"),
    Gate.fromTargetedRotation(-2/3, "-2/3"),
    Gate.fromTargetedRotation(1/3, "1/3"),
    Gate.fromTargetedRotation(2/3, "2/3")
];

/**
 * @param {!Gate} gate
 */
Gate.updateIfFuzzGate = function(gate) {
    if (gate === Gate.SILLY_GATES[0]) {
        Gate.SILLY_GATES[0] = Gate.makeFuzzGate();
    }
};

/** @type {!Array.<!{hint: !string, gates: !Array.<?Gate>}>} */
Gate.GATE_SET = [
    {
        hint: "Special",
        gates: [
            Gate.CONTROL,
            Gate.SWAP_HALF,
            Gate.PEEK,
            Gate.ANTI_CONTROL
        ]
    },
    {
        hint: "Half Turns",
        gates: [Gate.H, null, null, Gate.X, Gate.Y, Gate.Z]
    },
    {
        hint: "Quarter Turns (+/-)",
        gates: [
            Gate.DOWN,
            Gate.RIGHT,
            Gate.COUNTER_CLOCKWISE,
            Gate.UP,
            Gate.LEFT,
            Gate.CLOCKWISE]
    },
    {
        hint: "Evolving",
        gates: Gate.EVOLVING_GATES
    },
    {
        hint: "Targeted",
        gates: Gate.TARGETED_ROTATION_GATES
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
        gates: Gate.SILLY_GATES
    }
];

/**
 * @param {!Painter} painter
 * @param {!Rect} areaRect
 * @param {!boolean} isInToolbox
 * @param {!boolean} isHighlighted
 * @param {?CircuitContext} circuitContext
 */
Gate.prototype.paint = function(painter, areaRect, isInToolbox, isHighlighted, circuitContext) {
    this.symbolDrawer(painter, new GateDrawParams(isInToolbox, isHighlighted, areaRect, this, circuitContext));
};
