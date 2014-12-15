PointTest = TestCase("PointTest");

PointTest.prototype.testIsEqualTo = function() {
    var p = new Point(2, 3);
    assertTrue(p.isEqualTo(p));
    assertFalse(p.isEqualTo(null));
    assertFalse(p.isEqualTo(""));

    assertTrue(p.isEqualTo(new Point(2, 3)));
    assertFalse(p.isEqualTo(new Point(2, 4)));
    assertFalse(p.isEqualTo(new Point(1, 3)));
};

PointTest.prototype.testOffsetBy = function() {
    assertTrue(new Point(2, 3).offsetBy(5, 7).isEqualTo(new Point(7, 10)));
};

PointTest.prototype.testPlus = function() {
    assertTrue(new Point(2, 3).plus(new Point(5, 7)).isEqualTo(new Point(7, 10)));
};

