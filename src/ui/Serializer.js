import Gate from "src/ui/Gate.js"
import GateColumn from "src/ui/GateColumn.js"
import Gates from "src/ui/Gates.js"
import describe from "src/base/Describe.js"
import Seq from "src/base/Seq.js"
import Complex from "src/math/Complex.js"
import Matrix from "src/math/Matrix.js"
import Format from "src/base/Format.js"

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
        throw new Error(`Don't know how to deserialize JSON ${describe(value)} into an instance of ${expectedType}.`);
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
    //noinspection JSCheckFunctionSignatures
    return Matrix.parse(json);
};

/**
 * @param {!Gate} gate
 * @returns {!object}
 */
let toJson_Gate = gate => {
    if (new Seq(Gates.KnownToSerializer).contains(gate)) {
        return {id: gate.symbol};
    }

    if (gate.isTimeBased()) {
        throw new Error("Don't know how to serialize matrix functions.");
    }

    return {
        id: gate.symbol,
        matrix: toJson_Matrix(gate.matrixAt(0.25))
    };
};

/**
 * @param {!object} json
 * @returns {!Gate}
 * @throws {Error}
 */
let fromJson_Gate = json => {
    let symbol = json["id"];
    if (typeof symbol !== "string") {
        throw new Error(`Gate json should contain a string id. Json: ${describe(json)}`);
    }

    let matrixProp = json["matrix"];
    let matrix = matrixProp === undefined ? undefined : fromJson_Matrix(matrixProp);

    let match = new Seq(Gates.KnownToSerializer).
        filter(g => g.symbol === symbol).
        first(null);
    if (match !== null && (matrix === undefined || match.matrix.isEqualTo(matrix))) {
        return match;
    }

    if (symbol === Gates.Named.Silly.FUZZ_SYMBOL && matrix !== undefined) {
        let r = Gates.Named.Silly.FUZZ_MAKER();
        r.matrixOrFunc = matrix;
        return r;
    }

    return new Gate(symbol, matrix, symbol, "(A custom imported gate.)", "", Gate.DEFAULT_DRAWER);
};

/**
 * @param {!GateColumn} v
 * @returns {!object}
 */
let toJson_GateColumn = v => v.gates.map(e => e === null ? null : toJson_Gate(e));

/**
 * @param {object} json
 * @returns {!GateColumn}
 * @throws
 */
let fromJson_GateColumn = json => {
    if (!Array.isArray(json)) {
        throw new Error(`GateColumn json should be an array. Json: ${describe(json)}`);
    }
    return new GateColumn(json.map(e => e === null ? null : fromJson_Gate(e)));
};

const BINDINGS = [
    [Complex, toJson_Complex, fromJson_Complex],
    [Gate, toJson_Gate, fromJson_Gate],
    [Matrix, toJson_Matrix, fromJson_Matrix],
    [GateColumn, toJson_GateColumn, fromJson_GateColumn]
];
