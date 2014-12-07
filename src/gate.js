/**
 * A named single-qubit quantum operation.
 *
 * @param {!string} symbol The text shown inside the gate's box when drawn on the circuit.
 * @param {!Matrix} matrix The operation the gate applies.
 * @param {!string} name A helpful human-readable name for the operation.
 * @param {!string} description A helpful description of what the operation does.
 *
 * @property {!string} symbol
 * @property {!Matrix} matrix
 * @property {!string} name
 * @property {!string} description
 *
 * @constructor
 */
function Gate(symbol, matrix, name, description) {
    this.symbol = symbol;
    this.matrix = matrix;
    this.name = name;
    this.description = description;
}

/**
 * @returns {!string}
 */
Gate.prototype.toString = function() {
    return this.name;
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
    "superposition control qubit is on.");

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
    "to parts of the superposition where the control qubit is OFF.");

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
    "convenient.)");

/**
 * @type {!Gate}
 */
Gate.DOWN = new Gate(
    "↓",
    Matrix.fromRotation(0.25, 0, 0),
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
    Matrix.fromRotation(0.75, 0, 0),
    "Up Gate / Beam Splitter",
    "Cycles through OFF, (1-i)(OFF + i ON), ON, and (1+i)(OFF - i ON).\n" +
    "\n" +
    "The Up gate's effect is analogous to an optical beam splitter, in\n" +
    "that it splits and rotates the relative phase the right way. However,\n" +
    "it does have a different global phase factor so that it can be one of\n" +
    "the four square roots of the Pauli X gate (so applying it twice is\n" +
    "equivalent to a NOT). The Up gate is the inverse of the Down gate.");

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
    "the amplitudes within each pair.");

/**
 * @type {!Gate}
 */
Gate.RIGHT = new Gate(
    "→",
    Matrix.fromRotation(0, 0.25, 0),
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
    Matrix.fromRotation(0, 0.75, 0),
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
    Matrix.fromRotation(0, 0, 0.25),
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
    Matrix.fromRotation(0, 0, 0.75),
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
    "(You must place two swap gate halves in a column to do a swap.)");

/**
 * @type {!string}
 */
Gate.DRAW_MATRIX_SYMBOL = "\\__SPECIAL_SYMBOL__DRAW_MATRIX";

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
          fraction == 1/3 ? "/3"
        : fraction == -1/3 ? "-/3"
        : fraction == 1/8 ? "/8"
        : fraction == -1/8 ? "-/8"
        : fraction == 1/16 ? "/16"
        : fraction == -1/16 ? "-/16"
        : (Math.round(deg*64)/64).toString() + "°";

    return new Gate(
        symbol || "Z(" + name_desc + ")",
        Matrix.fromRotation(0, 0, fraction),
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
Gate.fromRotation = function(x, y, z, symbol) {
    if (x == 0 && y == 0) {
        return Gate.fromPhaseRotation(z, symbol);
    }

    var n = Math.sqrt(x*x + y*y + z*z);
    var deg = n*360;
    return new Gate(
        symbol || Gate.DRAW_MATRIX_SYMBOL, // special character that means "render the matrix"
        Matrix.fromRotation(x, y, z),
        deg +  "° around <" + x/n + ", " + y/n + ", " + z/n + ">",
        "A custom operation based on a rotation.");
};

/**
 * @param {!Matrix} matrix
 * @returns {!Gate}
 */
Gate.fromCustom = function(matrix) {
    return new Gate(
        Gate.DRAW_MATRIX_SYMBOL,
        matrix,
        matrix.toString(),
        "A custom operation.");
};

/**
 * A column of gates in a circuit with many qubits.
 *
 * @param {!Array.<?Gate>} gates The list of gates to apply to each wire, with the i'th gate applying to the i'th wire.
 * Wires without a gate in this column should use null instead.
 *
 * @property {!Array.<?Gate>} gates
 * @constructor
 */
function GateColumn(gates) {
    this.gates = gates;
}

/**
 * @param {!int} size
 * @returns {!GateColumn}
 */
GateColumn.empty = function(size) {
    var gates = [];
    for (var i = 0; i < size; i++) {
        gates.push(null);
    }
    return new GateColumn(gates);
};

/**
 * @returns {!boolean}
 */
GateColumn.prototype.isEmpty = function() {
    return this.gates.every(function(e) { return e === null; });
};

/**
 * Returns the matrix corresponding to the parallel applications of the operations in this circuit column.
 * @returns {!Matrix}
 */
GateColumn.prototype.matrix = function() {
    var ops = [];
    var swapIndices = [];
    for (var i = 0; i < this.gates.length; i++) {
        var op;
        if (this.gates[i] === null) {
            op = Matrix.identity(2)
        } else if (this.gates[i] === Gate.SWAP_HALF) {
            swapIndices.push(i);
            op = Matrix.identity(2);
        } else {
            op = this.gates[i].matrix;
        }
        ops.push(op);
    }

    var result = ops.reduce(function (a, e) { return e.tensorProduct(a); }, Matrix.identity(1));
    if (swapIndices.length === 2) {
        result = Matrix.fromWireSwap(this.gates.length, swapIndices[0], swapIndices[1]).times(result);
    }
    return result;
};

/**
 * Returns the result of applying this circuit column to the given state.
 * @param {!Matrix} state A column matrix of the correct size.
 * @returns {!Matrix}
 */
GateColumn.prototype.transform = function(state) {
    return this.matrix().times(state);
};
