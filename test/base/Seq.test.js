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
import {seq, Seq} from "src/base/Seq.js"

let suite = new Suite("Seq");

suite.test("constructor_Array", () => {
    assertThat(new Seq([])).iteratesAs();
    assertThat(new Seq(["a"])).iteratesAs("a");
    assertThat(new Seq(["a", "b", 3])).iteratesAs("a", "b", 3);
    assertThat(seq([])).iteratesAs();
    assertThat(seq(["a"])).iteratesAs("a");
    assertThat(seq(["a", "b", 3])).iteratesAs("a", "b", 3);
});

suite.test("constructor_OtherArrays", () => {
    let candidates = [
        new Float32Array([1, 2, 3]),
        new Int16Array([-1, 2, 3]),
        new Int32Array([1, -2, 3]),
        new Int8Array([1, 2, -3]),
        new Uint8Array([1, 2, 3]),
        new Uint16Array([1, 2, 3]),
        new Uint32Array([1, 2, 3, 4, 5]),
        new Uint32Array([]),
        ["a", "b", 3]
    ];

    for (let candidate of candidates) {
        for (let runs = 0; runs < 2; runs++) {
            let seq1 = new Seq(candidate);
            let seq2 = seq(candidate);
            let n = 0;
            for (let e of seq1) {
                assertThat(e).isEqualTo(candidate[n]);
                n++;
            }
            assertThat(n).isEqualTo(candidate.length);
            let n2 = 0;
            for (let e of seq2) {
                assertThat(e).isEqualTo(candidate[n2]);
                n2++;
            }
            assertThat(n2).isEqualTo(candidate.length);
        }
    }
});

suite.test("constructor_RawGeneratorSinglePass", () => {
    let s = seq(function*() {
        yield 1;
        yield 2;
    }());

    assertThat(s).iteratesAs(1, 2);
    // now the generator is used up and would iterate as []...
});

suite.test("fromGenerator_MultipleUses", () => {
    let s = Seq.fromGenerator(function*() {
        yield 1;
        yield 2;
    });

    assertThat(s).iteratesAs(1, 2);
    assertThat(s).iteratesAs(1, 2);
    assertThat(s).iteratesAs(1, 2);
});

suite.test("isEqualTo", () => {
    // Cases involving other types.
    assertFalse(seq([]).isEqualTo(null));
    assertFalse(seq([]).isEqualTo("a"));
    assertFalse(seq([]).isEqualTo(0));
    assertTrue(seq(["a", "b", "c"]).isEqualTo("abc")); // because string is iterable
    assertTrue(seq([1, 2, 3]).isEqualTo([1, 2, 3]));
    assertFalse(seq([1, 2, 3]).isEqualTo([1, 2]));

    // Concrete cases.
    assertTrue(seq([]).isEqualTo(seq([])));
    assertTrue(seq([2.5]).isEqualTo(seq(new Float32Array([2.5]))));
    assertFalse(seq([]).isEqualTo(seq([1])));

    // Acts like a grouping along expected boundaries.
    let groups = [
        [seq([]), seq([]), Seq.fromGenerator(function*(){ }), seq(new Int32Array([]))],
        [seq(["a"]), seq(["a"]), Seq.fromGenerator(function*(){ yield "a"; })],
        [seq([2.5]), Seq.fromGenerator(function*(){ yield 2.5; }), seq(new Float32Array([2.5]))],
        [seq(["a", "b", "c"]), Seq.fromGenerator(function*(){ yield "a"; yield "b"; yield "c" })]
    ];
    for (let g1 of groups) {
        for (let g2 of groups) {
            for (let e1 of g1) {
                for (let e2 of g2) {
                    assertThat(e1.isEqualTo(e2)).isEqualTo(g1 === g2);
                }
            }
        }
    }

    // Interop with assertThat.
    assertThat(seq(["a"])).isEqualTo(seq(["a"]));
    assertThat(seq(["a"])).isNotEqualTo(seq(["a", "b"]));
    assertThat(seq(["a"])).isNotEqualTo(seq([]));
    assertThat(seq(["a"])).isNotEqualTo(seq(["b"]));
});

suite.test("toArray", () => {
    let a0 = Seq.fromGenerator(function*() {}).toArray();
    assertTrue(Array.isArray(a0));
    assertThat(a0).isEqualTo([]);

    let a2 = Seq.fromGenerator(function*() { yield 1; yield "a"; }).toArray();
    assertTrue(Array.isArray(a2));
    assertThat(a2).isEqualTo([1, "a"]);
});

suite.test("toFloat32Array", () => {
    assertThat(seq([]).toFloat32Array()).isEqualTo(new Float32Array([]));
    assertThat(seq([1, 2, Infinity]).toFloat32Array()).isEqualTo(new Float32Array([1, 2, Infinity]));
    assertThat(Seq.fromGenerator(function*() {}).toFloat32Array()).isEqualTo(new Float32Array([]));
    assertThat(Seq.fromGenerator(function*() { yield 1; yield 0.5; }).toFloat32Array()).isEqualTo(
        new Float32Array([1, 0.5]));
});

suite.test("toSet", () => {
    assertThat(Seq.fromGenerator(function*() {}).toSet()).isEqualTo(new Set());
    assertThat(Seq.fromGenerator(function*() { yield 1; yield "a"; }).toSet()).isEqualTo(new Set([1, "a"]));
    assertThat(Seq.fromGenerator(function*() { yield "a"; yield 1; yield "a"; }).toSet()).isEqualTo(new Set([1, "a"]));

    assertThat(seq([]).toSet()).isEqualTo(new Set());
    assertThat(seq([1]).toSet()).isEqualTo(new Set([1]));
    assertThat(seq([1, 2]).toSet()).isEqualTo(new Set([1, 2]));
    assertThat(seq([1, 2, 1, 3]).toSet()).isEqualTo(new Set([3, 1, 2]));
});

suite.test("join", () => {
    assertThat(seq([]).join("||")).isEqualTo("");
    assertThat(seq([1]).join("||")).isEqualTo("1");
    assertThat(seq([1, 2]).join("||")).isEqualTo("1||2");
    assertThat(seq([1, 2, 3]).join("||")).isEqualTo("1||2||3");
});

