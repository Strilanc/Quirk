/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {assertTrue, assertFalse, assertThat, assertThrows, Suite} from "../TestUtil.js"
import {Controls} from "../../src/circuit/Controls.js"

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
    assertTrue(Controls.NONE.isEqualTo(new Controls(0, 0)));
});

suite.test("allowsState", () => {
    assertTrue(Controls.NONE.allowsState(0));
    assertTrue(Controls.NONE.allowsState(1));

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
    assertThat(Controls.NONE.desiredValueFor(0)).isEqualTo(undefined);
    assertThat(Controls.NONE.desiredValueFor(1)).isEqualTo(undefined);

    let m = new Controls(0x5, 0x1);
    assertThat(m.desiredValueFor(0)).isEqualTo(true);
    assertThat(m.desiredValueFor(1)).isEqualTo(undefined);
    assertThat(m.desiredValueFor(2)).isEqualTo(false);
    assertThat(m.desiredValueFor(3)).isEqualTo(undefined);
});

suite.test("bit", () => {
    assertThat(Controls.bit(0, true)).isEqualTo(new Controls(0x1, 0x1));
    assertThat(Controls.bit(0, false)).isEqualTo(new Controls(0x1, 0x0));
    assertThat(Controls.bit(2, true)).isEqualTo(new Controls(0x4, 0x4));
    assertThat(Controls.bit(2, false)).isEqualTo(new Controls(0x4, 0x0));
});

suite.test("and", () => {
    assertThat(Controls.NONE.and(Controls.NONE)).isEqualTo(Controls.NONE);
    assertThat(Controls.NONE.desiredValueFor(1)).isEqualTo(undefined);

    let m = new Controls(0x5, 0x1);
    assertThat(Controls.bit(0, true).and(Controls.bit(2, false))).isEqualTo(m);
    assertThat(Controls.bit(2, false).and(Controls.bit(0, true))).isEqualTo(m);
    assertThat(Controls.NONE.and(m)).isEqualTo(m);
    assertThat(m.and(m)).isEqualTo(m);

    assertThrows(() => Controls.bit(0, true).and(Controls.bit(0, false)));
});

suite.test("toString", () => {
    assertTrue(typeof(Controls.NONE.toString()) === "string");
    assertTrue(typeof(new Controls(0x5, 0x1).toString()) === "string");
});
