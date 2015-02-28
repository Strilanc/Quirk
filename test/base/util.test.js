import { assertThat, assertThrows } from "test/test.js"
import Util from "src/base/util.js"

let UtilTest = TestCase("UtilTest");

UtilTest.prototype.testNotNull = function() {
    assertThat(Util.notNull([])).isEqualTo([]);
    assertThat(Util.notNull("")).isEqualTo("");
};

UtilTest.prototype.testLg = function() {
    assertThrows(() => Util.lg(0));
    assertThrows(() => Util.lg(-1));
    assertThat(Util.lg(0.25)).isEqualTo(-2);
    assertThat(Util.lg(0.5)).isEqualTo(-1);
    assertThat(Util.lg(1)).isEqualTo(0);
    assertThat(Util.lg(2)).isEqualTo(1);
    assertThat(Util.lg(4)).isEqualTo(2);
    assertThat(Util.lg(8)).isEqualTo(3);
    assertThat(Util.lg(12345)).isApproximatelyEqualTo(13.5916392160301442);
    assertThat(Util.lg(1 << 10)).isEqualTo(10);
};

//UtilTest.prototype.testMaskCandidates = function() {
//    assertThrows(() => Util.maskCandidates(-1));
//    assertThat(Util.maskCandidates(0)).isEqualTo([0]);
//    assertThat(Util.maskCandidates(1)).isEqualTo([0, 1]);
//    assertThat(Util.maskCandidates(2)).isEqualTo([0, 2]);
//    assertThat(Util.maskCandidates(3)).isEqualTo([0, 1, 2, 3]);
//    assertThat(Util.maskCandidates(4)).isEqualTo([0, 4]);
//    assertThat(Util.maskCandidates(5)).isEqualTo([0, 1, 4, 5]);
//    assertThat(Util.maskCandidates(6)).isEqualTo([0, 2, 4, 6]);
//    assertThat(Util.maskCandidates(7)).isEqualTo([0, 1, 2, 3, 4, 5, 6, 7]);
//    assertThat(Util.maskCandidates(8)).isEqualTo([0, 8]);
//    assertThat(Util.maskCandidates(9)).isEqualTo([0, 1, 8, 9]);
//    assertThat(Util.maskCandidates((1 << 20) + (1 << 10))).isEqualTo([0, 1 << 10, 1 << 20, (1 << 10) + (1 << 20)]);
//};

