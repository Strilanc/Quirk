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

import {Suite, assertThat, assertTrue} from "../TestUtil.js"
import {Serializer} from "../../src/circuit/Serializer.js"

import {CircuitDefinition} from "../../src/circuit/CircuitDefinition.js"
import {setGateBuilderEffectToCircuit} from "../../src/circuit/CircuitComputeUtil.js"
import {Complex} from "../../src/math/Complex.js"
import {CustomGateSet} from "../../src/circuit/CustomGateSet.js"
import {describe} from "../../src/base/Describe.js"
import {Gate, GateBuilder} from "../../src/circuit/Gate.js"
import {GateColumn} from "../../src/circuit/GateColumn.js"
import {Gates} from "../../src/gates/AllGates.js"
import {Matrix} from "../../src/math/Matrix.js"
import {MysteryGateMaker} from "../../src/gates/Joke_MysteryGate.js"
import {seq} from "../../src/base/Seq.js"
import {Util} from "../../src/base/Util.js"

let suite = new Suite("Serializer");

let assertRoundTrip = (t, v, s, equater=undefined) => {
    try {
        let from = Serializer.fromJson(t, s);
        let to = Serializer.toJson(v);
        if (equater === undefined) {
            assertThat(from).isEqualTo(v);
            assertThat(to).isEqualTo(s);
        } else {
            assertThat(equater(from, v)).isEqualTo(true);
            assertThat(equater(to, s)).isEqualTo(true);
        }
    } catch (failure) {
        console.error(`Failed to round-trip: ${describe(s)} <--> ${describe(v)}`);
        throw failure;
    }
};

suite.test("roundTrip_Complex", () => {
    assertRoundTrip(Complex, Complex.ONE, "1");
    assertRoundTrip(Complex, new Complex(2, -3), "2-3i");
    assertRoundTrip(Complex, Complex.I, "i");
    assertRoundTrip(Complex, new Complex(0, -1), "-i");
    assertRoundTrip(Complex, new Complex(1 / 3, 0), "\u2153");
    assertRoundTrip(Complex, new Complex(1 / 3 + 0.00001, 0), "0.3333433333333333");
});

suite.test("roundTrip_Matrix", () => {
    assertRoundTrip(Matrix, Matrix.row(1, Complex.I), "{{1,i}}");
    assertRoundTrip(Matrix, Matrix.col(1, Complex.I), "{{1},{i}}");
    assertRoundTrip(Matrix, Matrix.square(1 / 3 + 0.00001, Complex.I.plus(1), -1 / 3, 0),
        "{{0.3333433333333333,1+i},{-\u2153,0}}");
});

suite.test("roundTrip_Gate", () => {
    assertRoundTrip(Gate, Gates.HalfTurns.X, "X", Util.STRICT_EQUALITY);
    for (let g of Gates.KnownToSerializer) {
        assertRoundTrip(Gate, g, g.serializedId, Util.STRICT_EQUALITY);
    }

    let f = MysteryGateMaker();
    let f2 = Serializer.fromJson(Gate, Serializer.toJson(f));
    assertThat(f.name).isEqualTo(f2.name);
    assertThat(f.blurb).isEqualTo(f2.blurb);
    assertThat(f.knownMatrixAt(0)).isEqualTo(f2.knownMatrixAt(0));
    assertThat(f.serializedId).isEqualTo(f2.serializedId);

    let g = Gate.fromKnownMatrix(
        "custom_id",
        Matrix.square(Complex.I, -1, 2, 3),
        "custom_name",
        "custom_blurb");
    let v = Serializer.toJson(g);
    let g2 = Serializer.fromJson(Gate, v);
    assertThat(v).isEqualTo({id: "custom_id", matrix: "{{i,-1},{2,3}}"});
    assertThat(g.knownMatrixAt(0)).isEqualTo(g2.knownMatrixAt(0));
    assertThat(g.symbol).isEqualTo(g2.symbol);
});

