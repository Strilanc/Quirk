/**
 * A named single-qubit quantum operation.
 *
 * @param {!number} x
 * @param {!number} y
 *
 * @property {!number} x
 * @property {!number} y
 *
 * @constructor
 */
function Point(x, y) {
    this.x = x;
    this.y = y;
}

/**
 * @param {!number} dx
 * @param {!number} dy
 */
Point.prototype.offsetBy = function(dx, dy) {
    return new Point(this.x + dx, this.y + dy);
};

/**
 * @param {!Point} p
 */
Point.prototype.plus = function(p) {
    return new Point(this.x + p.x, this.y + p.y);
};

/**
 * @param {!Point|*} other
 * @returns {!boolean}
 */
Point.prototype.isEqualTo = function(other) {
    return other instanceof Point &&
        other.x === this.x &&
        other.y === this.y;
};
