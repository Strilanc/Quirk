import { assertThat } from "test/test.js"
import Format from "src/util/format.js"

let FormatTest = TestCase("FormatTest");

FormatTest.prototype.testFormatFloat = function() {
    assertThat(Format.CONSISTENT.formatFloat(0)).isEqualTo("0.000");
    assertThat(Format.EXACT.formatFloat(0)).isEqualTo("0");
    assertThat(Format.MINIFIED.formatFloat(0)).isEqualTo("0");
    assertThat(Format.SIMPLIFIED.formatFloat(0)).isEqualTo("0");

    assertThat(Format.CONSISTENT.formatFloat(2)).isEqualTo("2.000");
    assertThat(Format.EXACT.formatFloat(2)).isEqualTo("2");
    assertThat(Format.MINIFIED.formatFloat(2)).isEqualTo("2");
    assertThat(Format.SIMPLIFIED.formatFloat(2)).isEqualTo("2");

    assertThat(Format.CONSISTENT.formatFloat(-3)).isEqualTo("-3.000");
    assertThat(Format.EXACT.formatFloat(-3)).isEqualTo("-3");
    assertThat(Format.MINIFIED.formatFloat(-3)).isEqualTo("-3");
    assertThat(Format.SIMPLIFIED.formatFloat(-3)).isEqualTo("-3");

    assertThat(Format.CONSISTENT.formatFloat(1/3)).isEqualTo("0.333");
    assertThat(Format.EXACT.formatFloat(1/3)).isEqualTo("\u2153");
    assertThat(Format.MINIFIED.formatFloat(1/3)).isEqualTo("\u2153");
    assertThat(Format.SIMPLIFIED.formatFloat(1/3)).isEqualTo("\u2153");

    assertThat(Format.CONSISTENT.formatFloat(1/3 + 0.00001)).isEqualTo("0.333");
    assertThat(Format.EXACT.formatFloat(1/3 + 0.00001)).isEqualTo("0.3333433333333333");
    assertThat(Format.MINIFIED.formatFloat(1/3 + 0.00001)).isEqualTo("0.3333433333333333");
    assertThat(Format.SIMPLIFIED.formatFloat(1/3 + 0.00001)).isEqualTo("\u2153");
};
