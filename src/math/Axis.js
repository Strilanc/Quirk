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

import {DetailedError} from "../base/DetailedError.js"
import {UNICODE_FRACTIONS} from "../base/Format.js"
import {parseFormula} from "./FormulaParser.js"

const PARSE_AXIS_TOKEN_MAP = new Map();

/**
 * Represents a user-entered axis like 'X+2*Y-Z'.
 */
class Axis {
    /**
     * @param {!number} x
     * @param {!number} y
     * @param {!number} z
     */
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * @param {!String} text
     * @returns {!Axis}
     */
    static parse(text) {
        let result = parseFormula(text, PARSE_AXIS_TOKEN_MAP);
        if (!(result instanceof Axis)) {
            throw new DetailedError("Not an axis.", {text, result});
        }
        return result;
    }

    /**
     * @returns {!string}
     */
    toString() {
        return `${this.x}X + ${this.y}Y + ${this.z}Z`;
    }

    /**
     * @param {!Axis|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof Axis && other.x === this.x && other.y === this.y && other.z === this.z;
    }

    /**
     * @param {!number|!Axis} v
     * @returns {!boolean}
     */
    static classify(v) {
        if (typeof v === "number") {
            return false;
        }
        if (v instanceof Axis) {
            return true;
        }
        throw new DetailedError("Not an axis or a number", {v});
    }

    /**
     * @param {!number|!Axis} a
     * @param {!number|!Axis} b
     * @param {!function(!number, !number): (!number|!Axis)} numNum
     * @param {!function(!Axis, !number): (!number|!Axis)} axisNum
     * @param {!function(!number, !Axis): (!number|!Axis)} numAxis
     * @param {!function(!Axis, !Axis): (!number|!Axis)} axisAxis
     * @returns {!number|!Axis}
     */
    static op(a, b, numNum, axisNum, numAxis, axisAxis) {
        let ca = Axis.classify(a);
        let cb = Axis.classify(b);
        if (ca && cb) {
            return axisAxis(a, b);
        }
        if (!ca && !cb) {
            return numNum(a, b);
        }
        if (ca) {
            return axisNum(a, b);
        }
        return numAxis(a, b);
    }

    static times(u, v) {
        return Axis.op(
            u, v,
            (a, b) => a*b,
            (a, b) => new Axis(a.x*b, a.y*b, a.z*b),
            (a, b) => new Axis(b.x*a, b.y*a, b.z*a),
            (a, b) => { throw new DetailedError("Can't multiply axes.", {a, b}); });
    }

    static add(u, v) {
        return Axis.op(
            u, v,
            (a, b) => a+b,
            (a, b) => { throw new DetailedError("Can't add axes to numbers.", {a, b}); },
            (a, b) => { throw new DetailedError("Can't add axes to numbers.", {a, b}); },
            (a, b) => new Axis(a.x + b.x, a.y + b.y, a.z + b.z));
    }

    static negate(u) {
        return Axis.classify(u) ? new Axis(-u.x, -u.y, -u.z) : -u;
    }

    static subtract(u, v) {
        return Axis.op(
            u, v,
            (a, b) => a - b,
            (a, b) => { throw new DetailedError("Can't subtract axes and numbers.", {a, b}); },
            (a, b) => { throw new DetailedError("Can't subtract axes and numbers.", {a, b}); },
            (a, b) => new Axis(a.x - b.x, a.y - b.y, a.z - b.z));
    }

    static divide(u, v) {
        return Axis.op(
            u, v,
            (a, b) => a / b,
            (a, b) => new Axis(a.x/b, a.y/b, a.z/b),
            (a, b) => { throw new DetailedError("Can't divide by an axis.", {a, b}); },
            (a, b) => { throw new DetailedError("Can't divide by an axis.", {a, b}); });
    }

    static raisedTo(u, v) {
        return Axis.op(
            u, v,
            (a, b) => Math.pow(a, b),
            (a, b) => { throw new DetailedError("Can't raise an axis to a power.", {a, b}); },
            (a, b) => { throw new DetailedError("Can't raise to an axis power.", {a, b}); },
            (a, b) => { throw new DetailedError("Can't raise to an axis power.", {a, b}); });
    }
}

PARSE_AXIS_TOKEN_MAP.set("x", new Axis(1, 0, 0));
PARSE_AXIS_TOKEN_MAP.set("y", new Axis(0, 1, 0));
PARSE_AXIS_TOKEN_MAP.set("z", new Axis(0, 0, 1));
PARSE_AXIS_TOKEN_MAP.set("(", "(");
PARSE_AXIS_TOKEN_MAP.set(")", ")");
for (let {character, value} of UNICODE_FRACTIONS) {
    //noinspection JSUnusedAssignment
    PARSE_AXIS_TOKEN_MAP.set(character, value);
}
PARSE_AXIS_TOKEN_MAP.set("sqrt", {
    unary_action: e => Axis.raisedTo(e, 0.5),
    priority: 4});
PARSE_AXIS_TOKEN_MAP.set("^", {
    binary_action: Axis.raisedTo,
    priority: 3});
PARSE_AXIS_TOKEN_MAP.set("*", {
    binary_action: Axis.times,
    priority: 2});
PARSE_AXIS_TOKEN_MAP.set("/", {
    binary_action: Axis.divide,
    priority: 2});
PARSE_AXIS_TOKEN_MAP.set("-", {
    unary_action: Axis.negate,
    binary_action: Axis.subtract,
    priority: 1});
PARSE_AXIS_TOKEN_MAP.set("+", {
    unary_action: e => e,
    binary_action: Axis.add,
    priority: 1});
PARSE_AXIS_TOKEN_MAP.set("√", PARSE_AXIS_TOKEN_MAP.get("sqrt"));

export {Axis}
