var force6 = e => e;

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

QuantumState.prototype.isApproximatelyEqualTo = function(other, epsilon) {
    return other instanceof QuantumState &&
        this.columnVector.isApproximatelyEqualTo(other.columnVector, epsilon);
};

QuantumState.prototype.toString = function() {
    return "QuantumState(" + this.columnVector + ")";
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
 * @param {!int} value
 * @returns {!QuantumState}
 */
QuantumState.classical = function(qubitCount, value) {
    need(qubitCount >= 0);
    need(value >= 0 && value < (1 << qubitCount));
    return new QuantumState(Matrix.generate(1, 1 << qubitCount, function(r) { return r === value ? 1 : 0 }));
};

/**
 * Returns a quantum state with every state having equal likelihood (and no relative or global phase factors).
 * @param {!int} qubitCount
 * @returns {!QuantumState}
 */
QuantumState.uniform = function(qubitCount) {
    need(qubitCount >= 0);
    return new QuantumState(Matrix.col(repeat(Math.pow(0.5, qubitCount/2), 1 << qubitCount)));
};

/**
 * @param {!int} targetMask A bit mask that says what the value states must match, what that value matters, in order to
 * count as a bit.
 * @param {!int} conditionMask A bit mask that determined which bits in the match mask are used.
 * @return {!number}
 */
QuantumState.prototype.probability = function (targetMask, conditionMask) {
    need((targetMask & ~conditionMask) === 0, "Target mask includes set bits that aren't in the condition mask.");
    if (conditionMask === 0) {
        return 1;
    }
    var vec = this.columnVector;
    var p = range(this.columnVector.height())
        .filter(function(i) { return ((i & conditionMask) === (targetMask & conditionMask)); })
        .map(function(i) { return vec.rows[i][0].norm2(); })
        .sum();
    return Math.min(Math.max(p, 0), 1);
};

/**
 * @param {!int} targetMask
 * @param {!int} positiveConditionMask
 * @param {!int} inclusionMask
 * @return {!{probabilityOfCondition: !number, probabilityOfHitGivenCondition: !number}}
 */
QuantumState.prototype.conditionalProbability = function (targetMask, positiveConditionMask, inclusionMask) {
    need((targetMask & ~(positiveConditionMask | inclusionMask)) === 0,
        "Target mask includes set bits that aren't in the condition masks.");
    need((positiveConditionMask & inclusionMask) === 0, "Inclusion and condition masks overlap.");

    var total = this.probability(targetMask & inclusionMask, inclusionMask);
    var conditioned = total === 0 ? 1 : this.probability(targetMask, positiveConditionMask | inclusionMask) / total;

    return {
        probabilityOfCondition: total,
        probabilityOfHitGivenCondition: conditioned
    };
};

/**
 *
 * @param {!Matrix} operation
 * @returns {!QuantumState}
 */
QuantumState.prototype.transformedBy = function(operation) {
    return new QuantumState(operation.times(this.columnVector));
};

/**
 *
 * @param {!Complex} phase
 * @returns {!QuantumState}
 */
QuantumState.prototype.phasedBy = function(phase) {
    need(Complex.ONE.isApproximatelyEqualTo(phase.norm2(), 0.00001));
    return new QuantumState(this.columnVector.scaledBy(phase));
};

/**
 * Determines the number of qubits making up the state.
 * @returns {!int}
 */
QuantumState.prototype.countQubits = function() {
    return Math.round(Math.log2(this.columnVector.height()));
};

/**
 * Determines the number of coefficients making up the quantum state.
 * @returns {!int}
 */
QuantumState.prototype.countStates = function() {
    return this.columnVector.height();
};

/**
 * @returns {!Complex}
 */
QuantumState.prototype.coefficient = function(i) {
    need(i >= 0 && i < this.columnVector.height());
    return this.columnVector.rows[i][0];
};

/**
 * Combines this quantum state's qubits with another state's qubits, in little-endian order.
 * @param {!QuantumState} other
 * @returns {!QuantumState}
 */
QuantumState.prototype.concat = function(other) {
    return new QuantumState(other.columnVector.tensorProduct(this.columnVector));
};

/**
 * @param {!int} mask
 * @returns {?{inside: !QuantumState, outside: !QuantumState}}
 */
QuantumState.prototype.tryFactorAroundMask = function(mask) {
    var numStates = this.countStates();
    var inverseMask = (numStates - 1) ^ mask;
    var within = maskCandidates(mask);
    var without = maskCandidates(inverseMask);
    var self = this;
    var f = function(i) { return self.coefficient(i); };

    var bestCompareIndex = range(numStates).maxBy(function(i) { return f(i).norm2(); });
    var best_i = bestCompareIndex & mask;
    var best_j = bestCompareIndex & inverseMask;
    var canSeparate = within.every(function(i) {
        var c = f(i | best_j).dividedBy(f(best_i | best_j));
        return without.every(function(j) {
            var err = f(best_i | j).times(c).minus(f(i | j)).norm2();
            return err < 0.000001;
        });
    });

    if (!canSeparate) {
        return null;
    }

    var phase = f(best_i | best_j).unit().conjugate();
    var inside = Matrix.col(within.map(function(i) { return f(i | best_j); }));
    var outside = Matrix.col(without.map(function(j) { return f(best_i | j).times(phase); }));
    inside = inside.scaledBy(1 / Math.sqrt(inside.norm2()));
    outside = outside.scaledBy(1 / Math.sqrt(outside.norm2()));

    return {
        inside: new QuantumState(inside),
        outside: new QuantumState(outside)
    };
};

/**
 * Attempts to break the state into unentangled sub-states, without re-ordering the qubits.
 *
 * @returns {!Array<!QuantumState>}
 */
QuantumState.prototype.contiguousFactorization = function() {
    var factors = [];
    var unfactored = this;

    var i = 1;
    while (i < unfactored.countQubits()) {
        var mask = (1 << i) - 1;
        var f = unfactored.tryFactorAroundMask(mask);
        if (f !== null) {
            factors.push(f.inside);
            unfactored = f.outside;
            i = 1;
            continue;
        }

        i++;
    }
    if (unfactored.countQubits() > 0) {
        factors.push(unfactored);
    }

    return factors;
};
