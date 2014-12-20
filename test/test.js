/**
 * @param {*} subject
 * @constructor
 */
function AssertionSubject(subject) {
    this.subject = subject;
}

/**
 * @param {*} other
 * @returns {!boolean}
 * @private
 */
AssertionSubject.prototype.isEqualToHelper = function(other) {
    if (this.subject instanceof Object && this.subject.hasOwnProperty("isEqualTo")) {
        return this.subject.isEqualTo(other);
    } else {
        return compare_(this.subject, other);
    }
};

/**
 * @param {*} other
 * @param {!number} epsilon
 * @returns {!boolean}
 * @private
 */
AssertionSubject.prototype.isApproximatelyEqualToHelper = function(other, epsilon) {
    if (this.subject === null) {
        return other === null;
    } else if (this.subject.isApproximatelyEqualTo !== undefined) {
        return this.subject.isApproximatelyEqualTo(other, epsilon);
    } else if (typeof this.subject === 'number') {
        return typeof other === 'number' && Math.abs(this.subject - other) < epsilon;
    } else {
        fail('Expected ' + this.subject + ' to have an isApproximatelyEqualTo method');
        return false;
    }
};

/**
 * @param {*} other
 * @returns {undefined}
 */
AssertionSubject.prototype.isEqualTo = function(other) {
    if (!this.isEqualToHelper(other)) {
        fail('Expected <' + this.subject + '> to equal <' + other + '>');
    }
};

/**
 * @param {*} other
 * @returns {undefined}
 */
AssertionSubject.prototype.isNotEqualTo = function(other) {
    if (this.isEqualToHelper(other)) {
        fail('Expected <' + this.subject + '> to NOT equal ' + other + '>');
    }
};

/**
 * @param {*} other
 * @param {=number} epsilon
 * @returns {undefined}
 */
AssertionSubject.prototype.isApproximatelyEqualTo = function(other, epsilon) {
    if (!this.isApproximatelyEqualToHelper(other, epsilon || 0.000001)) {
        fail('Expected <' + this.subject + '> to be approximately ' + other + '>');
    }
};

/**
 * @param {*} other
 * @param {=number} epsilon
 * @returns {undefined}
 */
AssertionSubject.prototype.isNotApproximatelyEqualTo = function(other, epsilon) {
    if (this.isApproximatelyEqualToHelper(other, epsilon || 0.000001)) {
        fail('Expected <' + this.subject + '> to NOT be approximately <' + other + '>');
    }
};

/**
 *
 * @param {*} subject
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 * @constructor
 */
var assertThat = function(subject, extraArgCatcher) {
    if (extraArgCatcher !== undefined) {
        fail('Extra assertThat arg');
    }
    return new AssertionSubject(subject);
};
