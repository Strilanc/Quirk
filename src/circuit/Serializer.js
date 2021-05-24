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

import {CircuitDefinition} from "./CircuitDefinition.js"
import {Complex} from "../math/Complex.js"
import {Config} from "../Config.js"
import {CustomGateSet} from "./CustomGateSet.js"
import {describe} from "../base/Describe.js"
import {DetailedError} from "../base/DetailedError.js"
import {Format} from "../base/Format.js"
import {Gate, GateBuilder} from "./Gate.js"
import {GateColumn} from "./GateColumn.js"
import {Gates, INITIAL_STATES_TO_GATES} from "../gates/AllGates.js"
import {Matrix} from "../math/Matrix.js"
import {Util} from "../base/Util.js"
import {notifyAboutRecoveryFromUnexpectedError} from "../fallback.js"
import {MysteryGateSymbol, MysteryGateMakerWithMatrix} from "../gates/Joke_MysteryGate.js"
import {seq} from "../base/Seq.js"
import {setGateBuilderEffectToCircuit} from "./CircuitComputeUtil.js"

/** @type {!function(!GateDrawParams)} */
let matrixDrawer = undefined;
/** @type {!function(!GateDrawParams)} */
let circuitDrawer = undefined;
/** @type {!function(!GateDrawParams)} */
let labelDrawer = undefined;
/** @type {!function(!GateDrawParams)} */
let locationIndependentDrawer = undefined;
/**
 * @param {!function(!GateDrawParams)} gateLabelDrawer
 * @param {!function(!GateDrawParams)} gateMatrixDrawer
 * @param {!function(!GateDrawParams)} gateCircuitDrawer
 * @param {!function(!GateDrawParams)} locationIndependentGateDrawer
 */
function initSerializer(gateLabelDrawer, gateMatrixDrawer, gateCircuitDrawer, locationIndependentGateDrawer) {
    labelDrawer = gateLabelDrawer;
    matrixDrawer = gateMatrixDrawer;
    circuitDrawer = gateCircuitDrawer;
    locationIndependentDrawer = locationIndependentGateDrawer;
}

/**
 * Serializes supported values to/from json elements.
 */
class Serializer {
    /**
     * @param {*} value
     * @param {*=undefined} context
     * @returns {*}
     */
    static toJson(value, context=undefined) {
        //noinspection JSUnusedLocalSymbols
        for (let [type, toJ, _] of BINDINGS) {
            //noinspection JSUnusedAssignment
            if (value instanceof type) {
                //noinspection JSUnusedAssignment
                return toJ(value, context);
            }
        }
        throw new Error(`Don't know how to convert ${describe(value)} to JSON.`);
    }

    /**
     * @param {*} expectedType
     * @param {*} json
     * @param {*=undefined} context
     * @returns {*}
     */
    static fromJson(expectedType, json, context=undefined) {
        //noinspection JSUnusedLocalSymbols
        for (let [type, _, fromJ] of BINDINGS) {
            //noinspection JSUnusedAssignment
            if (type === expectedType) {
                //noinspection JSUnusedAssignment
                return fromJ(json, context);
            }
        }
        throw new Error(`Don't know how to deserialize JSON ${describe(json)} into an instance of ${expectedType}.`);
    }
}

/**
 * @param {!Complex} v
 * @returns {!object}
 */
let toJson_Complex = v => v.toString(Format.MINIFIED);

/**
 * @param {object} json
 * @returns {!Complex}
 * @throws {Error}
 */
let fromJson_Complex = json => {
    if (typeof json === "string") {
        return Complex.parse(json);
    }
    throw new Error("Not a packed complex string: " + json);
};

/**
 * @param {!Matrix} v
 * @returns {!object}
 */
let toJson_Matrix = v => v.toString(Format.MINIFIED);

/**
 * @param {object} json
 * @returns {!Matrix}
 * @throws {Error}
 */
