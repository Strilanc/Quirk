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

import {Complex} from "../math/Complex.js"
import {Config} from "../Config.js"
import {Format} from "../base/Format.js"
import {Gate} from "../circuit/Gate.js"
import {MathPainter} from "./MathPainter.js"
import {Matrix} from "../math/Matrix.js"
import {Painter} from "./Painter.js"
import {Point} from "../math/Point.js"
import {Rect} from "../math/Rect.js"
import {Seq} from "../base/Seq.js"
import {drawCircuitTooltip} from "../ui/DisplayedCircuit.js"
import {Util} from "../base/Util.js"

class WidgetPainter {

    /**
     * @param {!Matrix} matrix
     * @param {!Format} format
     * @returns {!Array.<!string>}
     * @private
     */
    static describeGateTransformations(matrix, format) {
        let n = matrix.height();
        let b = Math.round(Math.log2(n));
        return Seq.range(n).
            map(c => {
                let inputDescription = WidgetPainter.describeKet(b, c, 1, Format.SIMPLIFIED);
                let col = matrix.getColumn(c);
                if (col.every(e => e.isEqualTo(0))) {
                    return "discards " + inputDescription;
                } else if (Seq.range(n).every(r => col[r].isEqualTo(r === c ? 1 : 0))) {
                    if (format !== Format.CONSISTENT) {
                        return "doesn't affect " + inputDescription;
                    }
                } else if (Seq.range(n).every(r => r === c || col[r].isEqualTo(0))) {
                    let degs = col[c].ln().imag * 180/Math.PI;
                    return "phases " + inputDescription + " by " + format.formatFloat(degs) + "°";
                }
                let outputDescription = new Seq(col).
                    mapWithIndex((e, c) => WidgetPainter.describeKet(b, c, e, format)).
                    filter(e => e !== "").
                    join(" + ").
                    split(" + -").join(" - ").
                    split(" + +").join(" + ");
                return 'transforms ' + inputDescription + ' into ' + outputDescription;
            }).
            toArray();
    }

