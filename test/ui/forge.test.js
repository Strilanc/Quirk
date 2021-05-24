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

import {Suite, assertThat, assertThrows} from "../TestUtil.js"
import {Complex} from "../../src/math/Complex.js"
import {Matrix} from "../../src/math/Matrix.js"
import {parseUserMatrix, parseUserRotation} from "../../src/ui/forge.js"

let suite = new Suite("forge");

suite.test("parseUserMatrix", () => {
    assertThrows(() => parseUserMatrix("bad", false));
    assertThrows(() => parseUserMatrix("{{1}}", false));
    assertThrows(() => parseUserMatrix("{{1, 0}}", false));
    assertThrows(() => parseUserMatrix("{{1, 0}, {2, 3}, {4, 5}}", false));
    assertThrows(() => parseUserMatrix("{{1, 1, 1}, {2, 2, 2}, {3, 3, 3}}", false));
    assertThrows(() => parseUserMatrix("((1, i), (i, 1))", false));

    assertThat(parseUserMatrix("0", false)).isEqualTo(Matrix.square(0, 0, 0, 0));
    assertThat(parseUserMatrix("1, 2", false)).isEqualTo(Matrix.square(1, 2, 0, 0));
    assertThat(parseUserMatrix("1, 2, 3+i, i^2", false)).isEqualTo(Matrix.square(1, 2, new Complex(3, 1), -1));
    assertThat(parseUserMatrix("0,0,0,0,0", false)).isEqualTo(Matrix.zero(4, 4));
    assertThat(parseUserMatrix("0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0", false)).isEqualTo(Matrix.zero(8, 8));

    let s = Math.sqrt(0.5);
    let si = new Complex(0, s);
    assertThat(parseUserMatrix("0", true)).isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(parseUserMatrix("1", true)).isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(parseUserMatrix("2", true)).isApproximatelyEqualTo(Matrix.square(1, 0, 0, 1));
    assertThat(parseUserMatrix("1, 1", true)).isApproximatelyEqualTo(Matrix.square(s, s, -s, s));
    assertThat(parseUserMatrix("1, i, i, 1", true)).isApproximatelyEqualTo(Matrix.square(s, si, si, s));
    assertThat(parseUserMatrix("{{1, i}, {i, 1}}", true)).isApproximatelyEqualTo(Matrix.square(s, si, si, s));
    assertThat(parseUserMatrix("[[1, i], [i, 1]]", true)).isApproximatelyEqualTo(Matrix.square(s, si, si, s));

    assertThat(parseUserMatrix("0,0,0,0,0", true)).isApproximatelyEqualTo(Matrix.identity(4));
    assertThat(parseUserMatrix("0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0", true)).isApproximatelyEqualTo(Matrix.identity(8));
});

suite.test("parseUserRotation", () => {
    let s = Math.sqrt(0.5);
    let si = new Complex(0, s);
    assertThat(parseUserRotation("180", "90", "X")).isEqualTo(Matrix.PAULI_X);
    assertThat(parseUserRotation("180", "90", "Y")).isEqualTo(Matrix.PAULI_Y);
    assertThat(parseUserRotation("180", "90", "Z")).isEqualTo(Matrix.PAULI_Z);
    assertThat(parseUserRotation("180", "90", "X+Z")).isEqualTo(Matrix.HADAMARD);
    assertThat(parseUserRotation("90", "45", "X")).isEqualTo(Matrix.fromPauliRotation(0.25, 0, 0));
    assertThat(parseUserRotation("-2*45", "2^3-8", "X")).isEqualTo(Matrix.square(s, si, si, s));
});
