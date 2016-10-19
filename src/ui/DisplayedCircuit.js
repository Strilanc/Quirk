import {CircuitDefinition} from "src/circuit/CircuitDefinition.js"
import {CircuitStats} from "src/circuit/CircuitStats.js"
import {Config} from "src/Config.js"
import {DetailedError} from "src/base/DetailedError.js"
import {equate} from "src/base/Equate.js"
import {Format} from "src/base/Format.js"
import {GateColumn} from "src/circuit/GateColumn.js"
import {GateDrawParams} from "src/draw/GateDrawParams.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Gates} from "src/gates/AllGates.js"
import {Hand} from "src/ui/Hand.js"
import {MathPainter} from "src/draw/MathPainter.js"
import {Point} from "src/math/Point.js"
import {Matrix} from "src/math/Matrix.js"
import {Rect} from "src/math/Rect.js"
import {Util} from "src/base/Util.js"
import {seq, Seq} from "src/base/Seq.js"
import {paintBlochSphereDisplay} from "src/gates/BlochSphereDisplay.js"

/** @type {!number} */
let CIRCUIT_OP_HORIZONTAL_SPACING = 10;
/** @type {!number} */
let CIRCUIT_OP_LEFT_SPACING = 35;

const SUPERPOSITION_GRID_LABEL_SPAN = 50;

const EXTRA_COLS_FOR_SINGLE_QUBIT_DISPLAYS = 2;

class DisplayedCircuit {
    /**
     *
     * @param {!number} top
     * @param {!CircuitDefinition} circuitDefinition
     * @param {undefined|!int} compressedColumnIndex
     * @param {undefined|!{col: !int, row: undefined|!int, resizeStyle: !boolean}} highlightedSlot
     * @param {undefined|!int} extraWireStartIndex
     * @private
     */
    constructor(top, circuitDefinition, compressedColumnIndex, highlightedSlot, extraWireStartIndex) {
        if (!Number.isFinite(top)) {
            throw new DetailedError("Bad top", {top, circuitDefinition});
        }
        if (!(circuitDefinition instanceof CircuitDefinition)) {
            throw new DetailedError("Bad circuitDefinition", {top, circuitDefinition});
        }
        /**
         * @type {!number}
         */
        this.top = top;
        /**
         * @type {!CircuitDefinition}
         */
        this.circuitDefinition = circuitDefinition;
        /**
         * @type {undefined|!int}
         * @private
         */
        this._compressedColumnIndex = compressedColumnIndex;
        /**
         * @type {undefined|!{col: !int, row: undefined|!int, resizeStyle: !boolean}}
         * @private
         */
        this._highlightedSlot = highlightedSlot;
        /**
         * @type {undefined|!int}
         * @private
         */
        this._extraWireStartIndex = extraWireStartIndex;
    }

    /**
     * @param {!number} top
     * @returns {!DisplayedCircuit}
     */
    static empty(top) {
        return new DisplayedCircuit(
            top,
            new CircuitDefinition(Config.MIN_WIRE_COUNT, []),
            undefined,
            undefined,
            undefined);
    }

    /**
     * @returns {!boolean}
     */
    isBeingEdited() {
        return this._extraWireStartIndex !== undefined;
    }

    /**
     * @returns {!int}
     * @private
     */
    _groundedWireCount() {
        let pseudoCount =
            this._extraWireStartIndex !== undefined && this._extraWireStartIndex !== Config.MAX_WIRE_COUNT ? 1 : 0;

        let n = Math.max(Config.MIN_WIRE_COUNT, this.circuitDefinition.numWires) - pseudoCount;
        return Math.max(n, this.circuitDefinition.minimumRequiredWireCount());
    }

    /**
     * @param {!bool=true} forTooltip
     * @returns {!number}
     */
    desiredHeight(forTooltip=false) {
        if (forTooltip) {
            return this.circuitDefinition.numWires * Config.WIRE_SPACING;
        }
        return this._groundedWireCount() * Config.WIRE_SPACING + 55;
    }

    /**
     * @param {!bool=true} forTooltip
     * @returns {!number}
     */
    desiredWidth(forTooltip=false) {
        if (forTooltip) {
            return this.gateRect(1, this.circuitDefinition.columns.length).x + CIRCUIT_OP_LEFT_SPACING;
        }
        return this._rectForSuperpositionDisplay().right() + 101;
    }

    /**
     * @param {!int} wireIndex
     * @returns {!Rect}
     */
    wireRect(wireIndex) {
        if (wireIndex < 0) {
            throw new DetailedError("Bad wireIndex", {wireIndex});
        }
        return new Rect(0, this.top + Config.WIRE_SPACING * wireIndex, Infinity, Config.WIRE_SPACING);
    }

    /**
     * @param {!number} y
     * @returns {!int}
     */
    wireIndexAt(y) {
        return Math.floor((y - this.top) / Config.WIRE_SPACING);
    }

    //noinspection JSMethodCanBeStatic
    /**
     * @param {!number} x
     * @returns {!number} The continuous column-space coordinate corresponding to the given display-space coordinate.
     * @private
     */
    toColumnSpaceCoordinate(x) {
        let spacing = (CIRCUIT_OP_HORIZONTAL_SPACING + Config.GATE_RADIUS * 2);
        let left = CIRCUIT_OP_LEFT_SPACING - CIRCUIT_OP_HORIZONTAL_SPACING / 2;
        return (x - left) / spacing - 0.5;
    }

    /**
     * @param {!number} y
     * @returns {undefined|!int}
     */
    indexOfDisplayedRowAt(y) {
        let i = Math.floor((y - this.top) / Config.WIRE_SPACING);
        if (i < 0 || i >= this.circuitDefinition.numWires) {
            return undefined;
        }
        return i;
    }

