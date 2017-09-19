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

import {Suite, assertThat} from "test/TestUtil.js"
import {describe} from "src/base/Describe.js"

let suite = new Suite("Describe");

class DescribableClass {
    constructor() { this.x = 1; }
}
class DescribedClass {
    constructor() { this.x = 1; }
    toString() { return "described"; }
}
class SomeIterable {
    constructor() {}

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    [Symbol.iterator]() {
        return [1, 2, 3][Symbol.iterator]();
    }
}

suite.test("trivial", () => {
    assertThat(describe(undefined)).isEqualTo("undefined");
    assertThat(describe(null)).isEqualTo("null");
    assertThat(describe(false)).isEqualTo("false");
    assertThat(describe("")).isEqualTo('""');
    assertThat(describe(0)).isEqualTo("0");
    assertThat(describe(Symbol())).isEqualTo("Symbol()");

    assertThat(describe([])).isEqualTo("[]");
    assertThat(describe({})).isEqualTo("{}");
    assertThat(describe(new Float32Array(0))).isEqualTo("Float32Array[]");
    assertThat(describe(new Int8Array(0))).isEqualTo("Int8Array[]");
    assertThat(describe(new Map())).isEqualTo("Map{}");
    assertThat(describe(new Set())).isEqualTo("Set{}");
});

suite.test("simple", () => {
    assertThat(describe(true)).isEqualTo("true");
    assertThat(describe(1.5)).isEqualTo("1.5");
    assertThat(describe("b")).isEqualTo('"b"');
    assertThat(describe(Symbol("a"))).isEqualTo('Symbol(a)');
    assertThat(describe(Infinity)).isEqualTo("Infinity");
    assertThat(describe(-Infinity)).isEqualTo("-Infinity");
    assertThat(describe(NaN)).isEqualTo("NaN");

    assertThat(describe([1, 2, 3])).isEqualTo("[1, 2, 3]");
    assertThat(describe(new Float32Array([1, 2, 3]))).isEqualTo("Float32Array[1, 2, 3]");
    assertThat(describe(new Int8Array([1, 2, 3]))).isEqualTo("Int8Array[1, 2, 3]");
    assertThat(describe(new Set([2]))).isEqualTo("Set{2}");
    assertThat(describe(new Map([[2, "b"]]))).isEqualTo('Map{2: "b"}');
    assertThat(describe({2: "b"})).isEqualTo('{"2": "b"}');

    assertThat(describe(new DescribedClass())).isEqualTo("described");
    assertThat(describe(new DescribableClass())).isEqualTo('(Type: DescribableClass){"x": 1}');
    assertThat(describe(new SomeIterable())).isEqualTo("SomeIterable[1, 2, 3]");
});

suite.test("recursion", () => {
    let a = [];
    a.push(a);
    assertThat(describe(a, 2)).isEqualTo(
        "[[!recursion-limit!]]");
    assertThat(describe(a, 10)).isEqualTo(
        "[[[[[[[[[[!recursion-limit!]]]]]]]]]]");

    let m = new Map();
    m.set(1, m);
    assertThat(describe(m, 2)).isEqualTo(
        "Map{1: Map{1: !recursion-limit!}}");
    assertThat(describe(m, 10)).isEqualTo(
        "Map{1: Map{1: Map{1: Map{1: Map{1: Map{1: Map{1: Map{1: Map{1: Map{1: !recursion-limit!}}}}}}}}}}");

    let s = new Set();
    s.add(s);
    assertThat(describe(s, 2)).isEqualTo(
        "Set{Set{!recursion-limit!}}");
    assertThat(describe(s, 10)).isEqualTo(
        "Set{Set{Set{Set{Set{Set{Set{Set{Set{Set{!recursion-limit!}}}}}}}}}}");

    let o = {};
    o[2] = o;
    assertThat(describe(o, 2)).isEqualTo(
        '{"2": {"2": !recursion-limit!}}');
    assertThat(describe(o, 10)).isEqualTo(
        '{"2": {"2": {"2": {"2": {"2": {"2": {"2": {"2": {"2": {"2": !recursion-limit!}}}}}}}}}}');

    // Default terminates.
    assertThat(describe(a)).isNotEqualTo(undefined);
    assertThat(describe(m)).isNotEqualTo(undefined);
    assertThat(describe(s)).isNotEqualTo(undefined);
    assertThat(describe(o)).isNotEqualTo(undefined);
});
