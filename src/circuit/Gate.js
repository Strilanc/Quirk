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

        /** @type {undefined|!function(!GateDrawParams) : void} */
        this.customDrawer = undefined;
        /** @type {undefined|*} */
        this.tag = undefined;
        /** @type {undefined|!function(inputTex:!WglTexture,controlTex:!WglTexture, qubit:!int):!WglConfiguredShader} */
        this.customShader = undefined;
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
        g.customShader = this.customShader;
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
     * @param {!function(inputTex: !WglTexture, controlTex: !WglTexture, qubit: !int) : !WglConfiguredShader} shaderFunc
     * @returns {!Gate}
     */
    withCustomShader(shaderFunc) {
        let g = this._copy();
        g.customShader = shaderFunc;
        return g;
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

    isTimeBased() {
        return !(this.matrixOrFunc instanceof Matrix);
    }

    isEqualTo(other) {
        return other instanceof Gate &&
            this.symbol === other.symbol &&
            ((this.matrixOrFunc instanceof Matrix && this.matrixOrFunc.isEqualTo(other.matrixOrFunc)) ||
            this.matrixOrFunc === other.matrixOrFunc) &&
            this.name === other.name &&
            this.blurb === other.blurb &&
            this.symbol === other.symbol &&
            this.tag === other.tag &&
            this.customShader === other.customShader &&
            this.customDrawer === other.customDrawer;
    }

    toString() {
        return `Gate(${this.symbol})`;
    }
}

export default Gate;
