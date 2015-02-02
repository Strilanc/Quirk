ArrayUtilTest = TestCase("ArrayUtilTest");

ArrayUtilTest.prototype.testRange = function() {
    assertThat(range(0)).isEqualTo([]);
    assertThat(range(1)).isEqualTo([0]);
    assertThat(range(2)).isEqualTo([0, 1]);
    assertThat(range(5)).isEqualTo([0, 1, 2, 3, 4]);
};

ArrayUtilTest.prototype.testFirstMatchElseUndefined = function() {
    assertThat([].firstMatchElseUndefined(function() { throw new Error(); })).isEqualTo(undefined);

    assertThat([1, 2, 3].firstMatchElseUndefined(function(e) { return e % 2 === 1; })).isEqualTo(1);
    assertThat([1, 2, 3].firstMatchElseUndefined(function(e) { return e % 2 === 0; })).isEqualTo(2);
    assertThat([1, 2, "a"].firstMatchElseUndefined(isString)).isEqualTo("a");

    assertThat(["a", "b", "c"].firstMatchElseUndefined(function() { return true; })).isEqualTo("a");
    assertThat(["a", "b", "c"].firstMatchElseUndefined(function() { return false; })).isEqualTo(undefined);
};

ArrayUtilTest.prototype.testMax = function() {
    assertThat([].max()).isEqualTo(-Infinity);
    assertThat([2].max()).isEqualTo(2);

    assertThat([2, 3].max()).isEqualTo(3);
    assertThat([3, 2].max()).isEqualTo(3);

    assertThat([2, 3, 5].max()).isEqualTo(5);
    assertThat([5, 2, 3].max()).isEqualTo(5);
    assertThat([3, 5, 2].max()).isEqualTo(5);

    assertThat(["a", "c", "b"].max()).isEqualTo("c");
};

ArrayUtilTest.prototype.testMaxBy = function() {
    assertThat([1.5].maxBy(function() { throw "do not call"; })).isEqualTo(1.5);
    assertThat([1, 2, 3, -4.5].maxBy(function(e) { return e*e; })).isEqualTo(-4.5);
    assertThat([1, 2, 3].maxBy(function(e) { return -e; })).isEqualTo(1);
    assertThat([{a: 1, b: 2}, {a: 2, b: 1}].maxBy(function(e) { return e.a; })).isEqualTo({a: 2, b: 1});
    assertThat([{a: 1, b: 2}, {a: 2, b: 1}].maxBy(function(e) { return e.b; })).isEqualTo({a: 1, b: 2});
};

ArrayUtilTest.prototype.testZip = function() {
    assertThat([].zip([], function() { throw "not called"; })).isEqualTo([]);
    assertThat([2].zip([3], function(e1, e2) { return e1 + e2; })).isEqualTo([5]);
    assertThat([2].zip([3, 5], function(e1, e2) { return e1 + e2; })).isEqualTo([5]);
    assertThat([2, 7].zip([3, 5], function(e1, e2) { return e1 + e2; })).isEqualTo([5, 12]);
    assertThat([2, 7, 11].zip([3, 5], function(e1, e2) { return e1 + e2; })).isEqualTo([5, 12]);
    assertThat([2, 7, 11].zip([3, 5, 13], function(e1, e2) { return e1 + e2; })).isEqualTo([5, 12, 24]);
};

