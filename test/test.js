/**
 * Checks a precondition, throwing an exception containing the given message in the case of failure.
 *
 * @param {!boolean|*} expression
 * @param {=string} message
 */
need = function(expression, message) {
    assertTrue("Precondition failed: " + (message || "(no message provided)"), expression);
};

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
 * @param {*} subject
 * @param {*} other
 * @param {!number} epsilon
 * @returns {!boolean}
 * @private
 */
AssertionSubject.isApproximatelyEqualToHelper = function(subject, other, epsilon) {
    if (subject === null) {
        return other === null;
    } else if (subject.isApproximatelyEqualTo !== undefined) {
        return subject.isApproximatelyEqualTo(other, epsilon);
    } else if (typeof subject === 'number') {
        return typeof other === 'number' && Math.abs(subject - other) < epsilon;
    } else if (Array.isArray(subject)) {
        if (!Array.isArray(other) || other.length !== subject.length) {
            return false;
        }
        return range(subject.length).every(function(i) {
            return AssertionSubject.isApproximatelyEqualToHelper(subject[i], other[i], epsilon);
        });
    } else {
        fail('Expected ' + this.describe(subject) + ' to have an isApproximatelyEqualTo method');
        return false;
    }
};

/**
 * @param {*} e
 * @returns {!string}
 */
AssertionSubject.prototype.describe = function(e) {
    if (e === null) {
        return "null";
    }
    if (e === undefined) {
        return "undefined";
    }
    if (Array.isArray(e)) {
        return arrayToString(e);
    }
    var result = e.toString();
    if (result === "[object Object]") {
        var entries = [];
        for (var key in e) {
            if (e.hasOwnProperty(key)) {
                entries.push(this.describe(key) + ": " + this.describe(e[key]));
            }
        }
        return (typeof e) + "(\n\t" + entries.join("\n\t") + "\n)";
    }
    return result;
};

/**
 * @param {*} other
 * @returns {undefined}
 */
AssertionSubject.prototype.isEqualTo = function(other) {
    if (!this.isEqualToHelper(other)) {
        fail('Got <' + this.describe(this.subject) + '> but expected it to equal <' + this.describe(other) + '>');
    }
};

/**
 * @param {*} other
 * @returns {undefined}
 */
AssertionSubject.prototype.isNotEqualTo = function(other) {
    if (this.isEqualToHelper(other)) {
        fail('Got <' + this.describe(this.subject) + '> but expected it to NOT equal <' + this.describe(other) + '>');
    }
};

/**
 * @param {*} other
 * @param {=number} epsilon
 * @returns {undefined}
 */
AssertionSubject.prototype.isApproximatelyEqualTo = function(other, epsilon) {
    if (!AssertionSubject.isApproximatelyEqualToHelper(this.subject, other, epsilon || 0.000001)) {
        fail('Got <' + this.describe(this.subject) + '> but expected it to approximately equal <' +
            this.describe(other) + '>');
    }
};

/**
 * @param {*} other
 * @param {=number} epsilon
 * @returns {undefined}
 */
AssertionSubject.prototype.isNotApproximatelyEqualTo = function(other, epsilon) {
    if (AssertionSubject.isApproximatelyEqualToHelper(this.subject, other, epsilon || 0.000001)) {
        fail('Expected <' + this.describe(this.subject) + '> but expected it to NOT approximately equal <' +
            this.describe(other) + '>');
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