let fromJson_Matrix = json => {
    if (typeof json !== "string") {
        throw new Error("Not a packed matrix string: " + json);
    }
    return Matrix.parse(/** @type {!string} */ json);
};

/**
 * @param {!Gate} gate
 * @param {!CustomGateSet=} context
 * @returns {!object}
 */
let toJson_Gate = (gate, context=new CustomGateSet()) => {
    let found = Gates.findKnownGateById(gate.serializedId, context);
    if (found === gate) {
        return gate.serializedId;
    }
    if (found !== undefined && found.param !== undefined) {
        return {id: gate.serializedId, arg: gate.param};
    }

    if (gate.name === "Parse Error") {
        return gate.tag;
    }

    let result = {};
    if (gate.serializedId !== "") {
        result.id = gate.serializedId;
    }
    if (gate.serializedId.startsWith("~") ? gate.symbol !== '' : gate.symbol !== gate.serializedId) {
        result.name = gate.symbol;
    }

    if (gate.stableDuration() === Infinity && gate.knownMatrixAt(0) !== undefined) {
        result.matrix = toJson_Matrix(gate.knownMatrixAt(0.25));
    } else if (gate.knownCircuit !== undefined) {
        result.circuit = toJson_CircuitDefinition(gate.knownCircuit, context);
    } else {
        throw new DetailedError("Don't known how to serialize gate's function.", {gate});
    }

    return result;
};

/**
 * @param {*} json
 * @returns {!String}
 * @private
 */
function _getGateId(json) {
    let symbol = typeof json === "string" ? json : json["id"];

    // Recover from bad symbol.
    if (symbol === undefined) {
        return "";
    }
    if (typeof symbol !== "string") {
        return describe(symbol);
    }

    return symbol;
}

/**
 * @param {*} matrixProp
 * @returns {!Matrix}
 * @private
 * @throws
 */
function _parseGateMatrix(matrixProp) {
    if (matrixProp === undefined) {
        throw new Error("Unrecognized gate id, but no matrix specified.");
    }
    let matrix = fromJson_Matrix(matrixProp);
    if (matrix.width() !== matrix.height()) {
        throw new Error("Gate matrix must be square.");
    }
    if (matrix.width() < 2 || matrix.width() > 1 << 4 || !Util.isPowerOf2(matrix.width())) {
        throw new Error("Supported gate matrix sizes are 2, 4, 8, and 16.");
    }
    return matrix;
}

/**
 * @param {object} json
 * @returns {!{id: !String, matrix: *, circuit: *, symbol: *, name: *, param: *}}
 */
let fromJson_Gate_props = json => {
    let id = _getGateId(json);
    let matrix = json["matrix"];
    let circuit = json["circuit"];
    let param = json["arg"];
    let symbol = json.name !== undefined ? json.name :
        id.startsWith('~') ? '' :
        id;
    let name = id.startsWith('~') ? `${symbol || 'Custom'} Gate [${id.substring(1)}]` :
        symbol !== '' ? symbol :
        id;
    return {id, matrix, circuit, symbol, name, param};
};

/**
 * @param {!{id: !String, matrix: *, circuit: *, symbol: *, name: *, param: *}} props
 * @returns {!Gate}
 */
let fromJson_Gate_Matrix = props => {
    let mat = _parseGateMatrix(props.matrix);

    // Special case the mystery gate.
    if (props.id === MysteryGateSymbol) {
        return MysteryGateMakerWithMatrix(mat);
    }

    let height = Math.round(Math.log2(mat.height()));
    let width = props.symbol === '' ? height : 1;
    let matrix = _parseGateMatrix(props.matrix);

    let builder = new GateBuilder().
        setSerializedId(props.id).
        setSymbol(props.symbol).
        setTitle(props.name).
        setHeight(height).
        setWidth(width).
        setDrawer(props.symbol === "" ? matrixDrawer
            : matrix.isIdentity() ? labelDrawer
            : matrix.isScaler() ? locationIndependentDrawer
            : undefined).
        setKnownEffectToMatrix(matrix);
    if (matrix.isIdentity()) {
        builder.markAsNotInterestedInControls();
    }
    return builder.gate;
};

