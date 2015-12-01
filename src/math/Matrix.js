import U from "src/base/Util.js"
import Seq from "src/base/Seq.js"
import Format from "src/base/Format.js"
import Complex from "src/math/Complex.js"

/**
 * A matrix of complex values.
 * @class
 */
class Matrix {
    /**
     * @param rows {!(!(!Complex[]))} The rows of complex coefficients making up the matrix.
     */
    constructor(rows) {
        U.need(Array.isArray(rows) && rows.every(Array.isArray), "array rows", rows);
        U.need(rows.length > 0, "non-zero height", arguments);

        let seqRows = new Seq(rows);
        let w = seqRows.map(e => e.length).distinct().single(0);
        U.need(w > 0, "consistent non-zero width", rows);
        U.need(seqRows.flatten().every(e => e instanceof Complex), "complex entries", rows);
    
        this.rows = rows;
    }

    /**
     * Determines if the receiving matrix is equal to the given matrix.
     * This method returns false, instead of throwing, when given badly typed arguments.
     * @param {!Matrix|*} obj
     * @returns {!boolean}
     */
    isEqualTo(obj) {
        if (this === obj) {
            return true;
        }
        if (!(obj instanceof Matrix)) {
            return false;
        }

        /** @type {!Matrix} */
        let other = obj;
        return new Seq(this.rows).isEqualTo(
            other.rows,
            (r1, r2) => new Seq(r1).isEqualTo(r2, U.CUSTOM_IS_EQUAL_TO_EQUALITY));
    }
    
    /**
     * Determines if the receiving matrix is approximately equal to the given matrix.
     * @param {!Matrix|*} other
     * @param {!number} epsilon Maximum distance between the two matrices.
     * @returns {!boolean}
     */
    isApproximatelyEqualTo(other, epsilon) {
        return other instanceof Matrix &&
            this.width() === other.width() &&
            this.height() === other.height() &&
            Math.sqrt(this.minus(other).norm2()) <= epsilon;
    };
    
    /**
     * Returns a text representation of the receiving matrix.
     * (It uses curly braces so you can paste it into wolfram alpha.)
     * @param {=Format} format
     * @returns {!string}
     */
    toString(format) {
        format = format || Format.EXACT;
        let data = this.rows.
            map(row => row.
                map(e => e === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE ? "C" : e.toString(format)).
                join(format.itemSeparator)).
            join("}" + format.itemSeparator + "{");
        return "{{" + data + "}}";
    };
    
    /**
     * @param {!string} text
     * @returns {!Matrix}
     * @throws
     */
    static parse(text) {
        text = text.replace(/\s/g, "");
    
        if (text.length < 4 || text.substr(0, 2) !== "{{" || text.substr(text.length - 2, 2) !== "}}") {
            throw new Error("Not surrounded by {{}}.");
        }
    
        // Some kind of recursive descent parser would be a better idea, but here we are.
        return new Matrix(text.
            substr(2, text.length - 4).
            split("},{").
            map(row => row.
                split(",").
                map(e => e === "C" ?
                    Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE :
                    Complex.parse(e))));
    };
    
    /**
     * Returns a matrix of the given dimensions, using the given function to generate the coefficients.
     * @param {!int} width
     * @param {!int} height
     * @param {!function} coefficientRowColGenerator
     * @returns {!Matrix}
     */
    static generate(width, height, coefficientRowColGenerator) {
        let rows = [];
        for (let r = 0; r < height; r++) {
            let row = [];
            rows.push(row);
            for (let c = 0; c < width; c++) {
                row.push(Complex.from(coefficientRowColGenerator(r, c)));
            }
        }
    
        return new Matrix(rows);
    };
    
    /**
     * Converts the given square block of coefficients into a square complex matrix.
     * @param {!Array<(!number|!Complex)>|!Array<!number>|!Array<!Complex>} coefs The coefficients of the matrix, arranged in a flat array of
     * square length with the coefficients (which can be numeric or complex) in row order.
     * @returns {!Matrix}
     */
    static square(coefs) {
        U.need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
        let n = Math.round(Math.sqrt(coefs.length));
        U.need(n * n === coefs.length, "Matrix.square: non-square number of arguments");
        return Matrix.generate(n, n, (r, c) => coefs[r * n + c]);
    };
    
