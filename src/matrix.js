// uses: complex.js

/**
 * A square matrix of complex values.
 * @param rows {Complex[][]} The rows of complex coefficients making up the matrix.
 * @class
 */
function Matrix(rows) {
    if (!(rows instanceof Array)) {
        throw "need(rows instanceof Array): " + rows;
    }
    if (rows.length == 0) {
        throw "need(rows.length > 0): " + rows;
    }
    if (!rows.every(function(row) { return row instanceof Array; })) {
        throw "need(rows.all(_.length == cols.length)): " + rows;
    }
    if (!rows.every(function(row) { return row.length == rows.length; })) {
        throw "need(rows.all(_.length == cols.length)): " + rows;
    }
    if (![].concat.apply([], rows).every(function(e) { return e instanceof Complex; })) {
        throw "need(rows.flatten().all(_ instanceof Complex)): " + rows;
    }

    this.rows = rows;
}

/**
 * Returns a matrix of the given size, using the given function to generate the coefficients.
 * @param {number} size
 * @param {function} coefficientRowColGenerator
 * @returns {Matrix}
 */
Matrix.generate = function (size, coefficientRowColGenerator) {
    var rows = [];
    for (var r = 0; r < size; r++) {
        var row = [];
        rows.push(row);
        for (var c = 0; c < size; c++) {
            row.push(Complex.from(coefficientRowColGenerator(r, c)));
        }
    }

    return new Matrix(rows);
};

/**
 * Converts the given square block of coefficients into a square complex matrix.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs The coefficients of the matrix, arranged in a flat array of
 * square length with the coefficients (which can be numeric or complex) in row order.
 * @returns {Matrix}
 */
Matrix.from = function (coefs) {
    if (coefs instanceof Array) {
        var n = Math.round(Math.sqrt(coefs.length));
        if (n * n != coefs.length) throw "Not square: " + coefs;
        return Matrix.generate(n, function(r, c) { return coefs[r * n + c]; });
    }

    throw "Don't know how to convert value into matrix: " + coefs;
};

/**
 * Determines if the receiving matrix is equal to the given matrix.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {Matrix|object} other
 * @returns {boolean}
 */
