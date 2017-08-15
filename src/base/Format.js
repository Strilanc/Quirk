// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Stores formatting options, for determining what string output should look like.
 */
class Format {
    /**
     * @param {!boolean} allowAbbreviation
     * @param {!number} maxAbbreviationError
     * @param {int|undefined} fixedDigits
     * @param {!string} itemSeparator
     *
     * @property {!boolean} allowAbbreviation Should outputs be shortened, if possible?
     * @property {!number} maxAbbreviationError How much error is abbreviating allowed to introduce?
     * @property {int|undefined} fixedDigits Use toFixed? How many digits?
     * @property {!string} itemSeparator What should list items be separated by?
     */
    constructor(allowAbbreviation, maxAbbreviationError, fixedDigits, itemSeparator) {
        this.allowAbbreviation = allowAbbreviation;
        this.maxAbbreviationError = maxAbbreviationError;
        this.fixedDigits = fixedDigits;
        this.itemSeparator = itemSeparator;
    }

    formatFloat(f) {
        if (this.allowAbbreviation) {
            return abbreviateFloat(f, this.maxAbbreviationError, this.fixedDigits);
        }
        if (this.fixedDigits !== undefined) {
            return f.toFixed(this.fixedDigits);
        }
        return f + "";
    }

    /**
     * Parses the given text into a float. Works for text created by Format#formatFloat.
     * @param {!string} text
     * @throws
     * @returns {!number}
     */
    static parseFloat(text) {
        if (text.length === 0) {
            throw new Error("Not a number: '" + text + "'");
        }
        if (text[0] === "-") {
            return -Format.parseFloat(text.substr(1));
        }
        if (text[0] === "\u221A") {
            return Math.sqrt(Format.parseFloat(text.substr(1)));
        }

        let fraction = match(UNICODE_FRACTIONS, e => e.character === text);
        if (fraction !== undefined) {
            return fraction.value;
        }

        let result = parseFloat(text);
        if (isNaN(result)) {
            throw new Error("Not a number: '" + text + "'")
        }
        return result;
    }

    /**
     * Corrects a value to a nearby simple fraction or root thereof, such as sqrt(1/2), so it can be printed compactly.
     * @param {!number} value The value to round.
     * @param {!number} epsilon The maximum offset error introduced by the rounding.
     */
    static simplifyByRounding(value, epsilon) {
        if (value < 0) {
            return -Format.simplifyByRounding(-value, epsilon);
        }

        let r = value % 1;
        if (r <= epsilon || 1 - r <= epsilon) {
            return Math.round(value);
        }

        let fraction = match(UNICODE_FRACTIONS, e => Math.abs(e.value - value) <= epsilon);
        if (fraction !== undefined) {
            return fraction.value;
        }

        let rootFraction = match(UNICODE_FRACTIONS, e => Math.abs(Math.sqrt(e.value) - value) <= epsilon);
        if (rootFraction !== undefined) {
            return Math.sqrt(rootFraction.value);
        }

        return value;
    }
}

/**
 * @type {!(!{character: !string, expanded: !string, value: !number}[])}
 */
const UNICODE_FRACTIONS = [
    {character: "\u00BD", ref: "½", expanded: "1/2", value: 1/2},
    {character: "\u00BC", ref: "¼", expanded: "1/4", value: 1/4},
    {character: "\u00BE", ref: "¾", expanded: "3/4", value: 3/4},
    {character: "\u2153", ref: "⅓", expanded: "1/3", value: 1/3},
    {character: "\u2154", ref: "⅔", expanded: "2/3", value: 2/3},
    {character: "\u2155", ref: "⅕", expanded: "1/5", value: 1/5},
    {character: "\u2156", ref: "⅖", expanded: "2/5", value: 2/5},
    {character: "\u2157", ref: "⅗", expanded: "3/5", value: 3/5},
    {character: "\u2158", ref: "⅘", expanded: "4/5", value: 4/5},
    {character: "\u2159", ref: "⅙", expanded: "1/6", value: 1/6},
    {character: "\u215A", ref: "⅚", expanded: "5/6", value: 5/6},
    {character: "\u2150", ref: "⅐", expanded: "1/7", value: 1/7},
    {character: "\u215B", ref: "⅛", expanded: "1/8", value: 1/8},
    {character: "\u215C", ref: "⅜", expanded: "3/8", value: 3/8},
    {character: "\u215D", ref: "⅝", expanded: "5/8", value: 5/8},
    {character: "\u215E", ref: "⅞", expanded: "7/8", value: 7/8},
    {character: "\u2151", ref: "⅑", expanded: "1/9", value: 1/9},
    {character: "\u2152", ref: "⅒", expanded: "1/10",  value:1/10}
];

/**
 * Returns the first element of an array matching the given predicate, or else returns undefined.
 */
const match = function(array, predicate) {
    for (let item of array) {
        if (predicate(item)) {
            return item;
        }
    }
    return undefined;
};

/**
 * Returns a string representation of a float, taking advantage of unicode fractions and square roots.
 *
 * @param {!number} value The value to represent as a string.
 * @param {!number=} epsilon The maximum error introduced by using an expression.
 * @param {!number|undefined=} digits The number of digits to use if no expression matches.
 * @returns {!string}
 */
function abbreviateFloat(value, epsilon=0, digits=undefined) {
    if (Math.abs(value) < epsilon) {
        return "0";
    }
    if (value < 0) {
        return "-" + abbreviateFloat(-value, epsilon, digits);
    }

    let fraction = match(UNICODE_FRACTIONS, e => Math.abs(e.value - value) <= epsilon);
    if (fraction !== undefined) {
        return fraction.character;
    }

    let rootFraction = match(UNICODE_FRACTIONS, e => Math.abs(Math.sqrt(e.value) - value) <= epsilon);
    if (rootFraction !== undefined) {
        return "\u221A" + rootFraction.character;
    }

    if (value % 1 !== 0 && digits !== undefined) {
        return value.toFixed(digits);
    }

    return value.toString();
}

/**
 * Returns an accurate result, but favoring looking nice over being small.
 * @type {!Format}
 */
Format.EXACT = new Format(true, 0, undefined, ", ");

/**
 * Returns an accurate result, favoring being small over looking nice.
 * @type {!Format}
 */
Format.MINIFIED = new Format(true, 0, undefined, ",");

/**
 * Returns an approximated result, strongly favoring looking nice.
 * @type {!Format}
 */
Format.SIMPLIFIED = new Format(true, 0.0005, 3, ", ");

/**
 * Returns an approximated result, but with the constraint that when it changes slightly it should "look the same".
 * (It should look good when varying and animated.)
 * @type {!Format}
 */
Format.CONSISTENT = new Format(false, 0, 2, ", ");

export {Format, UNICODE_FRACTIONS}