suite.test("roundTrip_CircuitDefinitionWithCustomGate", () => {
    let customGate = new GateBuilder().
        setSerializedId("~test").
        setSymbol('sym').
        setTitle('nam').
        setBlurb('blur').
        setKnownEffectToMatrix(Matrix.square(2, 3, 5, 7)).
        gate;
    let circuit = new CircuitDefinition(
        2,
        [new GateColumn([undefined, customGate])],
        undefined,
        undefined,
        new CustomGateSet(customGate));

    let json = Serializer.toJson(circuit);
    assertThat(json).isEqualTo({
        cols: [[1, '~test']],
        gates: [{id: '~test', name: 'sym', matrix: '{{2,3},{5,7}}'}]
    });

    let circuit2 = Serializer.fromJson(CircuitDefinition, json);
    assertThat(circuit2.columns.length).isEqualTo(1);
    assertThat(circuit2.columns[0].gates.length).isEqualTo(2);
    assertThat(circuit2.columns[0].gates[0]).isEqualTo(undefined);
    assertThat(circuit2.columns[0].gates[1].matrix).isEqualTo(customGate.matrix);
    assertThat(circuit2.columns[0].gates[1].symbol).isEqualTo(customGate.symbol);
    assertThat(circuit2.columns[0].gates[1].serializedId).isEqualTo(customGate.serializedId);
    assertThat(circuit2.customGateSet.gates.length).isEqualTo(1);
    assertTrue(circuit2.customGateSet.gates[0] === circuit2.columns[0].gates[1]);
});

suite.test("roundTrip_CircuitDefinitionWithDependentCustomGates", () => {
    let customGate = new GateBuilder().
        setSerializedId("~test").
        setSymbol('sym').
        setTitle('nam').
        setBlurb('blur').
        setKnownEffectToMatrix(Matrix.square(2, 3, 5, 7)).
        gate;
    let circuitForGate = new CircuitDefinition(
        2,
        [new GateColumn([customGate, customGate])],
        undefined,
        undefined,
        new CustomGateSet(customGate));
    let circuitGate = setGateBuilderEffectToCircuit(new GateBuilder(), circuitForGate).
        setSerializedId("~wombo").
        setSymbol('combo').
        gate;

    let circuit = new CircuitDefinition(
        3,
        [new GateColumn([customGate, circuitGate, undefined])],
        undefined,
        undefined,
        new CustomGateSet(customGate, circuitGate));

    let json = Serializer.toJson(circuit);
    assertThat(json).isEqualTo({
        cols: [['~test', '~wombo']], gates: [
            {id: '~test', name: 'sym', matrix: '{{2,3},{5,7}}'},
            {id: '~wombo', name: 'combo', circuit: {cols:[['~test', '~test']]}}]
    });
});

suite.test("roundTrip_GateColumn", () => {
    assertRoundTrip(
        GateColumn,
        new GateColumn([
            undefined,
            Gates.HalfTurns.X,
            Gates.Powering.XForward,
            Gates.Special.SwapHalf,
            Gates.Controls.Control,
            undefined]),
        [1, "X", "X^t", "Swap", "\u2022", 1]);
});

suite.test("roundTrip_circuitDefinition", () => {
    assertRoundTrip(
        CircuitDefinition,
        new CircuitDefinition(
            3,
            [new GateColumn([undefined, undefined, Gates.HalfTurns.X])]),
        {cols: [[1, 1, "X"]]});
});

