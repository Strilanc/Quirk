/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Complex} from "./Complex.js"
import {DetailedError} from "../base/DetailedError.js"
import {Format} from "../base/Format.js"
import {seq, Seq} from "../base/Seq.js"
import {Util} from "../base/Util.js"

/**
 * A matrix of complex values.
 * @class
 */
class Matrix {
    /**
     * @param {int} width
     * @param {int} height
     * @param {!Float64Array|!Float32Array} buffer Complex value data, packed row-wise with real and imaginary
     * coefficients interleaved.
     */
    constructor(width, height, buffer) {
        if (width*height*2 !== buffer.length) {
            throw new DetailedError("width*height*2 !== buffer.length", {width, height, len: buffer.length});
        }
        /**
         * @type {int}
         * @private
         */
        this._width = width;
        /**
         * @type {int}
         * @private
         */
        this._height = height;
        /**
         * @type {!Float32Array|!Float64Array}
         * @private
         */
        this._buffer = buffer;
    }

    /**
     * @param {int} col
     * @param {int} row
     * @returns {!Complex}
     */
    cell(col, row) {
        if (col < 0 || row < 0 || col >= this._width || row >= this._height) {
            throw new DetailedError("Cell out of range", {col, row, width: this._width, height: this._height});
        }
        let i = (this._width*row + col)*2;
        return new Complex(this._buffer[i], this._buffer[i + 1]);
    }

    /**
     * @returns {!Float64Array|!Float32Array}
     */
    rawBuffer() {
        return this._buffer;
    }

    /**
     * Encodes the matrix into JSON that could easily be read by humans or processed by external programs.
     * @returns {*}
     */
    toReadableJson() {
        return seq(this.rows()).map(complexVectorToReadableJson).toArray();
    }
    /**
     * @returns {!Array.<!Array.<Complex>>}
     */
    rows() {
        return Seq.range(this._height).
            map(row => Seq.range(this._width).
                map(col => this.cell(col, row)).
                toArray()).
            toArray();
    }

    /**
     * @param rows {!Array.<!Array.<Complex>>} The rows of complex coefficients making up the matrix.
     */
    static fromRows(rows) {
        Util.need(Array.isArray(rows) && rows.every(Array.isArray), "array rows", rows);
        Util.need(rows.length > 0, "non-zero height", arguments);

        let seqRows = seq(rows);
        let h = rows.length;
        let w = seqRows.map(e => e.length).distinct().single(null);
        if (w === null) {
            throw new DetailedError("Inconsistent row widths.", {rows});
        }

        let buffer = new Float64Array(w * h * 2);
        let i = 0;
        for (let row of rows) {
            for (let cell of row) {
                buffer[i] = Complex.realPartOf(cell);
                buffer[i + 1] = Complex.imagPartOf(cell);
                i += 2;
            }
        }
        return new Matrix(w, h, buffer);
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
        return this._width === other._width &&
            this._height === other._height &&
            Seq.range(this._buffer.length).every(i => this._buffer[i] === other._buffer[i]);
    }

    /**
     * Determines if the receiving matrix is approximately equal to the given matrix.
     * @param {!Matrix|*} other
     * @param {!number} epsilon Maximum distance between the two matrices.
     * @returns {!boolean}
     */
    isApproximatelyEqualTo(other, epsilon) {
        return other instanceof Matrix &&
            this._width === other._width &&
            this._height === other._height &&
            Math.sqrt(this.minus(other).norm2()) <= epsilon;
    }

