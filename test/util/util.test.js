UtilTest = TestCase("UtilTest");

UtilTest.prototype.testNotNull = function() {
    assertThat(notNull([])).isEqualTo([]);
    assertThat(notNull("")).isEqualTo("");
};

UtilTest.prototype.testScan = function() {
    assertThat(scan([], 2, function() { throw "do not call"; })).isEqualTo([2]);

    assertThat(scan([], 11, function(a, e) { return a + e; })).isEqualTo([11]);
    assertThat(scan([2], 11, function(a, e) { return a + e; })).isEqualTo([11, 13]);
    assertThat(scan([2, 3], 11, function(a, e) { return a + e; })).isEqualTo([11, 13, 16]);
    assertThat(scan([2, 3, 5], 11, function(a, e) { return a + e; })).isEqualTo([11, 13, 16, 21]);
};

UtilTest.prototype.testInsertAt = function() {
    var r = [];

    insertAt(r, "a", 0);
    assertThat(r).isEqualTo(["a"]);

    insertAt(r, "b", 0);
    assertThat(r).isEqualTo(["b", "a"]);

    insertAt(r, "c", 2);
    assertThat(r).isEqualTo(["b", "a", "c"]);

    insertAt(r, "d", 2);
    assertThat(r).isEqualTo(["b", "a", "d", "c"]);
};

UtilTest.prototype.testWithItemReplacedAt = function() {
    assertThat(withItemReplacedAt([1], -1, 0)).isEqualTo([-1]);

    var r = ["a", "b", "c"];
    assertThat(withItemReplacedAt(r, "d", 0)).isEqualTo(["d", "b", "c"]);
    assertThat(withItemReplacedAt(r, "d", 1)).isEqualTo(["a", "d", "c"]);
    assertThat(withItemReplacedAt(r, "d", 2)).isEqualTo(["a", "b", "d"]);
};

UtilTest.prototype.testTake = function() {
    assertThat(take([], 0)).isEqualTo([]);

    assertThat(take(["a"], 0)).isEqualTo([]);
    assertThat(take(["a"], 1)).isEqualTo(["a"]);

    assertThat(take(["a", "b"], 0)).isEqualTo([]);
    assertThat(take(["a", "b"], 1)).isEqualTo(["a"]);
    assertThat(take(["a", "b"], 2)).isEqualTo(["a", "b"]);
};

UtilTest.prototype.testCopyArray = function() {
    var a = [1, 2, 3];
    var b = copyArray(a);
    assertThat(a).isEqualTo([1, 2, 3]);
    assertThat(b).isEqualTo([1, 2, 3]);

    b.push([4]);
    assertThat(a).isEqualTo([1, 2, 3]);
    assertThat(b).isEqualTo([1, 2, 3, 4]);
};

UtilTest.prototype.testArrayToString = function() {
    assertThat(arrayToString([])).isEqualTo("[]");
    assertThat(arrayToString([2])).isEqualTo("[2]");
    assertThat(arrayToString([2, "a"])).isEqualTo("[2, a]");
};

UtilTest.prototype.testRepeat = function() {
    assertThat(repeat("a", 0)).isEqualTo([]);
    assertThat(repeat("a", 1)).isEqualTo(["a"]);
    assertThat(repeat("a", 2)).isEqualTo(["a", "a"]);
};

UtilTest.prototype.testMaxBy = function() {
    assertThat(maxBy([1.5], function(e) { throw "do no call"; })).isEqualTo(1.5);
    assertThat(maxBy([1, 2, 3, -4.5], function(e) { return e*e; })).isEqualTo(-4.5);
    assertThat(maxBy([1, 2, 3], function(e) { return -e; })).isEqualTo(1);
    assertThat(maxBy([{a: 1, b: 2}, {a: 2, b: 1}], function(e) { return e.a; })).isEqualTo({a: 2, b: 1});
    assertThat(maxBy([{a: 1, b: 2}, {a: 2, b: 1}], function(e) { return e.b; })).isEqualTo({a: 1, b: 2});
};

UtilTest.prototype.testLg = function() {
    assertThat(lg(0.25)).isEqualTo(-2);
    assertThat(lg(0.5)).isEqualTo(-1);
    assertThat(lg(1)).isEqualTo(0);
    assertThat(lg(2)).isEqualTo(1);
    assertThat(lg(4)).isEqualTo(2);
    assertThat(lg(8)).isEqualTo(3);
    assertThat(lg(12345)).isApproximatelyEqualTo(13.5916392160301442);
    assertThat(lg(1 << 10)).isEqualTo(10);
};

UtilTest.prototype.testMaskCandidates = function() {
    assertThat(maskCandidates(0)).isEqualTo([0]);
    assertThat(maskCandidates(1)).isEqualTo([0, 1]);
    assertThat(maskCandidates(2)).isEqualTo([0, 2]);
    assertThat(maskCandidates(3)).isEqualTo([0, 1, 2, 3]);
    assertThat(maskCandidates(4)).isEqualTo([0, 4]);
    assertThat(maskCandidates(5)).isEqualTo([0, 1, 4, 5]);
    assertThat(maskCandidates(6)).isEqualTo([0, 2, 4, 6]);
    assertThat(maskCandidates(7)).isEqualTo([0, 1, 2, 3, 4, 5, 6, 7]);
    assertThat(maskCandidates(8)).isEqualTo([0, 8]);
    assertThat(maskCandidates(9)).isEqualTo([0, 1, 8, 9]);
    assertThat(maskCandidates((1 << 20) + (1 << 10))).isEqualTo([0, 1 << 10, 1 << 20, (1 << 10) + (1 << 20)]);
};

