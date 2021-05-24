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
import {MathPainter} from "../../src/draw/MathPainter.js"

let suite = new Suite("MathPainter");

suite.test("describeProbability_middle", () => {
    assertThat(MathPainter.describeProbability(1/3, 0)).isEqualTo("33%");
    assertThat(MathPainter.describeProbability(1/3, 1)).isEqualTo("33.3%");
    assertThat(MathPainter.describeProbability(1/3, 2)).isEqualTo("33.33%");

    assertThat(MathPainter.describeProbability(1/2, 0)).isEqualTo("50%");
    assertThat(MathPainter.describeProbability(1/2, 1)).isEqualTo("50.0%");
    assertThat(MathPainter.describeProbability(1/2, 2)).isEqualTo("50.00%");

    assertThat(MathPainter.describeProbability(2/3, 0)).isEqualTo("67%");
    assertThat(MathPainter.describeProbability(2/3, 1)).isEqualTo("66.7%");
    assertThat(MathPainter.describeProbability(2/3, 2)).isEqualTo("66.67%");
});

suite.test("describeProbability_borders", () => {
    assertThat(MathPainter.describeProbability(0, 0)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0, 1)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0, 2)).isEqualTo("Off");

    assertThat(MathPainter.describeProbability(0.00001, 0)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0.00001, 1)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0.00001, 2)).isEqualTo("Off");

    assertThat(MathPainter.describeProbability(0.004, 0)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0.0004, 0)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0.0004, 1)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0.0004, 2)).isEqualTo("0.04%");

    assertThat(MathPainter.describeProbability(0.006, 0)).isEqualTo("1%");
    assertThat(MathPainter.describeProbability(0.0006, 0)).isEqualTo("Off");
    assertThat(MathPainter.describeProbability(0.0006, 1)).isEqualTo("0.1%");
    assertThat(MathPainter.describeProbability(0.0006, 2)).isEqualTo("0.06%");

    assertThat(MathPainter.describeProbability(0.996, 0)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(0.9996, 0)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(0.9996, 1)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(0.9996, 2)).isEqualTo("99.96%");

    assertThat(MathPainter.describeProbability(0.994, 0)).isEqualTo("99%");
    assertThat(MathPainter.describeProbability(0.9994, 0)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(0.9994, 1)).isEqualTo("99.9%");
    assertThat(MathPainter.describeProbability(0.9994, 2)).isEqualTo("99.94%");

    assertThat(MathPainter.describeProbability(0.99999, 0)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(0.99999, 1)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(0.99999, 2)).isEqualTo("On");

    assertThat(MathPainter.describeProbability(1, 0)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(1, 1)).isEqualTo("On");
    assertThat(MathPainter.describeProbability(1, 2)).isEqualTo("On");
});
