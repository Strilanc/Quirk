ArrayUtilTest = TestCase("ArrayUtilTest");

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
    assertThat([1.5].maxBy(function(e) { throw "do no call"; })).isEqualTo(1.5);
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

UtilTest.prototype.testArraysEqualBy = function() {
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
