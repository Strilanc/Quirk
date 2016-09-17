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

