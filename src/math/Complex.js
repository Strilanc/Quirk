import Format from "src/base/Format.js"

/**
 * Represents a complex number like `a + b i`, where `a` and `b` are real values and `i` is the square root of -1.
 */
class Complex {
    /**
     * @param {!number} real The real part of the Complex number. The 'a' in a + bi.
     * @param {!number} imag The imaginary part of the Complex number. The 'b' in a + bi.
     */
    constructor(real, imag) {
        /**
         * The real part of the Complex number. The 'a' in a + bi.
         * @type {!number}
         */
        this.real = real;
        /**
         * The imaginary part of the Complex number. The 'b' in a + bi.
         * @type {!number}
         */
        this.imag = imag;
    }

    /**
     * Determines if the receiving complex value is equal to the given complex, integer, or float value.
     * This method returns false, instead of throwing, when given badly typed arguments.
     * @param {!number|!Complex|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (other instanceof Complex) {
            return this.real === other.real && this.imag === other.imag;
        }
        if (typeof other === "number") {
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
    isApproximatelyEqualTo(other, epsilon) {
        if (other instanceof Complex || typeof other === "number") {
            var d = this.minus(Complex.from(other));
            return Math.abs(d.real) <= epsilon &&
                Math.abs(d.imag) <= epsilon &&
                d.abs() <= epsilon;
        }
        return false;
    };

    /**
     * Wraps the given number into a Complex value (unless it's already a Complex value).
     * @param {!number|!Complex} v
     * @returns {!Complex}
     */
    static from(v) {
        if (v instanceof Complex) {
            return v;
        }
        if (typeof v === "number") {
            return new Complex(v, 0);
        }
        throw "Don't know how create a Complex equal to: " + v;
    };

    /**
     * Returns the real component of a Complex, integer, or float value.
     * @param {!number|!Complex} v
     * @returns {!number}
     */
    static realPartOf(v) {
        if (v instanceof Complex) {
            return v.real;
        }
        if (typeof v === "number") {
            return v;
        }
        throw "Don't know how to get real part of: " + v;
    };

    /**
     * Returns the imaginary component of a Complex value, or else 0 for integer and float values.
     * @param {!number|!Complex} v
     * @returns {!number}
     */
    static imagPartOf(v) {
        if (v instanceof Complex) {
            return v.imag;
        }
        if (typeof v === "number") {
            return 0;
        }
        throw "Don't know how to get imaginary part of: " + v;
    };

    /**
     * Returns a compact text representation of the receiving complex value.
     * @param {=Format} format
     * @returns {!string}
     */
    toString(format) {
        format = format || Format.EXACT;

        if (format.allowAbbreviation) {
            if (Math.abs(this.imag) <= format.maxAbbreviationError) {
                return format.formatFloat(this.real);
            }
            if (Math.abs(this.real) <= format.maxAbbreviationError) {
                if (Math.abs(this.imag - 1) <= format.maxAbbreviationError) {
                    return "i";
                }
                if (Math.abs(this.imag + 1) <= format.maxAbbreviationError) {
                    return "-i";
                }
                return format.formatFloat(this.imag) + "i";
            }
        }

        var separator = this.imag >= 0 ? "+" : "-";
        var imagFactor = format.allowAbbreviation && Math.abs(Math.abs(this.imag) - 1) <= format.maxAbbreviationError ?
            "" :
            format.formatFloat(Math.abs(this.imag));
        var prefix = format.allowAbbreviation || format.fixedDigits === undefined || this.real < 0 ? "" : "+";
        return prefix + format.formatFloat(this.real) + separator + imagFactor + "i";
    };

    /**
     * Parses a complex number from some text.
     * @param {!string} text
     * @returns {!Complex}
     */
    static parse(text) {
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

                var val = dif === "" ? 1 : Format.parseFloat(dif);
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
    norm2() {
        return this.real * this.real + this.imag * this.imag;
    };

    /**
     * Returns the euclidean length of the receiving complex value.
     * @returns {!number}
     */
    abs() {
        return Math.sqrt(this.norm2());
    };

    /**
     * Returns the complex conjugate of the receiving complex value, with the same real part but a negated imaginary part.
     * @returns {!Complex}
     */
    conjugate() {
        return new Complex(this.real, -this.imag);
    };

    /**
     * Returns the angle, in radians, of the receiving complex value with 0 being +real-ward and τ/4 being +imag-ward.
     * Zero defaults to having a phase of zero.
     * @returns {!number}
     */
    phase() {
        return Math.atan2(this.imag, this.real);
    };

    /**
     * Returns a unit complex value parallel to the receiving complex value.
     * Zero defaults to having the unit vector 1+0i.
     * @returns {!Complex}
     */
    unit() {
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
    plus(v) {
        var c = Complex.from(v);
        return new Complex(this.real + c.real, this.imag + c.imag);
    };

    /**
     * Returns the difference from the receiving complex value to the given value.
     * @param {!number|!Complex} v
     * @returns {!Complex}
     */
    minus(v) {
        var c = Complex.from(v);
        return new Complex(this.real - c.real, this.imag - c.imag);
    };

    /**
     * Returns the product of the receiving complex value times the given value.
     * @param {!number|!Complex} v
     * @returns {!Complex}
     */
    times(v) {
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
    dividedBy(v) {
        var c = Complex.from(v);
        var d = c.norm2();
        if (d === 0) {
            throw new Error("Division by Zero");
        }

        var n = this.times(c.conjugate());
        return new Complex(n.real / d, n.imag / d);
    };

    sqrts() {
        let [r, i] = [this.real, this.imag];
        let m = Math.sqrt(Math.sqrt(r*r + i*i));
        if (m === 0) {
            return [Complex.ZERO];
        }
        if (i === 0 && r < 0) {
            return [new Complex(0, m), new Complex(0, -m)]
        }

        let a = this.phase() / 2;
        let c = new Complex(m * Math.cos(a), m * Math.sin(a));
        return [c, c.times(-1)];
    }

    /**
     * Returns the result of raising Euler's constant to the receiving complex value.
     * @returns {!Complex}
     */
    exp() {
        let [m, c, s] = [Math.exp(this.real), Math.cos(this.imag), Math.sin(this.imag)];
        return new Complex(m*c, m*s);
    }

    /**
     * Returns the natural logarithm of the receiving complex value.
     * @returns {!Complex}
     */
    ln() {
        return new Complex(Math.log(this.abs()), this.phase());
    }

    /**
     * Returns the result of raising the receiving complex value to the given complex exponent.
     * @param {!number|!Complex} exponent
     * @returns {!Complex}
     */
    raisedTo(exponent) {
        return this.ln().times(Complex.from(exponent)).exp();
    }

    /**
     * Returns the distinct roots of the quadratic, or linear, equation.
     */
    static rootsOfQuadratic(a, b, c) {
        a = Complex.from(a);
        b = Complex.from(b);
        c = Complex.from(c);

        if (a.isEqualTo(0)) {
            if (!b.isEqualTo(0)) {
                return [-c / b];
            }
            if (!c.isEqualTo(0)) {
                return [];
            }
            throw Error("Degenerate");
        }

        let difs = b.times(b).minus(a.times(c).times(4)).sqrts();
        let mid = b.times(-1);
        let denom = a.times(2);
        return difs.map(d => mid.minus(d).dividedBy(denom));
    }
}

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

export default Complex;
