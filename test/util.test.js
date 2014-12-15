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
