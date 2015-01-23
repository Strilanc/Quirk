/**
 * A matrix of complex values.
 * @param rows {!Array.<!Array.<!Complex>>} The rows of complex coefficients making up the matrix.
 * @property rows {!Array.<!Array.<!Complex>>}
 * @class
 */
function Matrix(rows) {
    need(Array.isArray(rows) && rows.every(Array.isArray), "array rows", arguments);
    need(rows.length > 0, "non-zero height", arguments);

    var w = rows.map(function(e) { return e.length; }).distinct().singleElseUndefined();
    need(w !== undefined && w > 0, "consistent non-zero width", arguments);
    need(rows.flatten().every(function(e) { return e instanceof Complex; }), "complex entries", arguments);

    this.rows = rows;
}

/**
 * Determines if the receiving matrix is equal to the given matrix.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {!Matrix|*} other
 * @returns {!boolean}
 */
Matrix.prototype.isEqualTo = function (other) {
    if (this === other) {
        return true;
    }

    return other instanceof Matrix &&
        this.rows.isEqualToBy(other.rows, function(thisRow, otherRow) {
            return thisRow.isEqualToBy(otherRow, CUSTOM_IS_EQUAL_TO_EQUALITY);
        });
};

/**
 * Determines if the receiving matrix is approximately equal to the given matrix.
 * @param {!Matrix|*} other
 * @param {!number} epsilon Maximum distance between the two matrices.
 * @returns {!boolean}
 */
Matrix.prototype.isApproximatelyEqualTo = function (other, epsilon) {
    return other instanceof Matrix &&
        this.width() === other.width() &&
        this.height() === other.height() &&
        Math.sqrt(this.minus(other).norm2()) <= epsilon;
};

/**
 * @param {object} json
 * @returns {!Matrix}
 * @throws {Error}
 */
Matrix.fromJson = function(json) {
    if (!isString(json)) {
        throw new Error("Not a packed matrix string: " + json);
    }
    //noinspection JSCheckFunctionSignatures
    return this.parse(json);
};

/**
 * @returns {!object}
 */
Matrix.prototype.toJson = function() {
    return this.toString();
};

/**
 * Returns a text representation of the receiving matrix.
 * (It uses curly braces so you can paste it into wolfram alpha.)
 * @param {=number} epsilon
 * @param {=number} digits
 * @returns {!string}
 */
Matrix.prototype.toString = function (epsilon, digits) {
    var data = this.rows.map(function(row) {
        var rowData = row.map(function(e) {
            return e === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE ? "C" : e.toString(epsilon, digits);
        });
        return rowData.join(", ");
    }).join("}, {");
    return "{{" + data + "}}";
};

/**
 * @param {!string} text
 * @returns {!Matrix}
 * @throws
 */
Matrix.parse = function(text) {
    text = text.replace(/\s/g, "");

    if (text.length < 4 || text.substr(0, 2) !== "{{" || text.substr(text.length - 2, 2) !== "}}") {
        throw new Error("Not surrounded by {{}}.");
    }

    // Some kind of recursive descent parser would be a better idea, but here we are.
    return new Matrix(text.substr(2, text.length - 4).split("},{").map(function(row) {
        return row.split(",").map(function(e) {
            return e === "C" ?
                Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE :
                Complex.parse(e);
        });
    }));
};

/**
 * Returns a matrix of the given dimensions, using the given function to generate the coefficients.
 * @param {!int} width
 * @param {!int} height
 * @param {!function} coefficientRowColGenerator
 * @returns {!Matrix}
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
 * @param {!Array.<(!number|!Complex)>|!Array.<!number>|!Array.<!Complex>} coefs The coefficients of the matrix, arranged in a flat array of
 * square length with the coefficients (which can be numeric or complex) in row order.
 * @returns {!Matrix}
 */
Matrix.square = function (coefs) {
    need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
    var n = Math.round(Math.sqrt(coefs.length));
    need(n * n === coefs.length, "Matrix.square: non-square number of arguments");
    return Matrix.generate(n, n, function(r, c) { return coefs[r * n + c]; });
};

/**
 * Converts the array of complex coefficients into a column vector.
 * @param {!Array.<(!number|!Complex)>|!Array.<!number>|!Array.<!Complex>} coefs
 * @returns {!Matrix}
 */
Matrix.col = function (coefs) {
    need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
    return Matrix.generate(1, coefs.length, function(r) { return coefs[r]; });
};

/**
 * Converts the array of complex coefficients into a row vector.
 * @param {!Array.<(!number|!Complex)>|!Array.<!number>|!Array.<!Complex>} coefs
 * @returns {!Matrix}
 */
