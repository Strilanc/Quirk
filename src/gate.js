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

Gate.CONTROL = new Gate(
    "\\•", // special character that means "draw fancy controlled thingies"
    Matrix.CONTROL_SYGIL,
    "Control",
    "This special operation makes other operations on the same column only apply when the control qubit is ON.\n" +
    "\n" +
    "(When the control qubit is in a superposition of ON and OFF, the operation applies only to the parts of the" +
    "superposition where it is on.)");

Gate.X = new Gate(
    "X",
    Matrix.PAULI_X,
    "NOT Gate / Pauli X Gate",
    "Toggles a qubit's value between ON and OFF.\n" +
    "\n" +
    "The NOT gate is also known as the Pauli X gate because it corresponds to a 180° turn around the X axis of the " +
    "Block Sphere. " +
    "The X gate is its own inverse.");


Gate.Y = new Gate(
    "Y",
    Matrix.PAULI_Y,
    "Pauli Y Gate",
    "Toggles a qubit's value between ON and OFF, but with a phase adjustment.\n" +
    "\n" +
    "The Pauli Y gate corresponds to a 180° turn around the Y axis of the Block Sphere. " +
    "You can think of it as a combination of the X and Z gates, but with an extra 90 degree global phase twist. " +
    "The Y its own inverse.");

Gate.Z = new Gate(
    "Z",
    Matrix.PAULI_Z,
    "Phase Flip Gate / Pauli Z Gate",
    "Flips the phase of a qubit's ON state, while leaving its OFF state alone.\n" +
    "\n" +
    "The Pauli Z gate corresponds to a 180° turn around the Z axis of the Block Sphere. " +
    "The Z gate is its own inverse.");

Gate.H = new Gate(
    "H",
    Matrix.HADAMARD,
    "Hadamard Gate",
    "Cycles a qubit's state through ON, ON+OFF, OFF, and ON-OFF.\n",
    "\n" +
    "The Hadamard gate is objectively the best quantum gate. It is its own inverse, corresponds to a single-bit " +
    "Fourier transform or a 180° turn around the X+Z diagonal axis of the Block Sphere, and is probably the simplest " +
    "quantum gate that creates/interferes superpositions.");

Gate.fromPhaseRotation = function(fraction) {
    var mod = function(n, d) { return ((n % d) + d) % d; };
    var dif_mod = function(n, d) { return mod(n + d/2, d) - d/2; };
    var deg = dif_mod(fraction, 1) * 360;

    return new Gate(
        "Z(" + deg + "°)",
        Matrix.fromRotation(0, 0, fraction),
        deg + "° Phase Gate",
        "Rotates the phase of a qubit's ON state, while leaving its OFF state alone. " +
        "The standard Pauli Z gate corresponds to Z(180°).");
};

Gate.fromRotation = function(x, y, z) {
    if (x == 0 && y == 0) {
        return Gate.fromPhaseRotation(z);
    }

    var n = Math.sqrt(x*x + y*y + z*z);
    var deg = n*360;
    return new Gate(
        "⊹",
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