const IDS_THAT_SHOULD_BE_KNOWN = [
    "•", "◦", "⊕", "⊖", "⊗", "(/)",
    "xpar", "ypar", "zpar",
    "|0⟩⟨0|", "|1⟩⟨1|", "|+⟩⟨+|", "|-⟩⟨-|", "|X⟩⟨X|", "|/⟩⟨/|",
    "Measure",
    "XDetector", "YDetector", "ZDetector",
    "XDetectControlReset", "YDetectControlReset", "ZDetectControlReset",
    "Swap",
    "…",
    "inputA1", "inputA2", "inputA3", "inputA4", "inputA5", "inputA6", "inputA7", "inputA8", "inputA9", "inputA10", "inputA11", "inputA12", "inputA13", "inputA14", "inputA15", "inputA16",
    "inputB1", "inputB2", "inputB3", "inputB4", "inputB5", "inputB6", "inputB7", "inputB8", "inputB9", "inputB10", "inputB11", "inputB12", "inputB13", "inputB14", "inputB15", "inputB16",
    "inputR1", "inputR2", "inputR3", "inputR4", "inputR5", "inputR6", "inputR7", "inputR8", "inputR9", "inputR10", "inputR11", "inputR12", "inputR13", "inputR14", "inputR15", "inputR16",
    "setA", "setB", "setR",
    "revinputA1", "revinputA2", "revinputA3", "revinputA4", "revinputA5", "revinputA6", "revinputA7", "revinputA8", "revinputA9", "revinputA10", "revinputA11", "revinputA12", "revinputA13", "revinputA14", "revinputA15", "revinputA16",
    "revinputB1", "revinputB2", "revinputB3", "revinputB4", "revinputB5", "revinputB6", "revinputB7", "revinputB8", "revinputB9", "revinputB10", "revinputB11", "revinputB12", "revinputB13", "revinputB14", "revinputB15", "revinputB16",
    "__error__",
    "0", "NeGate", "i", "-i", "√i", "√-i",
    "H",
    "X", "Y", "Z",
    "X^ft", "Y^ft", "Z^ft",
    "Rxft", "Ryft", "Rzft",
    "X^½", "X^⅓", "X^¼", "X^⅛", "X^⅟₁₆", "X^⅟₃₂",
    "X^-½", "X^-⅓", "X^-¼", "X^-⅛", "X^-⅟₁₆", "X^-⅟₃₂",
    "Y^½", "Y^⅓", "Y^¼", "Y^⅛", "Y^⅟₁₆", "Y^⅟₃₂",
    "Y^-½", "Y^-⅓", "Y^-¼", "Y^-⅛", "Y^-⅟₁₆", "Y^-⅟₃₂",
    "Z^½", "Z^⅓", "Z^¼", "Z^⅛", "Z^⅟₁₆", "Z^⅟₃₂", "Z^⅟₆₄", "Z^⅟₁₂₈",
    "Z^-½", "Z^-⅓", "Z^-¼", "Z^-⅛", "Z^-⅟₁₆",
    "X^t", "Y^t", "Z^t", "X^-t", "Y^-t", "Z^-t",
    "X^(A/2^n)", "Y^(A/2^n)", "Z^(A/2^n)",
    "X^(-A/2^n)", "Y^(-A/2^n)", "Z^(-A/2^n)",
    "e^iXt", "e^iYt", "e^iZt", "e^-iXt", "e^-iYt", "e^-iZt",
    "Amps1", "Amps2", "Amps3", "Amps4", "Amps5", "Amps6", "Amps7", "Amps8", "Amps9", "Amps10", "Amps11", "Amps12", "Amps13", "Amps14", "Amps15", "Amps16",
    "Chance", "Chance2", "Chance3", "Chance4", "Chance5", "Chance6", "Chance7", "Chance8", "Chance9", "Chance10", "Chance11", "Chance12", "Chance13", "Chance14", "Chance15", "Chance16",
    "Sample1", "Sample2", "Sample3", "Sample4", "Sample5", "Sample6", "Sample7", "Sample8", "Sample9", "Sample10", "Sample11", "Sample12", "Sample13", "Sample14", "Sample15", "Sample16",
    "Density", "Density2", "Density3", "Density4", "Density5", "Density6", "Density7", "Density8",
    "Bloch",
    "inc1", "inc2", "inc3", "inc4", "inc5", "inc6", "inc7", "inc8", "inc9", "inc10", "inc11", "inc12", "inc13", "inc14", "inc15", "inc16",
    "dec1", "dec2", "dec3", "dec4", "dec5", "dec6", "dec7", "dec8", "dec9", "dec10", "dec11", "dec12", "dec13", "dec14", "dec15", "dec16",
    "incmodR1", "incmodR2", "incmodR3", "incmodR4", "incmodR5", "incmodR6", "incmodR7", "incmodR8", "incmodR9", "incmodR10", "incmodR11", "incmodR12", "incmodR13", "incmodR14", "incmodR15", "incmodR16",
    "decmodR1", "decmodR2", "decmodR3", "decmodR4", "decmodR5", "decmodR6", "decmodR7", "decmodR8", "decmodR9", "decmodR10", "decmodR11", "decmodR12", "decmodR13", "decmodR14", "decmodR15", "decmodR16",
    "add2", "add3", "add4", "add5", "add6", "add7", "add8", "add9", "add10", "add11", "add12", "add13", "add14", "add15", "add16",
    "+=A1", "+=A2", "+=A3", "+=A4", "+=A5", "+=A6", "+=A7", "+=A8", "+=A9", "+=A10", "+=A11", "+=A12", "+=A13", "+=A14", "+=A15", "+=A16",
    "+AmodR1", "+AmodR2", "+AmodR3", "+AmodR4", "+AmodR5", "+AmodR6", "+AmodR7", "+AmodR8", "+AmodR9", "+AmodR10", "+AmodR11", "+AmodR12", "+AmodR13", "+AmodR14", "+AmodR15", "+AmodR16",
    "+ABmodR1", "+ABmodR2", "+ABmodR3", "+ABmodR4", "+ABmodR5", "+ABmodR6", "+ABmodR7", "+ABmodR8", "+ABmodR9", "+ABmodR10", "+ABmodR11", "+ABmodR12", "+ABmodR13", "+ABmodR14", "+ABmodR15", "+ABmodR16",
    "+=AA1", "+=AA2", "+=AA3", "+=AA4", "+=AA5", "+=AA6", "+=AA7", "+=AA8", "+=AA9", "+=AA10", "+=AA11", "+=AA12", "+=AA13", "+=AA14", "+=AA15", "+=AA16",
    "^=A1", "^=A2", "^=A3", "^=A4", "^=A5", "^=A6", "^=A7", "^=A8", "^=A9", "^=A10", "^=A11", "^=A12", "^=A13", "^=A14", "^=A15", "^=A16",
    "sub2", "sub3", "sub4", "sub5", "sub6", "sub7", "sub8", "sub9", "sub10", "sub11", "sub12", "sub13", "sub14", "sub15", "sub16",
    "-=A1", "-=A2", "-=A3", "-=A4", "-=A5", "-=A6", "-=A7", "-=A8", "-=A9", "-=A10", "-=A11", "-=A12", "-=A13", "-=A14", "-=A15", "-=A16",
    "-AmodR1", "-AmodR2", "-AmodR3", "-AmodR4", "-AmodR5", "-AmodR6", "-AmodR7", "-AmodR8", "-AmodR9", "-AmodR10", "-AmodR11", "-AmodR12", "-AmodR13", "-AmodR14", "-AmodR15", "-AmodR16",
    "-ABmodR1", "-ABmodR2", "-ABmodR3", "-ABmodR4", "-ABmodR5", "-ABmodR6", "-ABmodR7", "-ABmodR8", "-ABmodR9", "-ABmodR10", "-ABmodR11", "-ABmodR12", "-ABmodR13", "-ABmodR14", "-ABmodR15", "-ABmodR16",
    "-=AA1", "-=AA2", "-=AA3", "-=AA4", "-=AA5", "-=AA6", "-=AA7", "-=AA8", "-=AA9", "-=AA10", "-=AA11", "-=AA12", "-=AA13", "-=AA14", "-=AA15", "-=AA16",
    "*A1", "*A2", "*A3", "*A4", "*A5", "*A6", "*A7", "*A8", "*A9", "*A10", "*A11", "*A12", "*A13", "*A14", "*A15", "*A16",
    "/A1", "/A2", "/A3", "/A4", "/A5", "/A6", "/A7", "/A8", "/A9", "/A10", "/A11", "/A12", "/A13", "/A14", "/A15", "/A16",
    "*AmodR1", "*AmodR2", "*AmodR3", "*AmodR4", "*AmodR5", "*AmodR6", "*AmodR7", "*AmodR8", "*AmodR9", "*AmodR10", "*AmodR11", "*AmodR12", "*AmodR13", "*AmodR14", "*AmodR15", "*AmodR16",
    "/AmodR1", "/AmodR2", "/AmodR3", "/AmodR4", "/AmodR5", "/AmodR6", "/AmodR7", "/AmodR8", "/AmodR9", "/AmodR10", "/AmodR11", "/AmodR12", "/AmodR13", "/AmodR14", "/AmodR15", "/AmodR16",
    "*BToAmodR1", "*BToAmodR2", "*BToAmodR3", "*BToAmodR4", "*BToAmodR5", "*BToAmodR6", "*BToAmodR7", "*BToAmodR8", "*BToAmodR9", "*BToAmodR10", "*BToAmodR11", "*BToAmodR12", "*BToAmodR13", "*BToAmodR14", "*BToAmodR15", "*BToAmodR16",
    "/BToAmodR1", "/BToAmodR2", "/BToAmodR3", "/BToAmodR4", "/BToAmodR5", "/BToAmodR6", "/BToAmodR7", "/BToAmodR8", "/BToAmodR9", "/BToAmodR10", "/BToAmodR11", "/BToAmodR12", "/BToAmodR13", "/BToAmodR14", "/BToAmodR15", "/BToAmodR16",
    "+cntA1", "+cntA2", "+cntA3", "+cntA4", "+cntA5", "+cntA6", "+cntA7", "+cntA8", "+cntA9", "+cntA10", "+cntA11", "+cntA12", "+cntA13", "+cntA14", "+cntA15", "+cntA16",
    "-cntA1", "-cntA2", "-cntA3", "-cntA4", "-cntA5", "-cntA6", "-cntA7", "-cntA8", "-cntA9", "-cntA10", "-cntA11", "-cntA12", "-cntA13", "-cntA14", "-cntA15", "-cntA16",
    "^A<B", "^A>B", "^A<=B", "^A>=B", "^A=B", "^A!=B",
    "X^⌈t⌉", "X^⌈t-¼⌉",
    "Counting1", "Counting2", "Counting3", "Counting4", "Counting5", "Counting6", "Counting7", "Counting8", "Counting9", "Counting10", "Counting11", "Counting12", "Counting13", "Counting14", "Counting15", "Counting16",
    "Uncounting1", "Uncounting2", "Uncounting3", "Uncounting4", "Uncounting5", "Uncounting6", "Uncounting7", "Uncounting8", "Uncounting9", "Uncounting10", "Uncounting11", "Uncounting12", "Uncounting13", "Uncounting14", "Uncounting15", "Uncounting16",
    ">>t2", ">>t3", ">>t4", ">>t5", ">>t6", ">>t7", ">>t8", ">>t9", ">>t10", ">>t11", ">>t12", ">>t13", ">>t14", ">>t15", ">>t16",
    "<<t2", "<<t3", "<<t4", "<<t5", "<<t6", "<<t7", "<<t8", "<<t9", "<<t10", "<<t11", "<<t12", "<<t13", "<<t14", "<<t15", "<<t16",
    "<<2", "<<3", "<<4", "<<5", "<<6", "<<7", "<<8", "<<9", "<<10", "<<11", "<<12", "<<13", "<<14", "<<15", "<<16",
    ">>2", ">>3", ">>4", ">>5", ">>6", ">>7", ">>8", ">>9", ">>10", ">>11", ">>12", ">>13", ">>14", ">>15", ">>16",
    "QFT1", "QFT2", "QFT3", "QFT4", "QFT5", "QFT6", "QFT7", "QFT8", "QFT9", "QFT10", "QFT11", "QFT12", "QFT13", "QFT14", "QFT15", "QFT16",
    "QFT†1", "QFT†2", "QFT†3", "QFT†4", "QFT†5", "QFT†6", "QFT†7", "QFT†8", "QFT†9", "QFT†10", "QFT†11", "QFT†12", "QFT†13", "QFT†14", "QFT†15", "QFT†16",
    "c+=ab3", "c+=ab4", "c+=ab5", "c+=ab6", "c+=ab7", "c+=ab8", "c+=ab9", "c+=ab10", "c+=ab11", "c+=ab12", "c+=ab13", "c+=ab14", "c+=ab15", "c+=ab16",
    "c-=ab3", "c-=ab4", "c-=ab5", "c-=ab6", "c-=ab7", "c-=ab8", "c-=ab9", "c-=ab10", "c-=ab11", "c-=ab12", "c-=ab13", "c-=ab14", "c-=ab15", "c-=ab16",
    "+=AB1", "+=AB2", "+=AB3", "+=AB4", "+=AB5", "+=AB6", "+=AB7", "+=AB8", "+=AB9", "+=AB10", "+=AB11", "+=AB12", "+=AB13", "+=AB14", "+=AB15", "+=AB16",
    "-=AB1", "-=AB2", "-=AB3", "-=AB4", "-=AB5", "-=AB6", "-=AB7", "-=AB8", "-=AB9", "-=AB10", "-=AB11", "-=AB12", "-=AB13", "-=AB14", "-=AB15", "-=AB16",
    "PhaseGradient1", "PhaseGradient2", "PhaseGradient3", "PhaseGradient4", "PhaseGradient5", "PhaseGradient6", "PhaseGradient7", "PhaseGradient8", "PhaseGradient9", "PhaseGradient10", "PhaseGradient11", "PhaseGradient12", "PhaseGradient13", "PhaseGradient14", "PhaseGradient15", "PhaseGradient16",
    "PhaseUngradient1", "PhaseUngradient2", "PhaseUngradient3", "PhaseUngradient4", "PhaseUngradient5", "PhaseUngradient6", "PhaseUngradient7", "PhaseUngradient8", "PhaseUngradient9", "PhaseUngradient10", "PhaseUngradient11", "PhaseUngradient12", "PhaseUngradient13", "PhaseUngradient14", "PhaseUngradient15", "PhaseUngradient16",
    "Flip<A1", "Flip<A2", "Flip<A3", "Flip<A4", "Flip<A5", "Flip<A6", "Flip<A7", "Flip<A8", "Flip<A9", "Flip<A10", "Flip<A11", "Flip<A12", "Flip<A13", "Flip<A14", "Flip<A15", "Flip<A16",
    "rev2", "rev3", "rev4", "rev5", "rev6", "rev7", "rev8", "rev9", "rev10", "rev11", "rev12", "rev13", "rev14", "rev15", "rev16",
    "weave4", "weave5", "weave6", "weave7", "weave8", "weave9", "weave10", "weave11", "weave12", "weave13", "weave14", "weave15", "weave16",
    "split4", "split5", "split6", "split7", "split8", "split9", "split10", "split11", "split12", "split13", "split14", "split15", "split16",
    "grad^t1", "grad^t2", "grad^t3", "grad^t4", "grad^t5", "grad^t6", "grad^t7", "grad^t8", "grad^t9", "grad^t10", "grad^t11", "grad^t12", "grad^t13", "grad^t14", "grad^t15", "grad^t16",
    "grad^-t1", "grad^-t2", "grad^-t3", "grad^-t4", "grad^-t5", "grad^-t6", "grad^-t7", "grad^-t8", "grad^-t9", "grad^-t10", "grad^-t11", "grad^-t12", "grad^-t13", "grad^-t14", "grad^-t15", "grad^-t16",
];