Matrix.row = function (coefs) {
    need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
    return Matrix.generate(coefs.length, 1, function(r, c) { return coefs[c]; });
};

/**
 * Returns the width of the receiving matrix.
 * @returns {!int}
 */
Matrix.prototype.width = function() {
    return this.rows[0].length;
};

/**
 * Returns the height of the receiving matrix.
 * @returns {!int}
 */
Matrix.prototype.height = function() {
    return this.rows.length;
};

/**
 * Determines if the matrix is approximately unitary or not.
 * @param {!number} epsilon Distance away from unitary the matrix is allowed to be. Defaults to 0.
 * @returns {!boolean}
 */
Matrix.prototype.isApproximatelyUnitary = function (epsilon) {
    var n = this.width();
    if (this.height() !== n) {
        return false;
    }
    return this.times(this.adjoint()).isApproximatelyEqualTo(Matrix.identity(n), epsilon);
};

/**
 * Returns the conjugate transpose of the receiving operation (the adjoint is the inverse when the matrix is unitary).
 * @returns {!Matrix}
 */
Matrix.prototype.adjoint = function () {
    var m = this;
    return Matrix.generate(this.height(), this.width(), function(r, c) {
        return m.rows[c][r].conjugate();
    });
};

/**
 * Returns the result of scaling the receiving matrix by the given scalar factor.
 * @param {!number|!Complex} v
 * @returns {!Matrix}
 */
Matrix.prototype.scaledBy = function (v) {
    var m = this;
    return Matrix.generate(this.width(), this.height(), function(r, c) {
        return m.rows[r][c].times(v);
    });
};

/**
 * Returns the sum of the receiving matrix and the given matrix.
 * @param {!Matrix} other
 * @returns {!Matrix}
 */
Matrix.prototype.plus = function (other) {
    var m = this;
    var w = this.width();
    var h = this.height();
    need(other.width() === w && other.height() === h, "Matrix.plus: compatible sizes");
    return Matrix.generate(w, h, function(r, c) {
        return m.rows[r][c].plus(other.rows[r][c]);
    });
};

/**
 * Returns the difference from the receiving matrix to the given matrix.
 * @param {!Matrix} other
 * @returns {!Matrix}
 */
Matrix.prototype.minus = function (other) {
    var m = this;
    var w = this.width();
    var h = this.height();
    need(other.width() === w && other.height() === h, "Matrix.minus: compatible sizes");
    return Matrix.generate(w, h, function(r, c) {
        return m.rows[r][c].minus(other.rows[r][c]);
    });
};

/**
 * Returns the matrix product (i.e. the composition) of the receiving matrix and the given matrix.
 * @param {!Matrix} other
 * @returns {!Matrix}
 */
Matrix.prototype.times = function (other) {
    var m = this;
    var w = other.width();
    var h = this.height();
    var n = this.width();
    need(other.height() === n, "Matrix.times: compatible sizes");
    return Matrix.generate(w, h, function(r, c) {
        var t = Complex.ZERO;
        for (var i = 0; i < n; i++) {
            t = t.plus(m.rows[r][i].times(other.rows[i][c]));
        }
        return t;
    });
};

/**
 * Returns the receiving matrix's squared euclidean length.
 * @returns {!number}
 */
Matrix.prototype.norm2 = function() {
    var t = 0;
    for (var r = 0; r < this.rows.length; r++) {
        var row = this.rows[r];
        for (var c = 0; c < row.length; c++) {
            t += row[c].norm2();
        }
    }
    return t;
};

/**
 * Returns the tensor product of the receiving matrix and the given matrix.
 * @param {!Matrix} other
 * @returns {!Matrix}
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
            return r1 === c1 && r2 === c2 ?
                Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE
                : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
        }
        return v1.times(v2);
    });
};

/**
 * Returns the result of tensor-product-ing the receiving matrix with itself the given number of times.
 * @param {!int} exponent The number of times the matrix is tensor-product-ed with itself.
 * @returns {!Matrix}
 */
Matrix.prototype.tensorPower = function(exponent) {
    if (exponent === 0) {
        return Matrix.identity(1);
    }
    var t = this;
    while (exponent > 1) {
        // TODO: use repeated squaring instead
        t = t.tensorProduct(this);
        exponent -= 1;
    }
    return t;
};