    /**
     * Converts the array of complex coefficients into a column vector.
     * @param {!Array<(!number|!Complex)>|!Array<!number>|!Array<!Complex>} coefs
     * @returns {!Matrix}
     */
    static col(coefs) {
        U.need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
        return Matrix.generate(1, coefs.length, r => coefs[r]);
    };
    
    /**
     * Converts the array of complex coefficients into a row vector.
     * @param {!Array<(!number|!Complex)>|!Array<!number>|!Array<!Complex>} coefs
     * @returns {!Matrix}
     */
    static row(coefs) {
        U.need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
        return Matrix.generate(coefs.length, 1, (r, c) => coefs[c]);
    };
    
    /**
     * Returns the width of the receiving matrix.
     * @returns {!int}
     */
    width() {
        return this.rows[0].length;
    };
    
    /**
     * Returns the height of the receiving matrix.
     * @returns {!int}
     */
    height() {
        return this.rows.length;
    };
    
    /**
     * Determines if the matrix is approximately unitary or not.
     * @param {!number} epsilon Distance away from unitary the matrix is allowed to be. Defaults to 0.
     * @returns {!boolean}
     */
    isApproximatelyUnitary(epsilon) {
        let n = this.width();
        if (this.height() !== n) {
            return false;
        }
        return this.times(this.adjoint()).isApproximatelyEqualTo(Matrix.identity(n), epsilon);
    };
    
    /**
     * Returns the conjugate transpose of the receiving operation (the adjoint is the inverse when the matrix is unitary).
     * @returns {!Matrix}
     */
    adjoint() {
        return Matrix.generate(this.height(), this.width(), (r, c) => this.rows[c][r].conjugate());
    };
    
    /**
     * Returns the result of scaling the receiving matrix by the given scalar factor.
     * @param {!number|!Complex} v
     * @returns {!Matrix}
     */
    scaledBy(v) {
        return Matrix.generate(this.width(), this.height(), (r, c) => this.rows[r][c].times(v));
    };
    
    /**
     * Returns the sum of the receiving matrix and the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    plus(other) {
        let w = this.width();
        let h = this.height();
        U.need(other.width() === w && other.height() === h, "Matrix.plus: compatible sizes");
        return Matrix.generate(w, h, (r, c) => this.rows[r][c].plus(other.rows[r][c]));
    };
    
    /**
     * Returns the difference from the receiving matrix to the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    minus(other) {
        let w = this.width();
        let h = this.height();
        U.need(other.width() === w && other.height() === h, "Matrix.minus: compatible sizes");
        return Matrix.generate(w, h, (r, c) => this.rows[r][c].minus(other.rows[r][c]));
    };
    
    /**
     * Returns the matrix product (i.e. the composition) of the receiving matrix and the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    times(other) {
        let m = this;
        let w = other.width();
        let h = this.height();
        let n = this.width();
        U.need(other.height() === n, "Matrix.times: compatible sizes");
        return Matrix.generate(w, h, (r, c) => Seq.
            range(n).
            map(i => m.rows[r][i].times(other.rows[i][c])).
            aggregate(Complex.ZERO, (a, e) => a.plus(e)));
    };
    
    /**
     * Returns the receiving matrix's squared euclidean length.
     * @returns {!number}
     */
    norm2() {
        return new Seq(this.rows).flatten().map(e => e.norm2()).sum();
    };
    
