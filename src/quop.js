// uses: complex.js

/**
 * A single-qubit quantum operation, represented as a 2x2 unitary matrix [[a, b], [c, d]].
 * @param a {Complex} The upper-left coefficient of the unitary matrix.
 * @param b {Complex} The upper-right coefficient of the unitary matrix.
 * @param c {Complex} The bottom-left coefficient of the unitary matrix.
 * @param d {Complex} The bottom-right coefficient of the unitary matrix.
 * @class
 */
function Quop(a, b, c, d) {
    if (!(a instanceof Complex)) throw "need(a instanceof Complex): " + a;
    if (!(b instanceof Complex)) throw "need(b instanceof Complex): " + b;
    if (!(c instanceof Complex)) throw "need(c instanceof Complex): " + c;
    if (!(d instanceof Complex)) throw "need(d instanceof Complex): " + d;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
}

/**
 * Converts the given value into a quop.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs The coefficients of the 2x2 unitary matrix, in a-b-c-d order.
 * @returns {Quop}
 */
Quop.from = function (coefs) {
    if (coefs instanceof Array) {
        if (coefs.length != 4) {
            throw "Wrong number of coefficients: " + coefs;
        }
        return new Quop(
            Complex.from(coefs[0]),
            Complex.from(coefs[1]),
            Complex.from(coefs[2]),
            Complex.from(coefs[3]));
    }
    throw "Don't know how to convert into a 2x2 unitary matrix: " + coefs;
};

Quop.IDENTITY = Quop.from([1, 0, 0, 1]);
Quop.PAULI_X = Quop.from([0, 1, 1, 0]);
Quop.PAULI_Y = Quop.from([0, new Complex(0, -1), new Complex(0, 1), 0]);
Quop.PAULI_Z = Quop.from([1, 0, 0, -1]);

/**
 * Determines if the receiving quop is equal to the given quop.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {Quop|object} other
 * @returns {boolean}
 */
Quop.prototype.isEqualTo = function (other) {
    return other instanceof Quop &&
        this.a.isEqualTo(other.a) &&
        this.b.isEqualTo(other.b) &&
        this.c.isEqualTo(other.c) &&
        this.d.isEqualTo(other.d);
};

/**
 * Returns a text representation of the receiving operation as a 2x2 unitary matrix.
 * (It uses curly braces so you can paste it into wolfram alpha.)
 * @returns {string}
 */
Quop.prototype.toString = function () {
    return "{{" + this.a + ", " + this.b + "}, {" + this.c + ", " + this.d + "}}";
};

/**
 * Returns the conjugate transpose of the receiving operation (the adjoint is the inverse of unitary operations).
 * @returns {Quop}
 */
Quop.prototype.adjoint = function () {
    return new Quop(
        this.a.conjugate(),
        this.c.conjugate(),
        this.b.conjugate(),
        this.d.conjugate());
};

/**
 * Returns the result of scaling the receiving matrix by the given scalar factor.
 * @param {number|Complex} v
 * @returns {Quop}
 */
Quop.prototype.scaledBy = function (v) {
    return new Quop(
        this.a.times(v), this.b.times(v),
        this.c.times(v), this.d.times(v));
};

/**
 * Returns the sum of the receiving matrix and the given matrix.
 * @param {Quop} other
 * @returns {Quop}
 */
Quop.prototype.plus = function (other) {
    return new Quop(
        this.a.plus(other.a), this.b.plus(other.b),
        this.c.plus(other.c), this.d.plus(other.d));
};

/**
 * Returns the matrix product (i.e. the composition) of the receiving matrix and the given matrix.
 * @param {Quop} other
 * @returns {Quop}
 */
Quop.prototype.times = function (other) {
    var a = this.a;
    var b = this.b;
    var c = this.c;
    var d = this.d;

    var e = other.a;
    var f = other.b;
    var g = other.c;
    var h = other.d;

    return new Quop(
        a.times(e).plus(b.times(g)), a.times(f).plus(b.times(h)),
        c.times(e).plus(d.times(g)), c.times(f).plus(d.times(h)));
};
