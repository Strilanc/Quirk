CircuitTest = TestCase("CircuitTest");

CircuitTest.prototype.testFindOpHalfColumnAt = function() {
    var c = new Circuit(new Rect(10, 10, 200, 100), 9, [], null, undefined);
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

CircuitTest.prototype.testOpRect = function() {
    var c = new Circuit(new Rect(10, 10, 200, 100), 9, [], null, undefined);
    var w = GATE_RADIUS*2 + CIRCUIT_OP_HORIZONTAL_SPACING;
    var x = CIRCUIT_OP_LEFT_SPACING + 10;


    assertEquals(x + GATE_RADIUS, c.opRect(0).center().x);
    assertEquals(x + GATE_RADIUS + w, c.opRect(1).center().x);
    assertEquals(x + GATE_RADIUS + w*2, c.opRect(2).center().x);

    var d = new Circuit(new Rect(10, 10, 200, 100), 9, [], 1, undefined);

    assertEquals(x + GATE_RADIUS, d.opRect(0).center().x);
    assertEquals(x + GATE_RADIUS + w/2, d.opRect(1).center().x);
    assertEquals(x + GATE_RADIUS + w, d.opRect(2).center().x);
};

CircuitTest.prototype.testFindExistingOpColumnAt = function() {
    var col = new GateColumn(repeat(null, 9));
    var c0 = new Circuit(new Rect(10, 10, 200, 100), 9, repeat(col, 0), null, undefined);
    var c1 = new Circuit(new Rect(10, 10, 200, 100), 9, repeat(col, 1), null, undefined);
    var c3 = new Circuit(new Rect(10, 10, 200, 100), 9, repeat(col, 3), null, undefined);
    var w = GATE_RADIUS*2 + CIRCUIT_OP_HORIZONTAL_SPACING;
    var x = CIRCUIT_OP_LEFT_SPACING + 11;

    assertEquals(null, c0.findExistingOpColumnAt(new Point(x, 11)));
    assertEquals(null, c0.findExistingOpColumnAt(new Point(x + w*2/2, 11)));
    assertEquals(null, c1.findExistingOpColumnAt(new Point(x + w*2/2, 11)));
    assertEquals(null, c3.findExistingOpColumnAt(new Point(x + w*6/2, 11)));

    assertEquals(0, c1.findExistingOpColumnAt(new Point(x, 11)));
    assertEquals(0, c1.findExistingOpColumnAt(new Point(x + w/2, 11)));
    assertEquals(0, c1.findExistingOpColumnAt(new Point(x + w*0.999 - 1, 11)));

    assertEquals(0, c3.findExistingOpColumnAt(new Point(x, 11)));
    assertEquals(0, c3.findExistingOpColumnAt(new Point(x + w/2, 11)));
    assertEquals(1, c3.findExistingOpColumnAt(new Point(x + w*2/2, 11)));
    assertEquals(1, c3.findExistingOpColumnAt(new Point(x + w*3/2, 11)));
    assertEquals(2, c3.findExistingOpColumnAt(new Point(x + w*4/2, 11)));
    assertEquals(2, c3.findExistingOpColumnAt(new Point(x + w*5/2, 11)));
    assertEquals(2, c3.findExistingOpColumnAt(new Point(x + w*2.999 - 1, 11)));

    assertEquals(null, c3.findExistingOpColumnAt(new Point(x + 5000, 11)));
    assertEquals(null, c3.findExistingOpColumnAt(new Point(0, 11)));
    assertEquals(null, c3.findExistingOpColumnAt(new Point(x, 0)));
};

CircuitTest.prototype.testTryGrab = function() {
    var gates = repeat(null, 9);

    gates[1] = Gate.X;
    var area = new Rect(10, 10, 200, 1000);
    var c = new Circuit(area, 9, [new GateColumn(gates)], null, undefined);
    var p = c.gateRect(1, 0).center();

    var n_miss = c.tryGrab(new Hand(c.gateRect(0, 0).center(), null, null));
    assertTrue(n_miss.newCircuit.isEqualTo(c));
    assertTrue(n_miss.newHand.isEqualTo(new Hand(c.gateRect(0, 0).center(), null, null)));

    var n = c.tryGrab(new Hand(p, null, null));
    assertTrue(n.newCircuit.isEqualTo(new Circuit(area, 9, [new GateColumn(repeat(null, 9))], null, undefined)));
    assertTrue(n.newHand.isEqualTo(new Hand(p, new GateBlock([Gate.X]), 0)));
};
