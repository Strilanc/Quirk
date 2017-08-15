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

import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {Util} from "src/base/Util.js"

let suite = new Suite("Util");

suite.test("need", () => {
    assertThrows(() => Util.need(false));
    Util.need(true);
});

suite.test("notNull", () => {
    assertThrows(() => Util.notNull(null));
    assertThat(Util.notNull([])).isEqualTo([]);
    assertThat(Util.notNull("")).isEqualTo("");
});

suite.test("isPowerOf2", () => {
    assertFalse(Util.isPowerOf2(-1));
    assertFalse(Util.isPowerOf2(0));
    assertTrue(Util.isPowerOf2(1));
    assertTrue(Util.isPowerOf2(2));
    assertFalse(Util.isPowerOf2(3));
    assertTrue(Util.isPowerOf2(4));
    assertFalse(Util.isPowerOf2(5));
});

suite.test("ceilLg2", () => {
    assertThat(Util.ceilLg2(0)).isEqualTo(0);
    assertThat(Util.ceilLg2(1)).isEqualTo(0);
    assertThat(Util.ceilLg2(2)).isEqualTo(1);
    assertThat(Util.ceilLg2(3)).isEqualTo(2);
    assertThat(Util.ceilLg2(4)).isEqualTo(2);
    assertThat(Util.ceilLg2(5)).isEqualTo(3);
    assertThat(Util.ceilLg2(6)).isEqualTo(3);
    assertThat(Util.ceilLg2(7)).isEqualTo(3);
    assertThat(Util.ceilLg2(8)).isEqualTo(3);
    assertThat(Util.ceilLg2(9)).isEqualTo(4);
    assertThat(Util.ceilLg2((1<<20)-1)).isEqualTo(20);
    assertThat(Util.ceilLg2((1<<20))).isEqualTo(20);
    assertThat(Util.ceilLg2((1<<20)+1)).isEqualTo(21);
});

suite.test("floorLg2", () => {
    assertThat(Util.floorLg2(0)).isEqualTo(0);
    assertThat(Util.floorLg2(1)).isEqualTo(0);
    assertThat(Util.floorLg2(2)).isEqualTo(1);
    assertThat(Util.floorLg2(3)).isEqualTo(1);
    assertThat(Util.floorLg2(4)).isEqualTo(2);
    assertThat(Util.floorLg2(5)).isEqualTo(2);
    assertThat(Util.floorLg2(6)).isEqualTo(2);
    assertThat(Util.floorLg2(7)).isEqualTo(2);
    assertThat(Util.floorLg2(8)).isEqualTo(3);
    assertThat(Util.floorLg2(9)).isEqualTo(3);
    assertThat(Util.floorLg2((1<<20)-1)).isEqualTo(19);
    assertThat(Util.floorLg2((1<<20))).isEqualTo(20);
    assertThat(Util.floorLg2((1<<20)+1)).isEqualTo(20);
});

suite.test("bitSize", () => {
    assertThat(Util.bitSize(0)).isEqualTo(0);
    assertThat(Util.bitSize(1)).isEqualTo(1);
    assertThat(Util.bitSize(2)).isEqualTo(2);
    assertThat(Util.bitSize(3)).isEqualTo(2);
    assertThat(Util.bitSize(4)).isEqualTo(3);
    assertThat(Util.bitSize(5)).isEqualTo(3);
    assertThat(Util.bitSize(6)).isEqualTo(3);
    assertThat(Util.bitSize(7)).isEqualTo(3);
    assertThat(Util.bitSize(8)).isEqualTo(4);
    assertThat(Util.bitSize(9)).isEqualTo(4);
    assertThat(Util.bitSize(1 << 20)).isEqualTo(21);
    assertThat(Util.bitSize((1 << 20) + (1 << 19))).isEqualTo(21);
});

