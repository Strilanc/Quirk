import { assertThat, assertThrows } from "test/test.js"
import Seq from "src/util/seq.js"

let SeqTest = TestCase("SeqTest");

SeqTest.prototype.testWrap_Array = function() {
    assertThat(new Seq([])).iteratesAs();
    assertThat(new Seq(["a"])).iteratesAs("a");
    assertThat(new Seq(["a", "b", 3])).iteratesAs("a", "b", 3);
};

SeqTest.prototype.testWrap_OtherArrays = function() {
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
            let seq = new Seq(candidate);
            let n = 0;
            for (let e of seq) {
                assertThat(e).isEqualTo(candidate[n]);
                n++;
            }
            assertThat(n).isEqualTo(candidate.length);
        }
    }
};

SeqTest.prototype.testWrap_RawGeneratorSinglePass = function() {
    let seq = new Seq(function*() {
        yield 1;
        yield 2;
    }());

    assertThat(seq).iteratesAs(1, 2);
    // now the generator is used up and would iterate as []...
};

SeqTest.prototype.testFromGenerator_MultipleUses = function() {
    let seq = Seq.fromGenerator(function*() {
        yield 1;
        yield 2;
    });

    assertThat(seq).iteratesAs(1, 2);
    assertThat(seq).iteratesAs(1, 2);
    assertThat(seq).iteratesAs(1, 2);
};

