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

import {Suite, assertThat, assertTrue, assertFalse} from "../TestUtil.js"
import {Point} from "../../src/math/Point.js"

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

suite.test("minus", () => {
    assertThat(new Point(2, 3).minus(new Point(5, 7))).isEqualTo(new Point(-3, -4));
});

suite.test("times", () => {
    assertThat(new Point(2, 3).times(5)).isEqualTo(new Point(10, 15));
});

suite.test("distanceTo", () => {
    assertThat(new Point(2, 3).distanceTo(new Point(3, 3))).isEqualTo(1);
    assertThat(new Point(2, 3).distanceTo(new Point(4, 3))).isEqualTo(2);
    assertThat(new Point(2, 2).distanceTo(new Point(2, 3))).isEqualTo(1);
    assertThat(new Point(2, 2).distanceTo(new Point(2, 4))).isEqualTo(2);
    assertThat(new Point(0, 0).distanceTo(new Point(4, 3))).isEqualTo(5);
});
