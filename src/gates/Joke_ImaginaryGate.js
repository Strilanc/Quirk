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

import {GateBuilder} from "../circuit/Gate.js"
import {Matrix} from "../math/Matrix.js"
import {Complex} from "../math/Complex.js"
import {GatePainting} from "../draw/GatePainting.js"

const ImaginaryGate = new GateBuilder().
    setSerializedIdAndSymbol("i").
    setTitle("Imaginary Gate").
    setBlurb("Phases everything by i.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        GatePainting.paintGateSymbol(args);
    }).
    setKnownEffectToMatrix(Matrix.square(Complex.I, 0, 0, Complex.I)).
    gate;

const AntiImaginaryGate = new GateBuilder().
    setAlternate(ImaginaryGate).
    setSerializedIdAndSymbol("-i").
    setTitle("Anti-Imaginary Gate").
    setBlurb("Phases everything by -i.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        GatePainting.paintGateSymbol(args);
    }).
    setKnownEffectToMatrix(Matrix.square(Complex.I.neg(), 0, 0, Complex.I.neg())).
    gate;

const SqrtImaginaryGate = new GateBuilder().
    setSerializedIdAndSymbol("√i").
    setTitle("Half Imaginary Gate").
    setBlurb("Phases everything by √i.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        GatePainting.paintGateSymbol(args);
    }).
    setKnownEffectToMatrix(Matrix.square(1, 0, 0, 1).times(new Complex(Math.sqrt(0.5), Math.sqrt(0.5)))).
    gate;

const AntiSqrtImaginaryGate = new GateBuilder().
    setAlternate(SqrtImaginaryGate).
    setSerializedIdAndSymbol("√-i").
    setTitle("Half Anti-Imaginary Gate").
    setBlurb("Phases everything by √-i.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        GatePainting.paintGateSymbol(args);
    }).
    setKnownEffectToMatrix(Matrix.square(1, 0, 0, 1).times(new Complex(Math.sqrt(0.5), -Math.sqrt(0.5)))).
    gate;

export {AntiImaginaryGate, ImaginaryGate, SqrtImaginaryGate, AntiSqrtImaginaryGate}
