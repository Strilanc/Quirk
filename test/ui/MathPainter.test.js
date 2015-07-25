import { Suite, assertThat, fail } from "test/TestUtil.js"
import MathPainter from "src/ui/MathPainter.js"

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