suite.test("ceilingPowerOf2", () => {
    assertThat(Util.ceilingPowerOf2(-1)).isEqualTo(1);
    assertThat(Util.ceilingPowerOf2(0)).isEqualTo(1);
    assertThat(Util.ceilingPowerOf2(1)).isEqualTo(1);
    assertThat(Util.ceilingPowerOf2(2)).isEqualTo(2);
    assertThat(Util.ceilingPowerOf2(3)).isEqualTo(4);
    assertThat(Util.ceilingPowerOf2(4)).isEqualTo(4);
    assertThat(Util.ceilingPowerOf2(5)).isEqualTo(8);
    assertThat(Util.ceilingPowerOf2(6)).isEqualTo(8);
    assertThat(Util.ceilingPowerOf2(7)).isEqualTo(8);
    assertThat(Util.ceilingPowerOf2(8)).isEqualTo(8);
    assertThat(Util.ceilingPowerOf2(9)).isEqualTo(16);
    assertThat(Util.ceilingPowerOf2((1 << 20) - 1)).isEqualTo(1 << 20);
    assertThat(Util.ceilingPowerOf2(1 << 20)).isEqualTo(1 << 20);
    assertThat(Util.ceilingPowerOf2((1 << 20) + 1)).isEqualTo(1 << 21);
});

suite.test("powerOfTwoness", () => {
    assertThat(Util.powerOfTwoness(-2)).isEqualTo(1);
    assertThat(Util.powerOfTwoness(-1)).isEqualTo(0);
    assertThat(Util.powerOfTwoness(0)).isEqualTo(Math.POSITIVE_INFINITY);
    assertThat(Util.powerOfTwoness(1)).isEqualTo(0);
    assertThat(Util.powerOfTwoness(2)).isEqualTo(1);
    assertThat(Util.powerOfTwoness(3)).isEqualTo(0);
    assertThat(Util.powerOfTwoness(4)).isEqualTo(2);
    assertThat(Util.powerOfTwoness(5)).isEqualTo(0);
    assertThat(Util.powerOfTwoness(6)).isEqualTo(1);
    assertThat(Util.powerOfTwoness(7)).isEqualTo(0);
    assertThat(Util.powerOfTwoness(8)).isEqualTo(3);
    assertThat(Util.powerOfTwoness(9)).isEqualTo(0);

    assertThat(Util.powerOfTwoness(1 << 20)).isEqualTo(20);
    assertThat(Util.powerOfTwoness(1 + (1 << 20))).isEqualTo(0);
    assertThat(Util.powerOfTwoness(2 + (1 << 20))).isEqualTo(1);
});

suite.test("reverseGroupMap", () => {
    assertThat(Util.reverseGroupMap(new Map())).isEqualTo(new Map());
    assertThat(Util.reverseGroupMap(new Map([["a", ["b"]]]))).isEqualTo(new Map([["b", ["a"]]]));
    assertThat(Util.reverseGroupMap(new Map([
        ["a", ["b", "c"]]
    ]))).isEqualTo(new Map([
        ["b", ["a"]],
        ["c", ["a"]]
    ]));
    assertThat(Util.reverseGroupMap(new Map([
        ["a", ["b"]],
        ["c", ["b"]]
    ]))).isEqualTo(new Map([
        ["b", ["a", "c"]]
    ]));
    assertThat(Util.reverseGroupMap(new Map([
        ["a", [1, 2, 3]],
        ["b", [2, 3, 4]],
        ["c", [3, 4, 5]]
    ]))).isEqualTo(new Map([
        [1, ["a"]],
        [2, ["a", "b"]],
        [3, ["a", "b", "c"]],
        [4, ["b", "c"]],
        [5, ["c"]]
    ]));

    assertThat(Util.reverseGroupMap(new Map([
        ["a", [1, 2, 3]],
        ["b", [2, 3, 4]],
        ["c", [3, 4, 5]]
    ]), true)).isEqualTo(new Map([
        [1, ["a"]],
        [2, ["a", "b"]],
        [3, ["a", "b", "c"]],
        [4, ["b", "c"]],
        [5, ["c"]],
        ["a", []],
        ["b", []],
        ["c", []]
    ]));
    assertThat(Util.reverseGroupMap(new Map([
        [3, [1, 2]],
        [2, [1]]
    ]), true)).isEqualTo(new Map([
        [1, [3, 2]],
        [2, [3]],
        [3, []]
    ]));
});

