/**
 * A Complex number of the form a + bi, where i is the square root of -1.
 * @param {!number} real The real part of the Complex number. The 'a' in a + bi.
 * @param {!number} imag The imaginary part of the Complex number. The 'b' in a + bi.
 * @property {!number} real
 * @property {!number} imag
 * @constructor
 */
function Complex(real, imag) {
    this.real = real;
    this.imag = imag;
}

/**
 * @returns {!object}
 */
Complex.prototype.toJson = function() {
    return this.toString();
};

/**
 * @param {object} json
 * @returns {!Complex}
 * @throws {Error}
 */
Complex.fromJson = function(json) {
    if (isString(json)) {
        //noinspection JSCheckFunctionSignatures
        return Complex.parse(json);
    }
    throw new Error("Not a packed complex string: " + json);
};

/**
 * The complex number equal to zero.
 * @type {!Complex}
 */
Complex.ZERO = new Complex(0, 0);

/**
 * The complex number equal to one.
 * @type {!Complex}
 */
Complex.ONE = new Complex(1, 0);

/**
 * The square root of negative 1.
 * @type {!Complex}
 */
Complex.I = new Complex(0, 1);

/**
 * Determines if the receiving complex value is equal to the given complex, integer, or float value.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {!number|!Complex|*} other
 * @returns {!boolean}
 */
Complex.prototype.isEqualTo = function (other) {
    if (other instanceof Complex) {
        return this.real === other.real && this.imag === other.imag;
    }
    if (isNumber(other)) {
        return this.real === other && this.imag === 0;
    }
    return false;
};

/**
 * Determines if the receiving complex value is near the given complex, integer, or float value.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {!number|!Complex|*} other
 * @param {!number} epsilon
 * @returns {!boolean}
 */
Complex.prototype.isApproximatelyEqualTo = function (other, epsilon) {
    if (other instanceof Complex || isNumber(other)) {
        return this.minus(Complex.from(other)).norm2() <= epsilon;
    }
    return false;
};

/**
 * Wraps the given number into a Complex value (unless it's already a Complex value).
 * @param {!number|!Complex} v
 * @returns {!Complex}
 */
Complex.from = function (v) {
    if (v instanceof Complex) {
        return v;
    }
    if (isNumber(v)) {
        return new Complex(v, 0);
    }
    throw "Don't know how create a Complex equal to: " + v;
};

/**
 * Returns the real component of a Complex, integer, or float value.
 * @param {!number|!Complex} v
 * @returns {!number}
 */
Complex.realPartOf = function (v) {
    if (v instanceof Complex) {
        return v.real;
    }
    if (isNumber(v)) {
        return v;
    }
    throw "Don't know how to get real part of: " + v;
};

/**
 * Returns the imaginary component of a Complex value, or else 0 for integer and float values.
 * @param {!number|!Complex} v
 * @returns {!number}
 */
Complex.imagPartOf = function (v) {
    if (v instanceof Complex) {
        return v.imag;
    }
    if (isNumber(v)) {
        return 0;
    }
    throw "Don't know how to get imaginary part of: " + v;
};

/**
 * Returns a compact text representation of the receiving complex value.
 * @returns {!string}
 */
Complex.prototype.toString = function () {
    var epsilon = 0.00001;

    if (Math.abs(this.imag) < epsilon) {
        return floatToCompactString(this.real);
    }
    if (Math.abs(this.real) < epsilon) {
        if (Math.abs(this.imag - 1) < epsilon) {
            return "i";
        }
        if (Math.abs(this.imag + 1) < epsilon) {
            return "-i";
        }
        return floatToCompactString(this.imag) + "i";
    }
    var separator = this.imag > 0 ? "+" : "-";
    var imagFactor = Math.abs(Math.abs(this.imag) - 1) < epsilon ? "" : floatToCompactString(Math.abs(this.imag));
    return floatToCompactString(this.real) + separator + imagFactor + "i";
};

/**
 * Parses a complex number from some text.
 * @param {!string} text
 * @returns {!Complex}
 */
Complex.parse = function(text) {
    var sums = text.split("+");
    var total = Complex.ZERO;
    for (var i = 0; i < sums.length; i++) {
        var difs = sums[i].replace("e-", "e_minus").split("-");

        for (var j = 0; j < difs.length; j++) {
            var dif = difs[j].replace("e_minus", "e-");
            if (j === 0 && dif === "") {
                continue;
            }

            var isImaginaryPart = dif[dif.length - 1] === "i";
            if (isImaginaryPart) {
                dif = dif.slice(0, dif.length - 1);
            }

            var val = dif === "" ? 1 : parseFloatFromCompactString(dif);
            if (isNaN(val)) {
                throw "Not a float: '" + dif + "'";
            }
            var com = Complex.from(val).
                times(isImaginaryPart ? Complex.I : 1).
                times(j === 0 ? 1 : -1);
            total = total.plus(com);
        }
    }
    return total;
};

/**
 * Returns the squared euclidean length of the receiving complex value.
 * @returns {!number}
 */
Complex.prototype.norm2 = function () {
    return this.real * this.real + this.imag * this.imag;
};

/**
 * Returns the euclidean length of the receiving complex value.
 * @returns {!number}
 */
Complex.prototype.abs = function () {
    return Math.sqrt(this.norm2());
};

/**
 * Returns the complex conjugate of the receiving complex value, with the same real part but a negated imaginary part.
 * @returns {!Complex}
 */
Complex.prototype.conjugate = function () {
    return new Complex(this.real, -this.imag);
};

/**
 * Returns the angle, in radians, of the receiving complex value with 0 being +real-ward and τ/4 being +imag-ward.
 * Zero defaults to having a phase of zero.
 * @returns {!number}
 */
Complex.prototype.phase = function () {
    return Math.atan2(this.imag, this.real);
};

/**
 * Returns a unit complex value parallel to the receiving complex value.
 * Zero defaults to having the unit vector 1+0i.
 * @returns {!Complex}
 */
Complex.prototype.unit = function () {
    var m = this.norm2();
    if (m < 0.00001) {
        var theta = this.phase();
        return new Complex(Math.cos(theta), -Math.sin(theta));
    }
    return this.dividedBy(Math.sqrt(m));
};

/**
 * Returns the sum of the receiving complex value plus the given value.
 * @param {!number|!Complex} v
 * @returns {!Complex}
 */
Complex.prototype.plus = function (v) {
    var c = Complex.from(v);
    return new Complex(this.real + c.real, this.imag + c.imag);
};

/**
 * Returns the difference from the receiving complex value to the given value.
 * @param {!number|!Complex} v
 * @returns {!Complex}
 */
Complex.prototype.minus = function (v) {
    var c = Complex.from(v);
    return new Complex(this.real - c.real, this.imag - c.imag);
};

/**
 * Returns the product of the receiving complex value times the given value.
 * @param {!number|!Complex} v
 * @returns {!Complex}
 */
Complex.prototype.times = function (v) {
    var c = Complex.from(v);
    return new Complex(
        this.real * c.real - this.imag * c.imag,
        this.real * c.imag + this.imag * c.real);
};

/**
 * Returns the ratio of the receiving complex value to the given value.
 * @param {!number|!Complex} v
 * @returns {!Complex}
 */
Complex.prototype.dividedBy = function (v) {
    var c = Complex.from(v);
    var d = c.norm2();
    need(d !== 0, "Division by Zero");

    var n = this.times(c.conjugate());
    return new Complex(n.real / d, n.imag / d);
};
