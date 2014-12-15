CircuitTest = TestCase("CircuitTest");

CircuitTest.prototype.testFindOpHalfColumnAt = function() {
    var c = new Circuit(new Rect(10, 10, 200, 100), 9, [], null);
    var w = GATE_RADIUS*2 + CIRCUIT_OP_HORIZONTAL_SPACING;
    var x = CIRCUIT_OP_LEFT_SPACING + 11;

    assertEquals(-0.5, c.findOpHalfColumnAt(new Point(x, 11)));
    assertEquals(0, c.findOpHalfColumnAt(new Point(x + w/2, 11)));
    assertEquals(0.5, c.findOpHalfColumnAt(new Point(x + w, 11)));
    assertEquals(1, c.findOpHalfColumnAt(new Point(x + w*3/2, 11)));

    assertEquals(null, c.findOpHalfColumnAt(new Point(x + 5000, 11)));
    assertEquals(null, c.findOpHalfColumnAt(new Point(0, 11)));
    assertEquals(null, c.findOpHalfColumnAt(new Point(x, 0)));
};

CircuitTest.prototype.testFindOpHalfColumnAt = function() {
    var c = new Circuit(new Rect(10, 10, 200, 100), 9, [], null);
    var w = GATE_RADIUS*2 + CIRCUIT_OP_HORIZONTAL_SPACING;
    var x = CIRCUIT_OP_LEFT_SPACING + 10;


    assertEquals(x + GATE_RADIUS, c.opRect(0).center().x);
    assertEquals(x + GATE_RADIUS + w, c.opRect(1).center().x);
    assertEquals(x + GATE_RADIUS + w*2, c.opRect(2).center().x);

    var d = new Circuit(new Rect(10, 10, 200, 100), 9, [], 1);

    assertEquals(x + GATE_RADIUS, d.opRect(0).center().x);
    assertEquals(x + GATE_RADIUS + w/2, d.opRect(1).center().x);
    assertEquals(x + GATE_RADIUS + w, d.opRect(2).center().x);
};
