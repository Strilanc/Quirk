import { Suite, assertThat, assertTrue, assertFalse } from "test/TestUtil.js"
import Point from "src/math/Point.js"

let suite = new Suite("Point");

suite.test("isEqualTo", () => {
    let p = new Point(2, 3);
    assertTrue(p.isEqualTo(p));
    assertFalse(p.isEqualTo(null));
    assertFalse(p.isEqualTo(""));

    assertTrue(p.isEqualTo(new Point(2, 3)));
    assertFalse(p.isEqualTo(new Point(2, 4)));
    assertFalse(p.isEqualTo(new Point(1, 3)));

    // Interops with assertThat.
    assertThat(p).isEqualTo(new Point(2, 3));
    assertThat(p).isNotEqualTo(new Point(2, 4));
});

suite.test("toString", () => {
    assertThat(new Point(2, 3).toString()).isEqualTo("(x: 2, y: 3)");
});

suite.test("offsetBy", () => {
    assertThat(new Point(2, 3).offsetBy(5, 7)).isEqualTo(new Point(7, 10));
});

suite.test("plus", () => {
    assertThat(new Point(2, 3).plus(new Point(5, 7))).isEqualTo(new Point(7, 10));
});

suite.test("times", () => {
    assertThat(new Point(2, 3).times(5)).isEqualTo(new Point(10, 15));
});