/**
 * @param {!{id: !String, matrix: *, circuit: *, symbol: *, name: *, param: *}} props
 * @param {undefined|!CustomGateSet} context
 * @returns {!Gate}
 */
let fromJson_Gate_Circuit = (props, context) => {
    let circuit = fromJson_CircuitDefinition(props.circuit, context).withMinimumWireCount();
    return setGateBuilderEffectToCircuit(new GateBuilder(), circuit).
        setSerializedId(props.id).
        setSymbol(props.symbol).
        setTitle(props.name).
        setDrawer(circuitDrawer).
        gate;
};

/**
 * @param {!object} json
 * @param {!CustomGateSet=} context
 * @returns {!Gate}
 * @throws {Error}
 */
let fromJson_Gate = (json, context=new CustomGateSet()) => {
    let props = fromJson_Gate_props(json);

    try {
        if (props.matrix !== undefined) {
            return fromJson_Gate_Matrix(props);
        }

        if (props.circuit !== undefined) {
            return fromJson_Gate_Circuit(props, context);
        }

        // Operation not provided. Try to match by id.
        let match = Gates.findKnownGateById(props.id, context);
        if (match === undefined) {
            throw new DetailedError(`No gate with the id '${props.id}'.`, {json});
        }
        if (props.param !== undefined) {
            if (match.param === undefined) {
                throw new DetailedError("Arg for gate without arg.", {json});
            }
            match = match.withParam(props.param);
        }
        return match;

    } catch (ex) {
        notifyAboutRecoveryFromUnexpectedError(
            "Defaulted to a do-nothing 'parse error' gate. Failed to understand the json defining a gate.",
            {gate_json: json},
            ex);
        return new GateBuilder().
            setSerializedIdAndSymbol(props.id).
            setTitle("Parse Error").
            setBlurb(describe(ex)).
            promiseHasNoNetEffectOnStateVector().
            setExtraDisableReasonFinder(() => "parse\nerror").
            setTag(json).
            gate;
    }
};

/**
 * @param {!GateColumn} v
 * @param {!CustomGateSet=} context
 * @returns {!object}
 */
function toJson_GateColumn(v, context=new CustomGateSet()) {
    return v.gates.map(e => e === undefined ? 1 : toJson_Gate(e, context));
}

/**
 * @param {object} json
 * @param {!CustomGateSet=} context
 * @returns {!GateColumn}
 * @throws
 */
let fromJson_GateColumn = (json, context=new CustomGateSet()) => {
    if (!Array.isArray(json)) {
        throw new Error(`GateColumn json should be an array. Json: ${describe(json)}`);
    }
    return new GateColumn(json.map(e => e === 1 || e === undefined ? undefined : fromJson_Gate(e, context)));
};

/**
 * @param {!CustomGateSet} v
 * @returns {*}
 */
function toJson_CustomGateSet(v) {
    let result = [];
    for (let i = 0; i < v.gates.length; i++) {
        result.push(toJson_Gate(v.gates[i], new CustomGateSet(...v.gates.slice(0, i))));
    }
    return result;
}

/**
 * @param {*} json
 * @returns {!CustomGateSet}
 */
function fromJson_CustomGateSet(json) {
    if (!Array.isArray(json)) {
        throw new DetailedError("Expected an array of gates.", {json});
    }
    let gatesSoFar = new CustomGateSet();
    for (let e of json) {
        gatesSoFar = gatesSoFar.withGate(fromJson_Gate(e, gatesSoFar));
    }
    return gatesSoFar;
}

/**
 * @param {!CircuitDefinition} v
 * @param {undefined|!CustomGateSet} context
 * @returns {!object}
 */
