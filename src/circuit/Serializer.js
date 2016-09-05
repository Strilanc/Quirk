import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Complex from "src/math/Complex.js"
import Config from "src/Config.js"
import CustomGateSet from "src/circuit/CustomGateSet.js"
import describe from "src/base/Describe.js"
import DetailedError from "src/base/DetailedError.js"
import Format from "src/base/Format.js"
import Gate from "src/circuit/Gate.js"
import GateColumn from "src/circuit/GateColumn.js"
import GatePainting from "src/draw/GatePainting.js"
import Gates from "src/gates/AllGates.js"
import Matrix from "src/math/Matrix.js"
import Util from "src/base/Util.js"
import {notifyAboutRecoveryFromUnexpectedError} from "src/fallback.js"
import {MysteryGateSymbol, MysteryGateMakerWithMatrix} from "src/gates/Joke_MysteryGate.js"
import {seq, Seq} from "src/base/Seq.js"
import {circuitDefinitionToGate} from "src/circuit/CircuitComputeUtil.js"

/**
 * Serializes supported values to/from json elements.
 */
export default class Serializer {
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
    if (Gates.findKnownGateById(gate.serializedId, context) === gate) {
        return gate.serializedId;
    }

    if (gate.name === "Parse Error") {
        return gate.tag;
    }

    let result = {};
    if (gate.stableDuration() === Infinity && gate.knownMatrixAt(0) !== undefined) {
        result.matrix = toJson_Matrix(gate.knownMatrixAt(0.25));
    } else if (gate.knownCircuit !== undefined) {
        result.circuit = toJson_CircuitDefinition(gate.knownCircuit, context);
    } else {
        throw new DetailedError("Don't known how to serialize gate's function.", {gate});
    }

    if (gate.serializedId !== "") {
        result.id = gate.serializedId;
    }
    if (gate.serializedId !== gate.symbol && gate.serializedId.startsWith("~~")) {
        result.symbol = gate.symbol;
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
    if (matrix.width() < 2 || !Util.isPowerOf2(matrix.width())) {
        throw new Error("Gate matrix size must be at least 2, and a power of 2.");
    }
    return matrix;
}

/**
 * @param {!object} json
 * @param {!CustomGateSet=} context
 * @returns {!Gate}
 * @throws {Error}
 */
let fromJson_Gate = (json, context=new CustomGateSet()) => {
    let id = _getGateId(json);
    let matrixProp = json["matrix"];
    let circuitProp = json["circuit"];
    let drawer = id === "" ? GatePainting.MATRIX_DRAWER : GatePainting.DEFAULT_DRAWER;
    let symbol = json.symbol === undefined ? id : json.symbol;

    try {
        // Special case the mystery gate.
        if (id === MysteryGateSymbol && matrixProp !== undefined) {
            return MysteryGateMakerWithMatrix(_parseGateMatrix(matrixProp));
        }

        // Given matrix?
        if (matrixProp !== undefined) {
            return Gate.fromKnownMatrix(symbol, _parseGateMatrix(matrixProp), id, "").
                withCustomDrawer(drawer).
                withSerializedId(id);
        }

        // Given circuit?
        if (circuitProp !== undefined) {
            return Gate.withoutKnownMatrix(symbol, id, "").
                withKnownCircuit(fromJson_CircuitDefinition(circuitProp)).
                withCustomDrawer(drawer).
                withSerializedId(id);
        }

        // Operation not provided. Try to match by id.
        let match = Gates.findKnownGateById(id, context);
        if (match === undefined) {
            throw new DetailedError(`No gate with the id '${id}'.`, {json});
        }
        return match;

    } catch (ex) {
        notifyAboutRecoveryFromUnexpectedError(
            "Defaulted to a do-nothing 'parse error' gate. Failed to understand the json defining a gate.",
            {gate_json: json},
            ex);
        return Gate.fromIdentity(
            id,
            "Parse Error",
            describe(ex)).
            withCustomDrawer(drawer).
            withTag(json).
            withCustomDisableReasonFinder(() => "parse\nerror");
    }
};

/**
 * @param {!GateColumn} v
 * @param {!CustomGateSet=} context
 * @returns {!object}
 */
function toJson_GateColumn(v, context=new CustomGateSet()) {
    return v.gates.map(e => e === null ? 1 : toJson_Gate(e, context));
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
    return new GateColumn(json.map(e => e === 1 || e === null ? null : fromJson_Gate(e, context)));
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
        cols: v.columns.
            map(e => toJson_GateColumn(e, context || v.customGateSet)).
            map(c => seq(c).skipTailWhile(e => e === 1).toArray())
    };
    if (context === undefined && v.customGateSet.gates.length > 0) {
        result.gates = toJson_CustomGateSet(v.customGateSet);
    }
    return result;
};

/**
 * @param {object} json
 * @param {undefined|!CustomGateSet} context
 * @returns {!CircuitDefinition}
 * @throws
 */
let fromJson_CircuitDefinition = (json, context=undefined) => {
    let {cols} = json;
    let customGateSet = context ||
        (json.gates === undefined ? new CustomGateSet() : fromJson_CustomGateSet(json.gates));

    if (!Array.isArray(cols)) {
        throw new Error(`CircuitDefinition json should contain an array of cols. Json: ${describe(json)}`);
    }
    let gateCols = cols.map(e => fromJson_GateColumn(e, customGateSet));
    let numWires = seq(gateCols).map(c => c.minimumRequiredWireCount()).max(0);
    numWires = Math.max(Config.MIN_WIRE_COUNT, Math.min(numWires, Config.MAX_WIRE_COUNT));
    gateCols = gateCols.map(e => new GateColumn(seq(e.gates).
            padded(numWires, null). // Pad column up to circuit length.
            toArray().
            slice(0, numWires))); // Silently discard gates off the edge of the circuit.

    return new CircuitDefinition(numWires, gateCols, undefined, undefined, customGateSet);
};

const BINDINGS = [
    [Complex, toJson_Complex, fromJson_Complex],
    [Gate, toJson_Gate, fromJson_Gate],
    [Matrix, toJson_Matrix, fromJson_Matrix],
    [GateColumn, toJson_GateColumn, fromJson_GateColumn],
    [CircuitDefinition, toJson_CircuitDefinition, fromJson_CircuitDefinition]
];
