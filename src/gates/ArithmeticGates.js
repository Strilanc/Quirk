import Gate from "src/circuit/Gate.js"
import GatePainting from "src/ui/GatePainting.js"
import GateShaders from "src/circuit/GateShaders.js"
import Matrix from "src/math/Matrix.js"

let ArithmeticGates = {};
export default ArithmeticGates;

const INCREMENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => ((r-1) & ((1<<span)-1)) === c ? 1 : 0);
const DECREMENT_MATRIX_MAKER = span =>
    Matrix.generate(1<<span, 1<<span, (r, c) => ((r+1) & ((1<<span)-1)) === c ? 1 : 0);
const ADDITION_MATRIX_MAKER = span => Matrix.generate(1<<span, 1<<span, (r, c) => {
    let expected = r;
    let input = c;
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = input & ((1 << sa) - 1);
    let b = input >> sa;
    b += a;
    b &= ((1 << sb) - 1);
    let actual = a + (b << sa);
    return expected === actual ? 1 : 0;
});
const SUBTRACTION_MATRIX_MAKER = span => Matrix.generate(1<<span, 1<<span, (r, c) => {
    let expected = r;
    let input = c;
    let sa = Math.floor(span/2);
    let sb = Math.ceil(span/2);
    let a = input & ((1 << sa) - 1);
    let b = input >> sa;
    b -= a;
    b &= ((1 << sb) - 1);
    let actual = a + (b << sa);
    return expected === actual ? 1 : 0;
});

ArithmeticGates.IncrementFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "+1",
    "Increment Gate",
    "Adds 1 to the little-endian number represented by a block of qubits.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : INCREMENT_MATRIX_MAKER(span)).
    withSerializedId("inc" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.increment(val, con, bit, span, +1)));

ArithmeticGates.DecrementFamily = Gate.generateFamily(1, 16, span => Gate.withoutKnownMatrix(
    "-1",
    "Decrement Gate",
    "Subtracts 1 from the little-endian number represented by a block of qubits.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 4 ? undefined : DECREMENT_MATRIX_MAKER(span)).
    withSerializedId("dec" + span).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.increment(val, con, bit, span, -1)));

ArithmeticGates.AdditionFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "b+=a",
    "Addition Gate",
    "Adds a little-endian number into another.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : ADDITION_MATRIX_MAKER(span)).
    withSerializedId("add" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b+=a"], [Math.floor(span/2) / span])).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.addition(val, con, bit, Math.floor(span/2), Math.ceil(span/2), 1)));

ArithmeticGates.SubtractionFamily = Gate.generateFamily(2, 16, span => Gate.withoutKnownMatrix(
    "b-=a",
    "Subtraction Gate",
    "Subtracts a little-endian number from another.").
    markedAsOnlyPermutingAndPhasing().
    markedAsStable().
    withKnownMatrix(span >= 5 ? undefined : SUBTRACTION_MATRIX_MAKER(span)).
    withSerializedId("sub" + span).
    withCustomDrawer(GatePainting.SECTIONED_DRAWER_MAKER(["a", "b-=a"], [Math.floor(span/2) / span])).
    withHeight(span).
    withCustomShader((val, con, bit) => GateShaders.addition(val, con, bit, Math.floor(span/2), Math.ceil(span/2),-1)));

ArithmeticGates.all = [
    ...ArithmeticGates.IncrementFamily.all,
    ...ArithmeticGates.DecrementFamily.all,
    ...ArithmeticGates.AdditionFamily.all,
    ...ArithmeticGates.SubtractionFamily.all
];