ArrayUtilTest.prototype.testArraysEqualBy = function() {
    assertFalse([].isEqualToBy(null, function() { throw "not called"; }));
    assertFalse([].isEqualToBy(undefined, function() { throw "not called"; }));
    assertFalse([].isEqualToBy(0, function() { throw "not called"; }));
    assertFalse([].isEqualToBy("", function() { throw "not called"; }));

    assertTrue([].isEqualToBy([], function() { throw "not called"; }));
    assertFalse([1].isEqualToBy([1, 2], function() { throw "not called"; }));

    var eqMod5 = function(e1, e2) { return e1 % 5 === e2 % 5; };
    assertTrue([1].isEqualToBy([1], eqMod5));
    assertTrue([1].isEqualToBy([11], eqMod5));
    assertFalse([1].isEqualToBy([2], eqMod5));

    assertTrue([1, 2].isEqualToBy([1, 2], eqMod5));
    assertTrue([1, 2].isEqualToBy([1, 7], eqMod5));
    assertFalse([1, 2].isEqualToBy([1, 1], eqMod5));
    assertFalse([1, 2].isEqualToBy([2, 1], eqMod5));
    assertFalse([1, 2].isEqualToBy([2, 2], eqMod5));

    assertTrue([Complex.I, Complex.ZERO].isEqualToBy([Complex.I, Complex.ZERO], arg2(Complex.prototype.isEqualTo)));
    assertFalse([Complex.I, Complex.ZERO].isEqualToBy([Complex.I, Complex.I], arg2(Complex.prototype.isEqualTo)));

    assertTrue([1.5].isEqualToBy([1.5], STRICT_EQUALITY));
    assertFalse([1.5].isEqualToBy([1], STRICT_EQUALITY));

    assertTrue([Complex.from(1.5)].isEqualToBy([Complex.from(1.5)], CUSTOM_IS_EQUAL_TO_EQUALITY));
    assertFalse([Complex.from(1.5)].isEqualToBy([Complex.from(1)], CUSTOM_IS_EQUAL_TO_EQUALITY));
};

ArrayUtilTest.prototype.testSum = function() {
    assertThat([].sum()).isEqualTo(0);
    assertThat([2].sum()).isEqualTo(2);
    assertThat([2, 3.5].sum()).isEqualTo(5.5);
    assertThat(range(11).sum()).isEqualTo(55);
};

ArrayUtilTest.prototype.testFlatten = function() {
    assertThat([].flatten()).isEqualTo([]);
    assertThat([[]].flatten()).isEqualTo([]);
    assertThat([[[]]].flatten()).isEqualTo([[]]);
    assertThat([[1]].flatten()).isEqualTo([1]);
    assertThat([[1, 2], [3], [], [4, 5]].flatten()).isEqualTo([1, 2, 3, 4, 5]);
};

ArrayUtilTest.prototype.testToArrayString = function() {
    assertThat([].toArrayString()).isEqualTo("[]");
    assertThat([2].toArrayString()).isEqualTo("[2]");
    assertThat([2, "a"].toArrayString()).isEqualTo("[2, a]");
};

ArrayUtilTest.prototype.testRepeat = function() {
    assertThat(repeat("a", 0)).isEqualTo([]);
    assertThat(repeat("a", 1)).isEqualTo(["a"]);
    assertThat(repeat("a", 2)).isEqualTo(["a", "a"]);
    assertThat(repeat("b", 5)).isEqualTo(["b", "b", "b", "b", "b"]);
};

ArrayUtilTest.prototype.testClone = function() {
    assertThat([].clone()).isEqualTo([]);
    assertThat([1, "a"].clone()).isEqualTo([1, "a"]);

    var a = [1, 2, 3];
    var b = a.clone();
    assertThat(a).isEqualTo([1, 2, 3]);
    assertThat(b).isEqualTo([1, 2, 3]);

    b.push([4]);
    assertThat(a).isEqualTo([1, 2, 3]);
    assertThat(b).isEqualTo([1, 2, 3, 4]);
};

ArrayUtilTest.prototype.testScan = function() {
    assertThat([].scan(2, function() { throw "do not call"; })).isEqualTo([2]);

    assertThat([].scan(11, function(a, e) { return a + e; })).isEqualTo([11]);
    assertThat([2].scan(11, function(a, e) { return a + e; })).isEqualTo([11, 13]);
    assertThat([2, 3].scan(11, function(a, e) { return a + e; })).isEqualTo([11, 13, 16]);
    assertThat([2, 3, 5].scan(11, function(a, e) { return a + e; })).isEqualTo([11, 13, 16, 21]);
};

ArrayUtilTest.prototype.testInsertAt = function() {
    var r = [];

    r.insertAt(0, "a");
    assertThat(r).isEqualTo(["a"]);

    r.insertAt(0, "b");
    assertThat(r).isEqualTo(["b", "a"]);

    r.insertAt(2, "c");
    assertThat(r).isEqualTo(["b", "a", "c"]);

    r.insertAt(2, "d");
    assertThat(r).isEqualTo(["b", "a", "d", "c"]);
};