/**
 * Returns a single-qubit quantum operation corresponding to the given 3-dimensional rotation in some useful way.
 *
 * The mapping is chosen so that rotating around each axis runs through the respective pauli matrix, and so that cutting
 * a rotation in half square roots the result, and a few other nice properties.
 *
 * The direction of the given x, y, z vector determines which axis to rotate around, and the length of the vector
 * determines what fraction of an entire turn to rotate. For example, if [x, y, z] is [1/√8), 0, 1/√8], then the
 * rotation is a half-turn around the X+Z axis and the resulting operation is the Hadamard operation
 * {{1, 1}, {1, -1}}/√2.
 *
 * @param {!number} x The x component of the rotation vector.
 * @param {!number} y The y component of the rotation vector.
 * @param {!number} z The z component of the rotation vector.
 *
 * @returns {!Matrix}
 */
Matrix.fromPauliRotation = function (x, y, z) {
    var sinc = function(t) {
        if (Math.abs(t) < 0.0002) { return 1 - t*t / 6.0; }
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

    var m = Matrix.identity(2).scaledBy(ci).minus(sigma_v.scaledBy(cv));
    var expectNiceValuesCorrection = function(v) { return roundToNearbyFractionOrRoot(v, 0.0000000000001);};
    return m.transformRealAndImagComponentsWith(expectNiceValuesCorrection);
};

Matrix.fromTargetedRotation = function(p) {
    need(p >= -1 && p <= 1, arguments);
    var c = Math.sqrt(1 - Math.abs(p));
    var s = (p < 0 ? -1 : +1) * Math.sqrt(Math.abs(p));
    c = roundToNearbyFractionOrRoot(c, 0.00000000001);
    s = roundToNearbyFractionOrRoot(s, 0.00000000001);
    return Matrix.square([c, -s, s, c]);
}

/**
 * @param {!function(!number) : !number} func
 * @returns {!Matrix}
 * @private
 */
Matrix.prototype.transformRealAndImagComponentsWith = function(func) {
    return new Matrix(this.rows.map(function(row) {
        return row.map(function(cell) {
            return new Complex(func(cell.real), func(cell.imag));
        });
    }));
};

/**
 * Returns a matrix for an n-wire circuit that swaps wires i and j.
 * @param {!int} numWires
 * @param {!int} swapWire1
 * @param {!int} swapWire2
 */
Matrix.fromWireSwap = function(numWires, swapWire1, swapWire2) {
    return Matrix.generate(1 << numWires, 1 << numWires, function(r, c) {
        var bitSwap = function(n) {
            var m1 = 1 << swapWire1;
            var m2 = 1 << swapWire2;
            var s = n & ~(m1 | m2);
            if ((n & m1) !== 0) { s |= m2; }
            if ((n & m2) !== 0) { s |= m1; }
            return s;
        };
        return bitSwap(r) === c ? 1 : 0;
    });
};

/**
 * Returns the identity matrix, with 1s on the main diagonal and all other entries zero.
 * @param size The dimension of the returned identity matrix.
 * @returns {!Matrix}
 */
Matrix.identity = function(size) {
    return Matrix.generate(size, size, function(r, c) {
        return r === c ? 1 : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
    });
};

/**
 * Returns a rotation matrix that rotations by the given angle.
 * @param {!number} theta The angle the matrix should rotate by, in radians.
 * @returns {!Matrix} A real matrix.
 */
Matrix.rotation = function (theta) {
    var c = Math.cos(theta);
    var s = Math.sin(theta);
    return Matrix.square([
        c, -s,
        s, c]);
};

/**
 * Factors the matrix int u*s*v parts, where u and v are unitary matrices and s is a real diagonal matrix.
 * @returns {!{u: !Matrix, s: !Matrix, v: !Matrix}}
 */
Matrix.prototype.singularValueDecomposition = function () {
    /**
     * @param {!Complex|!number} p
     * @param {!Complex|!number} q
     * @returns {!Matrix}
     */
    var phase_cancel_matrix = function (p, q) {
        return Matrix.square([
            Complex.from(p).unit().conjugate(), 0,
            0, Complex.from(q).unit().conjugate()]);
    };

    /**
     * @param {!Matrix} m
     * @returns {!{u: !Matrix, s: !Matrix, v: !Matrix}}
     */
    var svd_real_2x2 = function (m) {
        var a = Complex.realPartOf(m.rows[0][0]);
        var b = Complex.realPartOf(m.rows[0][1]);
        var c = Complex.realPartOf(m.rows[1][0]);
        var d = Complex.realPartOf(m.rows[1][1]);

        var t = a + d;
        var x = b + c;
        var y = b - c;
        var z = a - d;

        var theta_0 = Math.atan2(x, t) / 2.0;
        var theta_d = Math.atan2(y, z) / 2.0;

        var s_0 = Math.sqrt(t * t + x * x) / 2.0;
        var s_d = Math.sqrt(z * z + y * y) / 2.0;

        return {
            u: Matrix.rotation(theta_0 - theta_d),
            s: Matrix.square([s_0 + s_d, 0, 0, s_0 - s_d]),
            v: Matrix.rotation(theta_0 + theta_d)
        };
    };

    /**
     * @param {!Matrix} m
     * @returns {!{u: !Matrix, s: !Matrix, v: !Matrix}}
     */
    var svd_2x2 = function (m) {
        // Initially all entries are free.
        // m = | ?+?i  ?+?i |
        //     | ?+?i  ?+?i |

        // Cancel top row phase
        var p = phase_cancel_matrix(m.rows[0][0], m.rows[0][1]);
        var m2 = m.times(p);
        // m2 = m p r = | >     >    |
        //              | ?+?i  ?+?i |

        // Cancel top-right value by rotation.
        var r = Matrix.rotation(Math.atan2(m2.rows[0][1].real, m2.rows[0][0].real));
        var m3 = m2.times(r);
        // m3 = m p r = | ?+?i  0    |
        //              | ?+?i  ?+?i |

        // Make bottom row non-imaginary and non-negative by column phasing.
        var q = phase_cancel_matrix(m3.rows[1][0], m3.rows[1][1]);
        var m4 = m3.times(q);
        // m4 = m p r q = | ?+?i  0 |
        //                | >     > |

        // Cancel imaginary part of top left value by row phasing.
        var t = phase_cancel_matrix(m4.rows[0][0], 1);
        var m5 = t.times(m4);
        // m5 = t m p r q = | > 0 |
        //                  | > > |

        // All values are now real (also the top-right is zero), so delegate to a
        // singular value decomposition that works for real matrices.
        // t m p r q = u s v
        var usv = svd_real_2x2(m5);

        // m = (t* u) s (v q* r* p*)
        return {
            u: t.adjoint().times(usv.u),
            s: usv.s,
            v: usv.v.times(q.adjoint()).times(r.adjoint()).times(p.adjoint())
        };
    };

    if (this.width() !== 2 || this.height() !== 2) {
        throw "Not implemented: non-2x2 singular value decomposition";
    }

    return svd_2x2(this);
};

/**
 * Returns the unitary matrix closest to the receiving matrix, "repairing" it into a unitary form.
 * @returns {!Matrix}
 */
Matrix.prototype.closestUnitary = function() {
    var svd = this.singularValueDecomposition();
    return svd.u.times(svd.v);
};

/**
 * A special complex value that the tensor product checks for in order to support controlled operations.
 * @type {!Complex}
 */
Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE = new Complex(1, 0);

/**
 * A marked complex zero that the tensor product propagates, so large empty areas can be grayed out when drawing.
 * @type {!Complex}
 */
Matrix.__TENSOR_SYGIL_COMPLEX_ZERO = Complex.from(0);

/**
 * A special value that acts like the pseudo-operation "use this qubit as a control" w.r.t. the tensor product.
 *
 * Implemented as a matrix [[C, 0], [0, 1]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {!Matrix}
 */
Matrix.CONTROL = Matrix.square([Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE, Matrix.__TENSOR_SYGIL_COMPLEX_ZERO,
                                Matrix.__TENSOR_SYGIL_COMPLEX_ZERO, 1]);

/**
 * A special value that acts like the pseudo-operation "use this qubit as an anti-control" w.r.t. the tensor product.
 *
 * Implemented as a matrix [[1, 0], [0, C]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {!Matrix}
 */
Matrix.ANTI_CONTROL = Matrix.square([1, Matrix.__TENSOR_SYGIL_COMPLEX_ZERO,
                                     Matrix.__TENSOR_SYGIL_COMPLEX_ZERO, Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE]);

/**
 * The 2x2 Pauli X matrix.
 * @type {!Matrix}
 */
Matrix.PAULI_X = Matrix.square([0, 1, 1, 0]);

/**
 * The 2x2 Pauli Y matrix.
 * @type {!Matrix}
 */
Matrix.PAULI_Y = Matrix.square([0, new Complex(0, -1), new Complex(0, 1), 0]);

/**
 * The 2x2 Pauli Z matrix.
 * @type {!Matrix}
 */
Matrix.PAULI_Z = Matrix.square([1, 0, 0, -1]);

/**
 * The 2x2 Hadamard matrix.
 * @type {!Matrix}
 */
Matrix.HADAMARD = Matrix.square([1, 1, 1, -1]).scaledBy(Math.sqrt(0.5));
