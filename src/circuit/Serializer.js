import CircuitDefinition from "src/circuit/CircuitDefinition.js"
import Complex from "src/math/Complex.js"
import Config from "src/Config.js"
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

/**
 * Serializes supported values to/from json elements.
 */
export default class Serializer {
    /**
     * @param {*} value
     * @returns {*}
     */
    static toJson(value) {
        //noinspection JSUnusedLocalSymbols
        for (let [type, toJ, _] of BINDINGS) {
            //noinspection JSUnusedAssignment
            if (value instanceof type) {
                //noinspection JSUnusedAssignment
                return toJ(value);
            }
        }
        throw new Error(`Don't know how to convert ${describe(value)} to JSON.`);
    }

    /**
     * @param {*} expectedType
     * @param {*} json
     * @returns {*}
     */
    static fromJson(expectedType, json) {
        //noinspection JSUnusedLocalSymbols
        for (let [type, _, fromJ] of BINDINGS) {
            //noinspection JSUnusedAssignment
            if (type === expectedType) {
                //noinspection JSUnusedAssignment
                return fromJ(json);
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
 * @returns {!object}
 */
let toJson_Gate = gate => {
    if (seq(Gates.KnownToSerializer).contains(gate)) {
        return gate.serializedId;
    }

    if (gate.name === "Parse Error") {
        return gate.tag;
    }

    if (gate.stableDuration() !== Infinity || gate.knownMatrixAt(0) === undefined) {
        throw new DetailedError("Can't serialize unknown gate with non-trivial operation.", {gate});
    }

    let matrix = gate.knownMatrixAt(0.25);

    if (gate.serializedId === "") {
        return {
            matrix: toJson_Matrix(matrix)
        };
    }

    return {
        id: gate.serializedId,
        matrix: toJson_Matrix(matrix)
    };
};

/**
 * @param {!object} json
 * @returns {!Gate}
 * @throws {Error}
 */
let fromJson_Gate = json => {
    let symbol = typeof json === "string" ? json : json["id"];

    // Recover from bad symbol.
    if (symbol === undefined) {
        symbol = "";
    }
    if (typeof symbol !== "string") {
        symbol = describe(symbol);
    }

    let matrixProp = json["matrix"];
    if (matrixProp === undefined) {
        // Should be a built-in.
        let match = seq(Gates.KnownToSerializer).
            filter(g => g.serializedId === symbol).
            first(null);
        if (match !== null) {
            return match;
        }

        // Err, okay... probably a bad matrix. Let the parse fail below.
    }

    let drawer = symbol === "" ? GatePainting.MATRIX_DRAWER : GatePainting.DEFAULT_DRAWER;
    let matrix;
    try {
        if (matrixProp === undefined) {
            throw new Error("Unrecognized gate id, but no matrix specified.");
        }
        matrix = fromJson_Matrix(matrixProp);
        if (matrix.width() !== matrix.height()) {
            throw new Error("Gate matrix must be square.");
        }
        if (matrix.width() < 2 || !Util.isPowerOf2(matrix.width())) {
            throw new Error("Gate matrix size must be at least 2, and a power of 2.");
        }
    } catch (ex) {
        notifyAboutRecoveryFromUnexpectedError(
            "Defaulted to a do-nothing 'parse error' gate. Failed to understand the json defining a gate.",
            {gate_json: json},
            ex);
        return Gate.fromIdentity(
            symbol,
            "Parse Error",
            describe(ex)).
            withCustomDrawer(drawer).
            withTag(json).
            withCustomDisableReasonFinder(() => "parse\nerror");
    }

    if (symbol === MysteryGateSymbol && matrix !== undefined) {
        return MysteryGateMakerWithMatrix(matrix);
    }

    return Gate.fromKnownMatrix(symbol, matrix, symbol, "").withCustomDrawer(drawer);
};

/**
 * @param {!GateColumn} v
 * @returns {!object}
 */
let toJson_GateColumn = v => v.gates.map(e => e === null ? 1 : toJson_Gate(e));

/**
 * @param {object} json
 * @returns {!GateColumn}
 * @throws
 */
let fromJson_GateColumn = json => {
    if (!Array.isArray(json)) {
        throw new Error(`GateColumn json should be an array. Json: ${describe(json)}`);
    }
    return new GateColumn(json.map(e => e === 1 || e === null ? null : fromJson_Gate(e)));
};

/**
 * @param {!CircuitDefinition} v
 * @returns {!object}
 */
let toJson_CircuitDefinition = v => {
    return {
        cols: v.columns.map(Serializer.toJson).map(c => seq(c).skipTailWhile(e => e === 1).toArray())
    };
};

/**
 * @param {object} json
 * @returns {!CircuitDefinition}
 * @throws
 */
let fromJson_CircuitDefinition = json => {
    let {cols} = json;

    if (!Array.isArray(cols)) {
        throw new Error(`CircuitDefinition json should contain an array of cols. Json: ${describe(json)}`);
    }
    let gateCols = cols.map(e => Serializer.fromJson(GateColumn, e));
    let numWires = seq(gateCols).map(c => c.minimumRequiredWireCount()).max(0);
    numWires = Math.max(Config.MIN_WIRE_COUNT, Math.min(numWires, Config.MAX_WIRE_COUNT));
    gateCols = gateCols.map(e => new GateColumn(seq(e.gates).
            padded(numWires, null). // Pad column up to circuit length.
            toArray().
            slice(0, numWires))); // Silently discard gates off the edge of the circuit.

    return new CircuitDefinition(numWires, gateCols);
};

const BINDINGS = [
    [Complex, toJson_Complex, fromJson_Complex],
    [Gate, toJson_Gate, fromJson_Gate],
    [Matrix, toJson_Matrix, fromJson_Matrix],
    [GateColumn, toJson_GateColumn, fromJson_GateColumn],
    [CircuitDefinition, toJson_CircuitDefinition, fromJson_CircuitDefinition]
];