    /**
     * @param {!number} x
     * @returns {undefined|!int}
     */
    indexOfDisplayedColumnAt(x) {
        let col = this.toColumnSpaceCoordinate(x);
        let i;
        if (this._compressedColumnIndex === undefined || col < this._compressedColumnIndex - 0.75) {
            i = Math.round(col);
        } else if (col < this._compressedColumnIndex - 0.25) {
            i = this._compressedColumnIndex;
        } else {
            i = Math.round(col) - 1;
        }

        if (i < 0 || i >= this.circuitDefinition.columns.length) {
            return undefined;
        }

        return i;
    }

    /**
     * @param {!Point} p
     * @returns {undefined|!number}
     */
    findOpHalfColumnAt(p) {
        if (p.x < 0 || p.y < this.top || p.y > this.top + this.desiredHeight()) {
            return undefined;
        }

        return Math.max(-0.5, Math.round(this.toColumnSpaceCoordinate(p.x) * 2) / 2);
    }

    /**
     * @param {!Hand} hand
     * @returns {undefined|!{col: !int, row: !int, halfColIndex: !number}}
     * @private
     */
    _findModificationIndex_helperColRow(hand) {
        if (hand.pos === undefined || hand.heldGate === undefined) {
            return undefined;
        }
        let pos = hand.pos.minus(hand.holdOffset).plus(new Point(Config.GATE_RADIUS, Config.GATE_RADIUS));
        let halfColIndex = this.findOpHalfColumnAt(pos);
        let row = this.indexOfDisplayedRowAt(pos.y);
        if (halfColIndex === undefined || row === undefined) {
            return undefined;
        }
        let col = Math.ceil(halfColIndex);
        return {col, row, halfColIndex};
    }

    /**
     * @param {!Hand} hand
     * @returns {?{ col : !number, row : !number, isInsert : !boolean }}
     */
    findModificationIndex(hand) {
        let loc = this._findModificationIndex_helperColRow(hand);
        if (loc === undefined) {
            return undefined;
        }
        let {col, row, halfColIndex} = loc;

        let isInsert = Math.abs(halfColIndex % 1) === 0.5;
        if (col >= this.circuitDefinition.columns.length) {
            return {col: col, row: row, isInsert: isInsert};
        }

        if (!isInsert) {
            let mustInsert = this.circuitDefinition.isSlotRectCoveredByGateInSameColumn(
                col, row, hand.heldGate.height);
            if (mustInsert) {
                let isAfter = hand.pos.x > this.opRect(col).center().x;
                isInsert = true;
                if (isAfter) {
                    col += 1;
                }
            }
        }

        return {col: col, row: row, isInsert: isInsert};
    }

    /**
     * @param {!int} operationIndex
     * @returns {Rect!}
     */
    opRect(operationIndex) {
        let opWidth = Config.GATE_RADIUS * 2;
        let opSeparation = opWidth + CIRCUIT_OP_HORIZONTAL_SPACING;
        let tweak = 0;
        if (this._compressedColumnIndex !== undefined && operationIndex === this._compressedColumnIndex) {
            tweak = opSeparation / 2;
        }
        if (this._compressedColumnIndex !== undefined && operationIndex > this._compressedColumnIndex) {
            tweak = opSeparation;
        }

        let dx = opSeparation * operationIndex - tweak + CIRCUIT_OP_LEFT_SPACING;
        return new Rect(dx, this.top, opWidth, this.desiredHeight());
    }

    /**
     * @param {!int} wireIndex
     * @param {!int} operationIndex
     * @param {!int=} width
     * @param {!int=} height
     */
    gateRect(wireIndex, operationIndex, width=1, height=1) {
        let op = this.opRect(operationIndex);
        let wire = this.wireRect(wireIndex);
        let r = new Rect(
            op.center().x - Config.GATE_RADIUS,
            wire.center().y - Config.GATE_RADIUS,
            2*Config.GATE_RADIUS + (width-1)*Config.WIRE_SPACING,
            2*Config.GATE_RADIUS + (height-1)*Config.WIRE_SPACING);

        return new Rect(Math.round(r.x - 0.5) + 0.5, Math.round(r.y - 0.5) + 0.5, Math.round(r.w), Math.round(r.h));
    }

    /**
     * @returns {!DisplayedCircuit}
     */
    afterTidyingUp() {
        return this.
            withCircuit(this.circuitDefinition.
                withUncoveredColumnsRemoved().
                withHeightOverlapsFixed().
                withWidthOverlapsFixed().
                withUncoveredColumnsRemoved().
                withTrailingSpacersIncluded()).
            _withCompressedColumnIndex(undefined).
            _withExtraWireStartIndex(undefined).
            _withHighlightedSlot(undefined);
    }