suite.test("binarySearchForTransitionFromTrueToFalse", () => {
    let r = ["axe", "cat", "def", "g"];
    assertThat(Util.binarySearchForTransitionFromTrueToFalse(r.length, i => r[i] < "a")).isEqualTo(0);
    assertThat(Util.binarySearchForTransitionFromTrueToFalse(r.length, i => r[i] < "b")).isEqualTo(1);
    assertThat(Util.binarySearchForTransitionFromTrueToFalse(r.length, i => r[i] < "d")).isEqualTo(2);
    assertThat(Util.binarySearchForTransitionFromTrueToFalse(r.length, i => r[i] < "e")).isEqualTo(3);

    for (let n = 0; n < 10; n++) {
        for (let t = 0; t <= n; t++) {
            assertThat(Util.binarySearchForTransitionFromTrueToFalse(n, i => i < t)).isEqualTo(t);
            assertThat(Util.binarySearchForTransitionFromTrueToFalse(n, i => i <= t)).isEqualTo(Math.min(n, t + 1));
        }
    }
});

suite.test("breakLine", () => {
    assertThat(Util.breakLine("a long line can be broken between words", 21, e => e.length)).isEqualTo([
        "a long line can be",
        "broken between words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 20, e => e.length)).isEqualTo([
        "a long line can be",
        "broken between words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 19, e => e.length)).isEqualTo([
        "a long line can be",
        "broken between",
        "words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 11, e => e.length)).isEqualTo([
        "a long line",
        "can be",
        "broken",
        "between",
        "words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 10, e => e.length)).isEqualTo([
        "a long",
        "line can",
        "be broken",
        "between",
        "words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 9, e => e.length)).isEqualTo([
        "a long",
        "line can",
        "be broken",
        "between",
        "words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 8, e => e.length)).isEqualTo([
        "a long",
        "line can",
        "be",
        "broken",
        "between",
        "words"
    ]);

    assertThat(Util.breakLine("a long line can be broken between words", 7, e => e.length)).isEqualTo([
        "a long",
        "line",
        "can be",
        "broken",
        "between",
        "words"
    ]);

    //noinspection SpellCheckingInspection
    assertThat(Util.breakLine("a long line can be broken between words", 6, e => e.length)).isEqualTo([
        "a long",
        "line",
        "can be",
        "broken",
        "betwee",
        "n",
        "words"
    ]);

    //noinspection SpellCheckingInspection
    assertThat(Util.breakLine("a long line can be broken between words", 5, e => e.length)).isEqualTo([
        "a",
        "long",
        "line",
        "can",
        "be",
        "broke",
        "n",
        "betwe",
        "en",
        "words"
    ]);

    assertThat(Util.breakLine("multiple     spaces       can get         \t\tcollapsed", 10, e => e.length)).isEqualTo([
        "multiple",
        "spaces",
        "can get",
        "collapsed"
    ]);

    assertThat(Util.breakLine("Wide Wide narrow narrow", 13, e => (e.match(/W/)||[]).length*8 + e.length)).isEqualTo([
        "Wide",
        "Wide",
        "narrow narrow"
    ]);
});

suite.test("decomposeObjectValues", () => {
    assertThat(Util.decomposeObjectValues({})).isEqualTo([]);
    assertThat(Util.decomposeObjectValues({a: "x"})).isEqualTo(["x"]);
    assertThat(Util.decomposeObjectValues({a: {b: "y"}})).isEqualTo([{b: "y"}]);
    assertThat(Util.decomposeObjectValues({a: "x", b: "y"})).isEqualTo(["x", "y"]);
    assertThat(Util.decomposeObjectValues({b: "y", a: "x"})).isEqualTo(["x", "y"]);
    assertThat(Util.decomposeObjectValues({a: []})).isEqualTo([]);
    assertThat(Util.decomposeObjectValues({a: [1, 2, 3]})).isEqualTo([1, 2, 3]);
    assertThat(Util.decomposeObjectValues({a: [1, 2, 3], b: "x", c: [4, 5]})).isEqualTo([1, 2, 3, "x", 4, 5]);
    assertThat(Util.decomposeObjectValues({a: [1, [2, 4], 3]})).isEqualTo([1, 2, 4, 3]);
    assertThat(Util.decomposeObjectValues({a: [1, [], 3]})).isEqualTo([1, 3]);
});

