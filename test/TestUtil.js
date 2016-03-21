// Cheat a little bit on the testing library being independent from what it tests
import describe from "src/base/Describe.js"
import equate from "src/base/Equate.js"

let assertionSubjectIndexInCurrentTest = 0;

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
    } else if (subject === undefined) {
        return other === undefined;
    } else if (subject.isApproximatelyEqualTo !== undefined) {
        return subject.isApproximatelyEqualTo(other, epsilon);
    } else if (typeof subject === 'number') {
        return subject === other ||
            (isNaN(subject) && isNaN(other)) ||
            (typeof other === 'number' && Math.abs(subject - other) < epsilon);
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

    return keys.every(key => other.hasOwnProperty(key) &&
        isApproximatelyEqualToHelper(subject[key], other[key], epsilon));
}

export class AssertionSubject {
    /**
     * @param {*} subject
     * @param {*} id
     * @param {*} info
     * @property {*} subject
     */
    constructor(subject, id=undefined, info=undefined) {
        sanityCheck(subject);

        /**
         * The "actual" value, to be compared against expected values.
         * @type {*}
         */
        this.subject = subject;
        /**
         * @type {*}
         */
        this.id = id;
        /**
         * @type {*}
         */
        this.info = info;
    }

    withInfo(newInfo) {
        return new AssertionSubject(this.subject, this.id, newInfo);
    }

    _fail(message) {
        let idMessage = this.id === undefined ? message : `${message} (${this.id})`;
        let infoMessage = this.info === undefined ? idMessage : `${idMessage} (info: ${describe(this.info)})`;
        fail(infoMessage);
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
        new AssertionSubject(actualItems, this.id).isEqualTo(items);
    };

    /**
     * @param {*} other
     */
    isEqualTo(other) {
        if (!equate(this.subject, other)) {
            this._fail(`Got <${describe(this.subject)}> but expected it to equal <${describe(other)}>.`);
        }
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @param {*} other
     */
    isGreaterThan(other) {
        if (!(this.subject > other)) {
            this._fail(`Got <${describe(this.subject)}> but expected it to be greater than <${describe(other)}>.`);
        }
    };

    /**
     * @param {*} other
     */
    isLessThan(other) {
        if (!(this.subject < other)) {
            this._fail(`Got <${describe(this.subject)}> but expected it to be less than <${describe(other)}>.`);
        }
    };

    /**
     * @param {*} other
     */
    isNotEqualTo(other) {
        if (equate(this.subject, other)) {
            this._fail(`Got <${describe(this.subject)}> but expected it to NOT equal <${describe(other)}>.`);
        }
    };

    /**
     * @param {*} other
     * @param {=number} epsilon
     */
    isApproximatelyEqualTo(other, epsilon = 0.000001) {
        if (!isApproximatelyEqualToHelper(this.subject, other, epsilon)) {
            this._fail(`Got <${describe(this.subject)}> but expected it to approximately equal <${describe(other)}>.`);
        }
    };

    /**
     * @param {*} other
     * @param {=number} epsilon
     */
    isNotApproximatelyEqualTo(other, epsilon = 0.000001) {
        if (isApproximatelyEqualToHelper(this.subject, other, epsilon)) {
            this._fail(
                `Got <${describe(this.subject)}> but expected it to NOT approximately equal <${describe(other)}>.`);
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
    assertionSubjectIndexInCurrentTest += 1;
    return new AssertionSubject(subject, 'assertThat #' + assertionSubjectIndexInCurrentTest);
}

export function assertTrue(subject) {
    assertThat(subject).isEqualTo(true);
}

export function assertFalse(subject) {
    assertThat(subject).isEqualTo(false);
}

/**
 * Invokes a function, requiring it to throw an exception. Returns the exception wrapped in an assertion subject.
 * @param {function()} func
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 */
export function assertThrows(func, extraArgCatcher) {
    if (extraArgCatcher !== undefined) {
        fail('Extra assertThrows arg');
    }
    try {
        func();
    } catch(ex) {
        return new AssertionSubject(ex, 'assertThrows');
    }
    fail('Expected an exception to be thrown by ' + func);
    return undefined;
}

/** @type {boolean|undefined} */
let __webGLSupportPresent = undefined;

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

let meanSquaredError = (data1, data2) => {
    if (data1.length !== data2.length) {
        return false;
    }
    let err = 0;
    for (let i = 0; i < data1.length; i++) {
        let e = data1[i] - data2[i];
        err += e*e;
    }
    return err / data1.length;
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
        /** @type {!(!function(!{ warn_only: !boolean|!string })[])} */
        this.tests = [];
         /** @type {!string} */
        this.name = name;
    }

    /**
     * @param {!string} name
     * @param {!function(!{ warn_only: !boolean|!string })} method
     */
    test(name, method) {
        this.tests.push([name, status => {
            assertionSubjectIndexInCurrentTest = 0;
            method(status);
        }]);
    }

    /**
     * @param {!string} name
     * @param {!function(!{ warn_only: !boolean|!string })} method
     */
    webGlTest(name, method) {
        let wrappedMethod = status => {
            if (__webGLSupportPresent === undefined) {
                if (window.WebGLRenderingContext === undefined) {
                    __webGLSupportPresent = false;
                } else {
                    let canvas = document.createElement('canvas');
                    let context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    __webGLSupportPresent = context instanceof WebGLRenderingContext;
                }
            }

            if (!__webGLSupportPresent) {
                console.warn(`Skipping ${this.name}.${name} due to lack of WebGL support.`);
                return;
            }

            method(status);
        };

        this.test(name, wrappedMethod);
    }

    /**
     * A test that compares the drawing, performed by the test method on the given canvas, to the given expected image
     * or data.
     * @param {!string} name
     * @param {!int} width
     * @param {!int} height
     * @param {!function(!HTMLCanvasElement, !{ warn_only: !boolean|!string })} method
     * @param {!string} expectedSrc Either the location of an accessible image, or a 'data:image/' link.
     * @param {!int=} tolerance
     */
    canvasAppearanceTest(name, width, height, method, expectedSrc, tolerance = 256) {
        this.test(name, status => {
            let actualCanvas = document.createElement("canvas");
            actualCanvas.width = width;
            actualCanvas.height = height;
            method(actualCanvas, status);
            let actualData = actualCanvas.getContext("2d").getImageData(0, 0, actualCanvas.width, actualCanvas.height);

            return promiseImageDataFromSrc(expectedSrc).then(expectedData => {
                let mse = meanSquaredError(actualData.data, expectedData.data);
                if (expectedData.width !== actualData.width ||
                    expectedData.height !== actualData.height ||
                    mse > tolerance) {

                    let actualSrc = actualCanvas.toDataURL("image/png");
                    fail(`Drawn image <\n\n${actualSrc}\n\n> differed with MSE=${mse} from <\n${expectedSrc}\n>.`);
                }

                // When things get hairy, it's useful to see the tolerance-vs-difference. But usually it's just noise.
                //if (mse > 0) {
                //    let s = `${this.name}.${name} image differed, but within tolerance (MSE=${mse}).`;
                //    (mse < 0.1 ? console.info : console.warn)(s);
                //}
            });
        });
    }
}

Suite.suites = [];