ArrayUtilTest.prototype.testWithItemReplacedAtBy = function() {
    assertThat([1].withItemReplacedAtBy(0, -1)).isEqualTo([-1]);

    var r = ["a", "b", "c"];
    assertThat(r.withItemReplacedAtBy(0, "d")).isEqualTo(["d", "b", "c"]);
    assertThat(r.withItemReplacedAtBy(1, "d")).isEqualTo(["a", "d", "c"]);
    assertThat(r.withItemReplacedAtBy(2, "d")).isEqualTo(["a", "b", "d"]);
};

ArrayUtilTest.prototype.testDistinctBy = function() {
    assertThat([].distinctBy(function() { throw "do not call"; })).isEqualTo([]);
    assertThat(["b"].distinctBy(function() { throw "do not call"; })).isEqualTo(["b"]);

    assertThat([1, 2].distinctBy(function() { return 0; })).isEqualTo([1]);
    assertThat([1, 2].distinctBy(function(e) { return e % 2; })).isEqualTo([1, 2]);
    assertThat([0, 2].distinctBy(function(e) { return e % 2; })).isEqualTo([0]);
    assertThat([1, 2, 3].distinctBy(function(e) { return e % 2; })).isEqualTo([1, 2]);

    assertThat([2, 3, 5, 7, 11, 13, 17, 19].distinctBy(function(e) { return e % 5; })).isEqualTo([2, 3, 5, 11, 19]);
    assertThat(range(10).distinctBy(function(e) { return e % 5; })).isEqualTo(range(5));
};

ArrayUtilTest.prototype.testDistinct = function() {
    assertThat([].distinct()).isEqualTo([]);
    assertThat(["a"].distinct()).isEqualTo(["a"]);
    assertThat(["a", "a"].distinct()).isEqualTo(["a"]);
    assertThat(["a", "b"].distinct()).isEqualTo(["a", "b"]);

    assertThat(["a", 1, "b", 2, 3, 2].distinct()).isEqualTo(["a", 1, "b", 2, 3]);
    assertThat(range(10).distinct()).isEqualTo(range(10));
};

ArrayUtilTest.prototype.testSingleElseUndefined = function() {
    assertThat([].singleElseUndefined()).isEqualTo(undefined);
    assertThat(["a"].singleElseUndefined()).isEqualTo("a");
    assertThat(["a", "b"].singleElseUndefined()).isEqualTo(undefined);
    assertThat(range(10).singleElseUndefined()).isEqualTo(undefined);
};

ArrayUtilTest.prototype.testPaddedWithTo = function() {
    assertThat([].paddedWithTo("a", 0)).isEqualTo([]);
    assertThat([].paddedWithTo("a", 1)).isEqualTo(["a"]);
    assertThat([].paddedWithTo("a", 2)).isEqualTo(["a", "a"]);

    //noinspection JSCheckFunctionSignatures
    assertThat(["b"].paddedWithTo("a", 0)).isEqualTo(["b"]);
    //noinspection JSCheckFunctionSignatures
    assertThat(["b"].paddedWithTo("a", 1)).isEqualTo(["b"]);
    //noinspection JSCheckFunctionSignatures
    assertThat(["b"].paddedWithTo("a", 2)).isEqualTo(["b", "a"]);

    assertThat(["b", "c"].paddedWithTo("a", 0)).isEqualTo(["b", "c"]);
    assertThat(["b", "c"].paddedWithTo("a", 1)).isEqualTo(["b", "c"]);
    assertThat(["b", "c"].paddedWithTo("a", 2)).isEqualTo(["b", "c"]);
};

ArrayUtilTest.prototype.testToArray_Float32 = function() {
    assertThat(new Float32Array([1, 2, 3]).toArray()).isEqualTo([1, 2, 3]);
};

ArrayUtilTest.prototype.testMapKeysTo = function() {
    assertThat([].mapKeysTo(function() { throw "do not call"; })).isEqualTo({});
    assertThat(["a", "b", "c"].mapKeysTo(function(e) { return e + "x"; })).isEqualTo(
        {"a": "ax", "b": "bx", "c": "cx"});
};
