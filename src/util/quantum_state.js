/**
 * A complex column vector.
 *
 * Constrained to power of 2 dimensions to allow decomposition into bits.
 *
 * @param {!Matrix} columnVector
 *
 * @property {!Matrix} columnVector
 *
 * @constructor
 */
function QuantumState(columnVector) {
    need(columnVector.width() === 1);
    need(isPowerOf2(columnVector.height()));
    this.columnVector = columnVector;
}

/**
 * @param {!QuantumState|*} other
 * @returns {!boolean}
 */
QuantumState.prototype.isEqualTo = function(other) {
    return other instanceof QuantumState &&
        this.columnVector.isEqualTo(other.columnVector);
};

/** @type {!QuantumState}  */
QuantumState.EMPTY = new QuantumState(Matrix.col([1]));

/** @type {!QuantumState}  */
QuantumState.SINGLE_ZERO = new QuantumState(Matrix.col([1, 0]));

/** @type {!QuantumState}  */
QuantumState.SINGLE_ONE = new QuantumState(Matrix.col([0, 1]));

/**
 * @param {!boolean} bit
 * @returns {!QuantumState}
 */
QuantumState.bit = function(bit) {
    return bit ? QuantumState.SINGLE_ONE : QuantumState.SINGLE_ZERO;
};

/**
 * @param {!int} qubitCount
 * @returns {!QuantumState}
 */
QuantumState.zero = function(qubitCount) {
    need(qubitCount >= 0);
    return new QuantumState(QuantumState.SINGLE_ZERO.columnVector.tensorPower(qubitCount));
};

/**
 * @param {!int} qubitCount
 * @param {!int} bitMask
 * @returns {!QuantumState}
 */
QuantumState.classical = function(qubitCount, bitMask) {
    need(qubitCount >= 0);
    need(bitMask < (1 << qubitCount));
    return new QuantumState(
        range(qubitCount)
        .map(function(i) { return QuantumState.bit((bitMask & (1 << i)) !== 0).columnVector; })
        .reduce(
            function(a, e) { return e.tensorProduct(a); },
            QuantumState.EMPTY.columnVector));
};

/**
 * @param {!int} matchMask A bit mask that says what the value states must match, what that value matters, in order to
 * count as a bit.
 * @param {!int} conditionMask A bit mask that determined which bits in the match mask are used.
 * @return {!number}
 */
QuantumState.prototype.probability = function (matchMask, conditionMask) {
    var vec = this.columnVector;
    return sum(
        range(this.columnVector.height())
        .filter(function(i) { return ((i & conditionMask) === (matchMask & conditionMask)); })
        .map(function(i) { return vec.rows[i][0].norm2(); }));
};

/**
 * @param {!int} matchMask
 * @param {!int} positiveConditionMask
 * @param {!int} inclusionConditionMask
 * @return {?number}
 */
QuantumState.prototype.conditionalProbability = function (matchMask, positiveConditionMask, inclusionConditionMask) {
    var total = this.probability(matchMask, inclusionConditionMask);
    if (total === 0) {
        return null;
    }

    return this.probability(matchMask, positiveConditionMask | inclusionConditionMask) / total;
};

/**
 *
 * @param {!Matrix} operation
 * @returns {!QuantumState}
 */
QuantumState.prototype.transformedBy = function(operation) {
    return new QuantumState(operation.times(this.columnVector));
};
