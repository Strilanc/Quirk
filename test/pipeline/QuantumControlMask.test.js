import { assertTrue, assertFalse, assertThat, assertThrows, Suite } from "test/TestUtil.js"
import QuantumControlMask from "src/pipeline/QuantumControlMask.js"

let suite = new Suite("QuantumControlMask");

suite.test("isEqualTo", () => {
    let s = new QuantumControlMask(0xF, 0xE);
    assertTrue(s.isEqualTo(s));
    assertFalse(s.isEqualTo(""));
    assertFalse(s.isEqualTo(null));

    assertThat(s.desiredValueMask).isEqualTo(0xE);
    assertThat(s.inclusionMask).isEqualTo(0xF);
    assertTrue(s.isEqualTo(new QuantumControlMask(0xF, 0xE)));
    assertFalse(s.isEqualTo(new QuantumControlMask(0, 0)));
    assertFalse(s.isEqualTo(new QuantumControlMask(0xF, 0xF)));
    assertFalse(s.isEqualTo(new QuantumControlMask(0xE, 0xE)));
    assertTrue(new QuantumControlMask(0x3, 0x2).isEqualTo(new QuantumControlMask(0x3, 0x2)));
    assertTrue(QuantumControlMask.NO_CONTROLS.isEqualTo(new QuantumControlMask(0, 0)));
});

suite.test("allowsState", () => {
    assertTrue(QuantumControlMask.NO_CONTROLS.allowsState(0));
    assertTrue(QuantumControlMask.NO_CONTROLS.allowsState(1));

    let m = new QuantumControlMask(0x5, 0x1);
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
    assertThat(QuantumControlMask.NO_CONTROLS.desiredValueFor(0)).isEqualTo(null);
    assertThat(QuantumControlMask.NO_CONTROLS.desiredValueFor(1)).isEqualTo(null);

    let m = new QuantumControlMask(0x5, 0x1);
    assertThat(m.desiredValueFor(0)).isEqualTo(true);
    assertThat(m.desiredValueFor(1)).isEqualTo(null);
    assertThat(m.desiredValueFor(2)).isEqualTo(false);
    assertThat(m.desiredValueFor(3)).isEqualTo(null);
});

suite.test("fromBitIs", () => {
    assertThat(QuantumControlMask.fromBitIs(0, true)).isEqualTo(new QuantumControlMask(0x1, 0x1));
    assertThat(QuantumControlMask.fromBitIs(0, false)).isEqualTo(new QuantumControlMask(0x1, 0x0));
    assertThat(QuantumControlMask.fromBitIs(2, true)).isEqualTo(new QuantumControlMask(0x4, 0x4));
    assertThat(QuantumControlMask.fromBitIs(2, false)).isEqualTo(new QuantumControlMask(0x4, 0x0));
});

suite.test("combine", () => {
    assertThat(QuantumControlMask.NO_CONTROLS.combine(QuantumControlMask.NO_CONTROLS)).isEqualTo(QuantumControlMask.NO_CONTROLS);
    assertThat(QuantumControlMask.NO_CONTROLS.desiredValueFor(1)).isEqualTo(null);

    let m = new QuantumControlMask(0x5, 0x1);
    assertThat(QuantumControlMask.fromBitIs(0, true).combine(QuantumControlMask.fromBitIs(2, false))).isEqualTo(m);
    assertThat(QuantumControlMask.fromBitIs(2, false).combine(QuantumControlMask.fromBitIs(0, true))).isEqualTo(m);
    assertThat(QuantumControlMask.NO_CONTROLS.combine(m)).isEqualTo(m);
    assertThat(m.combine(m)).isEqualTo(m);

    assertThrows(() => QuantumControlMask.fromBitIs(0, true).combine(QuantumControlMask.fromBitIs(0, false)));
});

suite.test("toString", () => {
    assertTrue(typeof(QuantumControlMask.NO_CONTROLS.toString()) === "string");
    assertTrue(typeof(new QuantumControlMask(0x5, 0x1).toString()) === "string");
});