let toJson_CircuitDefinition = (v, context) => {
    let result = {
        cols: v.trimEmptyColumnsAtEndIgnoringGateWidths().columns.
            map(e => toJson_GateColumn(e, context || v.customGateSet)).
            map(c => seq(c).skipTailWhile(e => e === 1).toArray())
    };
    if (context === undefined && v.customGateSet.gates.length > 0) {
        result.gates = toJson_CustomGateSet(v.customGateSet);
    }
    if (v.customInitialValues.size > 0) {
        result.init = [];
        let maxInit = seq(v.customInitialValues.keys()).max();
        for (let i = 0; i <= maxInit; i++) {
            let s = v.customInitialValues.get(i);
            result.init.push(
                s === undefined ? 0 :
                s === '1' ? 1 :
                s);
        }
    }
    return result;
};

let _cachedCircuit = undefined;
let _cachedCircuit_Arg = undefined;
function fromJsonText_CircuitDefinition(jsonText) {
    if (_cachedCircuit_Arg === jsonText) {
        return _cachedCircuit;
    }
    _cachedCircuit_Arg = jsonText;
    _cachedCircuit = fromJson_CircuitDefinition(JSON.parse(jsonText), undefined);
    return _cachedCircuit;
}

/**
 * @param {object} json
 * @returns {!Map.<!int, !string>}
 * @throws
 */
function _fromJson_InitialState(json) {
    let {init} = json;
    if (init === undefined) {
        return new Map();
    }

    if (!Array.isArray(init)) {
        throw new DetailedError('Initial states must be an array.', {json});
    }

    let result = new Map();
    for (let i = 0; i < init.length; i++) {
        let v = init[i];
        if (v === 0) {
            // 0 is the default. Don't need to do anything.
        } else if (v === 1) {
            result.set(i, '1');
        } else if (INITIAL_STATES_TO_GATES.has(v)) {
            result.set(i, v);
        } else {
            throw new DetailedError('Unrecognized initial state key.', {v, json});
        }
    }

    return result;
}

/**
 * @param {object} json
 * @param {undefined|!CustomGateSet} context
 * @returns {!CircuitDefinition}
 * @throws
 */
function fromJson_CircuitDefinition(json, context=undefined) {
    let {cols} = json;
    let customGateSet = context ||
        (json.gates === undefined ? new CustomGateSet() : fromJson_CustomGateSet(json.gates));

    if (!Array.isArray(cols)) {
        throw new Error(`CircuitDefinition json should contain an array of cols. Json: ${describe(json)}`);
    }
    let gateCols = cols.map(e => fromJson_GateColumn(e, customGateSet));

    let initialValues = _fromJson_InitialState(json);

    let numWires = 0;
    for (let col of gateCols) {
        numWires = Math.max(numWires, col.minimumRequiredWireCount());
    }
    numWires = Math.max(
        Config.MIN_WIRE_COUNT,
        Math.min(numWires, Config.MAX_WIRE_COUNT),
        ...[...initialValues.keys()].map(e => e + 1));

    gateCols = gateCols.map(col => new GateColumn([
            ...col.gates,
            // Pad column up to circuit length.
            ...new Array(Math.max(0, numWires - col.gates.length)).fill(undefined)
        // Silently discard gates off the edge of the circuit.
        ].slice(0, numWires)));

    return new CircuitDefinition(numWires, gateCols, undefined, undefined, customGateSet, false, initialValues).
        withTrailingSpacersIncluded();
}

const BINDINGS = [
    [Complex, toJson_Complex, fromJson_Complex],
    [Gate, toJson_Gate, fromJson_Gate],
    [Matrix, toJson_Matrix, fromJson_Matrix],
    [GateColumn, toJson_GateColumn, fromJson_GateColumn],
    [CircuitDefinition, toJson_CircuitDefinition, fromJson_CircuitDefinition]
];

export {Serializer, initSerializer, fromJsonText_CircuitDefinition}
