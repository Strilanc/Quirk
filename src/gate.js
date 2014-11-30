/**
 * A named single-qubit quantum operation.
 *
 * @param {string} symbol The text shown inside the gate's box when drawn on the circuit.
 * @param {Matrix} matrix The operation the gate applies.
 * @param {string} name A helpful human-readable name for the operation.
 * @param {string} description A helpful description of what the operation does.
 * @constructor
 */
function Gate(symbol, matrix, name, description) {
    this.symbol = symbol;
    this.matrix = matrix;
    this.name = name;
    this.description = description;
}

Gate.prototype.toString = function() {
    return this.name;
};

Gate.CONTROL = new Gate(
    "\\•", // special character that means "draw fancy controlled thingies"
    Matrix.CONTROL_SYGIL,
    "Control",
    "Linked operations apply only when control qubit is ON.\n" +
    "\n" +
    "The control 'operation' is really more like a a modifier. It conditions\n" +
    "other operations (ones in the same column) to only occur when the\n" +
    "control qubit is true. When the control qubit is in a superposition of\n" +
    "ON and OFF, the other operations only apply in the parts of the\n" +
    "superposition control qubit is on.");

Gate.ANTI_CONTROL = new Gate(
    "\\•", // special character that means "draw fancy controlled thingies"
    Matrix.ANTI_CONTROL_SYGIL,
    "Anti-Control",
    "Linked operations apply only when control qubit is OFF.\n" +
    "\n" +
    "The anti-control operation like the control operation, except it\n" +
    "conditions on OFF instead of ON. Linked operations will only apply\n" +
    "to parts of the superposition where the control qubit is OFF.");

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

Gate.UP = new Gate(
    "↑",
    Matrix.fromRotation(0.75, 0, 0),
    "Up Gate",
    "Cycles through OFF, (1-i)(OFF + i ON), ON, and (1+i)(OFF - i ON).\n" +
    "\n" +
    "The Up gate is a non-standard square-root-of-NOT gate. It's one\n" +
    "of the four square roots of the Pauli X gate, so applying it twice\n" +
    "is equivalent to a NOT. The Up gate is the inverse of the Down\n" +
    "gate.");

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

Gate.RIGHT = new Gate(
    "→",
    Matrix.fromRotation(0, 0.25, 0),
    "Right Gate",
    "Cycles through OFF, (1+i)(OFF + ON), i On, and (1-i)(OFF - ON).\n" +
    "\n" +
    "The Right gate is a non-standard gate. It's one of the four square\n" +
    "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
    "Y gate. The Right gate is the inverse of the Left gate.");

Gate.LEFT = new Gate(
    "←",
    Matrix.fromRotation(0, 0.75, 0),
    "Left Gate",
    "Cycles through OFF, (1-i)(OFF - ON), i On, and (1+i)(OFF + ON).\n" +
    "\n" +
    "The Left gate is a non-standard gate. It's one of the four square\n" +
    "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
    "Y gate. The Left gate is the inverse of the Right gate.");

Gate.Y = new Gate(
    "Y",
    Matrix.PAULI_Y,
    "Pauli Y Gate",
    "Toggles with a phase adjustment.\n" +
    "\n" +
    "The Pauli Y gate corresponds to a 180° turn around the Y axis of the\n" +
    "Block Sphere. You can think of it as a combination of the X and Z gates,\n" +
    "but with an extra 90 degree global phase twist. The Y its own inverse.");

Gate.COUNTER_CLOCKWISE = new Gate(
    "↺",
    Matrix.fromRotation(0, 0, 0.25),
    "Counter Phase Gate",
    "Multiplies the ON phase by i (without affecting the OFF state).\n" +
    "\n" +
    "The Counter Phase gate, sometimes called just 'the phase gate', is one\n" +
    "of the four square roots of the Pauli Z gate. It is the inverse of the\n" +
    "Clockwise Phase gate.");

Gate.CLOCKWISE = new Gate(
    "↻",
    Matrix.fromRotation(0, 0, 0.75),
    "Clockwise Phase Gate",
    "Multiplies the ON phase by -i (without affecting the OFF state).\n" +
    "\n" +
    "The Clockwise Phase gate is one of the four square roots of the Pauli Z\n" +
    "gate. It is the inverse of the Counter Phase gate.");

Gate.Z = new Gate(
    "Z",
    Matrix.PAULI_Z,
    "Phase Flip Gate / Pauli Z Gate",
    "Inverts the ON phase (without affecting the OFF state).\n" +
    "\n" +
    "The Pauli Z gate corresponds to a 180° turn around the Z axis of the\n" +
    "Block Sphere. It negates the amplitude of every state where the\n" +
    "target qubit is ON.");

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

Gate.fromPhaseRotation = function(fraction, symbol) {
    var mod = function(n, d) { return ((n % d) + d) % d; };
    var dif_mod = function(n, d) { return mod(n + d/2, d) - d/2; };
    var deg = dif_mod(fraction, 1) * 360;

    return new Gate(
        symbol || "Z(" + deg + "°)",
        Matrix.fromRotation(0, 0, fraction),
        deg + "° Phase Gate",
        "Rotates the phase of a qubit's ON state by " + deg + " degrees,\n" +
        "while leaving its OFF state alone. The standard Pauli Z gate\n" +
        "corresponds to Z(180°).");
};

Gate.fromRotation = function(x, y, z, symbol) {
    if (x == 0 && y == 0) {
        return Gate.fromPhaseRotation(z, symbol);
    }

    var n = Math.sqrt(x*x + y*y + z*z);
    var deg = n*360;
    return new Gate(
        symbol || "\\⊹", // special character that means "render the matrix"
        Matrix.fromRotation(x, y, z),
        deg +  "° around <" + x/n + ", " + y/n + ", " + z/n + ">",
        "A custom operation based on a rotation.");
};

Gate.fromCustom = function(matrix) {
    return new Gate(
        "\\⊹", // special character that means "render the matrix"
        matrix,
        matrix.toString(),
        "A custom operation.");
};

/**
 * A column of gates in a circuit with many qubits.
 *
 * @param {(Gate|null)[]} gates The list of gates to apply to each wire, with the i'th gate applying to the i'th wire.
 * Wires without a gate in this column should use null instead.
 * @constructor
 */
function GateColumn(gates) {
    this.gates = gates;
}

/**
 * @param {number} size
 * @returns {GateColumn}
 */
GateColumn.empty = function(size) {
    var gates = [];
    for (var i = 0; i < size; i++) {
        gates.push(null);
    }
    return new GateColumn(gates);
};

GateColumn.prototype.isEmpty = function() {
    return this.gates.every(function(e) { return e === null; });
};

/**
 * Returns the matrix corresponding to the parallel applications of the operations in this circuit column.
 */
GateColumn.prototype.matrix = function() {
    var ops = [];
    for (var i = 0; i < this.gates.length; i++) {
        var op;
        if (this.gates[i] === null) {
            op = Matrix.identity(2)
        } else {
            op = this.gates[i].matrix;;
        }
        ops.push(op);
    }

    return ops.reduce(function (a, e) { return e.tensorProduct(a); }, Matrix.identity(1));
};

/**
 * Returns the result of applying this circuit column to the given state.
 * @param {Matrix} state A column matrix of the correct size.
 * @returns {Matrix}
 */
GateColumn.prototype.transform = function(state) {
    return this.matrix().times(state);
};
