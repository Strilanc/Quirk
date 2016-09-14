import { Suite, assertThat, assertThrows, assertTrue, assertFalse } from "test/TestUtil.js"
import Axis from "src/math/Axis.js"

let suite = new Suite("Axis");

suite.test("isEqualTo", () => {
    let groups = [
        [new Axis(0, 0, 0), new Axis(0, 0, 0)],
        [new Axis(1, 0, 0), new Axis(1, 0, 0)],
        [new Axis(0, 1, 0), new Axis(0, 1, 0)],
        [new Axis(0, 0, 1), new Axis(0, 0, 1)],
        [new Axis(1, 2, 3), new Axis(1, 2, 3)],
        [new Axis(4, 5, 6)]
    ];

    for (let g1 of groups) {
        for (let g2 of groups) {
            for (let e1 of g1) {
                for (let e2 of g2) {
                    if (g1 === g2) {
                        assertThat(e1).isEqualTo(e2);
                        assertTrue(e1.isEqualTo(e2));
                    } else {
                        assertThat(e1).isNotEqualTo(e2);
                        assertFalse(e1.isEqualTo(e2));
                    }
                }
            }
        }
    }

    assertThat(new Axis(0, 0, 0)).isNotEqualTo(0);
    assertThat(new Axis(0, 0, 0)).isNotEqualTo("");
});

suite.test("parse", () => {
    assertThrows(() => Axis.parse(""));
    assertThrows(() => Axis.parse("0"));
    assertThrows(() => Axis.parse("abc"));
    assertThrows(() => Axis.parse("x*y"));
    assertThrows(() => Axis.parse("x^y"));
    assertThrows(() => Axis.parse("x/y"));

    assertThat(Axis.parse("x")).isEqualTo(new Axis(1, 0, 0));
    assertThat(Axis.parse("y")).isEqualTo(new Axis(0, 1, 0));
    assertThat(Axis.parse("z")).isEqualTo(new Axis(0, 0, 1));

    assertThat(Axis.parse("sqrt --4 x")).isEqualTo(new Axis(2, 0, 0));

    assertThat(Axis.parse("2z+3y-5x-x")).isEqualTo(new Axis(-6, 3, 2));
    assertThat(Axis.parse("2z*6^2+3y-5x-x")).isEqualTo(new Axis(-6, 3, 72));
});
