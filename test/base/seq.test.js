import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import Seq from "src/base/Seq.js"

let suite = new Suite("Seq");

suite.test("constructor_Array", () => {
    assertThat(new Seq([])).iteratesAs();
    assertThat(new Seq(["a"])).iteratesAs("a");
    assertThat(new Seq(["a", "b", 3])).iteratesAs("a", "b", 3);
});

suite.test("constructor_OtherArrays", (status) => {
    status.warn_only = "travis-ci's version of firefox can't iterate Float32Array";

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
});

suite.test("constructor_RawGeneratorSinglePass", () => {
    let seq = new Seq(function*() {
        yield 1;
        yield 2;
    }());

    assertThat(seq).iteratesAs(1, 2);
    // now the generator is used up and would iterate as []...
});

suite.test("fromGenerator_MultipleUses", () => {
    let seq = Seq.fromGenerator(function*() {
        yield 1;
        yield 2;
    });

    assertThat(seq).iteratesAs(1, 2);
    assertThat(seq).iteratesAs(1, 2);
    assertThat(seq).iteratesAs(1, 2);
});

suite.test("isEqualTo", (status) => {
    status.warn_only = "travis-ci's version of firefox can't iterate Float32Array";

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
});

suite.test("toArray", () => {
    let a0 = Seq.fromGenerator(function*() {}).toArray();
    assertTrue(Array.isArray(a0));
    assertThat(a0).isEqualTo([]);

    let a2 = Seq.fromGenerator(function*() { yield 1; yield "a"; }).toArray();
    assertTrue(Array.isArray(a2));
    assertThat(a2).isEqualTo([1, "a"]);
});

suite.test("join", () => {
    assertThat(new Seq([]).join("||")).isEqualTo("");
    assertThat(new Seq([1]).join("||")).isEqualTo("1");
    assertThat(new Seq([1, 2]).join("||")).isEqualTo("1||2");
    assertThat(new Seq([1, 2, 3]).join("||")).isEqualTo("1||2||3");
});