Matrix.prototype.isEqualTo = function (other) {
    if (!(other instanceof Matrix)) return false;

    var n = this.rows.length;
    if (other.rows.length != n) return false;

    for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
            if (!this.rows[r][c].isEqualTo(other.rows[r][c])) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Returns a text representation of the receiving matrix.
 * (It uses curly braces so you can paste it into wolfram alpha.)
 * @returns {string}
 */
Matrix.prototype.toString = function () {
    var data = this.rows.map(function(row) {
        var rowData = row.map(function(e) {
           return e === Matrix.__CONTROL_SYGIL_COMPLEX ? "C" : e.toString();
        });
        return rowData.join(", ");
    }).join("}, {");
    return "{{" + data + "}}";
};

/**
 * Returns the conjugate transpose of the receiving operation (the adjoint is the inverse when the matrix is unitary).
 * @returns {Matrix}
 */
Matrix.prototype.adjoint = function () {
    var m = this;
    return Matrix.generate(this.rows.length, function(r, c) {
        return m.rows[c][r].conjugate();
    });
};

/**
 * Returns the result of scaling the receiving matrix by the given scalar factor.
 * @param {number|Complex} v
 * @returns {Matrix}
 */
Matrix.prototype.scaledBy = function (v) {
    var m = this;
    return Matrix.generate(this.rows.length, function(r, c) {
        return m.rows[r][c].times(v);
    });
};

/**
 * Returns the sum of the receiving matrix and the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.plus = function (other) {
    var m = this;
    return Matrix.generate(this.rows.length, function(r, c) {
        return m.rows[r][c].plus(other.rows[r][c]);
    });
};

/**
 * Returns the difference from the receiving matrix to the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.minus = function (other) {
    var m = this;
    return Matrix.generate(this.rows.length, function(r, c) {
        return m.rows[r][c].minus(other.rows[r][c]);
    });
};

/**
 * Returns the matrix product (i.e. the composition) of the receiving matrix and the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.times = function (other) {
    var m = this;
    return Matrix.generate(this.rows.length, function(r, c) {
        var t = Complex.from(0);
        for (var i = 0; i < m.rows.length; i++) {
            t = t.plus(m.rows[r][i].times(other.rows[i][c]));
        }
        return t;
    });
};

/**
 * Returns the tensor product of the receiving matrix and the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.tensorProduct = function (other) {
    var m = this;
    var n1 = this.rows.length;
    var n2 = other.rows.length;
    return Matrix.generate(n1 * n2, function(r, c) {
        var r1 = Math.floor(r / n2);
        var c1 = Math.floor(c / n2);
        var r2 = r % n2;
        var c2 = c % n2;
        var v1 = m.rows[r1][c1];
        var v2 = other.rows[r2][c2];
        if (v1 === Matrix.__CONTROL_SYGIL_COMPLEX || v2 === Matrix.__CONTROL_SYGIL_COMPLEX) {
            return r1 == c1 && r2 == c2 ? 1 : 0;
        }
        return v1.times(v2);
    });
};

/**
 * Returns a single-qubit quantum operation corresponding to the given rotation.
 *
 * @param {number[]} v An [x, y, z] vector. The direction of the vector determines which axis to rotate around, and the
 * length of the vector determines what fraction of an entire turn to rotate. For example, if v is
 * [Math.sqrt(1/8), 0, Math.sqrt(1/8)] then the rotation is a half-turn around the X+Z axis and the resulting operation
 * is the Hadamard operation {{1, 1}, {1, -1}}/sqrt(2).
 *
 * @returns {Matrix}
 */
Matrix.fromRotation = function (v) {
    var sinc = function(t) {
        if (Math.abs(t) < 0.0002) return 1 - t*t / 6.0;
        return Math.sin(t) / t;
    };

    var x = v[0] * Math.PI * 2;
    var y = v[1] * Math.PI * 2;
    var z = v[2] * Math.PI * 2;

    var s = -11*x + -13*y + -17*z >= 0 ? 1 : -1;  // phase correction discontinuity on an awkward plane
    var theta = Math.sqrt(x*x + y*y + z*z);
    var sigma_v = Matrix.PAULI_X.scaledBy(x).plus(
                  Matrix.PAULI_Y.scaledBy(y)).plus(
                  Matrix.PAULI_Z.scaledBy(z));

    var ci = new Complex(1 + Math.cos(s * theta), Math.sin(s * theta)).times(0.5);
    var cv = new Complex(Math.sin(theta/2) * sinc(theta/2), -s * sinc(theta)).times(s * 0.5);

    return Matrix.identity(2).scaledBy(ci).minus(sigma_v.scaledBy(cv));
};

/**
 * Returns the identity matrix, with 1s on the main diagonal and all other entries zero.
 * @param size The dimension of the returned identity matrix.
 * @returns {Matrix}
 */
Matrix.identity = function(size) {
    return Matrix.generate(size, function(r, c) {
        return r == c ? 1 : 0;
    });
};

/**
 * The 2x2 Pauli X matrix.
 * @type {Matrix}
 */
Matrix.PAULI_X = Matrix.from([0, 1, 1, 0]);

/**
 * The 2x2 Pauli Y matrix.
 * @type {Matrix}
 */
Matrix.PAULI_Y = Matrix.from([0, new Complex(0, -1), new Complex(0, 1), 0]);

/**
 * The 2x2 Pauli Z matrix.
 * @type {Matrix}
 */
Matrix.PAULI_Z = Matrix.from([1, 0, 0, -1]);

/**
 * The 2x2 Hadamard matrix.
 * @type {Matrix}
 */
Matrix.HADAMARD = Matrix.from([1, 1, 1, -1]).scaledBy(Math.sqrt(0.5));

/**
 * The special complex value that the tensor product checks for in order to support controlled operations.
 * @type {Matrix}
 */
Matrix.__CONTROL_SYGIL_COMPLEX = new Complex(1, 0);

/**
 * A special value that acts like the pseudo-operation "use this qubit as a control".
 *
 * Implemented as a matrix [[C, 0], [0, 1]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {Matrix}
 */
Matrix.CONTROL_SYGIL = Matrix.from([Matrix.__CONTROL_SYGIL_COMPLEX, 0, 0, 1]);