UtilTest.prototype.testIsPowerOf2 = function() {
    assertFalse(isPowerOf2(-1));
    assertFalse(isPowerOf2(0));
    assertTrue(isPowerOf2(1));
    assertTrue(isPowerOf2(2));
    assertFalse(isPowerOf2(3));
    assertTrue(isPowerOf2(4));
    assertFalse(isPowerOf2(5));
};

UtilTest.prototype.testBitSize = function() {
    assertThat(bitSize(0)).isEqualTo(0);
    assertThat(bitSize(1)).isEqualTo(1);
    assertThat(bitSize(2)).isEqualTo(2);
    assertThat(bitSize(3)).isEqualTo(2);
    assertThat(bitSize(4)).isEqualTo(3);
    assertThat(bitSize(5)).isEqualTo(3);
    assertThat(bitSize(6)).isEqualTo(3);
    assertThat(bitSize(7)).isEqualTo(3);
    assertThat(bitSize(8)).isEqualTo(4);
    assertThat(bitSize(9)).isEqualTo(4);
    assertThat(bitSize(1 << 20)).isEqualTo(21);
    assertThat(bitSize((1 << 20) + (1 << 19))).isEqualTo(21);
};

UtilTest.prototype.testEvenPower = function() {
    assertThat(evenPower(-2)).isEqualTo(1);
    assertThat(evenPower(-1)).isEqualTo(0);
    assertThat(evenPower(0)).isEqualTo(Math.POSITIVE_INFINITY);
    assertThat(evenPower(1)).isEqualTo(0);
    assertThat(evenPower(2)).isEqualTo(1);
    assertThat(evenPower(3)).isEqualTo(0);
    assertThat(evenPower(4)).isEqualTo(2);
    assertThat(evenPower(5)).isEqualTo(0);
    assertThat(evenPower(6)).isEqualTo(1);
    assertThat(evenPower(7)).isEqualTo(0);
    assertThat(evenPower(8)).isEqualTo(3);
    assertThat(evenPower(9)).isEqualTo(0);

    assertThat(evenPower(1 << 20)).isEqualTo(20);
    assertThat(evenPower(1 + (1 << 20))).isEqualTo(0);
    assertThat(evenPower(2 + (1 << 20))).isEqualTo(1);
};

UtilTest.prototype.testRange = function() {
    assertThat(range(0)).isEqualTo([]);
    assertThat(range(1)).isEqualTo([0]);
    assertThat(range(2)).isEqualTo([0, 1]);
};

UtilTest.prototype.testSum = function() {
    assertThat(sum([])).isEqualTo(0);
    assertThat(sum([2])).isEqualTo(2);
    assertThat(sum([2, 3.5])).isEqualTo(5.5);
};

UtilTest.prototype.testZip = function() {
    assertThat(zip([], [], function() { throw "not called"; })).isEqualTo([]);
    assertThat(zip([2], [3], function(e1, e2) { return e1 + e2; })).isEqualTo([5]);
    assertThat(zip([2], [3, 5], function(e1, e2) { return e1 + e2; })).isEqualTo([5]);
    assertThat(zip([2, 7], [3, 5], function(e1, e2) { return e1 + e2; })).isEqualTo([5, 12]);
    assertThat(zip([2, 7, 11], [3, 5], function(e1, e2) { return e1 + e2; })).isEqualTo([5, 12]);
    assertThat(zip([2, 7, 11], [3, 5, 13], function(e1, e2) { return e1 + e2; })).isEqualTo([5, 12, 24]);
};

UtilTest.prototype.testArraysEqualBy = function() {
    assertTrue(arraysEqualBy([], [], function() { throw "not called"; }));
    assertFalse(arraysEqualBy([1], [1, 2], function() { throw "not called"; }));

    var eqMod5 = function(e1, e2) { return e1 % 5 === e2 % 5; };
    assertTrue(arraysEqualBy([1], [1], eqMod5));
    assertTrue(arraysEqualBy([1], [11], eqMod5));
    assertFalse(arraysEqualBy([1], [2], eqMod5));

    assertTrue(arraysEqualBy([1, 2], [1, 2], eqMod5));
    assertTrue(arraysEqualBy([1, 2], [1, 7], eqMod5));
    assertFalse(arraysEqualBy([1, 2], [1, 1], eqMod5));
    assertFalse(arraysEqualBy([1, 2], [2, 1], eqMod5));
    assertFalse(arraysEqualBy([1, 2], [2, 2], eqMod5));

    assertTrue(arraysEqualBy([Complex.I, Complex.ZERO], [Complex.I, Complex.ZERO], arg2(Complex.prototype.isEqualTo)));
    assertFalse(arraysEqualBy([Complex.I, Complex.ZERO], [Complex.I, Complex.I], arg2(Complex.prototype.isEqualTo)));

    assertTrue(arraysEqualBy([1.5], [1.5], STRICT_EQUALITY));
    assertFalse(arraysEqualBy([1.5], [1], STRICT_EQUALITY));

    assertTrue(arraysEqualBy([Complex.from(1.5)], [Complex.from(1.5)], CUSTOM_IS_EQUAL_TO_EQUALITY));
    assertFalse(arraysEqualBy([Complex.from(1.5)], [Complex.from(1)], CUSTOM_IS_EQUAL_TO_EQUALITY));
};

UtilTest.prototype.testArg1 = function() {
    assertThat(arg1(Complex.prototype.norm2)(Complex.I)).isEqualTo(1);
};

UtilTest.prototype.testArg2 = function() {
    assertTrue(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.I));
    assertFalse(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.ZERO));
    assertTrue(arg2(Complex.prototype.plus)(Complex.I, Complex.I).isEqualTo(new Complex(0, 2)));
};
