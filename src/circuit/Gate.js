import Util from "src/base/Util.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import Config from "src/Config.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"

/**
 * Describes a quantum operation that may vary with time.
 */
class Gate {
    /**
     * @param {!string} symbol The text shown inside the gate's box when drawn on the circuit.
     * @param {!Matrix|!function(!number): !Matrix} matrixOrFunc The operation the gate applies.
     * @param {!string} name A helpful human-readable name for the operation.
     * @param {!string} blurb A helpful description of what the operation does.
     */
    constructor(symbol, matrixOrFunc, name, blurb) {
        /** @type {!string} */
        this.symbol = symbol;
        /** @type {!string} */
        this.serializedId = symbol;
        /** @type {!Matrix|!function(!number): !Matrix} */
        this.matrixOrFunc = matrixOrFunc;
        /** @type {!string} */
        this.name = name;
        /** @type {!string} */
        this.blurb = blurb;
        /** @type {!int} */
        this.width = 1;
        /** @type {!int} */
        this.height = 1;

        /** @type {undefined|!function(!GateDrawParams) : void} */
        this.customDrawer = undefined;
        /** @type {undefined|*} */
        this.tag = undefined;
        /** @type {undefined|!Array.<!function(inputTex:!WglTexture,controlTex:!WglTexture, qubit:!int, time:!number):!WglConfiguredShader>} */
        this.customShaders = undefined;
        /** @type {!Array.<!Gate>} */
        this.gateFamily = [this];
        /** @type {!boolean} */
        this._isTimeDependent = false;
    }

    /**
     * @private
     * @returns {!Gate}
     */
    _copy() {
        let g = new Gate(this.symbol, this.matrixOrFunc, this.name, this.blurb);
        g.serializedId = this.serializedId;
        g.tag = this.tag;
        g.customDrawer = this.customDrawer;
        g.customShaders = this.customShaders;
        g.width = this.width;
        g.height = this.height;
        g.gateFamily = this.gateFamily;
        g._isTimeDependent = this._isTimeDependent;
        return g;
    }

    /**
     * @returns {!Gate}
     */
    withTimeDependence() {
        let g = this._copy();
        g._isTimeDependent = true;
        return g;
    }

    /**
     * @param {!int} width
     * @returns {!Gate}
     */
    withWidth(width) {
        let g = this._copy();
        g.width = width;
        return g;
    }

    /**
     * @param {!int} height
     * @returns {!Gate}
     */
    withHeight(height) {
        let g = this._copy();
        g.height = height;
        return g;
    }

    /**
     * @param {!function(!GateDrawParams) : void} drawer
     * @returns {!Gate}
     */
    withCustomDrawer(drawer) {
        let g = this._copy();
        g.customDrawer = drawer;
        return g;
    }

    /**
     * @param {!string} serializedId
     * @returns {!Gate}
     */
    withSerializedId(serializedId) {
        let g = this._copy();
        g.serializedId = serializedId;
        return g;
    }

    /**
     * @param {!Array.<!function(inputTex: !WglTexture, controlTex: !WglTexture, qubit: !int, time: !number) : !WglConfiguredShader>} shaderFuncs
     * @returns {!Gate}
     */
    withCustomShaders(shaderFuncs) {
        let g = this._copy();
        g.customShaders = shaderFuncs;
        return g;
    }

    /**
     * @param {!function(inputTex: !WglTexture, controlTex: !WglTexture, qubit: !int, time: !number) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomShader(shaderFunc) {
        return this.withCustomShaders([shaderFunc]);
    }

    /**
     * @param {T} gatesObj
     * @returns {T}
     * @template T
     */
    static makeFamily(gatesObj) {
        let oldGates = Util.decomposeObjectValues(gatesObj);
        let newGates = oldGates.map(e => e._copy());
        for (let g of newGates) {
            g.gateFamily = newGates;
        }
        return Util.recomposedObjectValues(gatesObj, newGates);
    }

    canChangeInSize() {
        return this.gateFamily.length > 1;
    }

    canIncreaseInSize() {
        return !this.gateFamily.every(e => e.height !== this.height + 1);
    }

    canDecreaseInSize() {
        return !this.gateFamily.every(e => e.height !== this.height - 1);
    }

    /**
     * @param {*} tag
     * @returns {!Gate}
     */
    withTag(tag) {
        let g = this._copy();
        g.tag = tag;
        return g;
    }

    /**
     * @param {!number} time
     * @returns {!Matrix}
     */
    matrixAt(time) {
        return this.matrixOrFunc instanceof Matrix ? this.matrixOrFunc : this.matrixOrFunc(time);
    }

    /**
     * @returns {!boolean}
     */
    isTimeBased() {
        return this._isTimeDependent || !(this.matrixOrFunc instanceof Matrix);
    }

    /**
     * @param {*|!Gate} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof Gate &&
            this.symbol === other.symbol &&
            this.serializedId === other.serializedId &&
            ((this.matrixOrFunc instanceof Matrix && this.matrixOrFunc.isEqualTo(other.matrixOrFunc)) ||
            this.matrixOrFunc === other.matrixOrFunc) &&
            this.name === other.name &&
            this.blurb === other.blurb &&
            this.symbol === other.symbol &&
            this.tag === other.tag &&
            this.customShaders === other.customShaders &&
            this.customDrawer === other.customDrawer;
    }

    /**
     * @returns {!string}
     */
    toString() {
        return `Gate(${this.symbol})`;
    }
}

export default Gate;