suite.test("toString", () => {
    assertThat(seq([]).toString()).isEqualTo("Seq[]");
    assertThat(seq([1]).toString()).isEqualTo("Seq[1]");
    assertThat(seq([1, 2]).toString()).isEqualTo("Seq[1, 2]");
    assertThat(seq([1, 2, 3]).toString()).isEqualTo("Seq[1, 2, 3]");
});

suite.test("range", () => {
    assertThrows(() => Seq.range(-1));

    assertThat(Seq.range(0)).iteratesAs();
    assertThat(Seq.range(1)).iteratesAs(0);
    assertThat(Seq.range(2)).iteratesAs(0, 1);
    assertThat(Seq.range(3)).iteratesAs(0, 1, 2);
    assertThat(Seq.range(10)).iteratesAs(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
});

suite.test("naturals", () => {
    let n = 0;
    for (let i of Seq.naturals()) {
        assertThat(i).isEqualTo(n);
        n++;
        if (n > 1000) {
            break;
        }
    }
});

suite.test("repeat", () => {
    assertThrows(() => Seq.repeat("a", -1));

    assertThat(Seq.repeat("a", 0)).iteratesAs();
    assertThat(Seq.repeat("a", 1)).iteratesAs("a");
    assertThat(Seq.repeat("a", 2)).iteratesAs("a", "a");
    assertThat(Seq.repeat(1.5, 5)).iteratesAs(1.5, 1.5, 1.5, 1.5, 1.5);
});

suite.test("solidify", () => {
    let s1 = seq([1, 2, 3]);
    let s2 = seq(new Float32Array([1, 2, 3]));
    assertTrue(s1 === s1.solidify());
    assertTrue(s2 === s2.solidify());

    let i = 0;
    let s3 = Seq.fromGenerator(function*() {
        while (i < 4) {
            yield i++;
        }
    });
    let s4 = s3.solidify();
    let s5 = s3.solidify();
    assertThat(s4).iteratesAs(0, 1, 2, 3);
    assertThat(s5).iteratesAs();
    assertThat(i).isEqualTo(4);
});

suite.test("map", () => {
    assertThat(seq([]).map(e => e + 1)).iteratesAs();
    assertThat(seq([1]).map(e => e + 1)).iteratesAs(2);
    assertThat(seq([1, 2]).map(e => e + 1)).iteratesAs(2, 3);
    assertThat(seq([3, 1, 2]).map(e => e * 2)).iteratesAs(6, 2, 4);
});

suite.test("flatMap", () => {
    assertThat(seq([]).flatMap(e => [])).iteratesAs();
    assertThat(seq([]).flatMap(e => [1, 2, 3])).iteratesAs();
    assertThat(seq([1, 2, 3]).flatMap(e => [])).iteratesAs();

    assertThat(seq([1]).flatMap(e => [e * 2, e * 2 + 1])).iteratesAs(2, 3);
    assertThat(seq([1, 2, 3]).flatMap(e => [e * 2, e * 2 + 1])).iteratesAs(2, 3, 4, 5, 6, 7);
    assertThat(seq([1, 2, 3]).flatMap(Seq.range)).iteratesAs(0, 0, 1, 0, 1, 2);
});

suite.test("filter", () => {
    assertThat(seq([]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(seq([1]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(seq([2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(seq([1, 2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(seq([2, 0, 1, 4]).filter(e => e % 2 === 0)).iteratesAs(2, 0, 4);
    assertThat(seq([2, 0, 1, 4]).filter(e => e % 2 === 1)).iteratesAs(1);
});

suite.test("filterWithIndex", () => {
    assertThat(seq([]).filterWithIndex((e, i) => e % 2 === 0)).iteratesAs();
    assertThat(seq([1]).filterWithIndex((e, i) => e % 2 === 0)).iteratesAs();
    assertThat(seq([2]).filterWithIndex((e, i) => e % 2 === 0)).iteratesAs(2);
    assertThat(seq([1, 2]).filterWithIndex((e, i) => e % 2 === 0)).iteratesAs(2);
    assertThat(seq([2, 0, 1, 4]).filterWithIndex((e, i) => e % 2 === 0)).iteratesAs(2, 0, 4);
    assertThat(seq([2, 0, 1, 4]).filterWithIndex((e, i) => e % 2 === 1)).iteratesAs(1);

    assertThat(seq([2, 0, 1, 4]).filterWithIndex((e, i) => i % 2 === 0)).iteratesAs(2, 1);
    assertThat(seq([2, 0, 1, 4]).filterWithIndex((e, i) => i % 2 === 1)).iteratesAs(0, 4);
    assertThat(seq([2, 0, 1, 4]).filterWithIndex((e, i) => (e+i) % 2 === 1)).iteratesAs(0, 1, 4);
});

suite.test("fold", () => {
    assertThrows(() => seq([]).fold((e1, e2) => undefined));
    assertThat(seq([]).fold(() => { throw new Error(); }, "abc")).isEqualTo("abc");

    assertThat(seq([1]).fold(() => { throw new Error(); })).isEqualTo(1);

    assertThat(seq([1, 2]).fold((e1, e2) => e1 + e2)).isEqualTo(3);
    assertThat(seq([1, 2, 3]).fold((e1, e2) => e1 + e2)).isEqualTo(6);
    assertThat(seq([1, 2, 3, 4]).fold((e1, e2) => e1 + e2)).isEqualTo(10);
    assertThat(seq([1, 2, 3, 4]).fold((e1, e2) => e1 * e2)).isEqualTo(24);
});

suite.test("aggregate", () => {
    assertThat(seq([]).aggregate("abc", () => { throw new Error(); })).isEqualTo("abc");
    assertThat(seq([1]).aggregate(-1, (a, e) => a + e)).isEqualTo(0);
    assertThat(seq([1, 2]).aggregate(-1, (a, e) => a + e)).isEqualTo(2);
    assertThat(seq([1, 2]).aggregate(-3, (a, e) => a + e)).isEqualTo(0);
    assertThat(seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * e)).isEqualTo(-24);
    assertThat(seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * 2 + e)).isEqualTo(10);
    assertThat(seq([1, 2, 3, 4]).aggregate("x", (a, e) => a + "," + e)).isEqualTo("x,1,2,3,4");
});

suite.test("zip", () => {
    assertThat(seq([]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(seq([1]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(seq([]).zip([1], () => { throw new Error(); })).iteratesAs();

    assertThat(seq(["a"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(seq(["a"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(seq(["a", "b"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(seq(["a", "b"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2", "b3");
});

suite.test("max", () => {
    assertThrows(() => seq([]).max());
    assertThat(seq([]).max("abc")).isEqualTo("abc");
    assertThat(seq([1]).max("abc")).isEqualTo(1);
    assertThat(seq([1]).max()).isEqualTo(1);
    assertThat(seq([1, 2]).max()).isEqualTo(2);
    assertThat(seq([2, 1]).max()).isEqualTo(2);
    assertThat(seq([2, 1, -5, 102, -3, 4]).max()).isEqualTo(102);
    assertThat(seq(["a", "c", "b"]).max()).isEqualTo("c");
});

suite.test("min", () => {
    assertThrows(() => seq([]).min());
    assertThat(seq([]).min("abc")).isEqualTo("abc");
    assertThat(seq([1]).min("abc")).isEqualTo(1);
    assertThat(seq([1]).min()).isEqualTo(1);
    assertThat(seq([1, 2]).min()).isEqualTo(1);
    assertThat(seq([2, 1]).min()).isEqualTo(1);
    assertThat(seq([2, 1, -5, 102, -3, 4]).min()).isEqualTo(-5);
    assertThat(seq(["a", "c", "b"]).min()).isEqualTo("a");
});

suite.test("maxBy", () => {
    assertThrows(() => seq([]).maxBy(() => undefined));
    assertThat(seq([]).maxBy(() => undefined, "abc")).isEqualTo("abc");
    assertThat(seq(["abc"]).maxBy(() => { throw new Error(); })).isEqualTo("abc");

    assertThat(seq([1, 2]).maxBy(e => e)).isEqualTo(2);
    assertThat(seq([1, 2]).maxBy(e => -e)).isEqualTo(1);
    assertThat(seq([1, 2]).maxBy(e => e, undefined, (e1, e2) => e1 < e2)).isEqualTo(2);
    assertThat(seq([1, 2]).maxBy(e => e, undefined, (e1, e2) => e1 > e2)).isEqualTo(1);
    assertThat(seq([-2, -1, 0, 1, 2]).maxBy(e => e*(2 - e))).isEqualTo(1);
    assertThat(seq([-2, -1, 0, 1, 2]).maxBy(e => e*(e - 2))).isEqualTo(-2);
});

suite.test("minBy", () => {
    assertThrows(() => seq([]).minBy(() => undefined));
    assertThat(seq([]).minBy(() => undefined, "abc")).isEqualTo("abc");
    assertThat(seq(["abc"]).minBy(() => { throw new Error(); })).isEqualTo("abc");

    assertThat(seq([1, 2]).minBy(e => e)).isEqualTo(1);
    assertThat(seq([1, 2]).minBy(e => -e)).isEqualTo(2);
    assertThat(seq([1, 2]).minBy(e => e, undefined, (e1, e2) => e1 < e2)).isEqualTo(1);
    assertThat(seq([1, 2]).minBy(e => e, undefined, (e1, e2) => e1 > e2)).isEqualTo(2);
    assertThat(seq([-2, -1, 0, 1, 2]).minBy(e => e*(2 - e))).isEqualTo(-2);
    assertThat(seq([-2, -1, 0, 1, 2]).minBy(e => e*(e - 2))).isEqualTo(1);
});

suite.test("any", () => {
    assertFalse(seq([]).any(() => { throw new Error(); }));

    assertFalse(seq([1]).any(e => e % 3 === 0));
    assertFalse(seq([2]).any(e => e % 3 === 0));
    assertTrue(seq([3]).any(e => e % 3 === 0));

    assertFalse(seq([1, 1]).any(e => e % 3 === 0));
    assertFalse(seq([4, 2]).any(e => e % 3 === 0));
    assertTrue(seq([7, 3]).any(e => e % 3 === 0));
    assertFalse(seq([2, 1]).any(e => e % 3 === 0));
    assertFalse(seq([5, 2]).any(e => e % 3 === 0));
    assertTrue(seq([8, 3]).any(e => e % 3 === 0));
    assertTrue(seq([3, 1]).any(e => e % 3 === 0));
    assertTrue(seq([6, 2]).any(e => e % 3 === 0));
    assertTrue(seq([9, 3]).any(e => e % 3 === 0));

    assertFalse(seq([1, 4, 7, 10, 13]).any(e => e % 3 === 0));
    assertTrue(seq([0, 1, 2, 3, 4, 5, 6]).any(e => e % 3 === 0));
    assertTrue(seq([3, 6, 9, 12]).any(e => e % 3 === 0));
});

suite.test("every", () => {
    assertTrue(seq([]).every(() => { throw new Error(); }));

    assertFalse(seq([1]).every(e => e % 3 === 0));
    assertFalse(seq([2]).every(e => e % 3 === 0));
    assertTrue(seq([3]).every(e => e % 3 === 0));

    assertFalse(seq([1, 1]).every(e => e % 3 === 0));
    assertFalse(seq([4, 2]).every(e => e % 3 === 0));
    assertFalse(seq([7, 3]).every(e => e % 3 === 0));
    assertFalse(seq([2, 1]).every(e => e % 3 === 0));
    assertFalse(seq([5, 2]).every(e => e % 3 === 0));
    assertFalse(seq([8, 3]).every(e => e % 3 === 0));
    assertFalse(seq([3, 1]).every(e => e % 3 === 0));
    assertFalse(seq([6, 2]).every(e => e % 3 === 0));
    assertTrue(seq([9, 3]).every(e => e % 3 === 0));

    assertFalse(seq([1, 4, 7, 10, 13]).every(e => e % 3 === 0));
    assertFalse(seq([0, 1, 2, 3, 4, 5, 6]).every(e => e % 3 === 0));
    assertTrue(seq([3, 6, 9, 12]).every(e => e % 3 === 0));
});

suite.test("contains", () => {
    assertFalse(seq([]).contains(1));
    assertFalse(seq([0]).contains(1));
    assertFalse(seq([0]).contains(""));
    assertTrue(seq([1]).contains(1));
    assertFalse(seq([[]]).contains([]));

    assertTrue(seq([1, 2, 3]).contains(1));
    assertTrue(seq([1, 2, 3]).contains(2));
    assertTrue(seq([1, 2, 3]).contains(3));
    assertFalse(seq([1, 2, 3]).contains(4));
});

suite.test("sum", () => {
    assertThat(seq([]).sum()).isEqualTo(0);
    assertThat(seq([11]).sum()).isEqualTo(11);
    assertThat(seq([1, 2]).sum()).isEqualTo(3);
    assertThat(seq([1, 2, 3, 4]).sum()).isEqualTo(10);

    assertThat(seq(["abc"]).sum()).isEqualTo("abc");
    assertThat(seq(["a", "b"]).sum()).isEqualTo("ab");
});

suite.test("product", () => {
    assertThat(seq([]).product()).isEqualTo(1);
    assertThat(seq([11]).product()).isEqualTo(11);
    assertThat(seq([11, 2]).product()).isEqualTo(22);
    assertThat(seq([11, 2, 3, 4]).product()).isEqualTo(264);

    assertThat(seq(["abc"]).product()).isEqualTo("abc");
});

suite.test("scan", () => {
    assertThat(seq([]).scan("abc", (a, e) => a + e)).iteratesAs("abc");
    assertThat(seq([1, 2, 3]).scan("abc", (a, e) => a + e)).iteratesAs("abc", "abc1", "abc12", "abc123");

    assertThat(seq([]).scan(10, (a, e) => a + e)).iteratesAs(10);
    assertThat(seq([1]).scan(10, (a, e) => a + e)).iteratesAs(10, 11);
    assertThat(seq([1, 2]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13);
    assertThat(seq([1, 2, 3]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13, 16);
});

suite.test("concat", () => {
    assertThat(seq([]).concat([])).iteratesAs();
    assertThat(seq([1]).concat([])).iteratesAs(1);
    assertThat(seq([]).concat([2])).iteratesAs(2);
    assertThat(seq([3]).concat([4])).iteratesAs(3, 4);
    assertThat(seq([5, 6]).concat([7, 8])).iteratesAs(5, 6, 7, 8);
});

suite.test("withOverlayedItem", () => {
    let f = "abc";

    // Negative index check happens at wrap-time.
    assertThrows(() => seq([]).withOverlayedItem(-1, f));
    assertThrows(() => seq([1]).withOverlayedItem(-1, f));

    // Past-end-of-sequence exception thrown only at iteration-time, and happens right away for arrays.
    assertThat(seq([]).withOverlayedItem(100, f)).isNotEqualTo(null);
    assertThrows(() => seq([]).withOverlayedItem(0, f).toArray());
    assertThrows(() => seq([]).withOverlayedItem(1, f).toArray());
    assertThrows(() => seq([1]).withOverlayedItem(1, f).toArray());
    assertThrows(() => seq([1, 2, 3]).withOverlayedItem(3, f).toArray());
    assertThrows(() => seq([1, 2, 3]).withOverlayedItem(3, f).take(1).toArray());
    assertThrows(() => seq(function*() { yield "a"; }).withOverlayedItem(1, f).toArray());

    assertThat(seq([1]).withOverlayedItem(0, f)).iteratesAs("abc");
    assertThat(seq([1, 2]).withOverlayedItem(0, f)).iteratesAs("abc", 2);
    assertThat(seq([1, 2]).withOverlayedItem(1, f)).iteratesAs(1, "abc");
    assertThat(seq([1, 2, 3]).withOverlayedItem(0, f)).iteratesAs("abc", 2, 3);
    assertThat(seq([1, 2, 3]).withOverlayedItem(1, f)).iteratesAs(1, "abc", 3);
    assertThat(seq([1, 2, 3]).withOverlayedItem(2, f)).iteratesAs(1, 2, "abc");
});

suite.test("withTransformedItem", () => {
    let f = e => e + "a";

    // Negative index check happens at wrap-time.
    assertThrows(() => seq([]).withTransformedItem(-1, f));
    assertThrows(() => seq([1]).withTransformedItem(-1, f));

    // Past-end-of-sequence exception thrown only at iteration-time, and happens right away for arrays.
    assertThat(seq([]).withTransformedItem(100, f)).isNotEqualTo(null);
    assertThrows(() => seq([]).withTransformedItem(0, f).toArray());
    assertThrows(() => seq([]).withTransformedItem(1, f).toArray());
    assertThrows(() => seq([1]).withTransformedItem(1, f).toArray());
    assertThrows(() => seq([1, 2, 3]).withTransformedItem(3, f).toArray());
    assertThrows(() => seq([1, 2, 3]).withTransformedItem(3, f).take(1).toArray());
    assertThrows(() => seq(function*() { yield "a"; }).withTransformedItem(1, f).toArray());

    assertThat(seq([1]).withTransformedItem(0, f)).iteratesAs("1a");
    assertThat(seq([1, 2]).withTransformedItem(0, f)).iteratesAs("1a", 2);
    assertThat(seq([1, 2]).withTransformedItem(1, f)).iteratesAs(1, "2a");
    assertThat(seq([1, 2, 3]).withTransformedItem(0, f)).iteratesAs("1a", 2, 3);
    assertThat(seq([1, 2, 3]).withTransformedItem(1, f)).iteratesAs(1, "2a", 3);
    assertThat(seq([1, 2, 3]).withTransformedItem(2, f)).iteratesAs(1, 2, "3a");
});

suite.test("withInsertedItem", () => {
    let f = "abc";

    // Negative index check happens at wrap-time.
    assertThrows(() => seq([]).withInsertedItem(-1, f));
    assertThrows(() => seq([1]).withInsertedItem(-1, f));
    assertThrows(() => seq([1, 2, 3]).withInsertedItem(-1, f));

    // Past-end-of-sequence exception thrown only at iteration-time, and happens right away for arrays.
    assertThat(seq([]).withInsertedItem(100, f)).isNotEqualTo(null);
    assertThrows(() => seq([]).withInsertedItem(1, f).toArray());
    assertThrows(() => seq([1]).withInsertedItem(2, f).toArray());
    assertThrows(() => seq([1, 2, 3]).withInsertedItem(4, f).toArray());
    assertThrows(() => seq([1, 2, 3]).withInsertedItem(4, f).take(1).toArray());
    assertThrows(() => seq(function*() { yield "a"; }).withInsertedItem(2, f).toArray());

    assertThat(seq([]).withInsertedItem(0, f)).iteratesAs("abc");
    assertThat(seq([1]).withInsertedItem(0, f)).iteratesAs("abc", 1);
    assertThat(seq([1]).withInsertedItem(1, f)).iteratesAs(1, "abc");
    assertThat(seq([1, 2]).withInsertedItem(0, f)).iteratesAs("abc", 1, 2);
    assertThat(seq([1, 2]).withInsertedItem(1, f)).iteratesAs(1, "abc", 2);
    assertThat(seq([1, 2]).withInsertedItem(2, f)).iteratesAs(1, 2, "abc");
    assertThat(seq([1, 2, 3]).withInsertedItem(0, f)).iteratesAs("abc", 1, 2, 3);
    assertThat(seq([1, 2, 3]).withInsertedItem(1, f)).iteratesAs(1, "abc", 2, 3);
    assertThat(seq([1, 2, 3]).withInsertedItem(2, f)).iteratesAs(1, 2, "abc", 3);
    assertThat(seq([1, 2, 3]).withInsertedItem(3, f)).iteratesAs(1, 2, 3, "abc");
});

suite.test("takeWhile", () => {
    assertThat(seq([]).takeWhile(() => { throw new Error(); })).iteratesAs();

    assertThat(seq([1]).takeWhile(e => e % 2 === 1)).iteratesAs(1);
    assertThat(seq([2]).takeWhile(e => e % 2 === 1)).iteratesAs();

    assertThat(seq([1, 3]).takeWhile(e => e % 2 === 1)).iteratesAs(1, 3);
    assertThat(seq([1, 4]).takeWhile(e => e % 2 === 1)).iteratesAs(1);
    assertThat(seq([2, 3]).takeWhile(e => e % 2 === 1)).iteratesAs();
    assertThat(seq([2, 4]).takeWhile(e => e % 2 === 1)).iteratesAs();

    assertThat(seq([1, 3, 5, 2, 4, 7]).takeWhile(e => e % 2 === 1)).iteratesAs(1, 3, 5);
});

suite.test("skipWhile", () => {
    assertThat(seq([]).skipWhile(() => { throw new Error(); })).iteratesAs();

    assertThat(seq([1]).skipWhile(e => e % 2 === 1)).iteratesAs();
    assertThat(seq([2]).skipWhile(e => e % 2 === 1)).iteratesAs(2);

    assertThat(seq([1, 3]).skipWhile(e => e % 2 === 1)).iteratesAs();
    assertThat(seq([1, 4]).skipWhile(e => e % 2 === 1)).iteratesAs(4);
    assertThat(seq([2, 3]).skipWhile(e => e % 2 === 1)).iteratesAs(2, 3);
    assertThat(seq([2, 4]).skipWhile(e => e % 2 === 1)).iteratesAs(2, 4);

    assertThat(seq([1, 3, 5, 2, 4, 7]).skipWhile(e => e % 2 === 1)).iteratesAs(2, 4, 7);
});

suite.test("skipTailWhile", () => {
    assertThat(seq([]).skipTailWhile(() => { throw new Error(); })).iteratesAs();

    assertThat(seq([1]).skipTailWhile(e => e % 2 === 1)).iteratesAs();
    assertThat(seq([2]).skipTailWhile(e => e % 2 === 1)).iteratesAs(2);

    assertThat(seq([1, 3]).skipTailWhile(e => e % 2 === 1)).iteratesAs();
    assertThat(seq([1, 4]).skipTailWhile(e => e % 2 === 1)).iteratesAs(1, 4);
    assertThat(seq([2, 3]).skipTailWhile(e => e % 2 === 1)).iteratesAs(2);
    assertThat(seq([2, 4]).skipTailWhile(e => e % 2 === 1)).iteratesAs(2, 4);

    assertThat(seq([1, 3, 5, 2, 4, 7]).skipTailWhile(e => e % 2 === 1)).iteratesAs(1, 3, 5, 2, 4);
});

suite.test("take", () => {
    assertThrows(() => seq([]).take(-1));

    assertThat(seq([]).take(0)).iteratesAs();
    assertThat(seq([]).take(1)).iteratesAs();
    assertThat(seq([]).take(2)).iteratesAs();
    assertThat(seq([1]).take(0)).iteratesAs();
    assertThat(seq([1]).take(1)).iteratesAs(1);
    assertThat(seq([1]).take(2)).iteratesAs(1);
    assertThat(seq([1, 2]).take(0)).iteratesAs();
    assertThat(seq([1, 2]).take(1)).iteratesAs(1);
    assertThat(seq([1, 2]).take(2)).iteratesAs(1, 2);
    assertThat(seq([1, 2, 3]).take(0)).iteratesAs();
    assertThat(seq([1, 2, 3]).take(1)).iteratesAs(1);
    assertThat(seq([1, 2, 3]).take(2)).iteratesAs(1, 2);
    assertThat(seq([1, 2, 3]).take(3)).iteratesAs(1, 2, 3);
    assertThat(seq([1, 2, 3]).take(1000)).iteratesAs(1, 2, 3);
});

suite.test("concat", () => {
    assertThrows(() => seq([]).skip(-1));

    assertThat(seq([]).skip(0)).iteratesAs();
    assertThat(seq([3]).skip(0)).iteratesAs(3);
    assertThat(seq([4, 5]).skip(0)).iteratesAs(4, 5);
    assertThat(seq([6, 7, 8]).skip(0)).iteratesAs(6, 7, 8);

    assertThat(seq([]).skip(1)).iteratesAs();
    assertThat(seq([3]).skip(1)).iteratesAs();
    assertThat(seq([4, 5]).skip(1)).iteratesAs(5);
    assertThat(seq([6, 7, 8]).skip(1)).iteratesAs(7, 8);

    assertThat(seq([]).skip(2)).iteratesAs();
    assertThat(seq([3]).skip(2)).iteratesAs();
    assertThat(seq([4, 5]).skip(2)).iteratesAs();
    assertThat(seq([6, 7, 8]).skip(2)).iteratesAs(8);
});

suite.test("reverse", () => {
    assertThat(seq([]).reverse()).iteratesAs();
    assertThat(seq([1]).reverse()).iteratesAs(1);
    assertThat(seq([1, 2]).reverse()).iteratesAs(2, 1);
    assertThat(seq(["a", "b", "c"]).reverse()).iteratesAs("c", "b", "a");
    assertThat(seq("12345").reverse()).iteratesAs("5", "4", "3", "2", "1");
});

suite.test("distinctBy", () => {
    assertThat(seq([]).distinctBy(() => { throw new Error(); })).iteratesAs();
    assertThat(seq(["abc"]).distinctBy(e => e)).iteratesAs("abc");

    assertThat(seq([1, 1]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(seq([1, 2]).distinctBy(e => e % 2)).iteratesAs(1, 2);
    assertThat(seq([1, 3]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(seq([1, 1]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(seq([2, 1]).distinctBy(e => e % 2)).iteratesAs(2, 1);
    assertThat(seq([3, 1]).distinctBy(e => e % 2)).iteratesAs(3);

    assertThat(seq([1, 1, 1]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(seq([2, 5, 3]).distinctBy(e => e % 2)).iteratesAs(2, 5);
    assertThat(seq([3, 2, 5]).distinctBy(e => e % 2)).iteratesAs(3, 2);
    assertThat(seq([4, 6, 7]).distinctBy(e => e % 2)).iteratesAs(4, 7);
    assertThat(seq([5, 3, 2]).distinctBy(e => e % 2)).iteratesAs(5, 2);
    assertThat(seq([6, 7, 4]).distinctBy(e => e % 2)).iteratesAs(6, 7);
    assertThat(seq([7, 4, 6]).distinctBy(e => e % 2)).iteratesAs(7, 4);
    assertThat(seq([8, 8, 8]).distinctBy(e => e % 2)).iteratesAs(8);
});

suite.test("distinct", () => {
    assertThat(seq([]).distinct()).iteratesAs();
    assertThat(seq(["abc"]).distinct()).iteratesAs("abc");
    assertThat(seq(["a", "b", "a"]).distinct()).iteratesAs("a", "b");
    assertThat(seq(["a", "a", "c", "c", "d", "c"]).distinct()).iteratesAs("a", "c", "d");
});

suite.test("flatten", () => {
    assertThat(seq([]).flatten()).iteratesAs();
    assertThat(seq([[]]).flatten()).iteratesAs();
    assertThat(seq([[], []]).flatten()).iteratesAs();

    assertThat(seq([["a"], []]).flatten()).iteratesAs("a");
    assertThat(seq([[], ["b"]]).flatten()).iteratesAs("b");
    assertThat(seq([["a"], ["b"]]).flatten()).iteratesAs("a", "b");

    assertThat(seq([[1, 2, 3], ["a", "b"], "cd"]).flatten()).iteratesAs(1, 2, 3, "a", "b", "c", "d");
});

suite.test("single", () => {
    assertThrows(() => seq([]).single());
    assertThat(seq([]).single("abc")).isEqualTo("abc");

    assertThat(seq([11]).single("abc")).isEqualTo(11);
    assertThat(seq([11]).single()).isEqualTo(11);

    assertThrows(() => seq([2, 3]).single());
    assertThat(seq([2, 3]).single("abc")).isEqualTo("abc");
});

suite.test("first", () => {
    assertThrows(() => seq([]).first());
    assertThat(seq([]).first("abc")).isEqualTo("abc");

    assertThat(seq([11]).first("abc")).isEqualTo(11);
    assertThat(seq([11]).first()).isEqualTo(11);

    assertThat(seq([2, 3]).first()).isEqualTo(2);
    assertThat(seq([2, 3]).first("abc")).isEqualTo(2);
});

suite.test("last", () => {
    assertThrows(() => seq([]).last());
    assertThat(seq([]).last("abc")).isEqualTo("abc");

    assertThat(seq([11]).last("abc")).isEqualTo(11);
    assertThat(seq([11]).last()).isEqualTo(11);

    assertThat(seq([2, 3]).last()).isEqualTo(3);
    assertThat(seq([2, 3]).last("abc")).isEqualTo(3);
});

suite.test("tryPeekCount", () => {
    assertThat(seq([]).tryPeekCount()).isEqualTo(0);
    assertThat(seq([11]).tryPeekCount()).isEqualTo(1);
    assertThat(seq([11, 12]).tryPeekCount()).isEqualTo(2);
    assertThat(seq([11, 12, 13]).tryPeekCount()).isEqualTo(3);
    assertThat(seq([11, 12, 13, 4, 5, 6]).count()).isEqualTo(6);

    assertThat(seq(new Map()).tryPeekCount()).isEqualTo(0);
    assertThat(seq(new Map([["a", "b"]])).tryPeekCount()).isEqualTo(1);

    assertThat(seq(new Set()).tryPeekCount()).isEqualTo(0);
    assertThat(seq(new Set("a")).tryPeekCount()).isEqualTo(1);

    assertThat(seq(new Float32Array([1, 2, 3])).tryPeekCount()).isEqualTo(3);

    assertThat(seq([11, 12, 13]).map(e => e + 1).tryPeekCount()).isEqualTo(undefined);
    assertThat(Seq.fromGenerator(function*() {}).tryPeekCount()).isEqualTo(undefined);
    assertThat(Seq.fromGenerator(function*() { yield "a"; }).tryPeekCount()).isEqualTo(undefined);
    assertThat(Seq.fromGenerator(function*() { yield "a"; yield "b"; }).tryPeekCount()).isEqualTo(undefined);
});

suite.test("count", () => {
    assertThat(seq([]).count()).isEqualTo(0);
    assertThat(seq([11]).count()).isEqualTo(1);
    assertThat(seq([11, 12]).count()).isEqualTo(2);
    assertThat(seq([11, 12, 13]).count()).isEqualTo(3);
    assertThat(seq([11, 12, 13, 4, 5, 6]).count()).isEqualTo(6);

    assertThat(seq(new Map()).count()).isEqualTo(0);
    assertThat(seq(new Map([["a", "b"]])).count()).isEqualTo(1);

    assertThat(seq(new Set()).count()).isEqualTo(0);
    assertThat(seq(new Set("a")).count()).isEqualTo(1);

    assertThat(seq(new Float32Array([1, 2, 3])).count()).isEqualTo(3);

    assertThat(seq([11, 12, 13]).map(e => e + 1).count()).isEqualTo(3);
    assertThat(Seq.fromGenerator(function*() {}).count()).isEqualTo(0);
    assertThat(Seq.fromGenerator(function*() { yield "a"; }).count()).isEqualTo(1);
    assertThat(Seq.fromGenerator(function*() { yield "a"; yield "b"; }).count()).isEqualTo(2);
});

suite.test("padded", () => {
    assertThat(seq([]).padded(0, "a")).iteratesAs();
    assertThat(seq([]).padded(1, "a")).iteratesAs("a");
    assertThat(seq([]).padded(2, "a")).iteratesAs("a", "a");
    assertThat(seq([]).padded(3, "a")).iteratesAs("a", "a", "a");
    assertThat(seq([]).padded(3)).iteratesAs(undefined, undefined, undefined);

    assertThat(seq([2]).padded(0, "a")).iteratesAs(2);
    assertThat(seq([2]).padded(1, "a")).iteratesAs(2);
    assertThat(seq([2]).padded(2, "a")).iteratesAs(2, "a");
    assertThat(seq([2]).padded(3, "a")).iteratesAs(2, "a", "a");

    assertThat(seq([2, 3]).padded(0, "a")).iteratesAs(2, 3);
    assertThat(seq([2, 3]).padded(1, "a")).iteratesAs(2, 3);
    assertThat(seq([2, 3]).padded(2, "a")).iteratesAs(2, 3);
    assertThat(seq([2, 3]).padded(3, "a")).iteratesAs(2, 3, "a");

    assertThat(seq([2, 3, 5]).padded(0, "a")).iteratesAs(2, 3, 5);
    assertThat(seq([2, 3, 5]).padded(1, "a")).iteratesAs(2, 3, 5);
    assertThat(seq([2, 3, 5]).padded(2, "a")).iteratesAs(2, 3, 5);
    assertThat(seq([2, 3, 5]).padded(3, "a")).iteratesAs(2, 3, 5);
});

suite.test("ifThen", () => {
    assertThat(seq([1, 2, 3]).ifThen(false, s => [4, 5, 6])).iteratesAs(1, 2, 3);
    assertThat(seq([1, 2, 3]).ifThen(true, s => [4, 5, 6])).iteratesAs(4, 5, 6);

    assertThat(seq([1, 2, 3]).ifThen(false, s => s.map(e => e * 2))).iteratesAs(1, 2, 3);
    assertThat(seq([1, 2, 3]).ifThen(true, s => s.map(e => e * 2))).iteratesAs(2, 4, 6);
});

suite.test("partitioned", () => {
    assertThrows(() => seq([]).partitioned(-1));
    assertThrows(() => seq([]).partitioned(0));

    assertThat(seq([]).partitioned(1)).iteratesAs();

    assertThat(seq(["a"]).partitioned(1)).iteratesAs(["a"]);
    assertThat(seq(["a"]).partitioned(2)).iteratesAs(["a"]);

    assertThat(seq(["a", "b"]).partitioned(1)).iteratesAs(["a"], ["b"]);
    assertThat(seq(["a", "b"]).partitioned(2)).iteratesAs(["a", "b"]);
    assertThat(seq(["a", "b"]).partitioned(3)).iteratesAs(["a", "b"]);

    assertThat(seq(["a", "b", "c"]).partitioned(1)).iteratesAs(["a"], ["b"], ["c"]);
    assertThat(seq(["a", "b", "c"]).partitioned(2)).iteratesAs(["a", "b"], ["c"]);
    assertThat(seq(["a", "b", "c"]).partitioned(3)).iteratesAs(["a", "b", "c"]);

    assertThat(seq(["a", "b", "c", "d"]).partitioned(1)).iteratesAs(["a"], ["b"], ["c"], ["d"]);
    assertThat(seq(["a", "b", "c", "d"]).partitioned(2)).iteratesAs(["a", "b"], ["c", "d"]);
    assertThat(seq(["a", "b", "c", "d"]).partitioned(3)).iteratesAs(["a", "b", "c"], ["d"]);
    assertThat(seq(["a", "b", "c", "d"]).partitioned(4)).iteratesAs(["a", "b", "c", "d"]);
});

suite.test("toMap", () => {
    assertThat(seq([]).toMap(() => { throw new Error(); }, () => { throw new Error(); })).isEqualTo(new Map());
    assertThat(seq([2]).toMap(e => e * e, e => e)).isEqualTo(new Map([[4, 2]]));
    assertThat(seq([2, 3, 4]).toMap(e => e, e => e * e)).isEqualTo(new Map([[2, 4], [3, 9], [4, 16]]));
});

suite.test("groupBy", () => {
    assertThat(seq([]).groupBy(() => { throw new Error(); })).isEqualTo(new Map());

    assertThat(seq([32]).groupBy(e => e % 3)).isEqualTo(new Map([[2, [32]]]));
    assertThat(seq([32, 2]).groupBy(e => e % 3)).isEqualTo(new Map([[2, [32, 2]]]));
    assertThat(seq([32, 2, 62]).groupBy(e => e % 3)).isEqualTo(new Map([[2, [32, 2, 62]]]));

    assertThat(seq([32, 3]).groupBy(e => e % 3)).isEqualTo(new Map([[0, [3]], [2, [32]]]));
    assertThat(seq([32, 3, 63]).groupBy(e => e % 3)).isEqualTo(new Map([[0, [3, 63]], [2, [32]]]));

    assertThat(seq([1, 2, 3]).groupBy(e => e % 3)).isEqualTo(new Map([[0, [3]], [1, [1]], [2, [2]]]));
    assertThat(seq([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).groupBy(e => e % 3)).isEqualTo(new Map([
        [0, [0, 3, 6, 9]],
        [1, [1, 4, 7, 10]],
        [2, [2, 5, 8]]]));
});

suite.test("breadthFirstSearch", () => {
    assertThat(seq([]).breadthFirstSearch(() => { throw new Error(); }, () => { throw new Error(); })).iteratesAs();
    assertThat(seq([1, 4]).breadthFirstSearch(e => [])).iteratesAs(
        1, 4);
    assertThat(seq([1, 4]).breadthFirstSearch(e => e >= 5 ? [] : [e*2, e*2+1])).iteratesAs(
        1, 4, 2, 3, 8, 9, 5, 6, 7);
    assertThat(seq([1, 4]).breadthFirstSearch(e => e >= 10 ? [] : [e*2, e*2+1])).iteratesAs(
        1, 4, 2, 3, 8, 9, 5, 6, 7, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15);
    assertThat(seq([1, 4]).breadthFirstSearch(e => e >= 10 ? [] : [e*2, e*2+1], e => e % 3)).iteratesAs(
        1, 2, 3);
});

suite.test("sorted", () => {
    assertThat(seq([]).sorted()).isEqualTo([]);
    assertThat(seq([1]).sorted()).isEqualTo([1]);
    assertThat(seq([1, 2]).sorted()).isEqualTo([1, 2]);
    assertThat(seq([2, 1]).sorted()).isEqualTo([1, 2]);
    assertThat(seq([1, 2, 3]).sorted()).isEqualTo([1, 2, 3]);
    assertThat(seq([3, 1, 2]).sorted()).isEqualTo([1, 2, 3]);
    assertThat(seq([3, 2, 1]).sorted()).isEqualTo([1, 2, 3]);
    assertThat(seq([-Infinity, Infinity, 3, 2, 1]).sorted()).isEqualTo([-Infinity, 1, 2, 3, Infinity]);
    assertThat(seq(["d", "a", "c", "b"]).sorted()).isEqualTo(["a", "b", "c", "d"]);
    assertThat(seq(["one", "two", "three"]).sorted()).isEqualTo(["one", "three", "two"]);
});

suite.test("sortedBy", () => {
    assertThat(seq([]).sortedBy(e => e % 5)).isEqualTo([]);
    assertThat(seq([1]).sortedBy(e => e % 5)).isEqualTo([1]);
    assertThat(seq([1, 2]).sortedBy(e => e % 5)).isEqualTo([1, 2]);
    assertThat(seq([2, 1]).sortedBy(e => e % 5)).isEqualTo([1, 2]);
    assertThat(seq([1, 5]).sortedBy(e => e % 5)).isEqualTo([5, 1]);
    assertThat(seq([5, 1]).sortedBy(e => e % 5)).isEqualTo([5, 1]);
});

suite.test("stride", () => {
    assertThat(seq([]).stride(1)).isEqualTo([]);
    assertThat(seq([]).stride(2)).isEqualTo([]);
    assertThat(seq([]).stride(3)).isEqualTo([]);

    assertThat(seq(["a"]).stride(1)).isEqualTo(["a"]);
    assertThat(seq(["a"]).stride(2)).isEqualTo(["a"]);
    assertThat(seq(["a"]).stride(3)).isEqualTo(["a"]);

    assertThat(seq(["a", "b"]).stride(1)).isEqualTo(["a", "b"]);
    assertThat(seq(["a", "b"]).stride(2)).isEqualTo(["a"]);
    assertThat(seq(["a", "b"]).stride(3)).isEqualTo(["a"]);

    assertThat(seq(["a", "b", "c"]).stride(1)).isEqualTo(["a", "b", "c"]);
    assertThat(seq(["a", "b", "c"]).stride(2)).isEqualTo(["a", "c"]);
    assertThat(seq(["a", "b", "c"]).stride(3)).isEqualTo(["a"]);

    assertThat(seq(["a", "b", "c", "d"]).stride(1)).isEqualTo(["a", "b", "c", "d"]);
    assertThat(seq(["a", "b", "c", "d"]).stride(2)).isEqualTo(["a", "c"]);
    assertThat(seq(["a", "b", "c", "d"]).stride(3)).isEqualTo(["a", "d"]);

    assertThat(seq(["a", "b", "c", "d", "e"]).stride(1)).isEqualTo(["a", "b", "c", "d", "e"]);
    assertThat(seq(["a", "b", "c", "d", "e"]).stride(2)).isEqualTo(["a", "c", "e"]);
    assertThat(seq(["a", "b", "c", "d", "e"]).stride(3)).isEqualTo(["a", "d"]);

    assertThat(seq(["a", "b", "c", "d", "e", "f"]).stride(1)).isEqualTo(["a", "b", "c", "d", "e", "f"]);
    assertThat(seq(["a", "b", "c", "d", "e", "f"]).stride(2)).isEqualTo(["a", "c", "e"]);
    assertThat(seq(["a", "b", "c", "d", "e", "f"]).stride(3)).isEqualTo(["a", "d"]);

    assertThat(seq(["a", "b", "c", "d", "e", "f", "g"]).stride(1)).isEqualTo(["a", "b", "c", "d", "e", "f", "g"]);
    assertThat(seq(["a", "b", "c", "d", "e", "f", "g"]).stride(2)).isEqualTo(["a", "c", "e", "g"]);
    assertThat(seq(["a", "b", "c", "d", "e", "f", "g"]).stride(3)).isEqualTo(["a", "d", "g"]);

    assertThat(Seq.range(100).stride(10)).isEqualTo(Seq.range(10).map(e => e*10));
});

suite.test("segmentBy", () => {
    assertThat(seq([]).segmentBy(() => { throw new Error(); })).iteratesAs();
    assertThat(seq([1]).segmentBy(e => e + 1)).iteratesAs([1]);
    assertThat(seq([2, 3, 5, 7, 11, 13]).segmentBy(e => e % 4)).iteratesAs([2], [3], [5], [7, 11], [13]);
    assertThat(seq([1, 2, 3, 4, 5, 6, 7, 8, 9]).segmentBy(e => e >> 2)).
        iteratesAs([1, 2, 3], [4, 5, 6, 7], [8, 9]);
    assertThat(seq([1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3]).segmentBy(e => e >> 2)).
        iteratesAs([1, 2, 3], [4, 5, 6, 7], [8, 9], [1, 2, 3]);
});
