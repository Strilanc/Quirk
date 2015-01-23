// PhantomJS doesn't support bind yet
Function.prototype.bind = Function.prototype.bind || function (thisp) {
    var fn = this;
    return function () {
        return fn.apply(thisp, arguments);
    };
};

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
    if (this.subject instanceof Object && this.subject.constructor.prototype.hasOwnProperty("isEqualTo")) {
        return this.subject.isEqualTo(other);
    } else {
        return compare_(this.subject, other);
    }
};

/**
 * @param {!Object} subject
 * @param {!Object} other
 * @param {!number} epsilon
 * @returns {!boolean}
 * @private
 */
AssertionSubject.isApproximatelyEqualToHelperDestructured = function(subject, other, epsilon) {
    var keys = [];
    for (var subjectKey in subject) {
        if (subject.hasOwnProperty(subjectKey)) {
            keys.push(subjectKey);
        }
    }
    for (var otherKey in other) {
        if (other.hasOwnProperty(otherKey) && !subject.hasOwnProperty(otherKey)) {
            return false;
        }
    }

    return keys.every(function(key) {
        return other.hasOwnProperty(key) &&
            AssertionSubject.isApproximatelyEqualToHelper(subject[key], other[key], epsilon);
    });
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
        return range(subject.length).every(function (i) {
            return AssertionSubject.isApproximatelyEqualToHelper(subject[i], other[i], epsilon);
        });
    } else if (subject instanceof Object && subject.toString() === "[object Object]") {
        return AssertionSubject.isApproximatelyEqualToHelperDestructured(subject, other, epsilon);
    } else {
        fail('Expected ' + AssertionSubject.describe(subject) + ' to have an isApproximatelyEqualTo method');
        return false;
    }
};

/**
 * @param {*} e
 * @returns {!string}
 */
AssertionSubject.describe = function(e) {
    if (e === null) {
        return "null";
    }
    if (e === undefined) {
        return "undefined";
    }
    if (Array.isArray(e)) {
        return "[" + range(e.length).map(function(i) { return AssertionSubject.describe(e[i]); }).join(", ") + "]";
    }
    var result = e.toString();
    if (result === "[object Object]") {
        var entries = [];
        for (var key in e) {
            if (e.hasOwnProperty(key)) {
                entries.push(AssertionSubject.describe(key) + ": " + AssertionSubject.describe(e[key]));
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
        fail('Got <' + AssertionSubject.describe(this.subject) + '> but expected it to equal <' +
            AssertionSubject.describe(other) + '>');
    }
};

/**
 * @param {*} other
 * @returns {undefined}
 */
AssertionSubject.prototype.isNotEqualTo = function(other) {
    if (this.isEqualToHelper(other)) {
        fail('Got <' + AssertionSubject.describe(this.subject) + '> but expected it to NOT equal <' +
            AssertionSubject.describe(other) + '>');
    }
};

/**
 * @param {*} other
 * @param {=number} epsilon
 * @returns {undefined}
 */
AssertionSubject.prototype.isApproximatelyEqualTo = function(other, epsilon) {
    if (epsilon === undefined) {
        epsilon = 0.000001;
    }
    if (!AssertionSubject.isApproximatelyEqualToHelper(this.subject, other, epsilon)) {
        fail('Got <' + AssertionSubject.describe(this.subject) + '> but expected it to approximately equal <' +
            AssertionSubject.describe(other) + '>');
    }
};

/**
 * @param {*} other
 * @param {=number} epsilon
 * @returns {undefined}
 */
AssertionSubject.prototype.isNotApproximatelyEqualTo = function(other, epsilon) {
    if (epsilon === undefined) {
        epsilon = 0.000001;
    }
    if (AssertionSubject.isApproximatelyEqualToHelper(this.subject, other, epsilon)) {
        fail('Expected <' + AssertionSubject.describe(this.subject) + '> but expected it to NOT approximately equal <' +
            AssertionSubject.describe(other) + '>');
    }
};

/**
 * Returns an assertion subject for the given value, which can be fluently extended with conditions like "isEqualTo".
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

/**
 * Invokes a function, requiring it to throw an exception. Returns the exception wrapped in an assertion subject.
 * @param {function()} func
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 */
var assertThrows = function(func, extraArgCatcher) {
    if (extraArgCatcher !== undefined) {
        fail('Extra assertThat arg');
    }
    try {
        func();
    } catch(ex) {
        return assertThat(ex);
    }
    fail('Expected an exception to be thrown by ' + func);
    return undefined;
};

var skipTestIfWebGlNotAvailable = function(func) {
    //noinspection JSUnresolvedVariable
    if (window.WebGLRenderingContext === undefined) {
        return function() {
            jstestdriver.console.log("JsTestDriver", "Skipping test due to lack of WebGL: " + func);
        }
    }
    return func;
};
