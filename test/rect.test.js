RectTest = TestCase("RectTest");

RectTest.prototype.testIsEqualTo = function() {
    var r = new Rect(2, 3, 5, 7);
    assertTrue(r.isEqualTo(r));
    assertTrue(r.isEqualTo(new Rect(2, 3, 5, 7)));
    assertTrue(new Rect(1, 2, 3, 4).isEqualTo(new Rect(1, 2, 3, 4)));
    assertFalse(r.isEqualTo(new Rect(1, 2, 3, 4)));

    assertFalse(r.isEqualTo(new Rect(1, 2, 5, 7)));
    assertFalse(r.isEqualTo(new Rect(2, 1, 5, 7)));
    assertFalse(r.isEqualTo(new Rect(2, 3, 1, 7)));
    assertFalse(r.isEqualTo(new Rect(2, 3, 5, 1)));

    assertFalse(r.isEqualTo(new Rect(2, 2, 5, 7)));
    assertFalse(r.isEqualTo(new Rect(3, 3, 5, 7)));
    assertFalse(r.isEqualTo(new Rect(2, 3, 5, 5)));
    assertFalse(r.isEqualTo(new Rect(2, 3, 7, 7)));
};

RectTest.prototype.testCenteredSquareWithRadius = function() {
    assertTrue(Rect.centeredSquareWithRadius({x: 2, y: 3}, 5).isEqualTo(new Rect(-3, -2, 10, 10)));
};

RectTest.prototype.testCenter = function() {
    assertEquals(4.5, new Rect(2, 3, 5, 7).center().x);
    assertEquals(6.5, new Rect(2, 3, 5, 7).center().y);
    assertEquals(6, new Rect(2, 3, 5, 6).center().y);
};

RectTest.prototype.testTopLeft = function() {
    assertEquals(2, new Rect(2, 3, 5, 7).topLeft().x);
    assertEquals(3, new Rect(2, 3, 5, 7).topLeft().y);
};

RectTest.prototype.testTopRight = function() {
    assertEquals(7, new Rect(2, 3, 5, 7).topRight().x);
    assertEquals(3, new Rect(2, 3, 5, 7).topRight().y);
};

RectTest.prototype.testBottomLeft = function() {
    assertEquals(2, new Rect(2, 3, 5, 7).bottomLeft().x);
    assertEquals(10, new Rect(2, 3, 5, 7).bottomLeft().y);
};

RectTest.prototype.testBottomRight = function() {
    assertEquals(7, new Rect(2, 3, 5, 7).bottomRight().x);
    assertEquals(10, new Rect(2, 3, 5, 7).bottomRight().y);
};

RectTest.prototype.testCenterLeft = function() {
    assertEquals(2, new Rect(2, 3, 5, 7).centerLeft().x);
    assertEquals(6.5, new Rect(2, 3, 5, 7).centerLeft().y);
};

RectTest.prototype.testCenterRight = function() {
    assertEquals(7, new Rect(2, 3, 5, 7).centerRight().x);
    assertEquals(6.5, new Rect(2, 3, 5, 7).centerRight().y);
};

RectTest.prototype.testTopCenter = function() {
    assertEquals(4.5, new Rect(2, 3, 5, 7).topCenter().x);
    assertEquals(3, new Rect(2, 3, 5, 7).topCenter().y);
};

RectTest.prototype.testBottomCenter = function() {
    assertEquals(4.5, new Rect(2, 3, 5, 7).bottomCenter().x);
    assertEquals(10, new Rect(2, 3, 5, 7).bottomCenter().y);
};

RectTest.prototype.testRight = function() {
    assertEquals(7, new Rect(2, 3, 5, 7).right());
};

RectTest.prototype.testBottom = function() {
    assertEquals(10, new Rect(2, 3, 5, 7).bottom());
};

