import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import Util from "src/base/Util.js"
import Rect from "src/base/Rect.js"
import Seq from "src/base/Seq.js"

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

suite.test("sliceRectFromFlattenedArray", () => {
    assertThat(Util.sliceRectFromFlattenedArray(4, [], new Rect(0, 0, 0, 0))).isEqualTo([]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(16).toArray(), new Rect(2, 2, 2, 2))).isEqualTo([
        10, 11,
        14, 15
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(16).toArray(), new Rect(0, 2, 2, 2))).isEqualTo([
        8, 9,
        12, 13
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(16).toArray(), new Rect(0, 1, 2, 2))).isEqualTo([
        4, 5,
        8, 9
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(16).toArray(), new Rect(0, 0, 2, 2))).isEqualTo([
        0, 1,
        4, 5
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(16).toArray(), new Rect(0, 0, 3, 3))).isEqualTo([
        0, 1, 2,
        4, 5, 6,
        8, 9, 10
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(20).toArray(), new Rect(0, 0, 1, 4))).isEqualTo([
        0, 4, 8, 12
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(20).toArray(), new Rect(1, 2, 1, 3))).isEqualTo([
        9, 13, 17
    ]);
    assertThat(Util.sliceRectFromFlattenedArray(4, Seq.range(20).toArray(), new Rect(1, 2, 3, 1))).isEqualTo([
        9, 10, 11
    ]);
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

//suite.test("MaskCandidates", () => {
//    assertThrows(() => Util.maskCandidates(-1));
//    assertThat(Util.maskCandidates(0)).isEqualTo([0]);
//    assertThat(Util.maskCandidates(1)).isEqualTo([0, 1]);
//    assertThat(Util.maskCandidates(2)).isEqualTo([0, 2]);
//    assertThat(Util.maskCandidates(3)).isEqualTo([0, 1, 2, 3]);
//    assertThat(Util.maskCandidates(4)).isEqualTo([0, 4]);
//    assertThat(Util.maskCandidates(5)).isEqualTo([0, 1, 4, 5]);
//    assertThat(Util.maskCandidates(6)).isEqualTo([0, 2, 4, 6]);
//    assertThat(Util.maskCandidates(7)).isEqualTo([0, 1, 2, 3, 4, 5, 6, 7]);
//    assertThat(Util.maskCandidates(8)).isEqualTo([0, 8]);
//    assertThat(Util.maskCandidates(9)).isEqualTo([0, 1, 8, 9]);
//    assertThat(Util.maskCandidates((1 << 20) + (1 << 10))).isEqualTo([0, 1 << 10, 1 << 20, (1 << 10) + (1 << 20)]);
//};

//suite.test("Arg1", () => {
//    assertThat(arg1(Complex.prototype.norm2)(Complex.I)).isEqualTo(1);
//};
//
//suite.test("Arg2", () => {
//    assertTrue(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.I));
//    assertFalse(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.ZERO));
//    assertTrue(arg2(Complex.prototype.plus)(Complex.I, Complex.I).isEqualTo(new Complex(0, 2)));
//};
//
//suite.test("IsNumber", () => {
//    assertTrue(isNumber(0));
//    assertTrue(isNumber(1));
//    assertTrue(isNumber(-1));
//    assertTrue(isNumber(1.5));
//    assertTrue(isNumber(Math.PI));
//    assertTrue(isNumber(NaN));
//    assertTrue(isNumber(-Infinity));
//    assertTrue(isNumber(Infinity));
//    assertTrue(isNumber(1 << 31));
//    assertTrue(isNumber(~0));
//
//    assertFalse(isNumber(""));
//    assertFalse(isNumber("0"));
//    assertFalse(isNumber({}));
//    assertFalse(isNumber(null));
//    assertFalse(isNumber(undefined));
//    assertFalse(isNumber([]));
//};
//
//suite.test("IsInt", () => {
//    assertTrue(isInt(0));
//    assertTrue(isInt(1));
//    assertTrue(isInt(-1));
//    assertTrue(isInt(1 << 31));
//    assertTrue(isInt(~0));
//
//    assertFalse(isInt(1.5));
//    assertFalse(isInt(Math.PI));
//    assertFalse(isInt(NaN));
//    assertFalse(isInt(-Infinity));
//    assertFalse(isInt(Infinity));
//    assertFalse(isInt(""));
//    assertFalse(isInt("0"));
//    assertFalse(isInt({}));
//    assertFalse(isInt(null));
//    assertFalse(isInt(undefined));
//    assertFalse(isInt([]));
//};
//
//suite.test("IsString", () => {
//    assertTrue(isString(""));
//    assertTrue(isString("0"));
//    assertTrue(isString("abc"));
//
//    assertFalse(isString({}));
//    assertFalse(isString(null));
//    assertFalse(isString(undefined));
//    assertFalse(isString([]));
//    assertFalse(isString(0));
//    assertFalse(isString(NaN));
//    assertFalse(isString(Infinity));
//};
//
//suite.test("FloatToCompactString", () => {
//    assertThat(floatToCompactString(0)).isEqualTo("0");
//    assertThat(floatToCompactString(1)).isEqualTo("1");
//    assertThat(floatToCompactString(0.5)).isEqualTo("\u00BD");
//    assertThat(floatToCompactString(2)).isEqualTo("2");
//    assertThat(floatToCompactString(-1/3)).isEqualTo("-\u2153");
//    assertThat(floatToCompactString(Math.sqrt(1/2))).isEqualTo("\u221A\u00BD");
//
//    assertThat(floatToCompactString(1/Math.sqrt(2))).isNotEqualTo("\u221A\u00BD");
//    assertThat(floatToCompactString(1/Math.sqrt(2), 0)).isEqualTo("0.7071067811865475");
//    assertThat(floatToCompactString(1/Math.sqrt(2), 0.00000001)).isEqualTo("\u221A\u00BD");
//    assertThat(floatToCompactString(1/Math.sqrt(2)+0.0001, 0.001)).isEqualTo("\u221A\u00BD");
//    assertThat(floatToCompactString(1/Math.sqrt(2)+0.0001, 0.00000001)).isNotEqualTo("\u221A\u00BD");
//
//    assertThat(floatToCompactString(0.342123)).isEqualTo("0.342123");
//    assertThat(floatToCompactString(0.342123, undefined, 2)).isEqualTo("0.34");
//    assertThat(floatToCompactString(0.342123, undefined, 8)).isEqualTo("0.34212300");
//    assertThat(floatToCompactString(501, undefined, 8)).isEqualTo("501");
//};
//
//suite.test("CacheFunc1", () => {
//    var calls = [];
//    var func = cacheFunc1(i => {
//        calls.push(i);
//        return [i];
//    });
//
//    assertThat(calls).isEqualTo([]);
//
//    assertThat(func(1)).isEqualTo([1]);
//    assertThat(calls).isEqualTo([1]);
//
//    assertThat(func(3)).isEqualTo([3]);
//    assertThat(calls).isEqualTo([1, 3]);
//
//    assertThat(func(1)).isEqualTo([1]);
//    assertThat(calls).isEqualTo([1, 3]);
//
//    assertThat(func(1)).isEqualTo([1]);
//    assertThat(calls).isEqualTo([1, 3]);
//
//    assertThat(func(2)).isEqualTo([2]);
//    assertThat(calls).isEqualTo([1, 3, 2]);
//};
//
//suite.test("CacheFunc2", () => {
//    var calls = [];
//    var func = cacheFunc2((i, j) => {
//        calls.push([i, j]);
//        return [i, j];
//    });
//
//    assertThat(calls).isEqualTo([]);
//
//    assertThat(func(1, 2)).isEqualTo([1, 2]);
//    assertThat(calls).isEqualTo([[1, 2]]);
//
//    assertThat(func(2, 1)).isEqualTo([2, 1]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1]]);
//
//    assertThat(func(2, 2)).isEqualTo([2, 2]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2]]);
//
//    assertThat(func(2, 1)).isEqualTo([2, 1]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2]]);
//
//    assertThat(func(100, -2)).isEqualTo([100, -2]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2], [100, -2]]);
//
//    assertThat(func(1, 2)).isEqualTo([1, 2]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2], [100, -2]]);
//};
//
//suite.test("CacheFunc3", () => {
//    var calls = [];
//    var func = cacheFunc3((i, j, k) => {
//        calls.push([i, j, k]);
//        return [i, j, k];
//    });
//
//    assertThat(calls).isEqualTo([]);
//
//    assertThat(func(1, 2, 3)).isEqualTo([1, 2, 3]);
//    assertThat(calls).isEqualTo([[1, 2, 3]]);
//
//    assertThat(func(2, 1, 4)).isEqualTo([2, 1, 4]);
//    assertThat(calls).isEqualTo([[1, 2, 3], [2, 1, 4]]);
//
//    assertThat(func(1, 2, 3)).isEqualTo([1, 2, 3]);
//    assertThat(calls).isEqualTo([[1, 2, 3], [2, 1, 4]]);
//};
