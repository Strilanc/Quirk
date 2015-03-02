import { assertTrue, assertFalse, assertThat, assertThrows, Suite } from "test/TestUtil.js"
import ControlMask from "src/quantum/ControlMask.js"

let suite = new Suite("ControlMask");

suite.test("isEqualTo", () => {
    let s = new ControlMask(0xF, 0xE);
    assertTrue(s.isEqualTo(s));
    assertFalse(s.isEqualTo(""));
    assertFalse(s.isEqualTo(null));

    assertThat(s.desiredValueMask).isEqualTo(0xE);
    assertThat(s.inclusionMask).isEqualTo(0xF);
    assertTrue(s.isEqualTo(new ControlMask(0xF, 0xE)));
    assertFalse(s.isEqualTo(new ControlMask(0, 0)));
    assertFalse(s.isEqualTo(new ControlMask(0xF, 0xF)));
    assertFalse(s.isEqualTo(new ControlMask(0xE, 0xE)));
    assertTrue(new ControlMask(0x3, 0x2).isEqualTo(new ControlMask(0x3, 0x2)));
    assertTrue(ControlMask.NO_CONTROLS.isEqualTo(new ControlMask(0, 0)));
});

suite.test("allowsState", () => {
    assertTrue(ControlMask.NO_CONTROLS.allowsState(0));
    assertTrue(ControlMask.NO_CONTROLS.allowsState(1));

    let m = new ControlMask(0x5, 0x1);
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
    assertThat(ControlMask.NO_CONTROLS.desiredValueFor(0)).isEqualTo(null);
    assertThat(ControlMask.NO_CONTROLS.desiredValueFor(1)).isEqualTo(null);

    let m = new ControlMask(0x5, 0x1);
    assertThat(m.desiredValueFor(0)).isEqualTo(true);
    assertThat(m.desiredValueFor(1)).isEqualTo(null);
    assertThat(m.desiredValueFor(2)).isEqualTo(false);
    assertThat(m.desiredValueFor(3)).isEqualTo(null);
});

suite.test("fromBitIs", () => {
    assertThat(ControlMask.fromBitIs(0, true)).isEqualTo(new ControlMask(0x1, 0x1));
    assertThat(ControlMask.fromBitIs(0, false)).isEqualTo(new ControlMask(0x1, 0x0));
    assertThat(ControlMask.fromBitIs(2, true)).isEqualTo(new ControlMask(0x4, 0x4));
    assertThat(ControlMask.fromBitIs(2, false)).isEqualTo(new ControlMask(0x4, 0x0));
});

suite.test("combine", () => {
    assertThat(ControlMask.NO_CONTROLS.combine(ControlMask.NO_CONTROLS)).isEqualTo(ControlMask.NO_CONTROLS);
    assertThat(ControlMask.NO_CONTROLS.desiredValueFor(1)).isEqualTo(null);

    let m = new ControlMask(0x5, 0x1);
    assertThat(ControlMask.fromBitIs(0, true).combine(ControlMask.fromBitIs(2, false))).isEqualTo(m);
    assertThat(ControlMask.fromBitIs(2, false).combine(ControlMask.fromBitIs(0, true))).isEqualTo(m);
    assertThat(ControlMask.NO_CONTROLS.combine(m)).isEqualTo(m);
    assertThat(m.combine(m)).isEqualTo(m);

    assertThrows(() => ControlMask.fromBitIs(0, true).combine(ControlMask.fromBitIs(0, false)));
});

suite.test("toString", () => {
    assertTrue(typeof(ControlMask.NO_CONTROLS.toString()) === "string");
    assertTrue(typeof(new ControlMask(0x5, 0x1).toString()) === "string");
});
