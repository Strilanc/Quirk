import {Suite, assertThat} from "test/TestUtil.js"

import {
    interleaveBit,
    deinterleaveBit,
    valPermuteFromBit,
    interleave,
    deinterleave
} from "src/gates/InterleaveBitsGates.js"

let suite = new Suite("InterleaveGates");

suite.test('interleaveBit', () => {
    assertThat(interleaveBit(0, 1)).isEqualTo(0);

    assertThat(interleaveBit(0, 2)).isEqualTo(0);
    assertThat(interleaveBit(1, 2)).isEqualTo(1);

    assertThat(interleaveBit(0, 3)).isEqualTo(0);
    assertThat(interleaveBit(1, 3)).isEqualTo(2);
    assertThat(interleaveBit(2, 3)).isEqualTo(1);

    assertThat(interleaveBit(0, 4)).isEqualTo(0);
    assertThat(interleaveBit(1, 4)).isEqualTo(2);
    assertThat(interleaveBit(2, 4)).isEqualTo(1);
    assertThat(interleaveBit(3, 4)).isEqualTo(3);

    assertThat(interleaveBit(0, 6)).isEqualTo(0);
    assertThat(interleaveBit(1, 6)).isEqualTo(2);
    assertThat(interleaveBit(2, 6)).isEqualTo(4);
    assertThat(interleaveBit(3, 6)).isEqualTo(1);
    assertThat(interleaveBit(4, 6)).isEqualTo(3);
    assertThat(interleaveBit(5, 6)).isEqualTo(5);

    assertThat(interleaveBit(0, 5)).isEqualTo(0);
    assertThat(interleaveBit(1, 5)).isEqualTo(2);
    assertThat(interleaveBit(2, 5)).isEqualTo(4);
    assertThat(interleaveBit(3, 5)).isEqualTo(1);
    assertThat(interleaveBit(4, 5)).isEqualTo(3);
});

suite.test('deinterleaveBit', () => {
    assertThat(deinterleaveBit(0, 1)).isEqualTo(0);

    assertThat(deinterleaveBit(0, 2)).isEqualTo(0);
    assertThat(deinterleaveBit(1, 2)).isEqualTo(1);

    assertThat(deinterleaveBit(0, 3)).isEqualTo(0);
    assertThat(deinterleaveBit(2, 3)).isEqualTo(1);
    assertThat(deinterleaveBit(1, 3)).isEqualTo(2);

    assertThat(deinterleaveBit(0, 4)).isEqualTo(0);
    assertThat(deinterleaveBit(2, 4)).isEqualTo(1);
    assertThat(deinterleaveBit(1, 4)).isEqualTo(2);
    assertThat(deinterleaveBit(3, 4)).isEqualTo(3);

    assertThat(deinterleaveBit(0, 6)).isEqualTo(0);
    assertThat(deinterleaveBit(2, 6)).isEqualTo(1);
    assertThat(deinterleaveBit(4, 6)).isEqualTo(2);
    assertThat(deinterleaveBit(1, 6)).isEqualTo(3);
    assertThat(deinterleaveBit(3, 6)).isEqualTo(4);
    assertThat(deinterleaveBit(5, 6)).isEqualTo(5);

    assertThat(deinterleaveBit(0, 5)).isEqualTo(0);
    assertThat(deinterleaveBit(2, 5)).isEqualTo(1);
    assertThat(deinterleaveBit(4, 5)).isEqualTo(2);
    assertThat(deinterleaveBit(1, 5)).isEqualTo(3);
    assertThat(deinterleaveBit(3, 5)).isEqualTo(4);
});

suite.test('valPermuteFromBit', () => {
    let id = valPermuteFromBit((i, n) => i);
    assertThat(id(101, 6)).isEqualTo(37);
    assertThat(id(101, 7)).isEqualTo(101);
    assertThat(id(96, 7)).isEqualTo(96);

    let shift = valPermuteFromBit((i, n) => (i + 1) % n);
    assertThat(shift(0b111000, 6)).isEqualTo(0b110001);
    assertThat(shift(0b10101, 5)).isEqualTo(0b01011);
});

suite.test('interleave', () => {
    assertThat(interleave(0b1111100000, 10)).isEqualTo(0b1010101010);
});

suite.test('deinterleave', () => {
    assertThat(deinterleave(0b1010101010, 10)).isEqualTo(0b1111100000);
});

suite.test('interleave_vs_deinterleave_bit', () => {
    for (let i = 0; i < 100; i++) {
        let n = Math.floor(Math.random() * 100 + 10);
        let b = Math.floor(Math.random() * n);
        let j = interleaveBit(b, n);
        assertThat(deinterleaveBit(j, n)).withInfo({n, b, j}).isEqualTo(b);
    }
});

suite.test('interleave_vs_deinterleave_bit', () => {
    for (let i = 0; i < 100; i++) {
        let n = Math.floor(Math.random() * 100 + 10);
        let b = Math.floor(Math.random() * n);
        let j = interleaveBit(b, n);
        assertThat(deinterleaveBit(j, n)).withInfo({n, b, j}).isEqualTo(b);
    }
});