suite.test("toString", () => {
    assertThat(new Seq([]).toString()).isEqualTo("[]");
    assertThat(new Seq([1]).toString()).isEqualTo("[1]");
    assertThat(new Seq([1, 2]).toString()).isEqualTo("[1, 2]");
    assertThat(new Seq([1, 2, 3]).toString()).isEqualTo("[1, 2, 3]");
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

suite.test("solidify", (status) => {
    status.warn_only = "travis-ci's version of firefox can't iterate Float32Array";

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
});

suite.test("map", () => {
    assertThat(new Seq([]).map(e => e + 1)).iteratesAs();
    assertThat(new Seq([1]).map(e => e + 1)).iteratesAs(2);
    assertThat(new Seq([1, 2]).map(e => e + 1)).iteratesAs(2, 3);
    assertThat(new Seq([3, 1, 2]).map(e => e * 2)).iteratesAs(6, 2, 4);
});

suite.test("filter", () => {
    assertThat(new Seq([]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(new Seq([1]).filter(e => e % 2 === 0)).iteratesAs();
    assertThat(new Seq([2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(new Seq([1, 2]).filter(e => e % 2 === 0)).iteratesAs(2);
    assertThat(new Seq([2, 0, 1, 4]).filter(e => e % 2 === 0)).iteratesAs(2, 0, 4);
    assertThat(new Seq([2, 0, 1, 4]).filter(e => e % 2 === 1)).iteratesAs(1);
});

suite.test("fold", () => {
    assertThrows(() => new Seq([]).fold((e1, e2) => undefined));
    assertThat(new Seq([]).fold(() => { throw new Error(); }, "abc")).isEqualTo("abc");

    assertThat(new Seq([1]).fold(() => { throw new Error(); })).isEqualTo(1);

    assertThat(new Seq([1, 2]).fold((e1, e2) => e1 + e2)).isEqualTo(3);
    assertThat(new Seq([1, 2, 3]).fold((e1, e2) => e1 + e2)).isEqualTo(6);
    assertThat(new Seq([1, 2, 3, 4]).fold((e1, e2) => e1 + e2)).isEqualTo(10);
    assertThat(new Seq([1, 2, 3, 4]).fold((e1, e2) => e1 * e2)).isEqualTo(24);
});

suite.test("aggregate", () => {
    assertThat(new Seq([]).aggregate("abc", () => { throw new Error(); })).isEqualTo("abc");
    assertThat(new Seq([1]).aggregate(-1, (a, e) => a + e)).isEqualTo(0);
    assertThat(new Seq([1, 2]).aggregate(-1, (a, e) => a + e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).aggregate(-3, (a, e) => a + e)).isEqualTo(0);
    assertThat(new Seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * e)).isEqualTo(-24);
    assertThat(new Seq([1, 2, 3, 4]).aggregate(-1, (a, e) => a * 2 + e)).isEqualTo(10);
    assertThat(new Seq([1, 2, 3, 4]).aggregate("x", (a, e) => a + "," + e)).isEqualTo("x,1,2,3,4");
});

suite.test("zip", () => {
    assertThat(new Seq([]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([1]).zip([], () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([]).zip([1], () => { throw new Error(); })).iteratesAs();

    assertThat(new Seq(["a"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a", "b"]).zip([2], (e1, e2) => e1 + e2)).iteratesAs("a2");
    assertThat(new Seq(["a", "b"]).zip([2, 3], (e1, e2) => e1 + e2)).iteratesAs("a2", "b3");
});

suite.test("max", () => {
    assertThrows(() => new Seq([]).max());
    assertThat(new Seq([]).max("abc")).isEqualTo("abc");
    assertThat(new Seq([1]).max("abc")).isEqualTo(1);
    assertThat(new Seq([1]).max()).isEqualTo(1);
    assertThat(new Seq([1, 2]).max()).isEqualTo(2);
    assertThat(new Seq([2, 1]).max()).isEqualTo(2);
    assertThat(new Seq([2, 1, -5, 102, -3, 4]).max()).isEqualTo(102);
    assertThat(new Seq(["a", "c", "b"]).max()).isEqualTo("c");
});

suite.test("min", () => {
    assertThrows(() => new Seq([]).min());
    assertThat(new Seq([]).min("abc")).isEqualTo("abc");
    assertThat(new Seq([1]).min("abc")).isEqualTo(1);
    assertThat(new Seq([1]).min()).isEqualTo(1);
    assertThat(new Seq([1, 2]).min()).isEqualTo(1);
    assertThat(new Seq([2, 1]).min()).isEqualTo(1);
    assertThat(new Seq([2, 1, -5, 102, -3, 4]).min()).isEqualTo(-5);
    assertThat(new Seq(["a", "c", "b"]).min()).isEqualTo("a");
});

suite.test("maxBy", () => {
    assertThrows(() => new Seq([]).maxBy(() => undefined));
    assertThat(new Seq([]).maxBy(() => undefined, "abc")).isEqualTo("abc");
    assertThat(new Seq(["abc"]).maxBy(() => { throw new Error(); })).isEqualTo("abc");

    assertThat(new Seq([1, 2]).maxBy(e => e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).maxBy(e => -e)).isEqualTo(1);
    assertThat(new Seq([1, 2]).maxBy(e => e, undefined, (e1, e2) => e1 < e2)).isEqualTo(2);
    assertThat(new Seq([1, 2]).maxBy(e => e, undefined, (e1, e2) => e1 > e2)).isEqualTo(1);
    assertThat(new Seq([-2, -1, 0, 1, 2]).maxBy(e => e*(2 - e))).isEqualTo(1);
    assertThat(new Seq([-2, -1, 0, 1, 2]).maxBy(e => e*(e - 2))).isEqualTo(-2);
});

suite.test("minBy", () => {
    assertThrows(() => new Seq([]).minBy(() => undefined));
    assertThat(new Seq([]).minBy(() => undefined, "abc")).isEqualTo("abc");
    assertThat(new Seq(["abc"]).minBy(() => { throw new Error(); })).isEqualTo("abc");

    assertThat(new Seq([1, 2]).minBy(e => e)).isEqualTo(1);
    assertThat(new Seq([1, 2]).minBy(e => -e)).isEqualTo(2);
    assertThat(new Seq([1, 2]).minBy(e => e, undefined, (e1, e2) => e1 < e2)).isEqualTo(1);
    assertThat(new Seq([1, 2]).minBy(e => e, undefined, (e1, e2) => e1 > e2)).isEqualTo(2);
    assertThat(new Seq([-2, -1, 0, 1, 2]).minBy(e => e*(2 - e))).isEqualTo(-2);
    assertThat(new Seq([-2, -1, 0, 1, 2]).minBy(e => e*(e - 2))).isEqualTo(1);
});

suite.test("any", () => {
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
});

suite.test("every", () => {
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
});

suite.test("contains", () => {
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
});

suite.test("sum", () => {
    assertThat(new Seq([]).sum()).isEqualTo(0);
    assertThat(new Seq([11]).sum()).isEqualTo(11);
    assertThat(new Seq([1, 2]).sum()).isEqualTo(3);
    assertThat(new Seq([1, 2, 3, 4]).sum()).isEqualTo(10);

    assertThat(new Seq(["abc"]).sum()).isEqualTo("abc");
    assertThat(new Seq(["a", "b"]).sum()).isEqualTo("ab");
});

suite.test("product", () => {
    assertThat(new Seq([]).product()).isEqualTo(1);
    assertThat(new Seq([11]).product()).isEqualTo(11);
    assertThat(new Seq([11, 2]).product()).isEqualTo(22);
    assertThat(new Seq([11, 2, 3, 4]).product()).isEqualTo(264);

    assertThat(new Seq(["abc"]).product()).isEqualTo("abc");
});

suite.test("scan", () => {
    assertThat(new Seq([]).scan("abc", (a, e) => a + e)).iteratesAs("abc");
    assertThat(new Seq([1, 2, 3]).scan("abc", (a, e) => a + e)).iteratesAs("abc", "abc1", "abc12", "abc123");

    assertThat(new Seq([]).scan(10, (a, e) => a + e)).iteratesAs(10);
    assertThat(new Seq([1]).scan(10, (a, e) => a + e)).iteratesAs(10, 11);
    assertThat(new Seq([1, 2]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13);
    assertThat(new Seq([1, 2, 3]).scan(10, (a, e) => a + e)).iteratesAs(10, 11, 13, 16);
});

suite.test("concat", () => {
    assertThat(new Seq([]).concat([])).iteratesAs();
    assertThat(new Seq([1]).concat([])).iteratesAs(1);
    assertThat(new Seq([]).concat([2])).iteratesAs(2);
    assertThat(new Seq([3]).concat([4])).iteratesAs(3, 4);
    assertThat(new Seq([5, 6]).concat([7, 8])).iteratesAs(5, 6, 7, 8);
});

suite.test("overlayAt", () => {
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
});

suite.test("takeWhile", () => {
    assertThat(new Seq([]).takeWhile(() => { throw new Error(); })).iteratesAs();

    assertThat(new Seq([1]).takeWhile(e => e % 2 === 1)).iteratesAs(1);
    assertThat(new Seq([2]).takeWhile(e => e % 2 === 1)).iteratesAs();

    assertThat(new Seq([1, 3]).takeWhile(e => e % 2 === 1)).iteratesAs(1, 3);
    assertThat(new Seq([1, 4]).takeWhile(e => e % 2 === 1)).iteratesAs(1);
    assertThat(new Seq([2, 3]).takeWhile(e => e % 2 === 1)).iteratesAs();

    assertThat(new Seq([1, 3, 5, 2, 4, 7]).takeWhile(e => e % 2 === 1)).iteratesAs(1, 3, 5);
});

suite.test("take", () => {
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
});

suite.test("concat", () => {
    assertThrows(() => new Seq([]).skip(-1));

    assertThat(new Seq([]).skip(0)).iteratesAs();
    assertThat(new Seq([3]).skip(0)).iteratesAs(3);
    assertThat(new Seq([4, 5]).skip(0)).iteratesAs(4, 5);
    assertThat(new Seq([6, 7, 8]).skip(0)).iteratesAs(6, 7, 8);

    assertThat(new Seq([]).skip(1)).iteratesAs();
    assertThat(new Seq([3]).skip(1)).iteratesAs();
    assertThat(new Seq([4, 5]).skip(1)).iteratesAs(5);
    assertThat(new Seq([6, 7, 8]).skip(1)).iteratesAs(7, 8);

    assertThat(new Seq([]).skip(2)).iteratesAs();
    assertThat(new Seq([3]).skip(2)).iteratesAs();
    assertThat(new Seq([4, 5]).skip(2)).iteratesAs();
    assertThat(new Seq([6, 7, 8]).skip(2)).iteratesAs(8);
});

suite.test("reverse", () => {
    assertThat(new Seq([]).reverse()).iteratesAs();
    assertThat(new Seq([1]).reverse()).iteratesAs(1);
    assertThat(new Seq([1, 2]).reverse()).iteratesAs(2, 1);
    assertThat(new Seq(["a", "b", "c"]).reverse()).iteratesAs("c", "b", "a");
    assertThat(new Seq("12345").reverse()).iteratesAs("5", "4", "3", "2", "1");
});

suite.test("distinctBy", () => {
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
});

suite.test("distinct", () => {
    assertThat(new Seq([]).distinct()).iteratesAs();
    assertThat(new Seq(["abc"]).distinct()).iteratesAs("abc");
    assertThat(new Seq(["a", "b", "a"]).distinct()).iteratesAs("a", "b");
    assertThat(new Seq(["a", "a", "c", "c", "d", "c"]).distinct()).iteratesAs("a", "c", "d");
});

suite.test("flatten", () => {
    assertThat(new Seq([]).flatten()).iteratesAs();
    assertThat(new Seq([[]]).flatten()).iteratesAs();
    assertThat(new Seq([[], []]).flatten()).iteratesAs();

    assertThat(new Seq([["a"], []]).flatten()).iteratesAs("a");
    assertThat(new Seq([[], ["b"]]).flatten()).iteratesAs("b");
    assertThat(new Seq([["a"], ["b"]]).flatten()).iteratesAs("a", "b");

    assertThat(new Seq([[1, 2, 3], ["a", "b"], "cd"]).flatten()).iteratesAs(1, 2, 3, "a", "b", "c", "d");
});

suite.test("single", () => {
    assertThrows(() => new Seq([]).single());
    assertThat(new Seq([]).single("abc")).isEqualTo("abc");

    assertThat(new Seq([11]).single("abc")).isEqualTo(11);
    assertThat(new Seq([11]).single()).isEqualTo(11);

    assertThrows(() => new Seq([2, 3]).single());
    assertThat(new Seq([2, 3]).single("abc")).isEqualTo("abc");
});

suite.test("first", () => {
    assertThrows(() => new Seq([]).first());
    assertThat(new Seq([]).first("abc")).isEqualTo("abc");

    assertThat(new Seq([11]).first("abc")).isEqualTo(11);
    assertThat(new Seq([11]).first()).isEqualTo(11);

    assertThat(new Seq([2, 3]).first()).isEqualTo(2);
    assertThat(new Seq([2, 3]).first("abc")).isEqualTo(2);
});

suite.test("last", () => {
    assertThrows(() => new Seq([]).last());
    assertThat(new Seq([]).last("abc")).isEqualTo("abc");

    assertThat(new Seq([11]).last("abc")).isEqualTo(11);
    assertThat(new Seq([11]).last()).isEqualTo(11);

    assertThat(new Seq([2, 3]).last()).isEqualTo(3);
    assertThat(new Seq([2, 3]).last("abc")).isEqualTo(3);
});

suite.test("count", () => {
    assertThat(new Seq([]).count()).isEqualTo(0);
    assertThat(new Seq([11]).count()).isEqualTo(1);
    assertThat(new Seq([11, 12]).count()).isEqualTo(2);
    assertThat(new Seq([11, 12, 13]).count()).isEqualTo(3);
    assertThat(new Seq([11, 12, 13, 4, 5, 6]).count()).isEqualTo(6);

    assertThat(Seq.fromGenerator(function*() {}).count()).isEqualTo(0);
    assertThat(Seq.fromGenerator(function*() { yield "a"; }).count()).isEqualTo(1);
    assertThat(Seq.fromGenerator(function*() { yield "a"; yield "b"; }).count()).isEqualTo(2);
});

suite.test("paddedWithTo", () => {
    assertThat(new Seq([]).paddedWithTo("a", 0)).iteratesAs();
    assertThat(new Seq([]).paddedWithTo("a", 1)).iteratesAs("a");
    assertThat(new Seq([]).paddedWithTo("a", 2)).iteratesAs("a", "a");
    assertThat(new Seq([]).paddedWithTo("a", 3)).iteratesAs("a", "a", "a");

    assertThat(new Seq([2]).paddedWithTo("a", 0)).iteratesAs(2);
    assertThat(new Seq([2]).paddedWithTo("a", 1)).iteratesAs(2);
    assertThat(new Seq([2]).paddedWithTo("a", 2)).iteratesAs(2, "a");
    assertThat(new Seq([2]).paddedWithTo("a", 3)).iteratesAs(2, "a", "a");

    assertThat(new Seq([2, 3]).paddedWithTo("a", 0)).iteratesAs(2, 3);
    assertThat(new Seq([2, 3]).paddedWithTo("a", 1)).iteratesAs(2, 3);
    assertThat(new Seq([2, 3]).paddedWithTo("a", 2)).iteratesAs(2, 3);
    assertThat(new Seq([2, 3]).paddedWithTo("a", 3)).iteratesAs(2, 3, "a");

    assertThat(new Seq([2, 3, 5]).paddedWithTo("a", 0)).iteratesAs(2, 3, 5);
    assertThat(new Seq([2, 3, 5]).paddedWithTo("a", 1)).iteratesAs(2, 3, 5);
    assertThat(new Seq([2, 3, 5]).paddedWithTo("a", 2)).iteratesAs(2, 3, 5);
    assertThat(new Seq([2, 3, 5]).paddedWithTo("a", 3)).iteratesAs(2, 3, 5);
});

suite.test("toMap", () => {
    assertThat(new Seq([]).toMap(() => { throw new Error(); }, () => { throw new Error(); })).isEqualTo(new Map());
    assertThat(new Seq([2]).toMap(e => e * e, e => e)).isEqualTo(new Map([[4, 2]]));
    assertThat(new Seq([2, 3, 4]).toMap(e => e, e => e * e)).isEqualTo(new Map([[2, 4], [3, 9], [4, 16]]));
});

suite.test("groupBy", () => {
    assertThat(new Seq([]).groupBy(() => { throw new Error(); })).isEqualTo(new Map());

    assertThat(new Seq([32]).groupBy(e => e % 3)).isEqualTo(new Map([[2, [32]]]));
    assertThat(new Seq([32, 2]).groupBy(e => e % 3)).isEqualTo(new Map([[2, [32, 2]]]));
    assertThat(new Seq([32, 2, 62]).groupBy(e => e % 3)).isEqualTo(new Map([[2, [32, 2, 62]]]));

    assertThat(new Seq([32, 3]).groupBy(e => e % 3)).isEqualTo(new Map([[0, [3]], [2, [32]]]));
    assertThat(new Seq([32, 3, 63]).groupBy(e => e % 3)).isEqualTo(new Map([[0, [3, 63]], [2, [32]]]));

    assertThat(new Seq([1, 2, 3]).groupBy(e => e % 3)).isEqualTo(new Map([[0, [3]], [1, [1]], [2, [2]]]));
    assertThat(new Seq([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).groupBy(e => e % 3)).isEqualTo(new Map([
        [0, [0, 3, 6, 9]],
        [1, [1, 4, 7, 10]],
        [2, [2, 5, 8]]]));
});

suite.test("breadthFirstSearch", () => {
    assertThat(new Seq([]).breadthFirstSearch(() => { throw new Error(); }, () => { throw new Error(); })).iteratesAs();
    assertThat(new Seq([1, 4]).breadthFirstSearch(e => [])).iteratesAs(
        1, 4);
    assertThat(new Seq([1, 4]).breadthFirstSearch(e => e >= 5 ? [] : [e*2, e*2+1])).iteratesAs(
        1, 4, 2, 3, 8, 9, 5, 6, 7);
    assertThat(new Seq([1, 4]).breadthFirstSearch(e => e >= 10 ? [] : [e*2, e*2+1])).iteratesAs(
        1, 4, 2, 3, 8, 9, 5, 6, 7, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15);
    assertThat(new Seq([1, 4]).breadthFirstSearch(e => e >= 10 ? [] : [e*2, e*2+1], e => e % 3)).iteratesAs(
        1, 2, 3);
});