suite.test("known_gates_backwards_compatible", () => {
    let knownIds = new Set(Gates.KnownToSerializer.map(e => e.serializedId));
    knownIds.add(MysteryGateMaker().serializedId);
    for (let id of IDS_THAT_SHOULD_BE_KNOWN) {
        assertThat(knownIds.has(id)).withInfo(id).isEqualTo(true);
    }
});

suite.test("known_gates_forward_compatible", meta => {
    let shouldBeKnownIds = new Set(IDS_THAT_SHOULD_BE_KNOWN);
    for (let id of Gates.KnownToSerializer.map(e => e.serializedId)) {
        if (id.startsWith("__unstable__")) {
            continue;
        }
        meta.warn_only = "New id: " + id;
        assertThat(shouldBeKnownIds.has(id)).withInfo(id).isEqualTo(true);
    }
    meta.warn_only = false;
});

suite.test("parse_nested_circuits", () => {
    let json = {
        cols:[["H"],["•","X"],["~oc3t"],["~qoc2"]],
        gates:[
            {
                id:"~oc3t",
                circuit:{cols:[["H"],["•","X"]]}},
            {
                id:"~v9rj",
                circuit:{cols:[["H"],["•","X"],["~oc3t"]]}
            },
            {
                id:"~qoc2",
                circuit:{"cols":[["H"],["•","X"],["~oc3t"]]}
            }
        ]
    };

    let circuitDef = Serializer.fromJson(CircuitDefinition, json);
    let reJson = Serializer.toJson(circuitDef);
    assertThat(JSON.stringify(reJson)).isEqualTo(JSON.stringify(json));
});

suite.test("known_gates_toolbox", () => {
    let allToolboxGates = seq(Gates.TopToolboxGroups).
        concat(Gates.BottomToolboxGroups).
        flatMap(e => e.gates).
        filter(e => e !== undefined).
        flatMap(e => e.gateFamily).
        toArray();

    let knownIds = new Set(Gates.KnownToSerializer.map(e => e.serializedId));
    knownIds.add(MysteryGateMaker().serializedId);
    for (let gate of allToolboxGates) {
        assertThat(knownIds.has(gate.serializedId)).withInfo(gate).isEqualTo(true);
    }

    // Print 'hidden ids' of gates not accessible from toolbox
    //let toolboxIds = new Set(allToolboxGates.map(e => e.serializedId));
    //for (let id of knownIds) {
    //    if (!toolboxIds.has(id)) {
    //        console.warn("hidden id: " + id);
    //    }
    //}
});
