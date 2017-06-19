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
import {DetailedError} from "src/base/DetailedError.js"

let suite = new Suite("DetailedError");

class ReentrantDescription {
    toString() {
        return new DetailedError("re-enter", this).details;
    }
}

suite.test("re-entrant_details", () => {
    assertThat(new DetailedError("test", new ReentrantDescription()).details).
        isEqualTo("(failed to describe detailsObj due to possibly re-entrancy)");
});