suite.test("recomposedObjectValues", () => {
    assertThrows(() => Util.recomposedObjectValues({}, [1]));
    assertThrows(() => Util.recomposedObjectValues({a: []}, [1]));
    assertThrows(() => Util.recomposedObjectValues({a: ""}, []));

    assertThat(Util.recomposedObjectValues({}, [])).isEqualTo({});
    assertThat(Util.recomposedObjectValues({a: "x"}, ["r"])).isEqualTo({a: "r"});
    assertThat(Util.recomposedObjectValues({a: {b: "y"}}, ["r"])).isEqualTo({a: "r"});
    assertThat(Util.recomposedObjectValues({a: "x", b: "y"}, [2, 3])).isEqualTo({a:2, b:3});
    assertThat(Util.recomposedObjectValues({b: "y", a: "x"}, [2, 3])).isEqualTo({a:2, b:3});
    assertThat(Util.recomposedObjectValues({a: []}, [])).isEqualTo({a:[]});
    assertThat(Util.recomposedObjectValues({a: [2, 3]}, [4, 5])).isEqualTo({a: [4, 5]});
    assertThat(Util.recomposedObjectValues({a: [1, 2, 3], b: "x", c: [4, 5]}, ["a", "b", "c", "d", "e", "f"])).
        isEqualTo({a: ["a", "b", "c"], b: "d", c: ["e", "f"]});
    assertThat(Util.recomposedObjectValues({a: [1, [2, 4], 3]}, ["a", "b", "c", "d"])).
        isEqualTo({a: ["a", ["b", "c"], "d"]});
    assertThat(Util.recomposedObjectValues({a: [1, [], 3]}, ["a", "b"])).isEqualTo({a: ["a", [], "b"]});
});

suite.test("snappedCosSin", () => {
    let r = Math.PI/4;
    let s = Math.sqrt(0.5);

    assertThat(Util.snappedCosSin(0.123)).isEqualTo([Math.cos(0.123), Math.sin(0.123)]);

    assertThat(Util.snappedCosSin(0)).isEqualTo([1, 0]);
    assertThat(Util.snappedCosSin(r)).isEqualTo([s, s]);
    assertThat(Util.snappedCosSin(2*r)).isEqualTo([0, 1]);
    assertThat(Util.snappedCosSin(3*r)).isEqualTo([-s, s]);
    assertThat(Util.snappedCosSin(4*r)).isEqualTo([-1, 0]);
    assertThat(Util.snappedCosSin(5*r)).isEqualTo([-s, -s]);
    assertThat(Util.snappedCosSin(6*r)).isEqualTo([0, -1]);
    assertThat(Util.snappedCosSin(7*r)).isEqualTo([s, -s]);
    assertThat(Util.snappedCosSin(8*r)).isEqualTo([1, 0]);

    assertThat(Util.snappedCosSin(-8*r)).isEqualTo([1, 0]);
    assertThat(Util.snappedCosSin(-7*r)).isEqualTo([s, s]);
    assertThat(Util.snappedCosSin(-6*r)).isEqualTo([0, 1]);
    assertThat(Util.snappedCosSin(-5*r)).isEqualTo([-s, s]);
    assertThat(Util.snappedCosSin(-4*r)).isEqualTo([-1, 0]);
    assertThat(Util.snappedCosSin(-3*r)).isEqualTo([-s, -s]);
    assertThat(Util.snappedCosSin(-2*r)).isEqualTo([0, -1]);
    assertThat(Util.snappedCosSin(-1*r)).isEqualTo([s, -s]);
});