//UtilTest.prototype.testIsPowerOf2 = function() {
//    assertFalse(isPowerOf2(-1));
//    assertFalse(isPowerOf2(0));
//    assertTrue(isPowerOf2(1));
//    assertTrue(isPowerOf2(2));
//    assertFalse(isPowerOf2(3));
//    assertTrue(isPowerOf2(4));
//    assertFalse(isPowerOf2(5));
//};
//
//UtilTest.prototype.testBitSize = function() {
//    assertThat(bitSize(0)).isEqualTo(0);
//    assertThat(bitSize(1)).isEqualTo(1);
//    assertThat(bitSize(2)).isEqualTo(2);
//    assertThat(bitSize(3)).isEqualTo(2);
//    assertThat(bitSize(4)).isEqualTo(3);
//    assertThat(bitSize(5)).isEqualTo(3);
//    assertThat(bitSize(6)).isEqualTo(3);
//    assertThat(bitSize(7)).isEqualTo(3);
//    assertThat(bitSize(8)).isEqualTo(4);
//    assertThat(bitSize(9)).isEqualTo(4);
//    assertThat(bitSize(1 << 20)).isEqualTo(21);
//    assertThat(bitSize((1 << 20) + (1 << 19))).isEqualTo(21);
//};
//
//UtilTest.prototype.testEvenPower = function() {
//    assertThat(evenPower(-2)).isEqualTo(1);
//    assertThat(evenPower(-1)).isEqualTo(0);
//    assertThat(evenPower(0)).isEqualTo(Math.POSITIVE_INFINITY);
//    assertThat(evenPower(1)).isEqualTo(0);
//    assertThat(evenPower(2)).isEqualTo(1);
//    assertThat(evenPower(3)).isEqualTo(0);
//    assertThat(evenPower(4)).isEqualTo(2);
//    assertThat(evenPower(5)).isEqualTo(0);
//    assertThat(evenPower(6)).isEqualTo(1);
//    assertThat(evenPower(7)).isEqualTo(0);
//    assertThat(evenPower(8)).isEqualTo(3);
//    assertThat(evenPower(9)).isEqualTo(0);
//
//    assertThat(evenPower(1 << 20)).isEqualTo(20);
//    assertThat(evenPower(1 + (1 << 20))).isEqualTo(0);
//    assertThat(evenPower(2 + (1 << 20))).isEqualTo(1);
//};
//
//UtilTest.prototype.testArg1 = function() {
//    assertThat(arg1(Complex.prototype.norm2)(Complex.I)).isEqualTo(1);
//};
//
//UtilTest.prototype.testArg2 = function() {
//    assertTrue(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.I));
//    assertFalse(arg2(Complex.prototype.isEqualTo)(Complex.I, Complex.ZERO));
//    assertTrue(arg2(Complex.prototype.plus)(Complex.I, Complex.I).isEqualTo(new Complex(0, 2)));
//};
//
//UtilTest.prototype.testIsNumber = function() {
//    assertTrue(isNumber(0));
//    assertTrue(isNumber(1));
//    assertTrue(isNumber(-1));
//    assertTrue(isNumber(1.5));
//    assertTrue(isNumber(Math.PI));
//    assertTrue(isNumber(NaN));
//    assertTrue(isNumber(-Infinity));
//    assertTrue(isNumber(Infinity));
//    assertTrue(isNumber(1 << 31));
//    assertTrue(isNumber(~0));
//
//    assertFalse(isNumber(""));
//    assertFalse(isNumber("0"));
//    assertFalse(isNumber({}));
//    assertFalse(isNumber(null));
//    assertFalse(isNumber(undefined));
//    assertFalse(isNumber([]));
//};
//
//UtilTest.prototype.testIsInt = function() {
//    assertTrue(isInt(0));
//    assertTrue(isInt(1));
//    assertTrue(isInt(-1));
//    assertTrue(isInt(1 << 31));
//    assertTrue(isInt(~0));
//
//    assertFalse(isInt(1.5));
//    assertFalse(isInt(Math.PI));
//    assertFalse(isInt(NaN));
//    assertFalse(isInt(-Infinity));
//    assertFalse(isInt(Infinity));
//    assertFalse(isInt(""));
//    assertFalse(isInt("0"));
//    assertFalse(isInt({}));
//    assertFalse(isInt(null));
//    assertFalse(isInt(undefined));
//    assertFalse(isInt([]));
//};
//
//UtilTest.prototype.testIsString = function() {
//    assertTrue(isString(""));
//    assertTrue(isString("0"));
//    assertTrue(isString("abc"));
//
//    assertFalse(isString({}));
//    assertFalse(isString(null));
//    assertFalse(isString(undefined));
//    assertFalse(isString([]));
//    assertFalse(isString(0));
//    assertFalse(isString(NaN));
//    assertFalse(isString(Infinity));
//};
//
//UtilTest.prototype.testFloatToCompactString = function() {
//    assertThat(floatToCompactString(0)).isEqualTo("0");
//    assertThat(floatToCompactString(1)).isEqualTo("1");
//    assertThat(floatToCompactString(0.5)).isEqualTo("\u00BD");
//    assertThat(floatToCompactString(2)).isEqualTo("2");
//    assertThat(floatToCompactString(-1/3)).isEqualTo("-\u2153");
//    assertThat(floatToCompactString(Math.sqrt(1/2))).isEqualTo("\u221A\u00BD");
//
//    assertThat(floatToCompactString(1/Math.sqrt(2))).isNotEqualTo("\u221A\u00BD");
//    assertThat(floatToCompactString(1/Math.sqrt(2), 0)).isEqualTo("0.7071067811865475");
//    assertThat(floatToCompactString(1/Math.sqrt(2), 0.00000001)).isEqualTo("\u221A\u00BD");
//    assertThat(floatToCompactString(1/Math.sqrt(2)+0.0001, 0.001)).isEqualTo("\u221A\u00BD");
//    assertThat(floatToCompactString(1/Math.sqrt(2)+0.0001, 0.00000001)).isNotEqualTo("\u221A\u00BD");
//
//    assertThat(floatToCompactString(0.342123)).isEqualTo("0.342123");
//    assertThat(floatToCompactString(0.342123, undefined, 2)).isEqualTo("0.34");
//    assertThat(floatToCompactString(0.342123, undefined, 8)).isEqualTo("0.34212300");
//    assertThat(floatToCompactString(501, undefined, 8)).isEqualTo("501");
//};
//
//UtilTest.prototype.testParseFloatFromCompactString = function() {
//    assertThat(parseFloatFromCompactString("0")).isEqualTo(0);
//    assertThat(parseFloatFromCompactString("1")).isEqualTo(1);
//    assertThat(parseFloatFromCompactString("-1")).isEqualTo(-1);
//
//    assertThat(parseFloatFromCompactString("\u00BD")).isEqualTo(0.5);
//    assertThat(parseFloatFromCompactString("2")).isEqualTo(2);
//    assertThat(parseFloatFromCompactString("501")).isEqualTo(501);
//    assertThat(parseFloatFromCompactString("\u221A2")).isEqualTo(Math.sqrt(2));
//    assertThat(parseFloatFromCompactString("-\u221A3")).isEqualTo(-Math.sqrt(3));
//
//    assertThat(parseFloatFromCompactString("0.7071067811865475")).isEqualTo(1/Math.sqrt(2));
//    assertThat(parseFloatFromCompactString("0.7071067811865476")).isEqualTo(Math.sqrt(1/2));
//    assertThat(parseFloatFromCompactString("\u221A\u00BD")).isEqualTo(Math.sqrt(1/2));
//    assertThat(parseFloatFromCompactString("-\u2153")).isEqualTo(-1/3);
//
//    assertThat(parseFloatFromCompactString("0.34")).isEqualTo(0.34);
//    assertThat(parseFloatFromCompactString("0.342123")).isEqualTo(0.342123);
//    assertThat(parseFloatFromCompactString("0.342123000")).isEqualTo(0.342123000);
//};
//
//UtilTest.prototype.testRoundToNearbyFractionOrRoot = function() {
//    assertThat(roundToNearbyFractionOrRoot(1/Math.sqrt(2), 0.0001)).isEqualTo(Math.sqrt(1/2));
//    assertThat(roundToNearbyFractionOrRoot(-1/3+0.0000001, 0.001)).isEqualTo(-1/3);
//    assertThat(roundToNearbyFractionOrRoot(1/3+0.0000001, 0.001)).isEqualTo(1/3);
//    assertThat(roundToNearbyFractionOrRoot(1/3+0.01, 0.001)).isNotEqualTo(1/3);
//    assertThat(roundToNearbyFractionOrRoot(0.1234, 0.0001)).isEqualTo(0.1234);
//    assertThat(roundToNearbyFractionOrRoot(0, 0.0001)).isEqualTo(0);
//};
//
//UtilTest.prototype.testCacheFunc1 = function() {
//    var calls = [];
//    var func = cacheFunc1(function(i) {
//        calls.push(i);
//        return [i];
//    });
//
//    assertThat(calls).isEqualTo([]);
//
//    assertThat(func(1)).isEqualTo([1]);
//    assertThat(calls).isEqualTo([1]);
//
//    assertThat(func(3)).isEqualTo([3]);
//    assertThat(calls).isEqualTo([1, 3]);
//
//    assertThat(func(1)).isEqualTo([1]);
//    assertThat(calls).isEqualTo([1, 3]);
//
//    assertThat(func(1)).isEqualTo([1]);
//    assertThat(calls).isEqualTo([1, 3]);
//
//    assertThat(func(2)).isEqualTo([2]);
//    assertThat(calls).isEqualTo([1, 3, 2]);
//};
//
//UtilTest.prototype.testCacheFunc2 = function() {
//    var calls = [];
//    var func = cacheFunc2(function(i, j) {
//        calls.push([i, j]);
//        return [i, j];
//    });
//
//    assertThat(calls).isEqualTo([]);
//
//    assertThat(func(1, 2)).isEqualTo([1, 2]);
//    assertThat(calls).isEqualTo([[1, 2]]);
//
//    assertThat(func(2, 1)).isEqualTo([2, 1]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1]]);
//
//    assertThat(func(2, 2)).isEqualTo([2, 2]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2]]);
//
//    assertThat(func(2, 1)).isEqualTo([2, 1]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2]]);
//
//    assertThat(func(100, -2)).isEqualTo([100, -2]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2], [100, -2]]);
//
//    assertThat(func(1, 2)).isEqualTo([1, 2]);
//    assertThat(calls).isEqualTo([[1, 2], [2, 1], [2, 2], [100, -2]]);
//};
//
//UtilTest.prototype.testCacheFunc3 = function() {
//    var calls = [];
//    var func = cacheFunc3(function(i, j, k) {
//        calls.push([i, j, k]);
//        return [i, j, k];
//    });
//
//    assertThat(calls).isEqualTo([]);
//
//    assertThat(func(1, 2, 3)).isEqualTo([1, 2, 3]);
//    assertThat(calls).isEqualTo([[1, 2, 3]]);
//
//    assertThat(func(2, 1, 4)).isEqualTo([2, 1, 4]);
//    assertThat(calls).isEqualTo([[1, 2, 3], [2, 1, 4]]);
//
//    assertThat(func(1, 2, 3)).isEqualTo([1, 2, 3]);
//    assertThat(calls).isEqualTo([[1, 2, 3], [2, 1, 4]]);
//};
