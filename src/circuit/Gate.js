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
     * @param {!function(!GateDrawParams) : void} drawer
     * @param tag Associated data.
     */
    constructor(symbol, matrixOrFunc, name, blurb, drawer, tag = undefined) {
        Util.need(typeof drawer == "function", name + "'s drawer isn't a function");

        /** @type {!string} */
        this.symbol = symbol;
        /** @type {!Matrix|!function(!number): !Matrix} */
        this.matrixOrFunc = matrixOrFunc;
        /** @type {!string} */
        this.name = name;
        /** @type {!string} */
        this.blurb = blurb;
        /** @type {!function(*)} */
        this.drawer = drawer;
        this.tag = tag;
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
            this.drawer === other.drawer;
    }

    toString() {
        return `Gate(${this.symbol})`;
    }
}

export default Gate;
