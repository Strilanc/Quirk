UtilTest = TestCase("UtilTest");

UtilTest.prototype.testScan = function() {
    assertEquals([2], scan([], 2, function() { throw "do not call"; }));

    assertEquals([11], scan([], 11, function(a, e) { return a + e; }));
    assertEquals([11, 13], scan([2], 11, function(a, e) { return a + e; }));
    assertEquals([11, 13, 16], scan([2, 3], 11, function(a, e) { return a + e; }));
    assertEquals([11, 13, 16, 21], scan([2, 3, 5], 11, function(a, e) { return a + e; }));
};
