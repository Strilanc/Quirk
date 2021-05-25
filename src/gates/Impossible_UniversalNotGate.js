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
import {ketArgs, ketShader} from "../circuit/KetShaderUtil.js"
import {WglConfiguredShader} from "../webgl/WglConfiguredShader.js"

/**
 * @param {!CircuitEvalContext} ctx
 * @returns {!WglConfiguredShader}
 */
let universalNot = ctx => UNIVERSAL_NOT_SHADER.withArgs(...ketArgs(ctx));
const UNIVERSAL_NOT_SHADER = ketShader(
    '',
    'vec2 other = inp(1.0 - out_id); return vec2(other.x, -other.y) * (1.0 - 2.0 * out_id);',
    1);

let UniversalNotGate = new GateBuilder().
    setSerializedId("__unstable__UniversalNot").
    setSymbol("UniNot").
    setTitle("Universal Not Gate").
    setBlurb("Mirrors through the origin of the Bloch sphere.\nImpossible in practice.").
    setActualEffectToShaderProvider(universalNot).
    promiseEffectIsStable().
    gate;

export {universalNot, UniversalNotGate}
