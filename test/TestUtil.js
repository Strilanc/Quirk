// Cheat a little bit on the testing library being independent from what it tests
import describe from "src/base/Describe.js"
import equate from "src/base/Equate.js"

function isArrayIsh(value) {
    return Array.isArray(value) ||
        value instanceof Float32Array ||
        value instanceof Float64Array ||
        value instanceof Int8Array ||
        value instanceof Int16Array ||
        value instanceof Int32Array ||
        value instanceof Uint8Array ||
        value instanceof Uint16Array ||
        value instanceof Uint32Array;
}

/**
 * @param {!string} message
 */
export function fail(message) {
    throw new Error(message);
}

/**
 * @param {*} subject
 * @throws
 */
function sanityCheck(subject) {
    //noinspection JSUnresolvedVariable
    if (subject instanceof Map) {
        for (let k in subject) {
            if (subject.hasOwnProperty(k)) {
                throw new Error(`Map has property 'map[${k}]' instead of entry 'map.get(${k})'. Probably a mistake.`)
            }
        }
    }
}

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
    } else if (isArrayIsh(subject)) {
        if (!isArrayIsh(other) || other.length !== subject.length) {
            return false;
        }
        for (let i = 0; i < subject.length; i++) {
            if (!isApproximatelyEqualToHelper(subject[i], other[i], epsilon)) {
                return false;
            }
        }
        return true;
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

export class AssertionSubject {
    /**
     * @param {*} subject
     */
    constructor(subject) {
        sanityCheck(subject);

        /**
         * The "actual" value, to be compared against expected values.
         * @type {*}
         */
        this.subject = subject;
    }

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
        if (!equate(this.subject, other)) {
            fail(`Got <${describe(this.subject)}> but expected it to equal <${describe(other)}>`);
        }
    };

    /**
     * @param {*} other
     * @returns {undefined}
     */
    isNotEqualTo(other) {
        if (equate(this.subject, other)) {
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

export function assertTrue(subject) {
    assertThat(subject).isEqualTo(true);
}

//noinspection JSUnusedGlobalSymbols
export function assertFalse(subject) {
    assertThat(subject).isEqualTo(false);
}

//noinspection JSUnusedGlobalSymbols
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

/** @type {boolean|undefined} */
let webGLSupportPresent = undefined;

let promiseImageDataFromSrc = src => {
    let img = document.createElement('img');
    img.src = src;
    return new Promise(resolve => { img.onload = resolve; }).then(() => {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    });
};

/**
 * A named collection of tests.
 */
export class Suite {
    /**
     * @param {!string} name
     */
    constructor(name) {
        Suite.suites.push(this);
        /** @type {!(!function(!{ warn_only: boolean|!string })[])} */
        this.tests = [];
         /** @type {!string} name */
        this.name = name;
    }

    /**
     * @param {!string} name
     * @param {!function(!{ warn_only: boolean|!string })} method
     */
    test(name, method) {
        this.tests.push([name, method]);
    }

    /**
     * @param {!string} name
     * @param {!function(!{ warn_only: boolean|!string })} method
     */
    webGlTest(name, method) {
        let wrappedMethod = (status) => {
            if (webGLSupportPresent === undefined) {
                if (window.WebGLRenderingContext === undefined) {
                    webGLSupportPresent = false;
                } else {
                    let canvas = document.createElement('canvas');
                    let context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    webGLSupportPresent = context instanceof WebGLRenderingContext;
                }
            }

            if (!webGLSupportPresent) {
                console.warn(`Skipping ${this.name}.${name} due to lack of WebGL support.`);
                return;
            }

            method(status);
        };

        this.test(name, wrappedMethod);
    }

    /**
     * @param {!string} name
     * @param {!int} width
     * @param {!int} height
     * @param {!function(!HTMLCanvasElement, !{ warn_only: boolean|!string })} method
     * @param {!string} expectedPngSrc
     */
    canvasAppearanceTest(name, width, height, method, expectedPngSrc) {
        this.test(name, status => {
            let actualCanvas = document.createElement("canvas");
            actualCanvas.width = width;
            actualCanvas.height = height;
            method(actualCanvas, status);
            let actualSrc = actualCanvas.toDataURL("image/png");

            // Recreate the actual image from its source, so any defects introduced during that process occur to both
            // and don't cause false-negatives. This should not be necessary... but it fails without it.
            let act = promiseImageDataFromSrc(actualSrc);
            let exp = promiseImageDataFromSrc(expectedPngSrc);

            return Promise.all([act, exp]).then(values => {
                let [actualData, expectedData] = values;

                if (expectedData.width !== actualData.width ||
                    expectedData.height !== actualData.height ||
                    !equate(actualData.data, expectedData.data)) {

                    fail(`Expected drawn image <\n${actualSrc}\n> to match expected image <\n${expectedPngSrc}\n>.`);
                }
            });
        });
    }
}

Suite.suites = [];
