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

import {Suite, assertThat} from "test/TestUtil.js"
import {RestartableRng} from "src/base/RestartableRng.js"

let suite = new Suite("RestartableRng");

suite.test("pre-repeat_multiple-copies", () => {
    let rng1 = new RestartableRng();
    let v1 = rng1.random();
    let v2 = rng1.random();

    let rng2 = rng1.restarted();
    assertThat(rng2.random()).isEqualTo(v1);
    assertThat(rng2.random()).isEqualTo(v2);

    let rng3 = rng2.restarted();
    assertThat(rng3.random()).isEqualTo(v1);
    assertThat(rng3.random()).isEqualTo(v2);

    let rng4 = rng1.restarted();
    assertThat(rng4.random()).isEqualTo(v1);
    assertThat(rng4.random()).isEqualTo(v2);
});

suite.test("post-repeat", () => {
    let rng1 = new RestartableRng();
    let rng2 = rng1.restarted();
    let v1 = rng1.random();
    assertThat(rng2.random()).isEqualTo(v1);
});

suite.test("reverse-repeat", () => {
    let rng1 = new RestartableRng();
    let rng2 = rng1.restarted();
    let v1 = rng2.random();
    assertThat(rng1.random()).isEqualTo(v1);
});