    /**
     * Returns a text representation of the receiving matrix.
     * (It uses curly braces so you can paste it into wolfram alpha.)
     * @param {=Format} format
     * @returns {!string}
     */
    toString(format = Format.EXACT) {
        let data = this.rows().
            map(row => row.
                map(e => e.toString(format)).
                join(format.itemSeparator)).
            join("}" + format.itemSeparator + "{");
        return "{{" + data + "}}";
    }

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
        return Matrix.fromRows(text.
            substr(2, text.length - 4).
            split("},{").
            map(row => row.
                split(",").
                map(Complex.parse)));
    }

    /**
     * Returns a matrix of the given dimensions, using the given function to generate the coefficients.
     * @param {!int} width
     * @param {!int} height
     * @param {!function(row: !int, col: !int): (!number|!Complex)} coefficientRowColGenerator
     * @returns {!Matrix}
     */
    static generate(width, height, coefficientRowColGenerator) {
        let buf = new Float64Array(width*height*2);
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                let k = (r*width + c)*2;
                let v = coefficientRowColGenerator(r, c);
                buf[k] = Complex.realPartOf(v);
                buf[k+1] = Complex.imagPartOf(v);
            }
        }
        return new Matrix(width, height, buf);
    }

    /**
     * Returns a diagonal matrix of the given size, using the given function to generate the diagonal coefficients.
     * @param {!int} size
     * @param {!function(!int): (!number|!Complex)} coefficientFunc
     * @returns {!Matrix}
     */
    static generateDiagonal(size, coefficientFunc) {
        let buf = new Float64Array(size*size*2);
        for (let i = 0; i < size; i++) {
            let k = i*(size+1)*2;
            let v = coefficientFunc(i);
            buf[k] = Complex.realPartOf(v);
            buf[k+1] = Complex.imagPartOf(v);
        }
        return new Matrix(size, size, buf);
    }

    /**
     * Returns a matrix of the given size, with each column being mapped to a row by the transition function.
     * @param {!int} size
     * @param {!function(!int): !int} transitionFunc
     * @returns {!Matrix}
     */
    static generateTransition(size, transitionFunc) {
        let buf = new Float64Array(size*size*2);
        for (let c = 0; c < size; c++) {
            let r = transitionFunc(c);
            let k = (r*size + c)*2;
            buf[k] = 1;
        }
        return new Matrix(size, size, buf);
    }

    /**
     * Returns a zero matrix of the given size.
     * @param {!number} width
     * @param {!number} height
     * @returns {!Matrix}
     */
    static zero(width, height) {
        return new Matrix(width, height, new Float64Array(width*height*2));
    }

    /**
     * Returns a 1x1 matrix containing the given value.
     * @param {!number|!Complex} coef
     * @returns {!Matrix}
     */
    static solo(coef) {
        return new Matrix(1, 1, new Float64Array([Complex.realPartOf(coef), Complex.imagPartOf(coef)]));
    }

    /**
     * Converts the given square block of coefficients into a square complex matrix.
     * @param {!number|!Complex} coefs The coefficients of the matrix,
     * arranged in a flat array of square length with the coefficients (which can be numeric or complex) in row order.
     * @returns {!Matrix}
     */
    static square(...coefs) {
        Util.need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
        let n = Math.round(Math.sqrt(coefs.length));
        Util.need(n * n === coefs.length, "Matrix.square: non-square number of arguments");
        return Matrix.generate(n, n, (r, c) => coefs[r * n + c]);
    }

    /**
     * Converts the array of complex coefficients into a column vector.
     * @param {!number|!Complex} coefs
     * @returns {!Matrix}
     */
    static col(...coefs) {
        Util.need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
        return Matrix.generate(1, coefs.length, r => coefs[r]);
    }

    /**
     * Converts the array of complex coefficients into a row vector.
     * @param {!number|!Complex} coefs
     * @returns {!Matrix}
     */
    static row(...coefs) {
        Util.need(Array.isArray(coefs), "Array.isArray(coefs)", arguments);
        return Matrix.generate(coefs.length, 1, (r, c) => coefs[c]);
    }

    /**
     * Returns the width of the receiving matrix.
     * @returns {!int}
     */
    width() {
        return this._width;
    }

    /**
     * Returns the height of the receiving matrix.
     * @returns {!int}
     */
    height() {
        return this._height;
    }

    /**
     * Determines if the matrix is approximately unitary or not.
     * @param {!number} epsilon Distance away from unitary the matrix is allowed to be. Defaults to 0.
     * @returns {!boolean}
     */
    isUnitary(epsilon) {
        let n = this.width();
        if (this.height() !== n) {
            return false;
        }
        return this.times(this.adjoint()).isApproximatelyEqualTo(Matrix.identity(n), epsilon);
    }

    /**
     * @param {!number=} epsilon
     * @returns {!boolean}
     */
    isLowerTriangular(epsilon=0) {
        for (let r = 0; r < this._height; r++) {
            for (let c = r + 1; c < this._width; c++) {
                let k = (r*this._width + c)*2;
                let v1 = this._buffer[k];
                let v2 = this._buffer[k+1];
                if (isNaN(v1) || isNaN(v2) || v1*v1 + v2*v2 > epsilon*epsilon) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @param {!number=} epsilon
     * @returns {!boolean}
     */
    isUpperTriangular(epsilon=0) {
        for (let r = 0; r < this._height; r++) {
            for (let c = 0; c < r && c < this._width; c++) {
                let k = (r*this._width + c)*2;
                let v1 = this._buffer[k];
                let v2 = this._buffer[k+1];
                if (isNaN(v1) || isNaN(v2) || v1*v1 + v2*v2 > epsilon*epsilon) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Determines if the matrix can be factored into a permutation matrix times a diagonal matrix.
     * @param {!number=} epsilon
     * @returns {!boolean}
     */
    isPhasedPermutation(epsilon = 0) {
        if (this._width !== this._height) {
            return false;
        }

        let n = this._width;
        let colCounts = new Uint32Array(n);
        let rowCounts = new Uint32Array(n);

        // Count number of non-zero elements in each row and column.
        for (let col = 0; col < n; col++) {
            for (let row = 0; row < n; row++) {
                let i = (row*n + col)*2;
                let m = Math.max(Math.abs(this._buffer[i]), Math.abs(this._buffer[i+1]));
                if (isNaN(m) || m > epsilon) {
                    colCounts[col] += 1;
                    rowCounts[row] += 1;
                }
            }
        }

        // Phased permutations have at most one entry in each row and column.
        return seq(colCounts).concat(rowCounts).every(e => e <= 1);
    }

    /**
     * Determines if the matrix is approximately equal to its own conjugate transpose or not.
     * @param {!number} epsilon Maximum error per entry.
     * @returns {!boolean}
     */
    isApproximatelyHermitian(epsilon) {
        if (this._width !== this._height) {
            return false;
        }
        for (let c = 0; c < this._width; c++) {
            for (let r = 0; r < this._height; r++) {
                let i = (this._width*r + c)*2;
                let j = (this._width*c + r)*2;
                if (Math.abs(this._buffer[i] - this._buffer[j]) > epsilon) {
                    return false;
                }
                if (Math.abs(this._buffer[i+1] + this._buffer[j+1]) > epsilon) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Determines if the matrix is an identity matrix.
     * @param {!number} epsilon
     * @returns {!boolean}
     */
    isIdentity(epsilon=0) {
        if (this._width !== this._height) {
            return false;
        }
        for (let c = 0; c < this._width; c++) {
            for (let r = 0; r < this._height; r++) {
                let i = (this._width*r + c)*2;
                let dr = Math.abs(this._buffer[i] - (r === c ? 1 : 0));
                let di = Math.abs(this._buffer[i+1]);
                if (Math.max(dr, di) > epsilon) {
                    return false;
                }
            }
        }
        return !this.hasNaN();
    }

    /**
     * Determines if the matrix is a scaled identity matrix.
     * @param {!number} epsilon
     * @returns {!boolean}
     */
    isScaler(epsilon=0) {
        if (this._width !== this._height) {
            return false;
        }
        let sr = this._buffer[0];
        let si = this._buffer[1];
        for (let c = 0; c < this._width; c++) {
            for (let r = 0; r < this._height; r++) {
                let i = (this._width*r + c)*2;
                let dr = Math.abs(this._buffer[i] - (r === c ? sr : 0));
                let di = Math.abs(this._buffer[i+1] - (r === c ? si : 0));
                if (Math.max(dr, di) > epsilon) {
                    return false;
                }
            }
        }
        return !this.hasNaN();
    }

    /**
     * Determines if the matrix contains a NaN.
     * @returns {!boolean}
     */
    hasNaN() {
        for (let i = 0; i < this._buffer.length; i++) {
            if (isNaN(this._buffer[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determines if the matrix is square and only has entries along its main diagonal.
     * @param {!number=} epsilon
     * @returns {!boolean}
     */
    isDiagonal(epsilon=0) {
        for (let c = 0; c < this._width; c++) {
            for (let r = 0; r < this._height; r++) {
                if (r === c) {
                    continue;
                }
                let k = (this._width*r + c)*2;
                let dr = Math.abs(this._buffer[k]);
                let di = Math.abs(this._buffer[k+1]);
                let d = Math.max(dr, di);
                if (isNaN(d) || d > epsilon) {
                    return false;
                }
            }
        }
        return this._width === this._height;
    }

    /**
     * Returns the conjugate transpose of the receiving operation (the adjoint is the inverse when the matrix is unitary).
     * @returns {!Matrix}
     */
    adjoint() {
        let w = this._height;
        let h = this._width;
        let newBuf = new Float64Array(w*h*2);
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                let kIn = (c*this._width + r)*2;
                let kOut = (r*w + c)*2;
                newBuf[kOut] = this._buffer[kIn];
                newBuf[kOut+1] = -this._buffer[kIn+1];
            }
        }
        return new Matrix(w, h, newBuf);
    }

    /**
     * @returns {!Matrix} The transpose of the receiving matrix.
     */
    transpose() {
        let w = this._height;
        let h = this._width;
        let newBuf = new Float64Array(w*h*2);
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                let kIn = (c*this._width + r)*2;
                let kOut = (r*w + c)*2;
                newBuf[kOut] = this._buffer[kIn];
                newBuf[kOut+1] = this._buffer[kIn+1];
            }
        }
        return new Matrix(w, h, newBuf);
    }

    /**
     * Returns the matrix' trace (i.e. the sum of its diagonal elements, i.e. the sum of its eigenvalues
     * if it's square).
     * @returns {!Complex}
     */
    trace() {
        let total_r = 0;
        let total_i = 0;
        let d = this._width*2 + 2;
        for (let i = 0; i < this._buffer.length; i += d) {
            total_r += this._buffer[i];
            total_i += this._buffer[i+1];
        }
        return new Complex(total_r, total_i);
    }

    /**
     * Returns the result of scaling the receiving matrix by the given scalar factor.
     * @param {!number|!Complex} v
     * @returns {!Matrix}
     * @private
     */
    _timesScalar(v) {
        let newBuffer = new Float64Array(this._buffer.length);
        let sr = Complex.realPartOf(v);
        let si = Complex.imagPartOf(v);
        for (let i = 0; i < newBuffer.length; i += 2) {
            let vr = this._buffer[i];
            let vi = this._buffer[i + 1];
            newBuffer[i] = vr*sr - vi*si;
            newBuffer[i + 1] = vr*si + vi*sr;
        }
        return new Matrix(this._width, this._height, newBuffer);
    }

    /**
     * Returns the sum of the receiving matrix and the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    plus(other) {
        let {_width: w, _height: h, _buffer: b1} = this;
        let b2 = other._buffer;
        Util.need(other._width === w && other._height === h, "Matrix.plus: compatible sizes");

        let newBuffer = new Float64Array(this._buffer.length);
        for (let i = 0; i < newBuffer.length; i++) {
            newBuffer[i] = b1[i] + b2[i];
        }
        return new Matrix(w, h, newBuffer);
    }

    /**
     * Returns the difference from the receiving matrix to the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    minus(other) {
        let {_width: w, _height: h, _buffer: b1} = this;
        let b2 = other._buffer;
        Util.need(other._width === w && other._height === h, "Matrix.minus: compatible sizes");

        let newBuffer = new Float64Array(this._buffer.length);
        for (let i = 0; i < newBuffer.length; i++) {
            newBuffer[i] = b1[i] - b2[i];
        }
        return new Matrix(w, h, newBuffer);
    }

    /**
     * Returns the matrix product (i.e. the composition) of the receiving matrix and the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     * @private
     */
    _timesMatrix(other) {
        if (this._width !== other._height) {
            throw new DetailedError("Incompatible sizes.", {'this': this, other})
        }
        let w = other._width;
        let h = this._height;
        let n = this._width;
        let newBuffer = new Float64Array(w*h*2);
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                let k3 = (r*w + c)*2;
                for (let k = 0; k < n; k++) {
                    let k1 = (r*n + k)*2;
                    let k2 = (k*w + c)*2;
                    let r1 = this._buffer[k1];
                    let i1 = this._buffer[k1+1];
                    let r2 = other._buffer[k2];
                    let i2 = other._buffer[k2+1];
                    let r3 = r1*r2 - i1*i2;
                    let i3 = r1*i2 + r2*i1;
                    newBuffer[k3] += r3;
                    newBuffer[k3+1] += i3;
                }
            }
        }
        return new Matrix(w, h, newBuffer);
    }

    /**
     * Returns the product of the receiving matrix and the given matrix or scalar.
     * @param {!Matrix|!number|!Complex} other A matrix or a scalar value.
     * @returns {!Matrix}
     */
    times(other) {
        //noinspection JSCheckFunctionSignatures
        return other instanceof Matrix ? this._timesMatrix(other) : this._timesScalar(other);
    }

    /**
     * Expands a qubit operation so that it applies to a larger register of qubits, with optional controls.
     * @param {!int} targetQubitOffset
     * @param {!int} registerSize
     * @param {!Controls} controls
     * @returns {!Matrix}
     */
    expandedForQubitInRegister(targetQubitOffset, registerSize, controls) {
        let used = Math.round(Math.log2(this._width));
        let result = Matrix.identity(1 << (registerSize - targetQubitOffset - used)).
            tensorProduct(this).
            tensorProduct(Matrix.identity(1 << targetQubitOffset)).
            _clone();

        for (let c = 0; c < result._width; c++) {
            for (let r = 0; r < result._height; r++) {
                if (!controls.allowsState(c) || !controls.allowsState(r)) {
                    let k = 2*(c + r*result._width);
                    result._buffer[k] = c === r ? 1 : 0;
                    result._buffer[k+1] = 0;
                }
            }
        }

        return result;
    }

    /**
     * @param {!Matrix} stateVector
     * @param {!int} qubitIndex
     * @param {!Controls} controls
     * @returns {!Matrix}
     */
    applyToStateVectorAtQubitWithControls(stateVector, qubitIndex, controls) {
        let chunkSize = this._width*2;
        let chunkBuf = stateVector._buffer.slice(0, chunkSize);
        let strideLength = 2 << qubitIndex;
        let strideChunkSize = strideLength*chunkSize >> 1;
        let resultBuf = stateVector._buffer.slice();
        for (let strideChunkStart = 0; strideChunkStart < resultBuf.length; strideChunkStart += strideChunkSize) {
            for (let strideOffset = 0; strideOffset < strideLength; strideOffset += 2) {
                if (!controls.allowsState((strideChunkStart | strideOffset) >> 1)) {
                    continue;
                }

                // Collect inputs into a small contiguous vector.
                let k = strideChunkStart + strideOffset;
                for (let i = 0; i < chunkBuf.length; i += 2) {
                    chunkBuf[i] = stateVector._buffer[k];
                    chunkBuf[i+1] = stateVector._buffer[k+1];
                    k += strideLength;
                }

                let transformedChunk = this.times(new Matrix(1, chunkBuf.length >> 1, chunkBuf));

                // Scatter outputs.
                k = strideChunkStart + strideOffset;
                for (let i = 0; i < chunkBuf.length; i += 2) {
                    resultBuf[k] = transformedChunk._buffer[i];
                    resultBuf[k+1] = transformedChunk._buffer[i+1];
                    k += strideLength;
                }
            }
        }
        return new Matrix(1, stateVector.height(), resultBuf);
    }

    /**
     * Returns the receiving matrix's squared euclidean length.
     * @returns {!number}
     */
    norm2() {
        let t = 0;
        for (let e of this._buffer) {
            t += e*e;
        }
        return t;
    }

    /**
     * Returns the tensor product of the receiving matrix and the given matrix.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    tensorProduct(other) {
        let w1 = this._width;
        let h1 = this._height;
        let w2 = other._width;
        let h2 = other._height;
        let w = w1*w2;
        let h = h1*h2;
        let newBuffer = new Float64Array(w*h*2);
        for (let r1 = 0; r1 < h1; r1++) {
            for (let r2 = 0; r2 < h2; r2++) {
                for (let c1 = 0; c1 < w1; c1++) {
                    for (let c2 = 0; c2 < w2; c2++) {
                        let k1 = (r1*w1 + c1)*2;
                        let k2 = (r2*w2 + c2)*2;
                        let k3 = ((r1*h2 + r2)*w + (c1*w2 + c2))*2;
                        let cr1 = this._buffer[k1];
                        let ci1 = this._buffer[k1+1];
                        let cr2 = other._buffer[k2];
                        let ci2 = other._buffer[k2+1];
                        let cr3 = cr1*cr2 - ci1*ci2;
                        let ci3 = cr1*ci2 + ci1*cr2;
                        newBuffer[k3] = cr3;
                        newBuffer[k3+1] = ci3;
                    }
                }
            }
        }
        return new Matrix(w, h, newBuffer);
    }

    timesQubitOperation(operation2x2, qubitIndex, controlMask, desiredValueMask) {
        Util.need((controlMask & (1 << qubitIndex)) === 0, "Matrix.timesQubitOperation: self-controlled");
        Util.need(operation2x2._width === 2 && operation2x2._height === 2, "Matrix.timesQubitOperation: not 2x2");

        let {_width: w, _height: h, _buffer: old} = this;
        let [ar, ai, br, bi, cr, ci, dr, di] = operation2x2._buffer;

        Util.need(h >= (2 << qubitIndex), "Matrix.timesQubitOperation: qubit index out of range");

        let buf = new Float64Array(old);
        let i = 0;
        for (let r = 0; r < h; r++) {
            let isControlled = ((controlMask & r) ^ desiredValueMask) !== 0;
            let qubitVal = (r & (1 << qubitIndex)) !== 0;
            for (let c = 0; c < w; c++) {
                if (!isControlled && !qubitVal) {
                    let j = i + (1 << qubitIndex)*2*w;
                    let xr = buf[i];
                    let xi = buf[i+1];
                    let yr = buf[j];
                    let yi = buf[j+1];

                    buf[i] = xr*ar - xi*ai + yr*br - yi*bi;
                    buf[i+1] = xr*ai + xi*ar + yr*bi + yi*br;
                    buf[j] = xr*cr - xi*ci + yr*dr - yi*di;
                    buf[j+1] = xr*ci + xi*cr + yr*di + yi*dr;
                }
                i += 2;
            }
        }
        return new Matrix(w, h, buf);
    }

    /**
     * Returns the result of tensor-product-ing the receiving matrix with itself the given number of times.
     * @param {!int} exponent The number of times the matrix is tensor-product-ed with itself.
     * @returns {!Matrix}
     */
    tensorPower(exponent) {
        if (!Number.isInteger(exponent) || exponent < 0) {
            throw new DetailedError("Bad exponent", {exponent});
        }
        let t = Matrix.identity(1);
        let p = this;
        for (let m = 1; m <= exponent; m *= 2) {
            if ((m & exponent) !== 0) {
                t = t.tensorProduct(p);
            }
            p = p.tensorProduct(p);
        }
        return t;
    }

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
        let sigma_v = Matrix.PAULI_X.times(x).plus(
                      Matrix.PAULI_Y.times(y)).plus(
                      Matrix.PAULI_Z.times(z));

        /** @type {!Complex} */
        let [cos, sin] = Util.snappedCosSin(s * theta);
        let ci = new Complex(1 + cos, sin).times(0.5);
        /** @type {!Complex} */
        let cv = new Complex(Math.sin(theta/2) * sinc(theta/2), -s * sinc(theta)).times(s * 0.5);

        //noinspection JSCheckFunctionSignatures
        let m = Matrix.identity(2).times(ci).minus(sigma_v.times(cv));
        let expectNiceValuesCorrection = v => Format.simplifyByRounding(v, 0.0000000000001);
        return m.transformRealAndImagComponentsWith(expectNiceValuesCorrection);
    }

    /**
     * @param {!function(!number) : !number} func
     * @returns {!Matrix}
     * @private
     */
    transformRealAndImagComponentsWith(func) {
        let buf = this._buffer.slice();
        for (let i = 0; i < buf.length; i++) {
            buf[i] = func(buf[i]);
        }
        return new Matrix(this._width, this._height, buf);
    }

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
        return Matrix.generateTransition(1<<numWires, bitSwap);
    }

    /**
     * Returns the identity matrix, with 1s on the main diagonal and all other entries zero.
     * @param size The dimension of the returned identity matrix.
     * @returns {!Matrix}
     */
    static identity(size) {
        if (!Number.isInteger(size) || size <= 0) {
            throw new DetailedError("Bad size", {size});
        }
        let buf = new Float64Array(size*size*2);
        for (let k = 0; k < size; k++) {
            buf[k*(size + 1)*2] = 1;
        }
        return new Matrix(size, size, buf);
    }

    /**
     * Returns a rotation matrix that rotations by the given angle.
     * @param {!number} theta The angle the matrix should rotate by, in radians.
     * @returns {!Matrix} A real matrix.
     */
    static rotation(theta) {
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        return Matrix.square(
            c, -s,
            s, c);
    }

    /**
     * @param {!int} row
     * @param {!Complex} scale
     * @private
     */
    _inline_rowScale_preMultiply(row, scale) {
        for (let col = 0; col < this._width; col++) {
            let v1 = this.cell(col, row);
            let v2 = v1.times(scale);
            let k = (row*this._width + col)*2;
            this._buffer[k] = v2.real;
            this._buffer[k+1] = v2.imag;
        }
    }

    /**
     * @param {!int} col
     * @param {!Complex} scale
     * @private
     */
    _inline_colScale_postMultiply(col, scale) {
        for (let row = 0; row < this._height; row++) {
            let v1 = this.cell(col, row);
            let v2 = v1.times(scale);
            let k = (row*this._width + col)*2;
            this._buffer[k] = v2.real;
            this._buffer[k+1] = v2.imag;
        }
    }

    /**
     * @param {!int} row1
     * @param {!int} row2
     * @param {!Matrix} op
     * @private
     */
    _inline_rowMix_preMultiply(row1, row2, op) {
        let [a, b, c, d] = op._2x2Breakdown();
        for (let col = 0; col < this._width; col++) {
            let x = this.cell(col, row1);
            let y = this.cell(col, row2);
            let v1 = x.times(a).plus(y.times(b));
            let v2 = x.times(c).plus(y.times(d));
            let k1 = (row1*this._width + col)*2;
            let k2 = (row2*this._width + col)*2;
            this._buffer[k1] = v1.real;
            this._buffer[k1+1] = v1.imag;
            this._buffer[k2] = v2.real;
            this._buffer[k2+1] = v2.imag;
        }
    }

    /**
     * @param {!int} col1
     * @param {!int} col2
     * @param {!Matrix} op
     * @private
     */
    _inline_colMix_postMultiply(col1, col2, op) {
        let [a, b, c, d] = op._2x2Breakdown();
        for (let row = 0; row < this._width; row++) {
            let x = this.cell(col1, row);
            let y = this.cell(col2, row);
            let v1 = x.times(a).plus(y.times(c));
            let v2 = x.times(b).plus(y.times(d));
            let k1 = (row*this._width + col1)*2;
            let k2 = (row*this._width + col2)*2;
            this._buffer[k1] = v1.real;
            this._buffer[k1+1] = v1.imag;
            this._buffer[k2] = v2.real;
            this._buffer[k2+1] = v2.imag;
        }
    }

    /**
     * @returns {!Matrix}
     * @private
     */
    _clone() {
        //noinspection JSCheckFunctionSignatures
        return new Matrix(this._width, this._height, this._buffer.slice());
    }

    /**
     * Factors the receiving square matrix into a unitary matrix Q times an upper diagonal matrix R.
     * @returns {!{Q: !Matrix, R: !Matrix}} where Q.times(R).isEqualTo(this) && Q.isUnitary() && R.isUpperTriangular()
     */
    qrDecomposition() {
        if (this._width !== this._height) {
            throw new DetailedError("Expected a square matrix.", this);
        }
        let Q = Matrix.identity(this._width);
        let R = this._clone();
        for (let row = 0; row < this._height; row++) {
            for (let col = 0; col < row && col < this._width; col++) {
                // We're going to cancel out the value below the diagonal with a Givens rotation.

                let belowDiag = R.cell(col, row); // Zero this.
                let onDiag = R.cell(col, col); // With this.

                // Determine how much to rotate.
                let mag1 = onDiag.abs();
                let mag2 = belowDiag.abs();
                if (mag2 === 0) {
                    continue; // Already zero'd.
                }
                let theta = -Math.atan2(mag2, mag1);
                let cos = Math.cos(theta);
                let sin = Math.sin(theta);

                // Need to cancel phases before rotating.
                let phase1 = onDiag.unit().conjugate();
                let phase2 = belowDiag.unit().conjugate();

                // Apply the rotation to R (and cancel it with Q).
                let op = Matrix.square(
                    phase1.times(cos), phase2.times(-sin),
                    phase1.times(sin), phase2.times(cos));
                R._inline_rowMix_preMultiply(col, row, op);
                Q._inline_colMix_postMultiply(col, row, op.adjoint());
            }

            // Cancel imaginary factors on diagonal.
            let u = R.cell(row, row).unit();
            R._inline_rowScale_preMultiply(row, u.conjugate());
            Q._inline_colScale_postMultiply(row, u);
        }
        return {Q, R};
    }

    /**
     * Factors the receiving square matrix into a lower diagonal matrix L times a unitary matrix Q.
     * @returns {!{L: !Matrix, Q: !Matrix}} where L.times(Q).isEqualTo(this) && Q.isUnitary() && R.isLowerTriangular()
     */
    lqDecomposition() {
        let {Q, R} = this.adjoint().qrDecomposition();
        return {L: R.adjoint(), Q: Q.adjoint()};
    }

    /**
     * Computes the magnitudes of the eigenvalues of the matrix, using the QR algorithm.
     * @param {!number} epsilon
     * @param {!number=} maxIterations
     * @returns {!Array.<!Complex>}
     */
    eigenvalueMagnitudes(epsilon, maxIterations = 1000) {
        if (this._width !== this._height) {
            throw new DetailedError("Expected a square matrix.", this);
        }
        let iteration = 0;
        let m = this;
        while (!m.isUpperTriangular(epsilon) && iteration < maxIterations) {
            let {Q, R} = m.qrDecomposition();
            if (R.isIdentity(epsilon)) {
                return Seq.repeat(1, this._width).toArray();
            }
            m = R.times(Q);
            iteration++;
        }
        return Seq.range(this._width).map(i => m.cell(i, i).abs()).sortedBy(e => -e).toArray();
    }

    /**
     * Computes the eigenvalues and eigenvectors of a 2x2 matrix.
     * @returns {!Array.<!{val: !Complex, vec: !Matrix}>}
     */
    eigenDecomposition() {
        if (this.width() !== 2 || this.height() !== 2) {
            throw new Error("Not implemented: non-2x2 eigen decomposition");
        }
        let [a, b, c, d] = this._2x2Breakdown();
        let vals = Complex.rootsOfQuadratic(
            Complex.ONE,
            a.plus(d).times(-1),
            a.times(d).minus(b.times(c)));
        if (vals.length === 0) {
            throw new Error("Degenerate")
        }
        if (vals.length === 1) {
            return [
                {val: vals[0], vec: Matrix.col(1, 0)},
                {val: vals[0], vec: Matrix.col(0, 1)}
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
            return {val: v, vec: Matrix.col(x, y).times(1/m)};
        });
    }

    /**
     * Lifts a numeric function so that it applies to matrices by using the eigendecomposition and applying the function
     * to the eigenvalue coefficients.
     * @param {!function(!Complex) : !Complex} complexFunction
     * @returns {!Matrix}
     */
    liftApply(complexFunction) {
        let t = this.times(0);
        for (let {val, vec} of this.eigenDecomposition()) {
            //noinspection JSUnusedAssignment
            let fVal = complexFunction(val);
            //noinspection JSUnusedAssignment
            let part = vec.times(vec.adjoint());
            t = t.plus(part.times(fVal));
        }
        return t;
    }

    /**
     * Returns the bloch sphere vector (as an x,y,z array) corresponding to this density matrix.
     * @returns {!Array.<!number>}
     */
    qubitDensityMatrixToBlochVector() {
        if (this._width !== 2 || this._height !== 2) {
            throw new DetailedError("Need a 2x2 density matrix.", this);
        }
        if (!this.isApproximatelyHermitian(0.01)) {
            throw new DetailedError("Density matrix should be Hermitian.", this);
        }
        if (!this.trace().isApproximatelyEqualTo(1, 0.01)) {
            throw new DetailedError("Density matrix should have unit trace.", this);
        }

        // Density matrix from bloch vector equation: M = 1/2 (I + vσ)
        //noinspection JSUnusedLocalSymbols
        let [ar, ai, br, bi, cr, ci, dr, di] = this._buffer;
        let x = -cr - br;
        let y = bi - ci;
        let z = dr - ar;
        return [x, y, z];
    }

    /**
     * Returns the square matrix' determinant (i.e. the product of its eigenvalues).
     * @returns {!Complex}
     */
    determinant() {
        Util.need(this.width() === this.height(), "Must be square");
        let n = this.width();
        if (n === 1) {
            return this.cell(0, 0);
        }
        return Seq.range(n).
            map(k => {
                let cutColMatrix = Matrix.generate(n - 1, n - 1, (r, c) => this.cell(
                    c + (c < k ? 0 : 1),
                    r + 1));
                return cutColMatrix.determinant().times(this.cell(k, 0)).times(Math.pow(-1, k));
            }).
            aggregate(Complex.ZERO, (a, e) => a.plus(e));
    }

    /**
     * @returns {!Array.<!Complex>}
     * @private
     */
    _2x2Breakdown() {
        return [new Complex(this._buffer[0], this._buffer[1]),
                new Complex(this._buffer[2], this._buffer[3]),
                new Complex(this._buffer[4], this._buffer[5]),
                new Complex(this._buffer[6], this._buffer[7])];
    }

    /**
     * Given a single-qubit operation matrix U, finds φ, θ, and v=[x,y,z] that satisfy
     * U = exp(i φ) (I cos(θ/2) - v σ i sin(θ/2))
     *
     * @returns {!{axis: !Array.<!number>, angle: !number, phase: !number}}
     */
    qubitOperationToAngleAxisRotation() {
        Util.need(this.width() === 2 && this.height() === 2, "Need a 2x2 matrix.");
        Util.need(this.isUnitary(0.01), "Need a unitary matrix.");

        // Extract orthogonal components, adjusting for factors of i.
        let [a, b, c, d] = this._2x2Breakdown();
        let wφ = a.plus(d);
        let xφ = b.plus(c).dividedBy(Complex.I);
        let yφ = b.minus(c);
        let zφ = a.minus(d).dividedBy(Complex.I);

        // Cancel global phase factor, pushing all values onto the real line.
        let φ = seq([wφ, xφ, yφ, zφ]).maxBy(e => e.abs()).unit().times(2);
        let w = Math.min(1, Math.max(-1, wφ.dividedBy(φ).real));
        let x = xφ.dividedBy(φ).real;
        let y = yφ.dividedBy(φ).real;
        let z = zφ.dividedBy(φ).real;
        let θ = -2*Math.acos(w);

        // Normalize axis.
        let n = Math.sqrt(x*x + y*y + z*z);
        if (n < 0.0000001) {
            // There's an axis singularity near θ=0. Just default to no rotation around the X axis.
            return {axis: [1, 0, 0], angle: 0, phase: φ.phase()};
        }
        x /= n;
        y /= n;
        z /= n;

        // Prefer θ in [-π, π].
        if (θ <= -Math.PI) {
            θ += 2*Math.PI;
            φ = φ.times(-1);
        }

        // Prefer axes that point positive-ward.
        if (x + y + z < 0) {
            x = -x;
            y = -y;
            z = -z;
            θ = -θ;
        }

        return {axis: [x, y, z], angle: θ, phase: φ.phase()};
    }

    /**
     * Returns the matrix U = exp(i φ) (I cos(θ/2) - v σ i sin(θ/2)).
     * @param {!number} angle
     * @param {!Array.<!number>} axis
     * @param {!number} phase
     * @returns {!Matrix}
     */
    static fromAngleAxisPhaseRotation(angle, axis, phase) {
        let [x, y, z] = axis;
        Util.need(Math.abs(x*x+y*y+z*z - 1) < 0.000001, "Not a unit axis.");

        let vσ = Matrix.PAULI_X.times(x).
            plus(Matrix.PAULI_Y.times(y)).
            plus(Matrix.PAULI_Z.times(z));
        let [cos, sin] = Util.snappedCosSin(-angle/2);
        return Matrix.identity(2).times(cos).
            plus(vσ.times(new Complex(0, sin))).
            times(Complex.polar(1, phase));
    }

    /**
     * Computes the cross product of two 3d column vectors.
     * @param {!Matrix} other
     * @returns {!Matrix}
     */
    cross3(other) {
        Util.need(this.width() === 1 && this.height() === 3, "This isn't a 3d column vector.");
        Util.need(other.width() === 1 && other.height() === 3, "Other's not a 3d column vector.");
        return Matrix.generate(1, 3, r => {
            let [i, j] = [(r+1) % 3, (r+2) % 3];
            let a = this.cell(0, i).times(other.cell(0, j));
            let b = this.cell(0, j).times(other.cell(0, i));
            return a.minus(b);
        });
    }

    /**
     * @returns {!{U: !Matrix, S: !Matrix, V: !Matrix}}
     */
    _unordered_singularValueDecomposition_2x2() {
        // Initial dirty work of clearing a corner is handled by the LQ decomposition.
        let U = Matrix.identity(2);
        let {L: S, Q: V} = this.lqDecomposition();

        // Cancel phase factors, leaving S with only real entries.
        let au = S.cell(0, 0).unit();
        let cu = S.cell(0, 1).unit();
        U._inline_colScale_postMultiply(0, au);
        U._inline_colScale_postMultiply(1, cu);
        S._inline_rowScale_preMultiply(0, au.conjugate());
        S._inline_rowScale_preMultiply(1, cu.conjugate());
        let du = S.cell(1, 1).unit();
        S._inline_colScale_postMultiply(1, du.conjugate());
        V._inline_rowScale_preMultiply(1, du);

        // Decompose the 2x2 real matrix.
        let [a,, b,, c,, d] = S._buffer;
        let t = a + d;
        let x = b + c;
        let y = b - c;
        let z = a - d;
        let theta_0 = Math.atan2(x, t) / 2.0;
        let theta_d = Math.atan2(y, z) / 2.0;
        let s_0 = Math.sqrt(t * t + x * x) / 2.0;
        let s_d = Math.sqrt(z * z + y * y) / 2.0;
        U._inline_colMix_postMultiply(0, 1, Matrix.rotation(theta_0 - theta_d));
        V._inline_rowMix_preMultiply(0, 1, Matrix.rotation(theta_0 + theta_d));
        S = Matrix.square(s_0 + s_d, 0, 0, s_0 - s_d);

        return {U, S, V};
    }

    /**
     * @param {!number=} epsilon
     * @param {!int=} maxIterations
     * @returns {!{U: !Matrix, S: !Matrix, V: !Matrix}}
     */
    _unordered_singularValueDecomposition_iterative(epsilon=0, maxIterations=100) {
        let U = Matrix.identity(this._width);
        let S = this._clone();
        let V = Matrix.identity(this._width);
        let iter = 0;
        while (!S.isDiagonal(epsilon) && iter++ < maxIterations) {
            let {Q: Ql, R: Sl} = S.qrDecomposition();
            let {L: Sr, Q: Qr} = Sl.lqDecomposition();
            U = U.times(Ql);
            S = Sr;
            V = Qr.times(V);
        }

        return {U, S, V};
    }

    /**
     * Factors the matrix int u*s*v parts, where u and v are unitary matrices and s is a real diagonal matrix.
     * @param {!number=} epsilon
     * @param {!int=} maxIterations
     * @returns {!{U: !Matrix, S: !Matrix, V: !Matrix}}
     */
    singularValueDecomposition(epsilon=0, maxIterations=100) {
        if (this._width !== this._height) {
            throw new DetailedError("Expected a square matrix.", this);
        }

        let {U, S, V} = this._width === 2 ?
            this._unordered_singularValueDecomposition_2x2() :
            this._unordered_singularValueDecomposition_iterative(epsilon, maxIterations);

        // Fix ordering, so that the singular values are ascending.
        let permutation = Seq.range(this._width).sortedBy(i => -S.cell(i, i).norm2()).toArray();
        for (let i = 0; i < S._width; i++) {
            let j = permutation.indexOf(i);
            if (i !== j) {
                U._inline_colMix_postMultiply(i, j, Matrix.PAULI_X);
                V._inline_rowMix_preMultiply(i, j, Matrix.PAULI_X);
                let si = i*(S._width + 1)*2;
                let sj = j*(S._width + 1)*2;
                [S._buffer[si], S._buffer[sj]] = [S._buffer[sj], S._buffer[si]];
                [S._buffer[si+1], S._buffer[sj+1]] = [S._buffer[sj+1], S._buffer[si+1]];
                [permutation[j], permutation[i]] = [permutation[i], permutation[j]];
            }
        }

        // Fix phases.
        for (let i = 0; i < S._width; i++) {
            U._inline_colScale_postMultiply(i, S.cell(i, i).unit());
        }

        // Discard off-diagonal elements.
        S = Matrix.generateDiagonal(S._width, k => S.cell(k, k).abs());

        return {U, S, V};
    }

    /**
     * @param {!int} colIndex
     * @returns {!Array.<!Complex>}
     */
    getColumn(colIndex) {
        Util.need(colIndex >= 0 && colIndex <= this.width(), "colIndex >= 0 && colIndex <= this.width()");
        let col = [];
        for (let r = 0; r < this._height; r++) {
            col.push(this.cell(colIndex, r));
        }
        return col;
    }

    /**
     * @param {!int} rowIndex
     * @returns {!Array.<!Complex>}
     */
    getRow(rowIndex) {
        Util.need(rowIndex >= 0 && rowIndex <= this.height(), "rowIndex >= 0 && rowIndex <= this.height()");
        let row = [];
        for (let c = 0; c < this._width; c++) {
            row.push(this.cell(c, rowIndex));
        }
        return row;
    }

    /**
     * Returns the unitary matrix closest to the receiving matrix, "repairing" it into a unitary form.
     * @returns {!Matrix}
     */
    closestUnitary(epsilon=0, maxIterations=100) {
        let svd = this.singularValueDecomposition(epsilon, maxIterations);
        return svd.U.times(svd.V);
    }
}

/**
 * The 2x2 Pauli X matrix.
 * @type {!Matrix}
 */
Matrix.PAULI_X = Matrix.square(0, 1, 1, 0);

/**
 * The 2x2 Pauli Y matrix.
 * @type {!Matrix}
 */
Matrix.PAULI_Y = Matrix.square(0, new Complex(0, -1), Complex.I, 0);

/**
 * The 2x2 Pauli Z matrix.
 * @type {!Matrix}
 */
Matrix.PAULI_Z = Matrix.square(1, 0, 0, -1);

/**
 * The 2x2 Hadamard matrix.
 * @type {!Matrix}
 */
Matrix.HADAMARD = Matrix.square(1, 1, 1, -1).times(Math.sqrt(0.5));

/**
 * Encodes a complex vector into JSON that could easily be read by humans or processed by external programs.
 * @param {!Iterable.<!Complex>} vector
 * @returns {*}
 */
function complexVectorToReadableJson(vector) {
    return seq(vector).map(e => {return {r: Complex.realPartOf(e), i: Complex.imagPartOf(e)}; }).toArray();
}

/**
 * Encodes a real vector into JSON that could easily be read by humans or processed by external programs.
 * @param {!Iterable.<!Complex>} vector
 * @returns {*}
 */
function realVectorToReadableJson(vector) {
    return seq(vector).map(Complex.realPartOf).toArray();
}

export {Matrix, complexVectorToReadableJson, realVectorToReadableJson}