RectTest.prototype.testSkipLeft = function() {
    assertTrue(new Rect(2, 3, 5, 7).skipLeft(0).isEqualTo(new Rect(2, 3, 5, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipLeft(1).isEqualTo(new Rect(3, 3, 4, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipLeft(4).isEqualTo(new Rect(6, 3, 1, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipLeft(5).isEqualTo(new Rect(7, 3, 0, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipLeft(6).isEqualTo(new Rect(7, 3, 0, 7)));
};

RectTest.prototype.testSkipRight = function() {
    assertTrue(new Rect(2, 3, 5, 7).skipRight(0).isEqualTo(new Rect(2, 3, 5, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipRight(1).isEqualTo(new Rect(2, 3, 4, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipRight(4).isEqualTo(new Rect(2, 3, 1, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipRight(5).isEqualTo(new Rect(2, 3, 0, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipRight(6).isEqualTo(new Rect(2, 3, 0, 7)));
};

RectTest.prototype.testSkipTop = function() {
    assertTrue(new Rect(2, 3, 5, 7).skipTop(0).isEqualTo(new Rect(2, 3, 5, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipTop(1).isEqualTo(new Rect(2, 4, 5, 6)));
    assertTrue(new Rect(2, 3, 5, 7).skipTop(6).isEqualTo(new Rect(2, 9, 5, 1)));
    assertTrue(new Rect(2, 3, 5, 7).skipTop(7).isEqualTo(new Rect(2, 10, 5, 0)));
    assertTrue(new Rect(2, 3, 5, 7).skipTop(8).isEqualTo(new Rect(2, 10, 5, 0)));
};

RectTest.prototype.testSkipBottom = function() {
    assertTrue(new Rect(2, 3, 5, 7).skipBottom(0).isEqualTo(new Rect(2, 3, 5, 7)));
    assertTrue(new Rect(2, 3, 5, 7).skipBottom(1).isEqualTo(new Rect(2, 3, 5, 6)));
    assertTrue(new Rect(2, 3, 5, 7).skipBottom(6).isEqualTo(new Rect(2, 3, 5, 1)));
    assertTrue(new Rect(2, 3, 5, 7).skipBottom(7).isEqualTo(new Rect(2, 3, 5, 0)));
    assertTrue(new Rect(2, 3, 5, 7).skipBottom(8).isEqualTo(new Rect(2, 3, 5, 0)));
};

RectTest.prototype.testTakeLeft = function() {
    assertTrue(new Rect(2, 3, 5, 7).takeLeft(-1).isEqualTo(new Rect(2, 3, 0, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeLeft(0).isEqualTo(new Rect(2, 3, 0, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeLeft(1).isEqualTo(new Rect(2, 3, 1, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeLeft(4).isEqualTo(new Rect(2, 3, 4, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeLeft(5).isEqualTo(new Rect(2, 3, 5, 7)));
};

RectTest.prototype.testTakeRight = function() {
    assertTrue(new Rect(2, 3, 5, 7).takeRight(-1).isEqualTo(new Rect(7, 3, 0, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeRight(0).isEqualTo(new Rect(7, 3, 0, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeRight(1).isEqualTo(new Rect(6, 3, 1, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeRight(4).isEqualTo(new Rect(3, 3, 4, 7)));
    assertTrue(new Rect(2, 3, 5, 7).takeRight(5).isEqualTo(new Rect(2, 3, 5, 7)));
};

RectTest.prototype.testTakeTop = function() {
    assertTrue(new Rect(2, 3, 5, 7).takeTop(-1).isEqualTo(new Rect(2, 3, 5, 0)));
    assertTrue(new Rect(2, 3, 5, 7).takeTop(0).isEqualTo(new Rect(2, 3, 5, 0)));
    assertTrue(new Rect(2, 3, 5, 7).takeTop(1).isEqualTo(new Rect(2, 3, 5, 1)));
    assertTrue(new Rect(2, 3, 5, 7).takeTop(6).isEqualTo(new Rect(2, 3, 5, 6)));
    assertTrue(new Rect(2, 3, 5, 7).takeTop(7).isEqualTo(new Rect(2, 3, 5, 7)));
};

RectTest.prototype.testTakeBottom = function() {
    assertTrue(new Rect(2, 3, 5, 7).takeBottom(-1).isEqualTo(new Rect(2, 10, 5, 0)));
    assertTrue(new Rect(2, 3, 5, 7).takeBottom(0).isEqualTo(new Rect(2, 10, 5, 0)));
    assertTrue(new Rect(2, 3, 5, 7).takeBottom(1).isEqualTo(new Rect(2, 9, 5, 1)));
    assertTrue(new Rect(2, 3, 5, 7).takeBottom(6).isEqualTo(new Rect(2, 4, 5, 6)));
    assertTrue(new Rect(2, 3, 5, 7).takeBottom(7).isEqualTo(new Rect(2, 3, 5, 7)));
};

RectTest.prototype.testPaddedBy = function() {
    assertTrue(new Rect(2, 3, 5, 7).paddedBy(0).isEqualTo(new Rect(2, 3, 5, 7)));
    assertTrue(new Rect(2, 3, 5, 7).paddedBy(1).isEqualTo(new Rect(1, 2, 7, 9)));
    assertTrue(new Rect(2, 3, 5, 7).paddedBy(2).isEqualTo(new Rect(0, 1, 9, 11)));
};

RectTest.prototype.testContainsPoint = function() {
    var r = new Rect(2, 3, 5, 7);
    assertTrue(r.containsPoint(r.center()));

    // Strictness
    assertTrue(r.containsPoint(r.topLeft()));
    assertFalse(r.containsPoint(r.topRight()));
    assertFalse(r.containsPoint(r.bottomLeft()));
    assertFalse(r.containsPoint(r.bottomRight()));

    // Left
    assertFalse(r.containsPoint({x: 2-0.001, y: 5}));
    assertTrue(r.containsPoint({x: 2+0.001, y: 5}));

    // Top
    assertFalse(r.containsPoint({x: 5, y: 3-0.001}));
    assertTrue(r.containsPoint({x: 5, y: 3+0.001}));

    // Right
    assertTrue(r.containsPoint({x: 7-0.001, y: 5}));
    assertFalse(r.containsPoint({x: 7+0.001, y: 5}));

    // Bottom
    assertTrue(r.containsPoint({x: 5, y: 10-0.001}));
    assertFalse(r.containsPoint({x: 5, y: 10+0.001}));
};

RectTest.prototype.testLeftHalf = function() {
    assertTrue(new Rect(2, 3, 5, 7).leftHalf().isEqualTo(new Rect(2, 3, 2.5, 7)));
};

RectTest.prototype.testRightHalf = function() {
    assertTrue(new Rect(2, 3, 5, 7).rightHalf().isEqualTo(new Rect(4.5, 3, 2.5, 7)));
};

RectTest.prototype.testTopHalf = function() {
    assertTrue(new Rect(2, 3, 5, 7).topHalf().isEqualTo(new Rect(2, 3, 5, 3.5)));
};

RectTest.prototype.testBottomHalf = function() {
    assertTrue(new Rect(2, 3, 5, 7).bottomHalf().isEqualTo(new Rect(2, 6.5, 5, 3.5)));
};