    /**
     * Returns the tensor product of the receiving matrix and the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    tensorProduct(other) {
        let w1 = this.width();
        let w2 = other.width();
        let h1 = this.height();
        let h2 = other.height();
        return Matrix.generate(w1 * w2, h1 * h2, (r, c) => {
            let r1 = Math.floor(r / h2);
            let c1 = Math.floor(c / w2);
            let r2 = r % h2;
            let c2 = c % w2;
            let v1 = this.rows[r1][c1];
            let v2 = other.rows[r2][c2];
            if (v1 === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO || v2 === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO) {
                return Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
            }
            if (v1 === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE || v2 === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE) {
                return r1 === c1 && r2 === c2 ?
                    Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE :
                    Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
            }
            return v1.times(v2);
        });
    };
    
    /**
     * Returns the result of tensor-product-ing the receiving matrix with itself the given number of times.
     * @param {!int} exponent The number of times the matrix is tensor-product-ed with itself.
     * @returns {!Matrix}
     */
    tensorPower(exponent) {
        if (exponent === 0) {
            return Matrix.identity(1);
        }
        let t = this;
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
    static fromPauliRotation(x, y, z) {
        let sinc = t => {
            if (Math.abs(t) < 0.0002) { return 1 - t*t / 6.0; }
            return Math.sin(t) / t;
        };
    
        x = -x * Math.PI * 2;
        y = -y * Math.PI * 2;
        z = -z * Math.PI * 2;
    
        let s = -11*x + -13*y + -17*z >= 0 ? 1 : -1;  // phase correction discontinuity on an awkward plane
        let theta = Math.sqrt(x*x + y*y + z*z);
        let sigma_v = Matrix.PAULI_X.scaledBy(x).plus(
                      Matrix.PAULI_Y.scaledBy(y)).plus(
                      Matrix.PAULI_Z.scaledBy(z));

        /** @type {!Complex} */
        let ci = new Complex(1 + Math.cos(s * theta), Math.sin(s * theta)).times(0.5);
        /** @type {!Complex} */
        let cv = new Complex(Math.sin(theta/2) * sinc(theta/2), -s * sinc(theta)).times(s * 0.5);
    
        let m = Matrix.identity(2).scaledBy(ci).minus(sigma_v.scaledBy(cv));
        let expectNiceValuesCorrection = v => Format.simplifyByRounding(v, 0.0000000000001);
        return m.transformRealAndImagComponentsWith(expectNiceValuesCorrection);
    };
    
    static fromTargetedRotation(p) {
        U.need(p >= -1 && p <= 1, arguments);
        let c = Math.sqrt(1 - Math.abs(p));
        let s = (p < 0 ? -1 : +1) * Math.sqrt(Math.abs(p));
        c = Format.simplifyByRounding(c, 0.00000000001);
        s = Format.simplifyByRounding(s, 0.00000000001);
        return Matrix.square([c, -s, s, c]);
    };

    /**
     * @param {!function(!number) : !number} func
     * @returns {!Matrix}
     * @private
     */
    transformRealAndImagComponentsWith(func) {
        return new Matrix(this.rows.map(row => row.map(cell => new Complex(func(cell.real), func(cell.imag)))));
    };
    
    /**
     * Returns a matrix for an n-wire circuit that swaps wires i and j.
     * @param {!int} numWires
     * @param {!int} swapWire1
     * @param {!int} swapWire2
     */
    static fromWireSwap(numWires, swapWire1, swapWire2) {
        let bitSwap = n => {
            let m1 = 1 << swapWire1;
            let m2 = 1 << swapWire2;
            let s = n & ~(m1 | m2);
            if ((n & m1) !== 0) { s |= m2; }
            if ((n & m2) !== 0) { s |= m1; }
            return s;
        };
        return Matrix.generate(1 << numWires, 1 << numWires, (r, c) => bitSwap(r) === c ? 1 : 0);
    };
    
    /**
     * Returns the identity matrix, with 1s on the main diagonal and all other entries zero.
     * @param size The dimension of the returned identity matrix.
     * @returns {!Matrix}
     */
    static identity(size) {
        return Matrix.generate(size, size, (r, c) => r === c ? 1 : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO);
    };
    
    /**
     * Returns a rotation matrix that rotations by the given angle.
     * @param {!number} theta The angle the matrix should rotate by, in radians.
     * @returns {!Matrix} A real matrix.
     */
    static rotation(theta) {
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        return Matrix.square([
            c, -s,
            s, c]);
    };

    /**
     * Computes the eigenvalues and eigenvectors of a 2x2 matrix.
     * @returns {!Array.<!{val: !Complex, vec: !Matrix}>}
     */
    eigenDecomposition() {
        if (this.width() !== 2 || this.height() !== 2) {
            throw "Not implemented: non-2x2 eigen decomposition";
        }
        let [[a, b],
             [c, d]] = this.rows;
        let vals = Complex.rootsOfQuadratic(
            Complex.ONE,
            a.plus(d).times(-1),
            a.times(d).minus(b.times(c)));
        if (vals.length === 0) {
            throw new Error("Degenerate")
        }
        if (vals.length === 1) {
            return [
                {val: vals[0], vec: Matrix.col([1, 0])},
                {val: vals[0], vec: Matrix.col([0, 1])}
            ];
        }
        return vals.map(v => {
            // x*(a-L) + y*b = 0
            let [x, y] = [b.times(-1), a.minus(v)];
            if (x.isEqualTo(0) && y.isEqualTo(0)) {
                [x, y] = [v.minus(d), c];
            }
            if (!x.isEqualTo(0)) {
                y = y.dividedBy(x);
                x = Complex.ONE;
            }
            let m = Math.sqrt(x.norm2() + y.norm2());
            if (m === 0) {
                throw new Error("Unexpected degenerate");
            }
            return {val: v, vec: Matrix.col([x, y]).scaledBy(1/m)};
        });
    }

    /**
     * Lifts a numeric function so that it applies to matrices by using the eigendecomposition and applying the function
     * to the eigenvalue coefficients.
     * @param {!function(!Complex) : !Complex} complexFunction
     * @returns {!Matrix}
     */
    liftApply(complexFunction) {
        let t = this.scaledBy(0);
        for (let {val, vec} of this.eigenDecomposition()) {
            let fVal = complexFunction(val);
            let part = vec.times(vec.adjoint());
            t = t.plus(part.scaledBy(fVal));
        }
        return t;
    }

    /**
     * Factors the matrix int u*s*v parts, where u and v are unitary matrices and s is a real diagonal matrix.
     * @returns {!{u: !Matrix, s: !Matrix, v: !Matrix}}
     */
    singularValueDecomposition() {
        /**
         * @param {!Complex|!number} p
         * @param {!Complex|!number} q
         * @returns {!Matrix}
         */
        let phase_cancel_matrix = (p, q) => {
            return Matrix.square([
                Complex.from(p).unit().conjugate(), 0,
                0, Complex.from(q).unit().conjugate()]);
        };
    
        /**
         * @param {!Matrix} m
         * @returns {!{u: !Matrix, s: !Matrix, v: !Matrix}}
         */
        let svd_real_2x2 = m => {
            let a = Complex.realPartOf(m.rows[0][0]);
            let b = Complex.realPartOf(m.rows[0][1]);
            let c = Complex.realPartOf(m.rows[1][0]);
            let d = Complex.realPartOf(m.rows[1][1]);
    
            let t = a + d;
            let x = b + c;
            let y = b - c;
            let z = a - d;
    
            let theta_0 = Math.atan2(x, t) / 2.0;
            let theta_d = Math.atan2(y, z) / 2.0;
    
            let s_0 = Math.sqrt(t * t + x * x) / 2.0;
            let s_d = Math.sqrt(z * z + y * y) / 2.0;
    
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
        let svd_2x2 = m => {
            // Initially all entries are free.
            // m = | ?+?i  ?+?i |
            //     | ?+?i  ?+?i |
    
            // Cancel top row phase
            let p = phase_cancel_matrix(m.rows[0][0], m.rows[0][1]);
            let m2 = m.times(p);
            // m2 = m p r = | >     >    |
            //              | ?+?i  ?+?i |
    
            // Cancel top-right value by rotation.
            let r = Matrix.rotation(Math.atan2(m2.rows[0][1].real, m2.rows[0][0].real));
            let m3 = m2.times(r);
            // m3 = m p r = | ?+?i  0    |
            //              | ?+?i  ?+?i |
    
            // Make bottom row non-imaginary and non-negative by column phasing.
            let q = phase_cancel_matrix(m3.rows[1][0], m3.rows[1][1]);
            let m4 = m3.times(q);
            // m4 = m p r q = | ?+?i  0 |
            //                | >     > |
    
            // Cancel imaginary part of top left value by row phasing.
            let t = phase_cancel_matrix(m4.rows[0][0], 1);
            let m5 = t.times(m4);
            // m5 = t m p r q = | > 0 |
            //                  | > > |
    
            // All values are now real (also the top-right is zero), so delegate to a
            // singular value decomposition that works for real matrices.
            // t m p r q = u s v
            let usv = svd_real_2x2(m5);
    
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
    
    getColumn(colIndex) {
        U.need(colIndex >= 0 && colIndex <= this.width(), "colIndex >= 0 && colIndex <= this.width()");
        return this.rows.map(r => r[colIndex]);
    };
    
    /**
     * Returns the unitary matrix closest to the receiving matrix, "repairing" it into a unitary form.
     * @returns {!Matrix}
     */
    closestUnitary() {
        let svd = this.singularValueDecomposition();
        return svd.u.times(svd.v);
    };
}

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

export default Matrix;
