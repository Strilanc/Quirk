import { Suite, assertThat } from "test/TestUtil.js"
import DetailedError from "src/base/DetailedError.js"

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
