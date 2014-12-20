UtilTest = TestCase("UtilTest");

UtilTest.prototype.testScan = function() {
    assertEquals([2], scan([], 2, function() { throw "do not call"; }));

    assertEquals([11], scan([], 11, function(a, e) { return a + e; }));
    assertEquals([11, 13], scan([2], 11, function(a, e) { return a + e; }));
    assertEquals([11, 13, 16], scan([2, 3], 11, function(a, e) { return a + e; }));
    assertEquals([11, 13, 16, 21], scan([2, 3, 5], 11, function(a, e) { return a + e; }));
};

UtilTest.prototype.testInsertAt = function() {
    var r = [];

    insertAt(r, "a", 0);
    assertEquals(["a"], r);

    insertAt(r, "b", 0);
    assertEquals(["b", "a"], r);

    insertAt(r, "c", 2);
    assertEquals(["b", "a", "c"], r);

    insertAt(r, "d", 2);
    assertEquals(["b", "a", "d", "c"], r);
};

UtilTest.prototype.testWithItemReplacedAt = function() {
    assertEquals([-1], withItemReplacedAt([1], -1, 0));

    var r = ["a", "b", "c"];
    assertEquals(["d", "b", "c"], withItemReplacedAt(r, "d", 0));
    assertEquals(["a", "d", "c"], withItemReplacedAt(r, "d", 1));
    assertEquals(["a", "b", "d"], withItemReplacedAt(r, "d", 2));
};

UtilTest.prototype.testNotNull = function() {
    assertEquals([], notNull([]));
    assertEquals("", notNull(""));
};

UtilTest.prototype.testTake = function() {
    assertEquals([], take([], 0));

    assertEquals([], take(["a"], 0));
    assertEquals(["a"], take(["a"], 1));

    assertEquals([], take(["a", "b"], 0));
    assertEquals(["a"], take(["a", "b"], 1));
    assertEquals(["a", "b"], take(["a", "b"], 2));
};

UtilTest.prototype.testSum = function() {
    assertEquals(0, sum([]));
    assertEquals(2, sum([2]));
    assertEquals(5.5, sum([2, 3.5]));
};

UtilTest.prototype.testZip = function() {
    assertEquals([], zip([], [], function() { throw "not called"; }));
    assertEquals([5], zip([2], [3], function(e1, e2) { return e1 + e2; }));
    assertEquals([5], zip([2], [3, 5], function(e1, e2) { return e1 + e2; }));
    assertEquals([5, 12], zip([2, 7], [3, 5], function(e1, e2) { return e1 + e2; }));
    assertEquals([5, 12], zip([2, 7, 11], [3, 5], function(e1, e2) { return e1 + e2; }));
    assertEquals([5, 12, 24], zip([2, 7, 11], [3, 5, 13], function(e1, e2) { return e1 + e2; }));
};

UtilTest.prototype.testArg2 = function() {
    assertTrue(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.I));
    assertFalse(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.ZERO));
    assertTrue(arg2(Complex.prototype.plus)(Complex.I, Complex.I).isEqualTo(new Complex(0, 2)));
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
};

UtilTest.prototype.testEvenPower = function() {
    assertEquals(Math.POSITIVE_INFINITY, evenPower(0));
    assertEquals(0, evenPower(1));
    assertEquals(1, evenPower(2));
    assertEquals(0, evenPower(3));
    assertEquals(2, evenPower(4));
    assertEquals(0, evenPower(5));
    assertEquals(1, evenPower(6));
    assertEquals(0, evenPower(7));
    assertEquals(3, evenPower(8));
    assertEquals(0, evenPower(9));

    assertEquals(20, evenPower(0 + (1 << 20)));
    assertEquals(0, evenPower(1 + (1 << 20)));
    assertEquals(1, evenPower(2 + (1 << 20)));
};
