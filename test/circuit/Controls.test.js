import { assertTrue, assertFalse, assertThat, assertThrows, Suite } from "test/TestUtil.js"
import Controls from "src/circuit/Controls.js"

let suite = new Suite("Controls");

suite.test("isEqualTo", () => {
    let s = new Controls(0xF, 0xE);
    assertTrue(s.isEqualTo(s));
    assertFalse(s.isEqualTo(""));
    assertFalse(s.isEqualTo(null));

    assertThat(s.desiredValueMask).isEqualTo(0xE);
    assertThat(s.inclusionMask).isEqualTo(0xF);
    assertTrue(s.isEqualTo(new Controls(0xF, 0xE)));
    assertFalse(s.isEqualTo(new Controls(0, 0)));
    assertFalse(s.isEqualTo(new Controls(0xF, 0xF)));
    assertFalse(s.isEqualTo(new Controls(0xE, 0xE)));
    assertTrue(new Controls(0x3, 0x2).isEqualTo(new Controls(0x3, 0x2)));
    assertTrue(Controls.NO_CONTROLS.isEqualTo(new Controls(0, 0)));
});

suite.test("allowsState", () => {
    assertTrue(Controls.NO_CONTROLS.allowsState(0));
    assertTrue(Controls.NO_CONTROLS.allowsState(1));

    let m = new Controls(0x5, 0x1);
    assertFalse(m.allowsState(0));
    assertTrue(m.allowsState(1));
    assertFalse(m.allowsState(2));
    assertTrue(m.allowsState(3));
    assertFalse(m.allowsState(4));
    assertFalse(m.allowsState(5));
    assertFalse(m.allowsState(6));
    assertFalse(m.allowsState(7));
    assertFalse(m.allowsState(8));
    assertTrue(m.allowsState(9));
});

suite.test("desiredValueFor", () => {
    assertThat(Controls.NO_CONTROLS.desiredValueFor(0)).isEqualTo(null);
    assertThat(Controls.NO_CONTROLS.desiredValueFor(1)).isEqualTo(null);

    let m = new Controls(0x5, 0x1);
    assertThat(m.desiredValueFor(0)).isEqualTo(true);
    assertThat(m.desiredValueFor(1)).isEqualTo(null);
    assertThat(m.desiredValueFor(2)).isEqualTo(false);
    assertThat(m.desiredValueFor(3)).isEqualTo(null);
});

suite.test("fromBitIs", () => {
    assertThat(Controls.fromBitIs(0, true)).isEqualTo(new Controls(0x1, 0x1));
    assertThat(Controls.fromBitIs(0, false)).isEqualTo(new Controls(0x1, 0x0));
    assertThat(Controls.fromBitIs(2, true)).isEqualTo(new Controls(0x4, 0x4));
    assertThat(Controls.fromBitIs(2, false)).isEqualTo(new Controls(0x4, 0x0));
});

suite.test("combine", () => {
    assertThat(Controls.NO_CONTROLS.combine(Controls.NO_CONTROLS)).isEqualTo(Controls.NO_CONTROLS);
    assertThat(Controls.NO_CONTROLS.desiredValueFor(1)).isEqualTo(null);

    let m = new Controls(0x5, 0x1);
    assertThat(Controls.fromBitIs(0, true).combine(Controls.fromBitIs(2, false))).isEqualTo(m);
    assertThat(Controls.fromBitIs(2, false).combine(Controls.fromBitIs(0, true))).isEqualTo(m);
    assertThat(Controls.NO_CONTROLS.combine(m)).isEqualTo(m);
    assertThat(m.combine(m)).isEqualTo(m);

    assertThrows(() => Controls.fromBitIs(0, true).combine(Controls.fromBitIs(0, false)));
});

suite.test("toString", () => {
    assertTrue(typeof(Controls.NO_CONTROLS.toString()) === "string");
    assertTrue(typeof(new Controls(0x5, 0x1).toString()) === "string");
});