    /**
     * @param {!Painter} painter
     * @param {!Gate} gate
     * @param {undefined|!Matrix} matrix
     * @param {!number} pad
     * @param {!number} dispSize
     * @param {!number} w
     * @param {!function(!Rect, pad:!number=):void} pushRect
     * @param {!function():!number} nextY
     * @private
     */
    static _paintGateTooltip_matrix(painter, gate, matrix, pad, dispSize, w, pushRect, nextY) {
        if (matrix === undefined) {
            return;
        }

        pushRect(new Rect(0, nextY(), 1, 0), pad*2);
        pushRect(painter.printParagraph('As matrix:', new Rect(pad, nextY(), w, 18), new Point(0, 0), 'black', 12), 0);
        let matrixRect = new Rect(pad, nextY(), dispSize, dispSize);
        let matrixDescRect = new Rect(0, matrixRect.y, w - pad, dispSize).skipLeft(matrixRect.right() + pad);
        MathPainter.paintMatrix(
            painter,
            matrix,
            matrixRect,
            Config.OPERATION_FORE_COLOR,
            'black',
            undefined,
            Config.OPERATION_BACK_COLOR,
            undefined,
            'transparent');
        pushRect(matrixRect);
        let n = matrix.height();
        if (n <= 4) {
            let format = gate.stableDuration() < 0.2 ? Format.CONSISTENT : Format.SIMPLIFIED;
            let matDescs = WidgetPainter.describeGateTransformations(matrix, format);
            let rowHeight = matrixDescRect.h / n;
            for (let r = 0; r < n; r++) {
                pushRect(painter.printParagraph(
                    matDescs[r],
                    matrixDescRect.skipTop(r * rowHeight).takeTop(rowHeight),
                    new Point(0, 0.5),
                    'black',
                    12));
            }
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!Gate} gate
     * @param {undefined|!Matrix} matrix
     * @param {!number} pad
     * @param {!number} dispSize
     * @param {!number} w
     * @param {!function(!Rect, pad:!number=):void} pushRect
     * @param {!function():!number} nextY
     * @private
     */
    static _paintGateTooltip_rotation(painter, gate, matrix, pad, dispSize, w, pushRect, nextY) {
        if (matrix === undefined || matrix.width() !== 2 || !matrix.isUnitary(0.001)) {
            return;
        }

        pushRect(new Rect(0, nextY(), 1, 0), pad*2);
        pushRect(painter.printParagraph(
            'As rotation:',
            new Rect(pad, nextY(), w, 18),
            new Point(0, 0),
            'black',
            12), 0);
        let {angle, axis, phase} = matrix.qubitOperationToAngleAxisRotation();

        let blochRect = new Rect(pad, nextY(), dispSize, dispSize);
        MathPainter.paintBlochSphereRotation(
            painter,
            matrix,
            blochRect,
            Config.OPERATION_BACK_COLOR,
            Config.OPERATION_FORE_COLOR);
        pushRect(blochRect);

        let format = gate.stableDuration() < 0.2 ? Format.CONSISTENT : Format.SIMPLIFIED;
        let rotDesc = new Seq([
            `rotates: ${format.formatFloat(angle * 180 / Math.PI)}°`,
            `around: ${WidgetPainter.describeAxis(axis, format)}`,
            '',
            `global phase: exp(${format.formatFloat(phase * 180 / Math.PI)}°i)`,
            ''
        ]).join('\n');
        pushRect(painter.printParagraph(
            rotDesc,
            new Rect(0, blochRect.y, w - pad, dispSize).skipLeft(blochRect.right() + pad),
            new Point(0, 0.5),
            'black',
            12));
    }


    /**
     * @param {!Painter} painter
     * @param {undefined|!CircuitDefinition} nestedCircuit
     * @param {!number} pad
     * @param {!number} dispSize
     * @param {!number} w
     * @param {!function(!Rect, pad:!number=):void} pushRect
     * @param {!function():!number} nextY
     * @param {!number} time
     * @private
     */
    static _paintGateTooltip_circuit(painter, nestedCircuit, pad, dispSize, w, pushRect, nextY, time) {
        if (nestedCircuit === undefined) {
            return;
        }

        let weight = nestedCircuit.gateWeight();

        pushRect(new Rect(0, nextY(), 1, 0), pad*2);
        pushRect(painter.printParagraph(
            `As circuit (gate weight = ${weight}):`,
            new Rect(pad, nextY(), w, 18),
            new Point(0, 0),
            'black',
            12), 0);

        let circuitRect = new Rect(pad, nextY(), w, dispSize);
        let {maxW, maxH} = drawCircuitTooltip(painter, nestedCircuit, circuitRect, true, time);
        pushRect(circuitRect.withW(maxW).withH(maxH));
    }

    /**
     * @param {!Painter} painter
     * @param {!number} w
     * @param {!Gate} gate
     * @param {!number} time
     * @returns {!{maxX: !number, maxY: !number}}
     * @private
     */
    static paintGateTooltipHelper(painter, w, gate, time) {
        const [pad, dispSize] = [4, 65];
        let [maxX, maxY] = [0, pad];
        let pushRect = (rect, actualPad=pad) => {
            maxY = Math.max(maxY, rect.bottom() + actualPad);
            maxX = Math.max(maxX, rect.right() + actualPad);
        };

        pushRect(painter.printLine(gate.name, new Rect(pad, maxY, w, 18), 0, "blue", 24));
        if (gate.blurb !== '') {
            pushRect(painter.printParagraph(gate.blurb, new Rect(pad, maxY, w, 50), new Point(0, 0), 'black', 14));
        }

        let matrix = gate.knownMatrixAt(time);
        if (gate.definitelyHasNoEffect()) {
            return {maxX, maxY};
        }

        WidgetPainter._paintGateTooltip_matrix(painter, gate, matrix, pad, dispSize, w, pushRect, () => maxY);
        WidgetPainter._paintGateTooltip_rotation(painter, gate, matrix, pad, dispSize, w, pushRect, () => maxY);
        WidgetPainter._paintGateTooltip_circuit(
            painter, gate.knownCircuitNested, pad, dispSize, w, pushRect, () => maxY, time);

        return {maxX, maxY};
    }

    /**
     * @param {!Painter} painter
     * @param {!Rect} area
     * @param {!Gate} gate
     * @param {!number} time
     * @param {!boolean=true} mayNeedToScale
     * @returns {!{maxW: number, maxH: number}}
     */
    static paintGateTooltip(painter, area, gate, time, mayNeedToScale=true) {
        painter.ctx.save();
        painter.ctx.translate(area.x, area.y);
        area = area.withX(0).withY(0);
        let scale = Math.min(area.w/500, area.h/300);
        if (mayNeedToScale && scale < 1) {
            painter.ctx.scale(scale, scale);
            area = area.withH(area.h/scale).withW(area.w/scale);
        }
        let w = area.w;

        let {maxX, maxY} = WidgetPainter.paintGateTooltipHelper(painter, w, gate, time);
        let r = new Rect(0, 0, maxX, maxY);
        painter.fillRect(r, '#F9FFF9');
        painter.strokeRect(r, 'black');
        WidgetPainter.paintGateTooltipHelper(painter, w, gate, time);

        painter.ctx.restore();
        return {maxW: maxX, maxH: maxY};
    }

    /**
     * @param {!int} bitCount
     * @param {!int} bitMask
     * @param {!Complex|!number} factor
     * @param {!Format} format
     * @returns {!string}
     */
    static describeKet(bitCount, bitMask, factor, format) {
        factor = Complex.from(factor);
        if (factor.isEqualTo(0)) {
            return "";
        }
        let scaleFactorDesc =
            factor.isEqualTo(1) ? "" :
            factor.isEqualTo(-1) ? "-" :
            factor.isEqualTo(Complex.I) ? "i" :
            factor.isEqualTo(Complex.I.times(-1)) ? "-i" :
            (factor.real === 0 || factor.imag === 0) && format !== Format.CONSISTENT ? factor.toString(format) :
            '(' + factor.toString(format) + ')·';

        let bitDesc = Util.bin(bitMask, bitCount);
        return scaleFactorDesc + '|' + bitDesc + '⟩';
    }
    /**
     * @param {!Array.<!number>} unitAxis x, y, z
     * @param {!Format} format
     * @returns {!string}
     */
    static describeAxis(unitAxis, format) {
        let max = new Seq(unitAxis).map(Math.abs).max();
        return new Seq(unitAxis).
            map(e => e/max).
            zip(["X", "Y", "Z"], (val, name) => {
                if (val === 0) {
                    return "";
                }
                if (val === 1) {
                    return name;
                }
                if (val === -1) {
                    return "-" + name;
                }
                return format.formatFloat(val) + "·" + name;
            }).
            filter(e => e !== "").
            join(" + ").
            replace(" + -", " - ").
            replace(" + +", " + ");
    }
}

export {WidgetPainter}
