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

import {Suite, fail, assertTrue, assertFalse} from "test/TestUtil.js"
import {equate} from "src/base/Equate.js"

import {describe} from "src/base/Describe.js"

let suite = new Suite("Equate");

class EmptyClass {
    constructor() { }
}
class EmptyClass2 {
    constructor() { }
}
class PropClass {
    constructor(v) {
        //noinspection JSUnusedGlobalSymbols
        this.v = v;
    }
}
class SomeIterable {
    constructor() {}

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    [Symbol.iterator]() { return [1, 2, 3][Symbol.iterator](); }
}
class One {
    constructor() {}
    isEqualTo(other) {
        return this !== null && other === 1 || other instanceof One;
    }
}
class First {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    isEqualTo(other) {
        return other instanceof First && this.x === other.x;
    }
}
class Iter {
    constructor(items) {
        this[Symbol.iterator] = () => items[Symbol.iterator]();
    }
}
class Iter2 {
    constructor(items) {
        this[Symbol.iterator] = () => items[Symbol.iterator]();
    }
}

suite.test("groups", () => {
    let groups = [
        [null, null],
        [undefined, undefined],
        [true, true],
        [false, false],
        [0, 0.0, 0],
        [1, 1.0, 1, new One(), new One()],
        [-1, -1.0, -1],
        [2, 2.0, 2],
        [Infinity, Infinity],
        [-Infinity, -Infinity],
        [NaN, NaN],
        ["", ""],
        ["0", "0"],
        [[], []],
        [[[]], [[]]],
        [new Iter([]), new Iter([])],
        [new Iter([1]), new Iter([1])],
        [new Iter([1, 2, 3]), new Iter([1, 2, 3])],
        [new Iter2([]), new Iter2([])],
        [new Float32Array(0), new Float32Array(0)],
        [new Int32Array(0), new Int32Array(0)],
        [new Int32Array([1, 2, 3]), new Int32Array([1, 2, 3])],
        [[1, 2, 3], [1, 2, 3]],
        [[1, 4, 3], [1, 4, 3]],
        [{}, {}],
        [{0: {}}, {0: {}}],
        [{a: 2}, {a: 2}],
        [new Map(), new Map()],
        [new Map([[1, 2]]), new Map([[1, 2]])],
        [new Map([[1, 3]]), new Map([[1, 3]])],
        [new Map([[3, 2]]), new Map([[3, 2]])],
        [new Map([[2, 1]]), new Map([[2, 1]])],
        [new Map([["2", 1]]), new Map([["2", 1]])],
        [new Map([[1, 2], ["a", 2]]), new Map([["a", 2], [1, 2]])],
        [new Set(), new Set()],
        [new Set(["a"]), new Set(["a"])],
        [new Set(["b"]), new Set(["b"])],
        [new Set([2, "a"]), new Set(["a", 2])],
        [new SomeIterable(), new SomeIterable()],
        [new EmptyClass(), new EmptyClass()],
        [new EmptyClass2(), new EmptyClass2()],
        [new PropClass(1), new PropClass(1)],
        [new PropClass(2), new PropClass(2)],
        [Symbol("a")],
        [new First(1, 2), new First(1, 3), new First(1, 2), new First(1, 3)],
        [new First(2, 2), new First(2, 3), new First(2, 2), new First(2, 3)],
        [
            {frump: new Map([["trump", [1, new Set([2, "a"]), new Float32Array(5)]]])},
            {frump: new Map([["trump", [1, new Set([2, "a"]), new Float32Array(5)]]])}
        ]
    ];

    assertTrue(equate(1, 1));
    assertFalse(equate(1, 2));

    for (let g1 of groups) {
        for (let g2 of groups) {
            for (let e1 of g1) {
                for (let e2 of g2) {
                    let actual = equate(e1, e2);
                    let expected = g1 === g2;
                    let eq = expected ? "equal" : "NOT equal";
                    if (actual !== expected) {
                        // Note: not using assertThat because assertThat's correctness depends on equate
                        fail(`Expected <${describe(e1)}> to ${eq} <${describe(e2)}>.`)
                    }
                }
            }
        }
    }
});
