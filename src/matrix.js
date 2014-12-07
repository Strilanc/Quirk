/**
 * A matrix of complex values.
 * @param rows {Complex[][]} The rows of complex coefficients making up the matrix.
 * @property rows {Complex[][]}
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
    var w = rows[0].length;
    if (w == 0 || !rows.every(function(row) { return row.length === w; })) {
        throw "need(rows.map(e -> e.length).single() > 0): " + rows;
    }
    if (![].concat.apply([], rows).every(function(e) { return e instanceof Complex; })) {
        throw "need(rows.flatten().all(_ instanceof Complex)): " + rows;
    }

    this.rows = rows;
}

Matrix.prototype.tensorPower = function(p) {
    if (p == 0) {
        return Matrix.identity(1);
    }
    var t = this;
    while (p > 1) {
        // TODO: use repeated squaring instead
        t = t.tensorProduct(this);
        p -= 1;
    }
    return t;
};

Matrix.prototype.width = function() {
    return this.rows[0].length;
};

Matrix.prototype.height = function() {
    return this.rows.length;
};

/**
 * Returns a matrix of the given dimensions, using the given function to generate the coefficients.
 * @param {int} width
 * @param {int} height
 * @param {function} coefficientRowColGenerator
 * @returns {Matrix}
 */
Matrix.generate = function (width, height, coefficientRowColGenerator) {
    var rows = [];
    for (var r = 0; r < height; r++) {
        var row = [];
        rows.push(row);
        for (var c = 0; c < width; c++) {
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
Matrix.square = function (coefs) {
    if (coefs instanceof Array) {
        var n = Math.round(Math.sqrt(coefs.length));
        if (n * n != coefs.length) throw "Not square: " + coefs;
        return Matrix.generate(n, n, function(r, c) { return coefs[r * n + c]; });
    }

    throw "Don't know how to convert value into matrix: " + coefs;
};

/**
 * Converts the array of complex coefficients into a column vector.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs
 * @returns {Matrix}
 */
Matrix.col = function (coefs) {
    return Matrix.generate(1, coefs.length, function(r) { return coefs[r]; });
};

/**
 * Converts the array of complex coefficients into a row vector.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs
 * @returns {Matrix}
 */
Matrix.row = function (coefs) {
    return Matrix.generate(coefs.length, 1, function(r, c) { return coefs[c]; });
};

/**
 * Determines if the receiving matrix is equal to the given matrix.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {Matrix|object} other
 * @returns {boolean}
 */
Matrix.prototype.isEqualTo = function (other) {
    if (!(other instanceof Matrix)) return false;

    var w = this.width();
    var h = other.height();
    if (other.width() != w || other.height() != h) return false;

    for (var r = 0; r < h; r++) {
        for (var c = 0; c < w; c++) {
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
           return e === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE ? "C" : e.toString();
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
    return Matrix.generate(this.height(), this.width(), function(r, c) {
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
    return Matrix.generate(this.width(), this.height(), function(r, c) {
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
    var w = this.width();
    var h = this.height();
    if (other.width() != w || other.height() != h) throw "Incompatible matrices: " + this + " + " + other;
    return Matrix.generate(w, h, function(r, c) {
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
    var w = this.width();
    var h = this.height();
    if (other.width() != w || other.height() != h) throw "Incompatible matrices: " + this + " - " + other;
    return Matrix.generate(w, h, function(r, c) {
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
    var w = other.width();
    var h = this.height();
    var n = this.width();
    if (other.height() != n) throw "Incompatible matrices: " + this + " * " + other;
    return Matrix.generate(w, h, function(r, c) {
        var t = Complex.ZERO;
        for (var i = 0; i < n; i++) {
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
    var w1 = this.width();
    var w2 = other.width();
    var h1 = this.height();
    var h2 = other.height();
    return Matrix.generate(w1 * w2, h1 * h2, function(r, c) {
        var r1 = Math.floor(r / h2);
        var c1 = Math.floor(c / w2);
        var r2 = r % h2;
        var c2 = c % w2;
        var v1 = m.rows[r1][c1];
        var v2 = other.rows[r2][c2];
        if (v1 === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO || v2 === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO) {
            return Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
        }
        if (v1 === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE || v2 === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE) {
            return r1 == c1 && r2 == c2 ? Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
        }
        return v1.times(v2);
    });
};

/**
 * Returns a single-qubit quantum operation corresponding to the given rotation.
 *
 * The direction of the given x, y, z vector determines which axis to rotate around, and the length of the vector
 * determines what fraction of an entire turn to rotate. For example, if [x, y, z] is [1/√8), 0, 1/√8], then the
 * rotation is a half-turn around the X+Z axis and the resulting operation is the Hadamard operation
 * {{1, 1}, {1, -1}}/√2.
 *
 * @param {number} x The x component of the rotation vector.
 * @param {number} y The y component of the rotation vector.
 * @param {number} z The z component of the rotation vector.
 *
 * @returns {Matrix}
 */
Matrix.fromRotation = function (x, y, z) {
    var sinc = function(t) {
        if (Math.abs(t) < 0.0002) return 1 - t*t / 6.0;
        return Math.sin(t) / t;
    };

    x = -x * Math.PI * 2;
    y = -y * Math.PI * 2;
    z = -z * Math.PI * 2;

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
 * Returns a matrix for an n-wire circuit that swaps wires i and j.
 * @param {int} numWires
 * @param {int} swapWire1
 * @param {int} swapWire2
 */
Matrix.fromWireSwap = function(numWires, swapWire1, swapWire2) {
    return Matrix.generate(1 << numWires, 1 << numWires, function(r, c) {
        var bitSwap = function(n) {
            var m1 = 1 << swapWire1;
            var m2 = 1 << swapWire2;
            var s = n & ~(m1 | m2);
            if ((n & m1) != 0) s |= m2;
            if ((n & m2) != 0) s |= m1;
            return s;
        };
        return bitSwap(r) === c ? 1 : 0;
    });
};

/**
 * Returns the identity matrix, with 1s on the main diagonal and all other entries zero.
 * @param size The dimension of the returned identity matrix.
 * @returns {Matrix}
 */
Matrix.identity = function(size) {
    return Matrix.generate(size, size, function(r, c) {
        return r == c ? 1 : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
    });
};


/**
 * A special complex value that the tensor product checks for in order to support controlled operations.
 * @type {Complex}
 */
Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE = new Complex(1, 0);

/**
 * A marked complex zero that the tensor product propagates, so large empty areas can be grayed out when drawing.
 * @type {Complex}
 */
Matrix.__TENSOR_SYGIL_COMPLEX_ZERO = Complex.from(0);

/**
 * A special value that acts like the pseudo-operation "use this qubit as a control" w.r.t. the tensor product.
 *
 * Implemented as a matrix [[C, 0], [0, 1]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {Matrix}
 */
Matrix.CONTROL = Matrix.square([Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE, Matrix.__TENSOR_SYGIL_COMPLEX_ZERO,
                                Matrix.__TENSOR_SYGIL_COMPLEX_ZERO, 1]);

/**
 * A special value that acts like the pseudo-operation "use this qubit as an anti-control" w.r.t. the tensor product.
 *
 * Implemented as a matrix [[1, 0], [0, C]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {Matrix}
 */
Matrix.ANTI_CONTROL = Matrix.square([1, Matrix.__TENSOR_SYGIL_COMPLEX_ZERO,
                                     Matrix.__TENSOR_SYGIL_COMPLEX_ZERO, Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE]);

/**
 * The 2x2 Pauli X matrix.
 * @type {Matrix}
 */
Matrix.PAULI_X = Matrix.square([0, 1, 1, 0]);

/**
 * The 2x2 Pauli Y matrix.
 * @type {Matrix}
 */
Matrix.PAULI_Y = Matrix.square([0, new Complex(0, -1), new Complex(0, 1), 0]);

/**
 * The 2x2 Pauli Z matrix.
 * @type {Matrix}
 */
Matrix.PAULI_Z = Matrix.square([1, 0, 0, -1]);

/**
 * The 2x2 Hadamard matrix.
 * @type {Matrix}
 */
Matrix.HADAMARD = Matrix.square([1, 1, 1, -1]).scaledBy(Math.sqrt(0.5));
