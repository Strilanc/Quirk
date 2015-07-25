/**
 * A two dimensional point with real coordinates.
 */
export default class Point {
    /**
     * @param {!number} x The new point's x coordinate.
     * @param {!number} y The new point's y coordinate.
     */
    constructor(x, y) {
        /**
         * The point's x coordinate.
         * @type {!number}
         */
        this.x = x;
        /**
         * The point's y coordinate.
         * @member Point#y
         * @type {!number}
         */
        this.y = y;
    }

    /**
     * Determines if the given value is a point with the same coordinates as the receiving point.
     * @param {!Point|*} obj The point, or other value, to compare against.
     * @returns {!boolean}
     */
    isEqualTo(obj) {
        if (!(obj instanceof Point)) {
            return false;
        }
        /** @type {!Point} */
        let other = obj;
        return other.x === this.x && other.y === this.y;
    };

    /**
     * @returns {!string}
     */
    toString() {
        return `(x: ${this.x}, y: ${this.y})`;
    };

    /**
     * Returns the result of adding the receiving point's coordinates to the given offset values.
     * @param {!number} dx The x offset.
     * @param {!number} dy The y offset.
     * @returns {!Point}
     */
    offsetBy(dx, dy) {
        return new Point(this.x + dx, this.y + dy);
    };

    /**
     * Returns the result of pairing and adding the receiving point's, and the given point's, coordinates.
     * @param {!Point} p
     * @returns {!Point}
     */
    plus(p) {
        return new Point(this.x + p.x, this.y + p.y);
    };

    /**
     * Returns the result of scaling the receiving point's coordinates by the given factor.
     * @param {!number} c The scaling factor.
     * @returns {!Point}
     */
    times(c) {
        return new Point(this.x * c, this.y * c);
    };
}
