import { assertThat } from "test/test.js"
import Point from "src/base/point.js"

let PointTest = TestCase("PointTest");

PointTest.prototype.testIsEqualTo = function() {
    var p = new Point(2, 3);
    assertThat(p).isEqualTo(p);
    assertThat(p).isNotEqualTo(null);
    assertThat(p).isNotEqualTo("");

    assertThat(p).isEqualTo(new Point(2, 3));
    assertThat(p).isNotEqualTo(new Point(2, 4));
    assertThat(p).isNotEqualTo(new Point(1, 3));
};

PointTest.prototype.testToString = function() {
    assertThat(new Point(2, 3).toString()).isEqualTo("(x: 2, y: 3)");
};

PointTest.prototype.testOffsetBy = function() {
    assertThat(new Point(2, 3).offsetBy(5, 7)).isEqualTo(new Point(7, 10));
};

PointTest.prototype.testPlus = function() {
    assertThat(new Point(2, 3).plus(new Point(5, 7))).isEqualTo(new Point(7, 10));
};

PointTest.prototype.testTimes = function() {
    assertThat(new Point(2, 3).times(5)).isEqualTo(new Point(10, 15));
};
