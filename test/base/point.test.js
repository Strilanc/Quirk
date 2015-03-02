import { assertThat } from "test/TestUtil.js"
import Point from "src/base/Point.js"

let Test = TestCase("PointTest");

Test.prototype.testIsEqualTo = () => {
    var p = new Point(2, 3);
    assertThat(p).isEqualTo(p);
    assertThat(p).isNotEqualTo(null);
    assertThat(p).isNotEqualTo("");

    assertThat(p).isEqualTo(new Point(2, 3));
    assertThat(p).isNotEqualTo(new Point(2, 4));
    assertThat(p).isNotEqualTo(new Point(1, 3));
};

Test.prototype.testToString = () => {
    assertThat(new Point(2, 3).toString()).isEqualTo("(x: 2, y: 3)");
};

Test.prototype.testOffsetBy = () => {
    assertThat(new Point(2, 3).offsetBy(5, 7)).isEqualTo(new Point(7, 10));
};

Test.prototype.testPlus = () => {
    assertThat(new Point(2, 3).plus(new Point(5, 7))).isEqualTo(new Point(7, 10));
};

Test.prototype.testTimes = () => {
    assertThat(new Point(2, 3).times(5)).isEqualTo(new Point(10, 15));
};