    /**
     * @param {!DisplayedCircuit|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        if (this === other) {
            return true;
        }
        return other instanceof DisplayedCircuit &&
            this.top === other.top &&
            this.circuitDefinition.isEqualTo(other.circuitDefinition) &&
            this._compressedColumnIndex === other._compressedColumnIndex &&
            this._extraWireStartIndex === other._extraWireStartIndex &&
            equate(this._highlightedSlot, other._highlightedSlot);
    }

    /**
     * @param {!Painter} painter
     * @param {!Hand} hand
     * @param {!CircuitStats} stats
     * @param {!bool=false} forTooltip
     * @param {!bool} showWires
     */
    paint(painter, hand, stats, forTooltip=false, showWires=true) {
        if (showWires) {
            this._drawWires(painter, !forTooltip);
        }

        for (let col = 0; col < this.circuitDefinition.columns.length; col++) {
            this._drawColumn(painter, this.circuitDefinition.columns[col], col, hand, stats);
        }

        if (!forTooltip) {
            this._drawOutputDisplays(painter, stats, hand);
            this._drawHintLabels(painter, stats);
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!boolean} showLabels
     * @private
     */
    _drawWires(painter, showLabels) {
        let drawnWireCount = Math.min(this.circuitDefinition.numWires, (this._extraWireStartIndex || Infinity) + 1);

        // Initial value labels
        if (showLabels) {
            for (let row = 0; row < drawnWireCount; row++) {
                let wireRect = this.wireRect(row);
                let y = wireRect.center().y;
                painter.print('|0⟩', 20, y, 'right', 'middle', 'black', '14px sans-serif', 20, Config.WIRE_SPACING);
            }
        }

        // Wires (doubled-up for measured sections).
        painter.ctx.save();
        for (let row = 0; row < drawnWireCount; row++) {
            if (row === this._extraWireStartIndex) {
                painter.ctx.globalAlpha *= 0.5;
            }
            painter.trace(trace => {
                let wireRect = this.wireRect(row);
                let y = Math.round(wireRect.center().y - 0.5) + 0.5;
                let lastX = showLabels ? 25 : 5;
                //noinspection ForLoopThatDoesntUseLoopVariableJS
                for (let col = 0;
                        showLabels ? lastX < painter.canvas.width : col <= this.circuitDefinition.columns.length;
                        col++) {
                    let x = this.opRect(col).center().x;
                    if (this.circuitDefinition.locIsMeasured(new Point(col, row))) {
                        // Measured wire.
                        trace.line(lastX, y-1, x, y-1);
                        trace.line(lastX, y+1, x, y+1);
                    } else {
                        // Unmeasured wire.
                        trace.line(lastX, y, x, y);
                    }
                    lastX = x;
                }
            }).thenStroke('black');
        }
        painter.ctx.restore();
        if (this._extraWireStartIndex !== undefined && this.circuitDefinition.numWires === Config.MAX_WIRE_COUNT) {
            painter.print(
                `(Max wires. Qubit limit is ${Config.MAX_WIRE_COUNT}.)`,
                5,
                this.wireRect(Config.MAX_WIRE_COUNT).y,
                'left',
                'top',
                'red',
                '16px bold monospace',
                400,
                Config.WIRE_SPACING);
        }
    }

    /**
     * @param {!int} col
     * @param {!int} row
     * @param {!Array.<!Point>} focusPosPts
     * @returns {!{isHighlighted: !boolean, isResizeShowing: !boolean, isResizeHighlighted: !boolean}}
     * @private
     */
    _highlightStatusAt(col, row, focusPosPts) {
        if (this._highlightedSlot !== undefined) {
            if (this._highlightedSlot.col === col && this._highlightedSlot.row === row) {
                return {
                    isResizeShowing: true,
                    isResizeHighlighted: this._highlightedSlot.resizeStyle,
                    isHighlighted: !this._highlightedSlot.resizeStyle
                };
            }
        }

        let gate = this.circuitDefinition.gateInSlot(col, row);
        if (gate === undefined || this._highlightedSlot !== undefined) {
            return {
                isResizeShowing: false,
                isResizeHighlighted: false,
                isHighlighted: false
            };
        }

        let gateRect = this.gateRect(row, col, gate.width, gate.height);
        let resizeTabRect = GatePainting.rectForResizeTab(gateRect);

        let isOverGate = pos => {
            let overGate = this.findGateOverlappingPos(pos);
            return overGate !== undefined && overGate.col === col && overGate.row === row;
        };
        let isNotCoveredAt = pos => {
            let g = this.findGateOverlappingPos(pos);
            return g === undefined || (g.col === col && g.row === row);
        };
        let isOverGateResizeTab = pos => isNotCoveredAt(pos) && resizeTabRect.containsPoint(pos);

        let isResizeHighlighted = gate.canChangeInSize() && seq(focusPosPts).any(isOverGateResizeTab);
        let isHighlighted = !isResizeHighlighted && seq(focusPosPts).any(isOverGate);
        let isResizeShowing = gate.canChangeInSize() && (isResizeHighlighted || isHighlighted);

        return {isHighlighted, isResizeShowing, isResizeHighlighted};
    }

    /**
     * @param {!Painter} painter
     * @param {!int} col
     * @param {!int} row
     * @param {!Rect} gateRect
     * @param {!boolean} isHighlighted
     * @private
     */
    _drawGate_disabledReason(painter, col, row, gateRect, isHighlighted) {
        let isDisabledReason = this.circuitDefinition.gateAtLocIsDisabledReason(col, row);
        if (isDisabledReason === undefined) {
            return;
        }

        painter.ctx.save();
        if (isHighlighted) {
            painter.ctx.globalAlpha *= 0.3;
        }
        painter.ctx.globalAlpha *= 0.5;
        painter.fillRect(gateRect.paddedBy(5), 'yellow');
        painter.ctx.globalAlpha *= 2;
        painter.strokeLine(gateRect.topLeft(), gateRect.bottomRight(), 'orange', 3);
        let r = painter.printParagraph(isDisabledReason, gateRect.paddedBy(5), new Point(0.5, 0.5), 'red');
        painter.ctx.globalAlpha *= 0.5;
        painter.fillRect(r.paddedBy(2), 'yellow');
        painter.ctx.globalAlpha *= 2;
        painter.printParagraph(isDisabledReason, gateRect.paddedBy(5), new Point(0.5, 0.5), 'red');
        painter.ctx.restore()
    }

    /**
     * @param {!Painter} painter
     * @param {!GateColumn} gateColumn
     * @param {!int} col
     * @param {!Hand} hand
     * @param {!CircuitStats} stats
     * @private
     */
    _drawColumn(painter, gateColumn, col, hand, stats) {
        this._drawColumnControlWires(painter, gateColumn, col, stats);
        this._drawColumnDragHighlight(painter, col);

        for (let row = 0; row < this.circuitDefinition.numWires; row++) {
            if (gateColumn.gates[row] === undefined) {
                continue;
            }
            let gate = gateColumn.gates[row];
            let gateRect = this.gateRect(row, col, gate.width, gate.height);

            let {isHighlighted, isResizeShowing, isResizeHighlighted} =
                this._highlightStatusAt(col, row, hand.hoverPoints());

            let drawer = gate.customDrawer || GatePainting.DEFAULT_DRAWER;
            painter.noteTouchBlocker({rect: gateRect, cursor: 'pointer'});
            if (gate.canChangeInSize()) {
                painter.noteTouchBlocker({rect: GatePainting.rectForResizeTab(gateRect), cursor: 'ns-resize'});
            }
            drawer(new GateDrawParams(
                painter,
                false,
                isHighlighted && !isResizeHighlighted,
                isResizeShowing,
                isResizeHighlighted,
                gateRect,
                gate,
                stats,
                {row, col},
                this._highlightedSlot === undefined ? hand.hoverPoints() : [],
                stats.customStatsForSlot(col, row)));

            this._drawGate_disabledReason(painter, col, row, gateRect, isHighlighted);
        }
    }

    _drawColumnDragHighlight(painter, col) {
        if (this._highlightedSlot !== undefined &&
                this._highlightedSlot.col === col &&
                this._highlightedSlot.row === undefined) {
            let rect = this.gateRect(0, col, 1, this._groundedWireCount()).paddedBy(3);
            painter.fillRect(rect, 'rgba(255, 196, 112, 0.7)');
            painter.strokeRect(rect, 'black');
        }
    }

    /**
     * @param {!Painter} painter
     * @param {!GateColumn} gateColumn
     * @param {!int} columnIndex
     * @param {!CircuitStats} stats
     * @private
     */
    _drawColumnControlWires(painter, gateColumn, columnIndex, stats) {
        let n = gateColumn.gates.length;
        let gs = gateColumn.gates;
        let x = Math.round(this.opRect(columnIndex).center().x - 0.5) + 0.5;

        if (stats.circuitDefinition.colHasNonLocalGates(columnIndex)) {
            painter.ctx.save();
            painter.ctx.setLineDash([1, 4]);
            painter.strokeLine(
                new Point(x, this.gateRect(0, 0).y),
                new Point(x, this.gateRect(this.circuitDefinition.numWires-1, 0).bottom()));
            painter.ctx.restore();
        }

        let hasTwoSwaps = stats.circuitDefinition.colHasEnabledSwapGate(columnIndex);

        let firstLast = predicate => firstLastMatchInRange(n, predicate);
        let [t1, t2] = firstLast(i => stats.circuitDefinition.locHasControllableGate(new Point(columnIndex, i)));
        let [c1, c2] = firstLast(i => this.circuitDefinition.locStartsSingleControlWire(new Point(columnIndex, i)));
        let [cc1, cc2] = firstLast(i => this.circuitDefinition.locStartsDoubleControlWire(new Point(columnIndex, i)));
        let [s1, s2] = firstLast(i => hasTwoSwaps && gs[i] === Gates.Special.SwapHalf);

        if (c1 !== undefined && t1 !== undefined) {
            let y1 =  this.wireRect(Math.min(t1, c1)).center().y;
            let y2 = this.wireRect(Math.max(t2, c2)).center().y;
            painter.strokeLine(new Point(x,y1), new Point(x, y2));
        }
        if (s1 !== undefined) {
            let y1 =  this.wireRect(s1).center().y;
            let y2 = this.wireRect(s2).center().y;
            painter.strokeLine(new Point(x,y1), new Point(x, y2));
        }
        if (cc1 !== undefined && t1 !== undefined) {
            let y1 =  this.wireRect(Math.min(t1, cc1)).center().y;
            let y2 = this.wireRect(Math.max(t2, cc2)).center().y;
            painter.strokeLine(new Point(x+1, y1), new Point(x+1, y2));
            painter.strokeLine(new Point(x-1, y1), new Point(x-1, y2));
        }
    }

    /**
     * @param {!Hand} hand
     * @returns {!DisplayedCircuit}
     */
    previewDrop(hand) {
        return hand.heldColumn !== undefined ? this._previewDropMovedGateColumn(hand) :
            hand.heldGate !== undefined ? this._previewDropMovedGate(hand) :
            this._previewResizedGate(hand);
    }

    /**
     * @param {!Hand} hand
     * @returns {!DisplayedCircuit}
     * @private
     */
    _previewDropMovedGateColumn(hand) {
        let halfCol = this.findOpHalfColumnAt(new Point(hand.pos.x, this.top));
        let mustInsert = halfCol % 1 === 0 &&
            this.circuitDefinition.columns[halfCol] !== undefined &&
            !this.circuitDefinition.columns[halfCol].isEmpty();
        if (mustInsert) {
            let isAfter = hand.pos.x > this.opRect(halfCol).center().x;
            halfCol += isAfter ? 0.5 : -0.5;
        }

        let col = Math.ceil(halfCol);
        let isInsert = halfCol % 1 !== 0;

        let rowShift = Math.round((hand.pos.y - hand.holdOffset.y - this.top) / Config.WIRE_SPACING);
        let newCircuitDef = this._shiftAndSpliceColumn(rowShift, [...hand.heldColumn.gates], col, isInsert);

        return this.withCircuit(newCircuitDef).
            _withHighlightedSlot({row: undefined, col, resizeStyle: false}).
            _withCompressedColumnIndex(isInsert ? col : undefined);
    }

    _shiftAndSpliceColumn(rowShift, gatesOfCol, insertCol, isInsert) {
        // Move gates upward.
        while (rowShift < 0 && gatesOfCol[0] === undefined) {
            gatesOfCol.shift();
            gatesOfCol.push(undefined);
            rowShift += 1;
        }

        // Shift gates downward.
        while (rowShift > 0 && gatesOfCol.length < Config.MAX_WIRE_COUNT) {
            gatesOfCol.unshift(undefined);
            if (new GateColumn(gatesOfCol).minimumRequiredWireCount() < gatesOfCol.length) {
                gatesOfCol.pop();
            }
            rowShift -= 1;
        }

        let expandedCircuit = this.circuitDefinition.withWireCount(gatesOfCol.length);
        let newCols = [...expandedCircuit.columns];

        // Move displays rightward.
        while (newCols.length < insertCol) {
            newCols.push(GateColumn.empty(expandedCircuit.numWires));
        }

        newCols.splice(insertCol, isInsert ? 0 : 1, new GateColumn(gatesOfCol));
        return expandedCircuit.withColumns(newCols).withTrailingSpacersIncluded();
    }

    /**
     * @param {!Hand} hand
     * @returns {!DisplayedCircuit}
     * @private
     */
    _previewDropMovedGate(hand) {
        let modificationPoint = this.findModificationIndex(hand);
        if (modificationPoint === undefined) {
            return this;
        }

        // Use the grab offset instead of the gate height so that tall gates are 'sticky' when dragging downward: they
        // aren't removed until the hand actually leaves the circuit area.
        let handRowOffset = Math.floor(hand.holdOffset.y/Config.WIRE_SPACING);
        if (modificationPoint.row + handRowOffset >= this.circuitDefinition.numWires) {
            return this;
        }

        let addedGate = hand.heldGate;

        let emptyCol = GateColumn.empty(this.circuitDefinition.numWires);
        let i = modificationPoint.col;
        let isInserting = modificationPoint.isInsert;
        let row = Math.min(modificationPoint.row, Math.max(0, Config.MAX_WIRE_COUNT - addedGate.height));
        let newCols = seq(this.circuitDefinition.columns).
            padded(i, emptyCol).
            ifThen(isInserting, s => s.withInsertedItem(i, emptyCol)).
            padded(i + addedGate.width, emptyCol).
            withTransformedItem(i, c => c.withGatesAdded(row, new GateColumn([addedGate]))).
            toArray();
        let newWireCount = Math.max(
            this._extraWireStartIndex || 0,
            Math.max(
                this.circuitDefinition.numWires,
                addedGate.height + row));
        if (newWireCount > Config.MAX_WIRE_COUNT) {
            return this;
        }

        let newCircuitDef = this.circuitDefinition.
            withColumns(newCols).
            withWireCount(newWireCount);
        return this.withCircuit(newCircuitDef).
            _withHighlightedSlot({row, col: modificationPoint.col, resizeStyle: false}).
            _withCompressedColumnIndex(isInserting ? i : undefined).
            _withFallbackExtraWireStartIndex(this.circuitDefinition.numWires);
    }

    /**
     * @param {!Hand} hand
     * @returns {!DisplayedCircuit}
     * @private
     */
    _previewResizedGate(hand) {
        if (hand.resizingGateSlot === undefined || hand.pos === undefined) {
            return this;
        }
        let gate = this.circuitDefinition.gateInSlot(hand.resizingGateSlot.x, hand.resizingGateSlot.y);
        if (gate === undefined) {
            return this;
        }
        let row = Math.min(
            this.wireIndexAt(hand.pos.y - hand.holdOffset.y),
            Config.MAX_WIRE_COUNT - 1);
        let newGate = seq(gate.gateFamily).minBy(g => Math.abs(g.height - (row - hand.resizingGateSlot.y + 1)));
        let newWireCount = Math.min(Config.MAX_WIRE_COUNT,
            Math.max(this.circuitDefinition.numWires, newGate.height + hand.resizingGateSlot.y));
        let newCols = seq(this.circuitDefinition.columns).
            withTransformedItem(hand.resizingGateSlot.x,
                colObj => new GateColumn(seq(colObj.gates).
                    withOverlayedItem(hand.resizingGateSlot.y, newGate).
                    toArray())).
            toArray();

        let newCircuitWithoutOverlapFix = this.circuitDefinition.withColumns(newCols).withWireCount(newWireCount);
        let newCircuitWithOverlapFix = newCircuitWithoutOverlapFix.withHeightOverlapsFixed();
        let newCircuit = newCircuitWithOverlapFix.withTrailingSpacersIncluded();
        return this.withCircuit(newCircuit).
            _withHighlightedSlot(this._highlightedSlot).
            _withCompressedColumnIndex(newCircuitWithoutOverlapFix.isEqualTo(newCircuitWithOverlapFix) ?
                undefined :
                hand.resizingGateSlot.x + 1).
            _withFallbackExtraWireStartIndex(this.circuitDefinition.numWires);
    }

    /**
     * @param {!Hand} hand
     * @returns {!DisplayedCircuit}
     */
    afterDropping(hand) {
        return this.previewDrop(hand)._withCompressedColumnIndex(undefined);
    }

    /**
     * @param {!CircuitDefinition} circuitDefinition
     * @returns {!DisplayedCircuit}
     */
    withCircuit(circuitDefinition) {
        return new DisplayedCircuit(
            this.top,
            circuitDefinition,
            this._compressedColumnIndex,
            this._highlightedSlot,
            this._extraWireStartIndex);
    }

    /**
     * @param {undefined|!int} compressedColumnIndex
     * @returns {!DisplayedCircuit}
     * @private
     */
    _withCompressedColumnIndex(compressedColumnIndex) {
        return new DisplayedCircuit(
            this.top,
            this.circuitDefinition,
            compressedColumnIndex,
            this._highlightedSlot,
            this._extraWireStartIndex);
    }

    /**
     * @param {undefined|!{col: !int, row: undefined|!int, resizeStyle: !boolean}} slot
     * @returns {!DisplayedCircuit}
     * @private
     */
    _withHighlightedSlot(slot) {
        return new DisplayedCircuit(
            this.top,
            this.circuitDefinition,
            this._compressedColumnIndex,
            slot,
            this._extraWireStartIndex);
    }

    /**
     * @param {undefined|!int} extraWireStartIndex
     * @returns {!DisplayedCircuit}
     * @private
     */
    _withExtraWireStartIndex(extraWireStartIndex) {
        return new DisplayedCircuit(
            this.top,
            this.circuitDefinition,
            this._compressedColumnIndex,
            this._highlightedSlot,
            extraWireStartIndex);
    }

    /**
     * @param {undefined|!int} fallbackExtraWireStartIndex
     * @returns {!DisplayedCircuit}
     * @private
     */
    _withFallbackExtraWireStartIndex(fallbackExtraWireStartIndex) {
        return this._withExtraWireStartIndex(this._extraWireStartIndex || fallbackExtraWireStartIndex);
    }

    /**
     * @param {!Hand} hand
     * @param {!int} extraWireCount
     * @returns {!DisplayedCircuit}
     */
    withJustEnoughWires(hand, extraWireCount) {
        let neededWireCountForPlacement = hand.heldGate !== undefined ? hand.heldGate.height : 0;
        let desiredWireCount = this.circuitDefinition.minimumRequiredWireCount();
        let clampedWireCount = Math.min(
            Config.MAX_WIRE_COUNT,
            Math.max(
                Math.min(1, neededWireCountForPlacement),
                Math.max(Config.MIN_WIRE_COUNT, desiredWireCount) + extraWireCount));
        return this.withCircuit(this.circuitDefinition.withWireCount(clampedWireCount)).
            _withExtraWireStartIndex(extraWireCount === 0 ? undefined : this.circuitDefinition.numWires);
    }

    /**
     * @param {!Point} pos
     * @returns {undefined|!{col: !int, row: !int, offset: !Point}}
     */
    findGateOverlappingPos(pos) {
        let col = this.indexOfDisplayedColumnAt(pos.x);
        let row = this.indexOfDisplayedRowAt(pos.y);
        if (col === undefined || row === undefined) {
            return undefined;
        }

        let target = this.circuitDefinition.findGateCoveringSlot(col, row);
        if (target === undefined) {
            return undefined;
        }

        let gateRect = this.gateRect(target.row, target.col, target.gate.width, target.gate.height);
        if (!gateRect.containsPoint(pos)) {
            return undefined;
        }

        return {col: target.col, row: target.row, offset: pos.minus(gateRect.topLeft())};
    }

    /**
     * @param {!Hand} hand
     * @param {!boolean=false} duplicate
     * @param {!boolean=false} wholeColumn
     * @returns {!{newCircuit: !DisplayedCircuit, newHand: !Hand}}
     */
    tryGrab(hand, duplicate=false, wholeColumn=false) {
        if (wholeColumn) {
            return this._tryGrabWholeColumn(hand, duplicate) || {newCircuit: this, newHand: hand};
        }
        let {newCircuit, newHand} = this._tryGrabResizeTab(hand) || {newCircuit: this, newHand: hand};
        return newCircuit._tryGrabGate(newHand, duplicate) || {newCircuit, newHand};
    }

    /**
     * @param {!Hand} hand
     * @param {!boolean=} duplicate
     * @returns {undefined|!{newCircuit: !DisplayedCircuit, newHand: !Hand}}
     */
    _tryGrabGate(hand, duplicate=false) {
        if (hand.isBusy() || hand.pos === undefined) {
            return undefined;
        }

        let foundPt = this.findGateOverlappingPos(hand.pos);
        if (foundPt === undefined) {
            return undefined;
        }

        let {col, row, offset} = foundPt;
        let gate = this.circuitDefinition.columns[col].gates[row];

        let remainingGates = seq(this.circuitDefinition.columns[col].gates).toArray();
        if (!duplicate) {
            remainingGates[row] = undefined;
        }

        let newCols = seq(this.circuitDefinition.columns).
            withOverlayedItem(col, new GateColumn(remainingGates)).
            toArray();
        return {
            newCircuit: new DisplayedCircuit(
                this.top,
                this.circuitDefinition.withColumns(newCols),
                undefined,
                undefined,
                this._extraWireStartIndex),
            newHand: hand.withHeldGate(gate, offset)
        };
    }

    /**
     * @param {!Hand} hand
     * @returns {!{newCircuit: !DisplayedCircuit, newHand: !Hand}}
     */
    _tryGrabResizeTab(hand) {
        if (hand.isBusy() || hand.pos === undefined) {
            return undefined;
        }

        for (let col = 0; col < this.circuitDefinition.columns.length; col++) {
            for (let row = 0; row < this.circuitDefinition.numWires; row++) {
                let gate = this.circuitDefinition.columns[col].gates[row];
                if (gate === undefined) {
                    continue;
                }
                let {isResizeHighlighted} =
                    this._highlightStatusAt(col, row, hand.hoverPoints());
                if (isResizeHighlighted) {
                    let offset = hand.pos.minus(this.gateRect(row + gate.height - 1, col, 1, 1).center());
                    return {
                        newCircuit: this._withHighlightedSlot({col, row, resizeStyle: true}),
                        newHand: hand.withResizeSlot(new Point(col, row), offset)
                    };
                }
            }
        }
        return undefined;
    }

    /**
     * @param {!Hand} hand
     * @param {!boolean} duplicate
     * @returns {undefined|!{newCircuit: !DisplayedCircuit, newHand: !Hand}}
     * @private
     */
    _tryGrabWholeColumn(hand, duplicate) {
        if (hand.isBusy() || hand.pos === undefined) {
            return undefined;
        }

        let col = Math.round(this.toColumnSpaceCoordinate(hand.pos.x));
        if (col < 0 || col >= this.circuitDefinition.columns.length || this.circuitDefinition.columns[col].isEmpty()) {
            return undefined;
        }

        let newCols = [...this.circuitDefinition.columns];
        if (!duplicate) {
            newCols.splice(col, 1, GateColumn.empty(this.circuitDefinition.numWires));
        }

        let holdOffset = new Point(0, this.wireIndexAt(hand.pos.y) * Config.WIRE_SPACING + Config.WIRE_SPACING/2);
        return {
            newCircuit: this.withCircuit(this.circuitDefinition.withColumns(newCols)),
            newHand: hand.withHeldGateColumn(this.circuitDefinition.columns[col], holdOffset)
        };
    }

    /**
     * @returns {Infinity|!number}
     */
    stableDuration() {
        return this.circuitDefinition.stableDuration();
    }

    /**
     * @returns {!int}
     */
    importantWireCount() {
        return Math.max(
            this.circuitDefinition.numWires - (this._extraWireStartIndex === Config.MAX_WIRE_COUNT ? 0 : 1),
            Math.max(
                Config.MIN_WIRE_COUNT,
                this.circuitDefinition.minimumRequiredWireCount()));
    }

    /**
     * Draws a peek gate on each wire at the right-hand side of the circuit.
     *
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!Hand} hand
     * @private
     */
    _drawOutputDisplays(painter, stats, hand) {
        let chanceCol = this._clampedCircuitColCount() + 1;
        let blochCol = chanceCol + 1;
        let numWire = this.importantWireCount();

        for (let i = 0; i < numWire; i++) {
            let p = stats.controlledWireProbabilityJustAfter(i, Infinity);
            MathPainter.paintProbabilityBox(painter, p, this.gateRect(i, chanceCol), hand.hoverPoints());
            let m = stats.qubitDensityMatrix(Infinity, i);
            if (m !== undefined) {
                paintBlochSphereDisplay(painter, m, this.gateRect(i, blochCol), hand.hoverPoints());
            }
        }

        let bottom = this.wireRect(numWire-1).bottom();
        let x = this.opRect(chanceCol - 1).x;
        painter.printParagraph(
            "Local wire states\n(Chance/Bloch)",
            new Rect(x, bottom+4, 190, 40),
            new Point(0.5, 0),
            'gray');

        this._drawOutputSuperpositionDisplay(painter, stats, hand);
    }

    /**
     * @returns {!number} The number of columns used for drawing the circuit, before the output display.
     * @private
     */
    _clampedCircuitColCount() {
        return Math.max(
            this.circuitDefinition.columns.length,
            Config.MIN_COL_COUNT + (this._compressedColumnIndex !== undefined ? 1 : 0));
    }

    /**
     * Draws a peek gate on each wire at the right-hand side of the circuit.
     *
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @param {!Hand} hand
     * @private
     */
    _drawOutputSuperpositionDisplay(painter, stats, hand) {
        let amplitudeGrid = this._outputStateAsMatrix(stats);
        let gridRect = this._rectForSuperpositionDisplay();

        let numWire = this.importantWireCount();
        MathPainter.paintMatrix(
            painter,
            amplitudeGrid,
            gridRect,
            numWire < Config.SIMPLE_SUPERPOSITION_DRAWING_WIRE_THRESHOLD ? Config.SUPERPOSITION_MID_COLOR : undefined,
            'black',
            numWire < Config.SIMPLE_SUPERPOSITION_DRAWING_WIRE_THRESHOLD ? Config.SUPERPOSITION_FORE_COLOR : undefined,
            Config.SUPERPOSITION_BACK_COLOR);
        let forceSign = v => (v >= 0 ? '+' : '') + v.toFixed(2);
        MathPainter.paintMatrixTooltip(painter, amplitudeGrid, gridRect, hand.hoverPoints(),
            (c, r) => `Amplitude of |${Util.bin(r*amplitudeGrid.width() + c, numWire)}⟩`,
            (c, r, v) => 'val:' + v.toString(new Format(false, 0, 5, ", ")),
            (c, r, v) => `mag²:${(v.norm2()*100).toFixed(4)}%, phase:${forceSign(v.phase() * 180 / Math.PI)}°`);

        this._drawOutputSuperpositionDisplay_labels(painter);
    }

    /**
     * @param {!Painter} painter
     * @private
     */
    _drawOutputSuperpositionDisplay_labels(painter) {
        let gridRect = this._rectForSuperpositionDisplay();
        let numWire = this.importantWireCount();
        let [colWires, rowWires] = [Math.floor(numWire/2), Math.ceil(numWire/2)];
        let [colCount, rowCount] = [1 << colWires, 1 << rowWires];
        let [dw, dh] = [gridRect.w / colCount, gridRect.h / rowCount];

        // Row labels.
        painter.ctx.save();
        painter.ctx.translate(gridRect.right(), gridRect.y);
        let prefix = colWires < 4 ? "_".repeat(colWires) : ".._";
        DisplayedCircuit._drawLabelsReasonablyFast(
            painter,
            dh,
            rowCount,
            i => prefix + Util.bin(i, rowWires),
            SUPERPOSITION_GRID_LABEL_SPAN);
        painter.ctx.restore();

        // Column labels.
        painter.ctx.save();
        painter.ctx.translate(gridRect.x + colCount*dw, gridRect.bottom());
        painter.ctx.rotate(Math.PI/2);
        let suffix = rowWires < 4 ? "_".repeat(rowWires) : "_..";
        DisplayedCircuit._drawLabelsReasonablyFast(
            painter,
            dw,
            colCount,
            i => Util.bin(colCount-1-i, rowWires) + suffix,
            SUPERPOSITION_GRID_LABEL_SPAN);
        painter.ctx.restore();
    }

    /**
     * @param {!Painter} painter
     * @param {!number} dy
     * @param {!int} n
     * @param {!function(!int) : !String} labeller
     * @param {!number} boundingWidth
     * @private
     */
    static _drawLabelsReasonablyFast(painter, dy, n, labeller, boundingWidth) {
        let ctx = painter.ctx;
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        painter.ctx.font = '12px monospace';
        let w = Math.max(
            painter.ctx.measureText(labeller(0)).width,
            painter.ctx.measureText(labeller(n-1)).width);
        let h = ctx.measureText("0").width * 2.5;
        let scale = Math.min(Math.min(boundingWidth / w, dy / h), 1);

        // Row labels.
        let step = dy/scale;
        let pad = 2/scale;
        ctx.scale(scale, scale);
        ctx.translate(0, dy*0.5/scale - h*0.5);
        ctx.fillStyle = 'lightgray';
        if (h < step*0.95) {
            for (let i = 0; i < n; i++) {
                ctx.fillRect(0, step * i, w + 2 * pad, h);
            }
        } else {
            ctx.fillRect(0, 0, w + 2 * pad, h*n);
        }
        ctx.fillStyle = 'black';
        for (let i = 0; i < n; i++) {
            ctx.fillText(labeller(i), pad, h*0.5 + step*i);
        }
        ctx.restore();
    }

    /**
     * @param {!CircuitStats} stats
     * @returns {!Matrix}
     * @private
     */
    _outputStateAsMatrix(stats) {
        let numWire = this.importantWireCount();
        let buf = stats.finalState.rawBuffer();
        if (stats.circuitDefinition.numWires !== numWire) {
            let r = new Float32Array(2 << numWire);
            r.set(buf.slice(0, r.length));
            buf = r;
        }

        let [colWires, rowWires] = [Math.floor(numWire/2), Math.ceil(numWire/2)];
        let [colCount, rowCount] = [1 << colWires, 1 << rowWires];
        return new Matrix(colCount, rowCount, buf);
    }

    /**
     * @returns {!Rect}
     * @private
     */
    _rectForSuperpositionDisplay() {
        let col = this._clampedCircuitColCount() + EXTRA_COLS_FOR_SINGLE_QUBIT_DISPLAYS + 1;
        let numWire = this.importantWireCount();
        let [colWires, rowWires] = [Math.floor(numWire/2), Math.ceil(numWire/2)];
        let [colCount, rowCount] = [1 << colWires, 1 << rowWires];
        let topRect = this.gateRect(0, col);
        let bottomRect = this.gateRect(numWire-1, col);
        let gridRect = new Rect(topRect.x, topRect.y, 0, bottomRect.bottom() - topRect.y);
        return gridRect.withW(gridRect.h * (colCount/rowCount));
    }

    /**
     * Draws a peek gate on each wire at the right-hand side of the circuit.
     *
     * @param {!Painter} painter
     * @param {!CircuitStats} stats
     * @private
     */
    _drawHintLabels(painter, stats) {
        let gridRect = this._rectForSuperpositionDisplay();

        // Amplitude hint.
        painter.print(
            'Final amplitudes',
            gridRect.right() + 3,
            gridRect.bottom() + 3,
            'left',
            'top',
            'gray',
            '12px sans-serif',
            100,
            20);

        // Deferred measurement warning.
        if (this.circuitDefinition.colIsMeasuredMask(Infinity) !== 0) {
            painter.printParagraph(
                "(assuming measurement deferred)",
                new Rect(
                    gridRect.right() + 3,
                    gridRect.bottom() + 20,
                    100,
                    75),
                new Point(0.5, 0),
                'red');
        }

        // Discard rate warning.
        if (Math.abs(stats.postSelectionSurvivalRate - 1) > 0.01) {
            let desc;
            if (stats.postSelectionSurvivalRate < 1) {
                let rate = Math.round(100 - stats.postSelectionSurvivalRate * 100);
                let rateDesc = stats.postSelectionSurvivalRate === 0 ? "100" : rate < 100 ? rate : ">99";
                desc = `Discard rate: ${rateDesc}%`;
            } else {
                let factor = Math.round(stats.postSelectionSurvivalRate * 100);
                desc = `Over-unity: ${factor}%`;
            }
            painter.print(
                desc,
                this._rectForSuperpositionDisplay().x - 5,
                gridRect.bottom() + SUPERPOSITION_GRID_LABEL_SPAN,
                'right',
                'bottom',
                'red',
                '14px sans-serif',
                800,
                50);
        }
    }
}

/**
 * @param {!Painter} painter
 * @param {!CircuitDefinition} circuitDefinition
 * @param {!Rect} rect
 * @param {!boolean} showWires
 * @param {!number} time
 * @returns {!{maxW: !number, maxH: !number}}
 */
function drawCircuitTooltip(painter, circuitDefinition, rect, showWires, time) {
    let displayed = new DisplayedCircuit(
        0,
        circuitDefinition,
        undefined,
        undefined,
        undefined);
    let neededWidth = displayed.desiredWidth(true);
    let neededHeight = displayed.desiredHeight(true);
    let scaleX = rect.w / neededWidth;
    let scaleY = rect.h / neededHeight;
    if (showWires) {
        let s = Math.min(scaleX, scaleY);
        scaleX = s;
        scaleY = s;
    }
    let stats = CircuitStats.withNanDataFromCircuitAtTime(circuitDefinition, time);
    try {
        painter.ctx.save();
        painter.ctx.translate(rect.x, rect.y);
        painter.ctx.scale(Math.min(1, scaleX), Math.min(1, scaleY));
        painter.ctx.translate(0, 0);
        displayed.paint(
            painter,
            Hand.EMPTY,
            stats,
            true,
            showWires);
    } finally {
        painter.ctx.restore();
    }
    return {maxW: neededWidth*scaleX, maxH: neededHeight*scaleY};
}

/**
 * @param {!GateDrawParams} args
 */
let GATE_CIRCUIT_DRAWER = args => {
    let circuit = args.gate.knownCircuit;
    if (circuit === undefined || args.gate.symbol !== '') {
        if (args.gate.stableDuration() === Infinity) {
            GatePainting.DEFAULT_DRAWER(args);
        } else {
            GatePainting.makeCycleDrawer()(args);
        }
        return;
    }

    let toolboxColor = args.gate.stableDuration() === Infinity ?
        Config.GATE_FILL_COLOR :
        Config.TIME_DEPENDENT_HIGHLIGHT_COLOR;
    GatePainting.paintBackground(args, toolboxColor);
    drawCircuitTooltip(args.painter, args.gate.knownCircuitNested, args.rect, false, args.stats.time);
    GatePainting.paintOutline(args);
    if (args.isHighlighted) {
        args.painter.ctx.save();
        args.painter.ctx.globalAlpha *= 0.9;
        args.painter.fillRect(args.rect, Config.HIGHLIGHTED_GATE_FILL_COLOR);
        args.painter.ctx.restore();
    }
    GatePainting.paintOutline(args);
};

/**
 * @param {!int} rangeLen
 * @param {!function(!int): !boolean} predicate
 * @returns {!Array.<undefined|!int>}
 */
function firstLastMatchInRange(rangeLen, predicate){
    let first = undefined;
    let last = undefined;
    for (let i = 0; i < rangeLen; i++) {
        if (predicate(i)) {
            if (first === undefined) {
                first = i;
            }
            last = i;
        }
    }
    return [first, last];
}

export {DisplayedCircuit, drawCircuitTooltip, GATE_CIRCUIT_DRAWER}
