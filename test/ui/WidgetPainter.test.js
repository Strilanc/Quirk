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

import {Suite, assertThat} from "../TestUtil.js"
import {WidgetPainter} from "../../src/draw/WidgetPainter.js"

import {Format} from "../../src/base/Format.js"
import {Complex} from "../../src/math/Complex.js"

let suite = new Suite("WidgetPainter");

suite.test("describeAxis", () => {
    let s = Math.sqrt(2);

    assertThat(WidgetPainter.describeAxis([1, 0, 0], Format.SIMPLIFIED)).isEqualTo("X");
    assertThat(WidgetPainter.describeAxis([0, 1, 0], Format.SIMPLIFIED)).isEqualTo("Y");
    assertThat(WidgetPainter.describeAxis([0, 0, 1], Format.SIMPLIFIED)).isEqualTo("Z");

    assertThat(WidgetPainter.describeAxis([s, s, 0], Format.SIMPLIFIED)).isEqualTo("X + Y");
    assertThat(WidgetPainter.describeAxis([0, s, s], Format.SIMPLIFIED)).isEqualTo("Y + Z");
    assertThat(WidgetPainter.describeAxis([s, 0, s], Format.SIMPLIFIED)).isEqualTo("X + Z");

    assertThat(WidgetPainter.describeAxis([-s, s, 0], Format.SIMPLIFIED)).isEqualTo("-X + Y");
    assertThat(WidgetPainter.describeAxis([0, -s, s], Format.SIMPLIFIED)).isEqualTo("-Y + Z");
    assertThat(WidgetPainter.describeAxis([s, 0, -s], Format.SIMPLIFIED)).isEqualTo("X - Z");

    assertThat(WidgetPainter.describeAxis([1, -1, 1], Format.SIMPLIFIED)).isEqualTo("X - Y + Z");

    assertThat(WidgetPainter.describeAxis([1, 0.5, 0.25], Format.SIMPLIFIED)).isEqualTo("X + ½·Y + ¼·Z");
    assertThat(WidgetPainter.describeAxis([1, 0.5, 0.25], Format.CONSISTENT)).isEqualTo("X + 0.50·Y + 0.25·Z");
});

suite.test("describeKet", () => {
    assertThat(WidgetPainter.describeKet(1, 0, 1, Format.SIMPLIFIED)).isEqualTo('|0⟩');
    assertThat(WidgetPainter.describeKet(1, 1, 1, Format.SIMPLIFIED)).isEqualTo('|1⟩');

    assertThat(WidgetPainter.describeKet(2, 0, 1, Format.SIMPLIFIED)).isEqualTo('|00⟩');
    assertThat(WidgetPainter.describeKet(2, 1, 1, Format.SIMPLIFIED)).isEqualTo('|01⟩');
    assertThat(WidgetPainter.describeKet(2, 2, 1, Format.SIMPLIFIED)).isEqualTo('|10⟩');
    assertThat(WidgetPainter.describeKet(2, 3, 1, Format.SIMPLIFIED)).isEqualTo('|11⟩');

    assertThat(WidgetPainter.describeKet(2, 0, new Complex(-1, 0), Format.SIMPLIFIED)).isEqualTo('-|00⟩');
    assertThat(WidgetPainter.describeKet(2, 1, Complex.I, Format.SIMPLIFIED)).isEqualTo('i|01⟩');
    assertThat(WidgetPainter.describeKet(2, 2, new Complex(0, -1), Format.SIMPLIFIED)).isEqualTo('-i|10⟩');
    assertThat(WidgetPainter.describeKet(2, 3, new Complex(1, 1), Format.SIMPLIFIED)).isEqualTo('(1+i)·|11⟩');
});
