// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Suite, assertThat, assertThrows} from "test/TestUtil.js"
import {Format} from "src/base/Format.js"

let suite = new Suite("Format");

suite.test("formatFloat", () => {
    assertThat(Format.CONSISTENT.formatFloat(0)).isEqualTo("0.00");
    assertThat(Format.EXACT.formatFloat(0)).isEqualTo("0");
    assertThat(Format.MINIFIED.formatFloat(0)).isEqualTo("0");
    assertThat(Format.SIMPLIFIED.formatFloat(0)).isEqualTo("0");

    assertThat(Format.CONSISTENT.formatFloat(2)).isEqualTo("2.00");
    assertThat(Format.EXACT.formatFloat(2)).isEqualTo("2");
    assertThat(Format.MINIFIED.formatFloat(2)).isEqualTo("2");
    assertThat(Format.SIMPLIFIED.formatFloat(2)).isEqualTo("2");

    assertThat(Format.CONSISTENT.formatFloat(-3)).isEqualTo("-3.00");
    assertThat(Format.EXACT.formatFloat(-3)).isEqualTo("-3");
    assertThat(Format.MINIFIED.formatFloat(-3)).isEqualTo("-3");
    assertThat(Format.SIMPLIFIED.formatFloat(-3)).isEqualTo("-3");

    assertThat(Format.CONSISTENT.formatFloat(1/3)).isEqualTo("0.33");
    assertThat(Format.EXACT.formatFloat(1/3)).isEqualTo("\u2153");
    assertThat(Format.MINIFIED.formatFloat(1/3)).isEqualTo("\u2153");
    assertThat(Format.SIMPLIFIED.formatFloat(1/3)).isEqualTo("\u2153");

    assertThat(Format.CONSISTENT.formatFloat(1/3 + 0.00001)).isEqualTo("0.33");
    assertThat(Format.EXACT.formatFloat(1/3 + 0.00001)).isEqualTo("0.3333433333333333");
    assertThat(Format.MINIFIED.formatFloat(1/3 + 0.00001)).isEqualTo("0.3333433333333333");
    assertThat(Format.SIMPLIFIED.formatFloat(1/3 + 0.00001)).isEqualTo("\u2153");
});

suite.test("parseFloatFromCompactString", () => {
    assertThrows(() => Format.parseFloat(""));
    assertThrows(() => Format.parseFloat("a"));
    assertThrows(() => Format.parseFloat("one"));

    assertThat(Format.parseFloat("0")).isEqualTo(0);
    assertThat(Format.parseFloat("1")).isEqualTo(1);
    assertThat(Format.parseFloat("-1")).isEqualTo(-1);

    assertThat(Format.parseFloat("\u00BD")).isEqualTo(0.5);
    assertThat(Format.parseFloat("2")).isEqualTo(2);
    assertThat(Format.parseFloat("501")).isEqualTo(501);
    assertThat(Format.parseFloat("\u221A2")).isEqualTo(Math.sqrt(2));
    assertThat(Format.parseFloat("-\u221A3")).isEqualTo(-Math.sqrt(3));

    assertThat(Format.parseFloat("0.7071067811865475")).isEqualTo(1/Math.sqrt(2));
    assertThat(Format.parseFloat("0.7071067811865476")).isEqualTo(Math.sqrt(1/2));
    assertThat(Format.parseFloat("\u221A\u00BD")).isEqualTo(Math.sqrt(1/2));
    assertThat(Format.parseFloat("-\u2153")).isEqualTo(-1/3);

    assertThat(Format.parseFloat("0.34")).isEqualTo(0.34);
    assertThat(Format.parseFloat("0.342123")).isEqualTo(0.342123);
    assertThat(Format.parseFloat("0.342123000")).isEqualTo(0.342123000);
});

suite.test("simplifyByRounding", () => {
    assertThat(Format.simplifyByRounding(1, 0.01)).isEqualTo(1);
    assertThat(Format.simplifyByRounding(1.00001, 0)).isEqualTo(1.00001);
    assertThat(Format.simplifyByRounding(1.00001, 0.01)).isEqualTo(1);
    assertThat(Format.simplifyByRounding(Math.sqrt(1/2) + 0.0001, 0.01)).isEqualTo(Math.sqrt(0.5));
    assertThat(Format.simplifyByRounding(1/Math.sqrt(2), 0.0001)).isEqualTo(Math.sqrt(1/2));
    assertThat(Format.simplifyByRounding(-1/3+0.0000001, 0.001)).isEqualTo(-1/3);
    assertThat(Format.simplifyByRounding(1/3+0.0000001, 0.001)).isEqualTo(1/3);
    assertThat(Format.simplifyByRounding(1/3+0.01, 0.001)).isNotEqualTo(1/3);
    assertThat(Format.simplifyByRounding(0.1234, 0.0001)).isEqualTo(0.1234);
    assertThat(Format.simplifyByRounding(0, 0.0001)).isEqualTo(0);
});