suite.test("numberOfSetBits", () => {
    assertThrows(() => Util.numberOfSetBits(-1));
    assertThrows(() => Util.numberOfSetBits("what"));
    assertThrows(() => Util.numberOfSetBits(NaN));
    assertThrows(() => Util.numberOfSetBits(Infinity));
    assertThrows(() => Util.numberOfSetBits(Math.pow(2, 32)));
    assertThrows(() => Util.numberOfSetBits(0.1));

    assertThat(Util.numberOfSetBits(0)).isEqualTo(0);
    assertThat(Util.numberOfSetBits(1)).isEqualTo(1);
    assertThat(Util.numberOfSetBits(2)).isEqualTo(1);
    assertThat(Util.numberOfSetBits(3)).isEqualTo(2);
    assertThat(Util.numberOfSetBits(4)).isEqualTo(1);
    assertThat(Util.numberOfSetBits(5)).isEqualTo(2);
    assertThat(Util.numberOfSetBits(6)).isEqualTo(2);
    assertThat(Util.numberOfSetBits(7)).isEqualTo(3);
    assertThat(Util.numberOfSetBits(8)).isEqualTo(1);
    assertThat(Util.numberOfSetBits(9)).isEqualTo(2);
    assertThat(Util.numberOfSetBits(10)).isEqualTo(2);
    assertThat(Util.numberOfSetBits(11)).isEqualTo(3);
    assertThat(Util.numberOfSetBits(12)).isEqualTo(2);
    assertThat(Util.numberOfSetBits(13)).isEqualTo(3);
    assertThat(Util.numberOfSetBits(14)).isEqualTo(3);
    assertThat(Util.numberOfSetBits(15)).isEqualTo(4);
    assertThat(Util.numberOfSetBits(16)).isEqualTo(1);
    assertThat(Util.numberOfSetBits(17)).isEqualTo(2);

    assertThat(Util.numberOfSetBits(0x11111111)).isEqualTo(8);
    assertThat(Util.numberOfSetBits(0x22222222)).isEqualTo(8);
    assertThat(Util.numberOfSetBits(0x01234567)).isEqualTo(12);
    assertThat(Util.numberOfSetBits(0x89ABCDEF)).isEqualTo(20);
    assertThat(Util.numberOfSetBits(0xFFFFFFFF)).isEqualTo(32);
});

suite.test("properMod", () => {
    assertThrows(() => Util.properMod(0, 0));
    assertThrows(() => Util.properMod(1, 0));
    assertThrows(() => Util.properMod(1, -1));

    assertThat(Util.properMod(502, 501)).isEqualTo(1);
    assertThat(Util.properMod(-502, 501)).isEqualTo(500);

    assertThat(Util.properMod(-2, 1.5)).isEqualTo(1);
    assertThat(Util.properMod(-1.5, 1.5)).isEqualTo(0);
    assertThat(Util.properMod(-1, 1.5)).isEqualTo(0.5);
    assertThat(Util.properMod(-0.5, 1.5)).isEqualTo(1);
    assertThat(Util.properMod(0, 1.5)).isEqualTo(0);
    assertThat(Util.properMod(0.5, 1.5)).isEqualTo(0.5);
    assertThat(Util.properMod(1, 1.5)).isEqualTo(1);
    assertThat(Util.properMod(1.5, 1.5)).isEqualTo(0);
    assertThat(Util.properMod(2, 1.5)).isEqualTo(0.5);
});

suite.test("extended_gcd", () => {
    assertThat(Util.extended_gcd(2, 2)).isEqualTo({x: 0, y: 1, gcd: 2});
    assertThat(Util.extended_gcd(2, 3)).isEqualTo({x: -1, y: 1, gcd: 1});
    assertThat(Util.extended_gcd(3, 2)).isEqualTo({x: 1, y: -1, gcd: 1});
    assertThat(Util.extended_gcd(11, 0)).isEqualTo({x: 1, y: 0, gcd: 11});
    assertThat(Util.extended_gcd(11, 1)).isEqualTo({x: 0, y: 1, gcd: 1});
    assertThat(Util.extended_gcd(240, 46)).isEqualTo({x: -9, y: 47, gcd: 2});
    assertThat(Util.extended_gcd(3655, 3826)).isEqualTo({x: -179, y: 171, gcd: 1});
});

suite.test("modular_multiplicative_inverse", () => {
    assertThat(Util.modular_multiplicative_inverse(10, 11)).isEqualTo(10);
    assertThat(Util.modular_multiplicative_inverse(2, 4)).isEqualTo(undefined);
    assertThat(Util.modular_multiplicative_inverse(2, 11)).isEqualTo(6);
    assertThat(Util.modular_multiplicative_inverse(3, 1024)).isEqualTo(683);
    assertThat(Util.modular_multiplicative_inverse(683, 1024)).isEqualTo(3);
});
