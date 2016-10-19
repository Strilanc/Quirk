import {Point} from "src/math/Point.js"
import {Rect} from "src/math/Rect.js"

class TouchScrollBlocker {
    /**
     * @param {HTMLElement} parentElement
     */
    constructor(parentElement) {
        /**
         * @type {!HTMLElement}
         * @private
         */
        this._parentElement = parentElement;

        /**
         * @type {!{div: !HTMLDivElement, area: !Rect}}
         * @private
         */
        this._curBlockers = [];

        /**
         * @type {!int}
         * @private
         */
        this._curShowing = 0;
    }

    //noinspection Eslint
    /**
     * @param {!Array.<!{rect: !Rect, cursor: undefined|!string}>} desiredBlockers
     * @param {undefined|!string} overrideCursorStyle
     */
    setBlockers(desiredBlockers, overrideCursorStyle) {
        while (this._curBlockers.length < desiredBlockers.length) {
            let blockerDiv = document.createElement('div');
            blockerDiv.style.touchAction = 'none';
            blockerDiv.style.position = 'absolute';
            blockerDiv.style.opacity = 0.0001;
            this._parentElement.appendChild(blockerDiv);
            this._curBlockers.push({div: blockerDiv, area: undefined});
        }

        // Positioning.
        for (let i = 0; i < desiredBlockers.length; i++) {
            let desiredArea = desiredBlockers[i].rect;
            let desiredCursor = overrideCursorStyle || desiredBlockers[i].cursor || 'auto';
            let cur = this._curBlockers[i];
            let style = cur.div.style;

            if (!desiredArea.isEqualTo(cur.area)) {
                cur.area = desiredArea;
                style.left = desiredArea.x + "px";
                style.top = desiredArea.y + "px";
                style.width = desiredArea.w + "px";
                style.height = desiredArea.h + "px";
            }
            if (style.cursor !== desiredCursor) {
                style.cursor = desiredCursor;
            }
        }

        // Visibility.
        while (this._curShowing < desiredBlockers.length) {
            this._curBlockers[this._curShowing].div.style.display = 'inline';
            this._curShowing++;
        }
        while (this._curShowing > desiredBlockers.length) {
            this._curShowing--;
            this._curBlockers[this._curShowing].div.style.display = 'none';
        }
    }
}

export {TouchScrollBlocker}
