import { assertThat, assertThrows } from "test/TestUtil.js"
import Seq from "src/base/Seq.js"

let SeqTest = TestCase("SeqTest");

SeqTest.prototype.testWrap_Array = () => {
    assertThat(new Seq([])).iteratesAs();
    assertThat(new Seq(["a"])).iteratesAs("a");
    assertThat(new Seq(["a", "b", 3])).iteratesAs("a", "b", 3);
};

SeqTest.prototype.testWrap_OtherArrays = () => {
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

SeqTest.prototype.testWrap_RawGeneratorSinglePass = () => {
    let seq = new Seq(function*() {
        yield 1;
        yield 2;
    }());

    assertThat(seq).iteratesAs(1, 2);
    // now the generator is used up and would iterate as []...
};

SeqTest.prototype.testFromGenerator_MultipleUses = () => {
    let seq = Seq.fromGenerator(function*() {
        yield 1;
        yield 2;
    });

    assertThat(seq).iteratesAs(1, 2);
    assertThat(seq).iteratesAs(1, 2);
    assertThat(seq).iteratesAs(1, 2);
};

SeqTest.prototype.testIsEqualTo = () => {
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

SeqTest.prototype.testToArray = () => {
    let a0 = Seq.fromGenerator(function*() {}).toArray();
    assertTrue(Array.isArray(a0));
    assertThat(a0).isEqualTo([]);

    let a2 = Seq.fromGenerator(function*() { yield 1; yield "a"; }).toArray();
    assertTrue(Array.isArray(a2));
    assertThat(a2).isEqualTo([1, "a"]);
};

SeqTest.prototype.testJoin = () => {
    assertThat(new Seq([]).join("||")).isEqualTo("");
    assertThat(new Seq([1]).join("||")).isEqualTo("1");
    assertThat(new Seq([1, 2]).join("||")).isEqualTo("1||2");
    assertThat(new Seq([1, 2, 3]).join("||")).isEqualTo("1||2||3");
};

SeqTest.prototype.testToString = () => {
    assertThat(new Seq([]).toString()).isEqualTo("[]");
    assertThat(new Seq([1]).toString()).isEqualTo("[1]");
    assertThat(new Seq([1, 2]).toString()).isEqualTo("[1, 2]");
    assertThat(new Seq([1, 2, 3]).toString()).isEqualTo("[1, 2, 3]");
};

SeqTest.prototype.testRange = () => {
    assertThrows(() => Seq.range(-1));

    assertThat(Seq.range(0)).iteratesAs();
    assertThat(Seq.range(1)).iteratesAs(0);
    assertThat(Seq.range(2)).iteratesAs(0, 1);
    assertThat(Seq.range(3)).iteratesAs(0, 1, 2);
    assertThat(Seq.range(10)).iteratesAs(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
};

SeqTest.prototype.testNaturals = () => {
    let n = 0;
    for (let i of Seq.naturals()) {
        assertThat(i).isEqualTo(n);
        n++;
        if (n > 1000) {
            break;
        }
    }
};

SeqTest.prototype.testRepeat = () => {
    assertThrows(() => Seq.repeat("a", -1));

    assertThat(Seq.repeat("a", 0)).iteratesAs();
    assertThat(Seq.repeat("a", 1)).iteratesAs("a");
    assertThat(Seq.repeat("a", 2)).iteratesAs("a", "a");
    assertThat(Seq.repeat(1.5, 5)).iteratesAs(1.5, 1.5, 1.5, 1.5, 1.5);
};

SeqTest.prototype.testSolidify = () => {
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

SeqTest.prototype.testMap = () => {
    assertThat(new Seq([]).map(e => e + 1)).iteratesAs();
    assertThat(new Seq([1]).map(e => e + 1)).iteratesAs(2);
    assertThat(new Seq([1, 2]).map(e => e + 1)).iteratesAs(2, 3);
    assertThat(new Seq([3, 1, 2]).map(e => e * 2)).iteratesAs(6, 2, 4);
};

SeqTest.prototype.testFilter = () => {
    assertThat(new Seq([]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(new Seq([1]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(new Seq([2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(new Seq([1, 2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(new Seq([2, 0, 1, 4]).filter(e => e % 2 === 0)).iteratesAs(2, 0, 4);
    assertThat(new Seq([2, 0, 1, 4]).filter(e => e % 2 === 1)).iteratesAs(1);
};

SeqTest.prototype.testFold = () => {
    assertThrows(() => new Seq([]).fold((e1, e2) => undefined));
    assertThat(new Seq([]).fold(() => { throw new Error(); }, "abc")).isEqualTo("abc");

    assertThat(new Seq([1]).fold(() => { throw new Error(); })).isEqualTo(1);

    assertThat(new Seq([1, 2]).fold((e1, e2) => e1 + e2)).isEqualTo(3);
    assertThat(new Seq([1, 2, 3]).fold((e1, e2) => e1 + e2)).isEqualTo(6);
    assertThat(new Seq([1, 2, 3, 4]).fold((e1, e2) => e1 + e2)).isEqualTo(10);
    assertThat(new Seq([1, 2, 3, 4]).fold((e1, e2) => e1 * e2)).isEqualTo(24);
};

SeqTest.prototype.testAggregate = () => {
    assertThat(new Seq([]).aggregate("abc", () => { throw new Error(); })).isEqualTo("abc");
    assertThat(new Seq([1]).aggregate(-1, (a, e) => a + e)).isEqualTo(0);
    assertThat(new Seq([1, 2]).aggregate(-1, (a, e) => a + e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).aggregate(-3, (a, e) => a + e)).isEqualTo(0);
    assertThat(new Seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * e)).isEqualTo(-24);
    assertThat(new Seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * 2 + e)).isEqualTo(10);
    assertThat(new Seq([1, 2, 3, 4]).aggregate("x", (a, e) => a + "," + e)).isEqualTo("x,1,2,3,4");
};

SeqTest.prototype.testZip = () => {
    assertThat(new Seq([]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([1]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([]).zip([1], () => { throw new Error(); })).iteratesAs();

    assertThat(new Seq(["a"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a", "b"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a", "b"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2", "b3");
};

SeqTest.prototype.testMax = () => {
    assertThrows(() => new Seq([]).max());
    assertThat(new Seq([]).max("abc")).isEqualTo("abc");
    assertThat(new Seq([1]).max("abc")).isEqualTo(1);
    assertThat(new Seq([1]).max()).isEqualTo(1);
    assertThat(new Seq([1, 2]).max()).isEqualTo(2);
    assertThat(new Seq([2, 1]).max()).isEqualTo(2);
    assertThat(new Seq([2, 1, -5, 102, -3, 4]).max()).isEqualTo(102);
    assertThat(new Seq(["a", "c", "b"]).max()).isEqualTo("c");
};

SeqTest.prototype.testMin = () => {
    assertThrows(() => new Seq([]).min());
    assertThat(new Seq([]).min("abc")).isEqualTo("abc");
    assertThat(new Seq([1]).min("abc")).isEqualTo(1);
    assertThat(new Seq([1]).min()).isEqualTo(1);
    assertThat(new Seq([1, 2]).min()).isEqualTo(1);
    assertThat(new Seq([2, 1]).min()).isEqualTo(1);
    assertThat(new Seq([2, 1, -5, 102, -3, 4]).min()).isEqualTo(-5);
    assertThat(new Seq(["a", "c", "b"]).min()).isEqualTo("a");
};

SeqTest.prototype.testMaxBy = () => {
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

SeqTest.prototype.testMinBy = () => {
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

SeqTest.prototype.testAny = () => {
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

SeqTest.prototype.testEvery = () => {
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

SeqTest.prototype.testContains = () => {
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

SeqTest.prototype.testSum = () => {
    assertThat(new Seq([]).sum()).isEqualTo(0);
    assertThat(new Seq([11]).sum()).isEqualTo(11);
    assertThat(new Seq([1, 2]).sum()).isEqualTo(3);
    assertThat(new Seq([1, 2, 3, 4]).sum()).isEqualTo(10);

    assertThat(new Seq(["abc"]).sum()).isEqualTo("abc");
    assertThat(new Seq(["a", "b"]).sum()).isEqualTo("ab");
};

SeqTest.prototype.testProduct = () => {
    assertThat(new Seq([]).product()).isEqualTo(1);
    assertThat(new Seq([11]).product()).isEqualTo(11);
    assertThat(new Seq([11, 2]).product()).isEqualTo(22);
    assertThat(new Seq([11, 2, 3, 4]).product()).isEqualTo(264);

    assertThat(new Seq(["abc"]).product()).isEqualTo("abc");
};

SeqTest.prototype.testScan = () => {
    assertThat(new Seq([]).scan("abc", (a, e) => a + e)).iteratesAs("abc");
    assertThat(new Seq([1, 2, 3]).scan("abc", (a, e) => a + e)).iteratesAs("abc", "abc1", "abc12", "abc123");

    assertThat(new Seq([]).scan(10, (a, e) => a + e)).iteratesAs(10);
    assertThat(new Seq([1]).scan(10, (a, e) => a + e)).iteratesAs(10, 11);
    assertThat(new Seq([1, 2]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13);
    assertThat(new Seq([1, 2, 3]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13, 16);
};

SeqTest.prototype.testOverlayAt = () => {
    assertThrows(() => new Seq([]).overlayAt(undefined, -1));

    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([]).overlayAt("abc", 0)).iteratesAs();
    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1]).overlayAt("abc", 0)).iteratesAs("abc");
    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1, 2]).overlayAt("abc", 0)).iteratesAs("abc", 2);

    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([]).overlayAt("abc", 1)).iteratesAs();
    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1]).overlayAt("abc", 1)).iteratesAs(1);
    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1, 2]).overlayAt("abc", 1)).iteratesAs(1, "abc");
    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1, 2, 3]).overlayAt("abc", 1)).iteratesAs(1, "abc", 3);

    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1, 2, 3]).overlayAt("abc", 2)).iteratesAs(1, 2, "abc");
    //noinspection JSCheckFunctionSignatures
    assertThat(new Seq([1, 2, 3]).overlayAt("abc", 3)).iteratesAs(1, 2, 3);
};

SeqTest.prototype.testTakeWhile = () => {
    assertThat(new Seq([]).takeWhile(() => { throw new Error(); })).iteratesAs();

    assertThat(new Seq([1]).takeWhile(e => e % 2 === 1)).iteratesAs(1);
    assertThat(new Seq([2]).takeWhile(e => e % 2 === 1)).iteratesAs();

    assertThat(new Seq([1, 3]).takeWhile(e => e % 2 === 1)).iteratesAs(1, 3);
    assertThat(new Seq([1, 4]).takeWhile(e => e % 2 === 1)).iteratesAs(1);
    assertThat(new Seq([2, 3]).takeWhile(e => e % 2 === 1)).iteratesAs();

    assertThat(new Seq([1, 3, 5, 2, 4, 7]).takeWhile(e => e % 2 === 1)).iteratesAs(1, 3, 5);
};

SeqTest.prototype.testTake = () => {
    assertThrows(() => new Seq([]).take(-1));

    assertThat(new Seq([]).take(0)).iteratesAs();
    assertThat(new Seq([]).take(1)).iteratesAs();
    assertThat(new Seq([]).take(2)).iteratesAs();
    assertThat(new Seq([1]).take(0)).iteratesAs();
    assertThat(new Seq([1]).take(1)).iteratesAs(1);
    assertThat(new Seq([1]).take(2)).iteratesAs(1);
    assertThat(new Seq([1, 2]).take(0)).iteratesAs();
    assertThat(new Seq([1, 2]).take(1)).iteratesAs(1);
    assertThat(new Seq([1, 2]).take(2)).iteratesAs(1, 2);
    assertThat(new Seq([1, 2, 3]).take(0)).iteratesAs();
    assertThat(new Seq([1, 2, 3]).take(1)).iteratesAs(1);
    assertThat(new Seq([1, 2, 3]).take(2)).iteratesAs(1, 2);
    assertThat(new Seq([1, 2, 3]).take(3)).iteratesAs(1, 2, 3);
    assertThat(new Seq([1, 2, 3]).take(1000)).iteratesAs(1, 2, 3);
};

SeqTest.prototype.testReverse = () => {
    assertThat(new Seq([]).reverse()).iteratesAs();
    assertThat(new Seq([1]).reverse()).iteratesAs(1);
    assertThat(new Seq([1, 2]).reverse()).iteratesAs(2, 1);
    assertThat(new Seq(["a", "b", "c"]).reverse()).iteratesAs("c", "b", "a");
    assertThat(new Seq("12345").reverse()).iteratesAs("5", "4", "3", "2", "1");
};

SeqTest.prototype.testDistinctBy = () => {
    assertThat(new Seq([]).distinctBy(() => { throw new Error(); })).iteratesAs();
    assertThat(new Seq(["abc"]).distinctBy(e => e)).iteratesAs("abc");

    assertThat(new Seq([1, 1]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(new Seq([1, 2]).distinctBy(e => e % 2)).iteratesAs(1, 2);
    assertThat(new Seq([1, 3]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(new Seq([1, 1]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(new Seq([2, 1]).distinctBy(e => e % 2)).iteratesAs(2, 1);
    assertThat(new Seq([3, 1]).distinctBy(e => e % 2)).iteratesAs(3);

    assertThat(new Seq([1, 1, 1]).distinctBy(e => e % 2)).iteratesAs(1);
    assertThat(new Seq([2, 5, 3]).distinctBy(e => e % 2)).iteratesAs(2, 5);
    assertThat(new Seq([3, 2, 5]).distinctBy(e => e % 2)).iteratesAs(3, 2);
    assertThat(new Seq([4, 6, 7]).distinctBy(e => e % 2)).iteratesAs(4, 7);
    assertThat(new Seq([5, 3, 2]).distinctBy(e => e % 2)).iteratesAs(5, 2);
    assertThat(new Seq([6, 7, 4]).distinctBy(e => e % 2)).iteratesAs(6, 7);
    assertThat(new Seq([7, 4, 6]).distinctBy(e => e % 2)).iteratesAs(7, 4);
    assertThat(new Seq([8, 8, 8]).distinctBy(e => e % 2)).iteratesAs(8);
};

SeqTest.prototype.testDistinct = () => {
    assertThat(new Seq([]).distinct()).iteratesAs();
    assertThat(new Seq(["abc"]).distinct()).iteratesAs("abc");
    assertThat(new Seq(["a", "b", "a"]).distinct()).iteratesAs("a", "b");
    assertThat(new Seq(["a", "a", "c", "c", "d", "c"]).distinct()).iteratesAs("a", "c", "d");
};

SeqTest.prototype.testFlatten = () => {
    assertThat(new Seq([]).flatten()).iteratesAs();
    assertThat(new Seq([[]]).flatten()).iteratesAs();
    assertThat(new Seq([[], []]).flatten()).iteratesAs();

    assertThat(new Seq([["a"], []]).flatten()).iteratesAs("a");
    assertThat(new Seq([[], ["b"]]).flatten()).iteratesAs("b");
    assertThat(new Seq([["a"], ["b"]]).flatten()).iteratesAs("a", "b");

    assertThat(new Seq([[1, 2, 3], ["a", "b"], "cd"]).flatten()).iteratesAs(1, 2, 3, "a", "b", "c", "d");
};

SeqTest.prototype.testSingle = () => {
    assertThrows(() => new Seq([]).single());
    assertThat(new Seq([]).single("abc")).isEqualTo("abc");

    assertThat(new Seq([11]).single("abc")).isEqualTo(11);
    assertThat(new Seq([11]).single()).isEqualTo(11);

    assertThrows(() => new Seq([2, 3]).single());
    assertThat(new Seq([2, 3]).single("abc")).isEqualTo("abc");
};

SeqTest.prototype.testToMap = () => {
    assertThat(new Seq([]).toMap(() => { throw new Error(); }, () => { throw new Error(); })).isEqualTo(new Map());
    assertThat(new Seq([2]).toMap(e => e * e, e => e)).isEqualTo(new Map([[4, 2]]));
    assertThat(new Seq([2, 3, 4]).toMap(e => e, e => e * e)).isEqualTo(new Map([[2, 4], [3, 9], [4, 16]]));
};