SeqTest.prototype.testIsEqualTo = function() {
    // Cases involving other types.
    assertFalse(new Seq([]).isEqualTo(null));
    assertFalse(new Seq([]).isEqualTo("a"));
    assertFalse(new Seq([]).isEqualTo(0));
    assertTrue(new Seq(["a", "b", "c"]).isEqualTo("abc")); // because string is iterable
    assertTrue(new Seq([1, 2, 3]).isEqualTo([1, 2, 3]));
    assertFalse(new Seq([1, 2, 3]).isEqualTo([1, 2]));

    // Concrete cases.
    assertTrue(new Seq([]).isEqualTo(new Seq([])));
    assertTrue(new Seq([2.5]).isEqualTo(new Seq(new Float32Array([2.5]))));
    assertFalse(new Seq([]).isEqualTo(new Seq([1])));

    // Acts like a grouping along expected boundaries.
    var groups = [
        [new Seq([]), new Seq([]), Seq.fromGenerator(function*(){ }), new Seq(new Int32Array([]))],
        [new Seq(["a"]), new Seq(["a"]), Seq.fromGenerator(function*(){ yield "a"; })],
        [new Seq([2.5]), Seq.fromGenerator(function*(){ yield 2.5; }), new Seq(new Float32Array([2.5]))],
        [new Seq(["a", "b", "c"]), Seq.fromGenerator(function*(){ yield "a"; yield "b"; yield "c" })]
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
    assertThat(new Seq(["a"])).isEqualTo(new Seq(["a"]));
    assertThat(new Seq(["a"])).isNotEqualTo(new Seq(["a", "b"]));
    assertThat(new Seq(["a"])).isNotEqualTo(new Seq([]));
    assertThat(new Seq(["a"])).isNotEqualTo(new Seq(["b"]));
};

SeqTest.prototype.testToArray = function() {
    let a0 = Seq.fromGenerator(function*() {}).toArray();
    assertTrue(Array.isArray(a0));
    assertThat(a0).isEqualTo([]);

    let a2 = Seq.fromGenerator(function*() { yield 1; yield "a"; }).toArray();
    assertTrue(Array.isArray(a2));
    assertThat(a2).isEqualTo([1, "a"]);
};

SeqTest.prototype.testJoin = function() {
    assertThat(new Seq([]).join("||")).isEqualTo("");
    assertThat(new Seq([1]).join("||")).isEqualTo("1");
    assertThat(new Seq([1, 2]).join("||")).isEqualTo("1||2");
    assertThat(new Seq([1, 2, 3]).join("||")).isEqualTo("1||2||3");
};

SeqTest.prototype.testToString = function() {
    assertThat(new Seq([]).toString()).isEqualTo("[]");
    assertThat(new Seq([1]).toString()).isEqualTo("[1]");
    assertThat(new Seq([1, 2]).toString()).isEqualTo("[1, 2]");
    assertThat(new Seq([1, 2, 3]).toString()).isEqualTo("[1, 2, 3]");
};

SeqTest.prototype.testRange = function() {
    assertThrows(() => Seq.range(-1));

    assertThat(Seq.range(0)).iteratesAs();
    assertThat(Seq.range(1)).iteratesAs(0);
    assertThat(Seq.range(2)).iteratesAs(0, 1);
    assertThat(Seq.range(3)).iteratesAs(0, 1, 2);
    assertThat(Seq.range(10)).iteratesAs(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
};

SeqTest.prototype.testRepeat = function() {
    assertThrows(() => Seq.repeat("a", -1));

    assertThat(Seq.repeat("a", 0)).iteratesAs();
    assertThat(Seq.repeat("a", 1)).iteratesAs("a");
    assertThat(Seq.repeat("a", 2)).iteratesAs("a", "a");
    assertThat(Seq.repeat(1.5, 5)).iteratesAs(1.5, 1.5, 1.5, 1.5, 1.5);
};

SeqTest.prototype.testSolidify = function() {
    let s1 = new Seq([1, 2, 3]);
    let s2 = new Seq(new Float32Array([1, 2, 3]));
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
};

SeqTest.prototype.testMap = function() {
    assertThat(new Seq([]).map(e => e + 1)).iteratesAs();
    assertThat(new Seq([1]).map(e => e + 1)).iteratesAs(2);
    assertThat(new Seq([1, 2]).map(e => e + 1)).iteratesAs(2, 3);
    assertThat(new Seq([3, 1, 2]).map(e => e * 2)).iteratesAs(6, 2, 4);
};

SeqTest.prototype.testFilter = function() {
    assertThat(new Seq([]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(new Seq([1]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(new Seq([2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(new Seq([1, 2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(new Seq([2, 0, 1, 4]).filter(e => e % 2 === 0)).iteratesAs(2, 0, 4);
    assertThat(new Seq([2, 0, 1, 4]).filter(e => e % 2 === 1)).iteratesAs(1);
};

SeqTest.prototype.testFold = function() {
    assertThrows(() => new Seq([]).fold((e1, e2) => undefined));
    assertThat(new Seq([]).fold(() => { throw new Error(); }, "abc")).isEqualTo("abc");

    assertThat(new Seq([1]).fold(() => { throw new Error(); })).isEqualTo(1);

    assertThat(new Seq([1, 2]).fold((e1, e2) => e1 + e2)).isEqualTo(3);
    assertThat(new Seq([1, 2, 3]).fold((e1, e2) => e1 + e2)).isEqualTo(6);
    assertThat(new Seq([1, 2, 3, 4]).fold((e1, e2) => e1 + e2)).isEqualTo(10);
    assertThat(new Seq([1, 2, 3, 4]).fold((e1, e2) => e1 * e2)).isEqualTo(24);
};

SeqTest.prototype.testAggregate = function() {
    assertThat(new Seq([]).aggregate("abc", () => { throw new Error(); })).isEqualTo("abc");
    assertThat(new Seq([1]).aggregate(-1, (a, e) => a + e)).isEqualTo(0);
    assertThat(new Seq([1, 2]).aggregate(-1, (a, e) => a + e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).aggregate(-3, (a, e) => a + e)).isEqualTo(0);
    assertThat(new Seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * e)).isEqualTo(-24);
    assertThat(new Seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * 2 + e)).isEqualTo(10);
    assertThat(new Seq([1, 2, 3, 4]).aggregate("x", (a, e) => a + "," + e)).isEqualTo("x,1,2,3,4");
};

SeqTest.prototype.testZip = function() {
    assertThat(new Seq([]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([1]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([]).zip([1], () => { throw new Error(); })).iteratesAs();

    assertThat(new Seq(["a"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a", "b"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a", "b"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2", "b3");
};

SeqTest.prototype.testMax = function() {
    assertThrows(() => new Seq([]).max());
    assertThat(new Seq([]).max("abc")).isEqualTo("abc");
    assertThat(new Seq([1]).max("abc")).isEqualTo(1);
    assertThat(new Seq([1]).max()).isEqualTo(1);
    assertThat(new Seq([1, 2]).max()).isEqualTo(2);
    assertThat(new Seq([2, 1]).max()).isEqualTo(2);
    assertThat(new Seq([2, 1, -5, 102, -3, 4]).max()).isEqualTo(102);
    assertThat(new Seq(["a", "c", "b"]).max()).isEqualTo("c");
};

SeqTest.prototype.testMin = function() {
    assertThrows(() => new Seq([]).min());
    assertThat(new Seq([]).min("abc")).isEqualTo("abc");
    assertThat(new Seq([1]).min("abc")).isEqualTo(1);
    assertThat(new Seq([1]).min()).isEqualTo(1);
    assertThat(new Seq([1, 2]).min()).isEqualTo(1);
    assertThat(new Seq([2, 1]).min()).isEqualTo(1);
    assertThat(new Seq([2, 1, -5, 102, -3, 4]).min()).isEqualTo(-5);
    assertThat(new Seq(["a", "c", "b"]).min()).isEqualTo("a");
};

SeqTest.prototype.testMaxBy = function() {
    assertThrows(() => new Seq([]).maxBy(() => undefined));
    assertThat(new Seq([]).maxBy(() => undefined, "abc")).isEqualTo("abc");
    assertThat(new Seq(["abc"]).maxBy(() => { throw new Error(); })).isEqualTo("abc");

    assertThat(new Seq([1, 2]).maxBy(e => e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).maxBy(e => -e)).isEqualTo(1);
    assertThat(new Seq([1, 2]).maxBy(e => e, undefined, (e1, e2) => e1 < e2)).isEqualTo(2);
    assertThat(new Seq([1, 2]).maxBy(e => e, undefined, (e1, e2) => e1 > e2)).isEqualTo(1);
    assertThat(new Seq([-2, -1, 0, 1, 2]).maxBy(e => e*(2 - e))).isEqualTo(1);
    assertThat(new Seq([-2, -1, 0, 1, 2]).maxBy(e => e*(e - 2))).isEqualTo(-2);
};

SeqTest.prototype.testMinBy = function() {
    assertThrows(() => new Seq([]).minBy(() => undefined));
    assertThat(new Seq([]).minBy(() => undefined, "abc")).isEqualTo("abc");
    assertThat(new Seq(["abc"]).minBy(() => { throw new Error(); })).isEqualTo("abc");

    assertThat(new Seq([1, 2]).minBy(e => e)).isEqualTo(1);
    assertThat(new Seq([1, 2]).minBy(e => -e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).minBy(e => e, undefined, (e1, e2) => e1 < e2)).isEqualTo(1);
    assertThat(new Seq([1, 2]).minBy(e => e, undefined, (e1, e2) => e1 > e2)).isEqualTo(2);
    assertThat(new Seq([-2, -1, 0, 1, 2]).minBy(e => e*(2 - e))).isEqualTo(-2);
    assertThat(new Seq([-2, -1, 0, 1, 2]).minBy(e => e*(e - 2))).isEqualTo(1);
};

SeqTest.prototype.testAny = function() {
    assertFalse(new Seq([]).any(() => { throw new Error(); }));

    assertFalse(new Seq([1]).any(e => e % 3 === 0));
    assertFalse(new Seq([2]).any(e => e % 3 === 0));
    assertTrue(new Seq([3]).any(e => e % 3 === 0));

    assertFalse(new Seq([1, 1]).any(e => e % 3 === 0));
    assertFalse(new Seq([4, 2]).any(e => e % 3 === 0));
    assertTrue(new Seq([7, 3]).any(e => e % 3 === 0));
    assertFalse(new Seq([2, 1]).any(e => e % 3 === 0));
    assertFalse(new Seq([5, 2]).any(e => e % 3 === 0));
    assertTrue(new Seq([8, 3]).any(e => e % 3 === 0));
    assertTrue(new Seq([3, 1]).any(e => e % 3 === 0));
    assertTrue(new Seq([6, 2]).any(e => e % 3 === 0));
    assertTrue(new Seq([9, 3]).any(e => e % 3 === 0));

    assertFalse(new Seq([1, 4, 7, 10, 13]).any(e => e % 3 === 0));
    assertTrue(new Seq([0, 1, 2, 3, 4, 5, 6]).any(e => e % 3 === 0));
    assertTrue(new Seq([3, 6, 9, 12]).any(e => e % 3 === 0));
};

SeqTest.prototype.testEvery = function() {
    assertTrue(new Seq([]).every(() => { throw new Error(); }));

    assertFalse(new Seq([1]).every(e => e % 3 === 0));
    assertFalse(new Seq([2]).every(e => e % 3 === 0));
    assertTrue(new Seq([3]).every(e => e % 3 === 0));

    assertFalse(new Seq([1, 1]).every(e => e % 3 === 0));
    assertFalse(new Seq([4, 2]).every(e => e % 3 === 0));
    assertFalse(new Seq([7, 3]).every(e => e % 3 === 0));
    assertFalse(new Seq([2, 1]).every(e => e % 3 === 0));
    assertFalse(new Seq([5, 2]).every(e => e % 3 === 0));
    assertFalse(new Seq([8, 3]).every(e => e % 3 === 0));
    assertFalse(new Seq([3, 1]).every(e => e % 3 === 0));
    assertFalse(new Seq([6, 2]).every(e => e % 3 === 0));
    assertTrue(new Seq([9, 3]).every(e => e % 3 === 0));

    assertFalse(new Seq([1, 4, 7, 10, 13]).every(e => e % 3 === 0));
    assertFalse(new Seq([0, 1, 2, 3, 4, 5, 6]).every(e => e % 3 === 0));
    assertTrue(new Seq([3, 6, 9, 12]).every(e => e % 3 === 0));
};

SeqTest.prototype.testContains = function() {
    //noinspection JSCheckFunctionSignatures
    assertFalse(new Seq([]).contains(1));
    //noinspection JSCheckFunctionSignatures
    assertFalse(new Seq([0]).contains(1));
    //noinspection JSCheckFunctionSignatures
    assertFalse(new Seq([0]).contains(""));
    //noinspection JSCheckFunctionSignatures
    assertTrue(new Seq([1]).contains(1));
    //noinspection JSCheckFunctionSignatures
    assertFalse(new Seq([[]]).contains([]));

    //noinspection JSCheckFunctionSignatures
    assertTrue(new Seq([1, 2, 3]).contains(1));
    //noinspection JSCheckFunctionSignatures
    assertTrue(new Seq([1, 2, 3]).contains(2));
    //noinspection JSCheckFunctionSignatures
    assertTrue(new Seq([1, 2, 3]).contains(3));
    //noinspection JSCheckFunctionSignatures
    assertFalse(new Seq([1, 2, 3]).contains(4));
};

SeqTest.prototype.testSum = function() {
    assertThat(new Seq([]).sum()).isEqualTo(0);
    assertThat(new Seq([11]).sum()).isEqualTo(11);
    assertThat(new Seq([1, 2]).sum()).isEqualTo(3);
    assertThat(new Seq([1, 2, 3, 4]).sum()).isEqualTo(10);

    assertThat(new Seq(["abc"]).sum()).isEqualTo("abc");
    assertThat(new Seq(["a", "b"]).sum()).isEqualTo("ab");
};

SeqTest.prototype.testProduct = function() {
    assertThat(new Seq([]).product()).isEqualTo(1);
    assertThat(new Seq([11]).product()).isEqualTo(11);
    assertThat(new Seq([11, 2]).product()).isEqualTo(22);
    assertThat(new Seq([11, 2, 3, 4]).product()).isEqualTo(264);

    assertThat(new Seq(["abc"]).product()).isEqualTo("abc");
};

SeqTest.prototype.testScan = function() {
    assertThat(new Seq([]).scan("abc", (a, e) => a + e)).iteratesAs("abc");
    assertThat(new Seq([1, 2, 3]).scan("abc", (a, e) => a + e)).iteratesAs("abc", "abc1", "abc12", "abc123");

    assertThat(new Seq([]).scan(10, (a, e) => a + e)).iteratesAs(10);
    assertThat(new Seq([1]).scan(10, (a, e) => a + e)).iteratesAs(10, 11);
    assertThat(new Seq([1, 2]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13);
    assertThat(new Seq([1, 2, 3]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13, 16);
};
