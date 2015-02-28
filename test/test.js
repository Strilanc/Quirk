// PhantomJS doesn't support bind yet
Function.prototype.bind = Function.prototype.bind || function(newThis) {
    return () => this.apply(newThis, arguments);
};

/**
 * @param {*} subject
 * @param {*} other
 * @param {!number} epsilon
 * @returns {!boolean}
 * @private
 */
function isApproximatelyEqualToHelper(subject, other, epsilon) {
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
        return subject.keys().every(i => isApproximatelyEqualToHelper(subject[i], other[i], epsilon));
    } else if (subject instanceof Object && subject.toString() === "[object Object]") {
        return isApproximatelyEqualToHelperDestructured(subject, other, epsilon);
    } else {
        fail('Expected ' + describe(subject) + ' to have an isApproximatelyEqualTo method');
        return false;
    }
}

/**
 * @param {!Object} subject
 * @param {!Object} other
 * @param {!number} epsilon
 * @returns {!boolean}
 * @private
 */
function isApproximatelyEqualToHelperDestructured(subject, other, epsilon) {
    let keys = [];
    for (let subjectKey in subject) {
        if (subject.hasOwnProperty(subjectKey)) {
            keys.push(subjectKey);
        }
    }
    for (let otherKey in other) {
        if (other.hasOwnProperty(otherKey) && !subject.hasOwnProperty(otherKey)) {
            return false;
        }
    }

    //noinspection JSCheckFunctionSignatures
    return keys.every(key => other.hasOwnProperty(key) &&
    isApproximatelyEqualToHelper(subject[key], other[key], epsilon));
}

/**
 * @param {*} value
 * @param {!int=} escape
 * @returns {!string}
 */
function describe(value, escape = 0) {
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }
    if (typeof value === "string") {
        return value;
    }
    if (escape > 10) {
        return `(!! recursion limit hit at ${value} !!)`;
    }

    //noinspection JSUnresolvedVariable
    if (value[Symbol.iterator] !== undefined) {
        let array = [];
        for (let item of value) {
            if (array.length > 1000) {
                array.push("[...]");
            }
            array.push(item);
        }
        return "[" + array.map(e => describe(e, escape + 1)).join(", ") + "]";
    }

    var result = value.toString();
    if (result === "[object Object]") {
        var entries = [];
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                entries.push(describe(key, escape + 1) + ": " + describe(value[key], escape + 1));
            }
        }
        return (typeof value) + "(\n\t" + entries.join("\n\t") + "\n)";
    }
    return result;
}

export class AssertionSubject {
    /**
     * @param {*} subject
     */
    constructor(subject) {
        /**
         * The "actual" value, to be compared against expected values.
         * @type {*}
         */
        this.subject = subject;
    }

    /**
     * @param {*} other
     * @returns {!boolean}
     * @private
     */
    isEqualToHelper(other) {
        if (this.subject instanceof Object && this.subject.constructor.prototype.hasOwnProperty("isEqualTo")) {
            return this.subject.isEqualTo(other);
        } else {
            return compare_(this.subject, other);
        }
    };

    iteratesAs(...items) {
        let actualItems = [];
        for (let item of this.subject) {
            if (actualItems.length > items.length * 2 + 100) {
                actualItems.push("{...}");
                break;
            }
            actualItems.push(item);
        }
        assertThat(actualItems).isEqualTo(items);
    };

    /**
     * @param {*} other
     * @returns {undefined}
     */
    isEqualTo(other) {
        if (!this.isEqualToHelper(other)) {
            fail(`Got <${describe(this.subject)}> but expected it to equal <${describe(other)}>`);
        }
    };

    /**
     * @param {*} other
     * @returns {undefined}
     */
    isNotEqualTo(other) {
        if (this.isEqualToHelper(other)) {
            fail(`Got <${describe(this.subject)}> but expected it to NOT equal <${describe(other)}>`);
        }
    };

    /**
     * @param {*} other
     * @param {=number} epsilon
     * @returns {undefined}
     */
    isApproximatelyEqualTo(other, epsilon = 0.000001) {
        if (!isApproximatelyEqualToHelper(this.subject, other, epsilon)) {
            fail(`Got <${describe(this.subject)}> but expected it to approximately equal <${describe(other)}>`);
        }
    };

    /**
     * @param {*} other
     * @param {=number} epsilon
     * @returns {undefined}
     */
    isNotApproximatelyEqualTo(other, epsilon = 0.000001) {
        if (isApproximatelyEqualToHelper(this.subject, other, epsilon)) {
            fail(`Got <${describe(this.subject)}> but expected it to NOT approximately equal <${describe(other)}>`);
        }
    };
}

/**
 * Returns an assertion subject for the given value, which can be fluently extended with conditions like "isEqualTo".
 * @param {*} subject
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 */
export function assertThat(subject, extraArgCatcher) {
    if (extraArgCatcher !== undefined) {
        fail('Extra assertThat arg');
    }
    return new AssertionSubject(subject);
}

/**
 * Invokes a function, requiring it to throw an exception. Returns the exception wrapped in an assertion subject.
 * @param {function()} func
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 */
export function assertThrows(func, extraArgCatcher) {
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
}

export function skipTestIfWebGlNotAvailable(func) {
    //noinspection JSUnresolvedVariable
    if (window.WebGLRenderingContext === undefined) {
        return function() {
            jstestdriver.console.log("JsTestDriver", "Skipping test due to lack of WebGL: " + func);
        }
    }
    return func;
}
