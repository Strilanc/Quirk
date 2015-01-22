/**
 * A 2-d rectangle.
 * @param {!number} x
 * @param {!number} y
 * @param {!number} w
 * @param {!number} h
 * @property {!number} x
 * @property {!number} y
 * @property {!number} w
 * @property {!number} h
 * @constructor
 */
function Rect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

/**
 * @param {!Rect|*} other
 * @returns {!boolean}
 */
Rect.prototype.isEqualTo = function(other) {
    return other instanceof Rect &&
        other.x === this.x &&
        other.y === this.y &&
        other.w === this.w &&
        other.h === this.h;
};

Rect.prototype.toString = function() {
    return "[" + this.x + ":" + this.right() + "]x[" + this.y + ":" + this.bottom() + "]";
};

/**
 *
 * @param {!Point} p The x/y point at the center of the square.
 * @param {!number} r Half of the diameter of the square.
 * @returns {!Rect}
 */
Rect.centeredSquareWithRadius = function(p, r) {
    return new Rect(p.x - r, p.y - r, r*2, r*2);
};

/**
 * @returns {!Point}
 */
Rect.prototype.center = function() {
    return new Point(this.x + this.w / 2, this.y + this.h / 2);
};

/**
 * @returns {!Point}
 */
Rect.prototype.topLeft = function() {
    return new Point(this.x, this.y);
};

/**
 * @returns {!Point}
 */
Rect.prototype.topRight = function() {
    return new Point(this.x + this.w, this.y);
};

/**
 * @returns {!Point}
 */
Rect.prototype.bottomLeft = function() {
    return new Point(this.x, this.y + this.h);
};

/**
 * @returns {!Point}
 */
Rect.prototype.bottomRight = function() {
    return new Point(this.x + this.w, this.y + this.h);
};

/**
 * @returns {!Point}
 */
Rect.prototype.centerLeft = function() {
    return new Point(this.x, this.y + this.h/2);
};

/**
 * @returns {!Point}
 */
Rect.prototype.centerRight = function() {
    return new Point(this.x + this.w, this.y + this.h/2);
};

/**
 * @returns {!Point}
 */
Rect.prototype.topCenter = function() {
    return new Point(this.x + this.w/2, this.y);
};

/**
 * @returns {!Point}
 */
Rect.prototype.bottomCenter = function() {
    return new Point(this.x + this.w/2, this.y + this.h);
};


/**
 * @returns !number
 */
Rect.prototype.right = function() {
    return this.x + this.w;
};

/**
 * @returns !number
 */
Rect.prototype.bottom = function() {
    return this.y + this.h;
};

/**
 * Returns the result of removing the given width from the left side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} lostWidth
 * @returns !Rect
 */
Rect.prototype.skipLeft = function(lostWidth) {
    var d = Math.min(lostWidth, this.w);
    return new Rect(this.x + d, this.y, this.w - d, this.h);
};

/**
 * Returns the result of removing the given width from the right side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} lostWidth
 * @returns !Rect
 */
Rect.prototype.skipRight = function(lostWidth) {
    var d = Math.min(lostWidth, this.w);
    return new Rect(this.x, this.y, this.w - d, this.h);
};

/**
 * Returns the result of removing the given height from the top side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} lostHeight
 * @returns !Rect
 */
Rect.prototype.skipTop = function(lostHeight) {
    var d = Math.min(lostHeight, this.h);
    return new Rect(this.x, this.y + d, this.w, this.h - d);
};

/**
 * Returns the result of removing the given height from the bottom side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} lostHeight
 * @returns !Rect
 */
Rect.prototype.skipBottom = function(lostHeight) {
    var d = Math.min(lostHeight, this.h);
    return new Rect(this.x, this.y, this.w, this.h - d);
};

/**
 * Returns the result of removing all but the given width from the left side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} keptWidth
 * @returns !Rect
 */
Rect.prototype.takeLeft = function(keptWidth) {
    var d = Math.max(keptWidth, 0);
    return new Rect(this.x, this.y, d, this.h);
};

/**
 * Returns the result of removing all but the given width from the right side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} keptWidth
 * @returns !Rect
 */
Rect.prototype.takeRight = function(keptWidth) {
    var d = Math.max(keptWidth, 0);
    return new Rect(this.x + this.w - d, this.y, d, this.h);
};

/**
 * Returns the result of removing all but the given height from the top side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} keptHeight
 * @returns !Rect
 */
Rect.prototype.takeTop = function(keptHeight) {
    var d = Math.max(keptHeight, 0);
    return new Rect(this.x, this.y, this.w, d);
};

/**
 * Returns the result of removing all but the given height from the bottom side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {!number} keptHeight
 * @returns !Rect
 */
Rect.prototype.takeBottom = function(keptHeight) {
    var d = Math.max(keptHeight, 0);
    return new Rect(this.x, this.y + this.h - d, this.w, d);
};

/**
 * Returns the result of padding to each side of the rectangle by the given amount.
 *
 * @param {!number} p The margin from the receiving rect's outside to the returned rect's inside.
 * @returns !Rect
 */
Rect.prototype.paddedBy = function(p) {
    return new Rect(this.x - p, this.y - p, this.w + p * 2, this.h + p * 2);
};

/**
 * Returns the result of scaling the rectangle w.r.t. its center by the given scaling factor.
 * @param {!number} factor
 * @returns {!Rect}
 */
Rect.prototype.scaledOutwardBy = function(factor) {
    var c = this.center();
    var w2 = this.w * factor;
    var h2 = this.h * factor;
    return new Rect(c.x - w2/2, c.y - h2/2, w2, h2);
};

/**
 * Determines if the given point is in the receiving rect or not.
 *
 * Note that the top and left of the rectangle are inclusive, but the bottom and right are exclusive.
 *
 * @param {!Point} p The query point.
 * @returns {!boolean}
 */
Rect.prototype.containsPoint = function(p) {
    return p.x >= this.x &&
        p.x < this.x + this.w &&
        p.y >= this.y &&
        p.y < this.y + this.h;
};

/**
 * @param {!number} proportion
 * @returns {!Rect}
 */
Rect.prototype.takeLeftProportion = function(proportion) {
    return this.takeLeft(this.w * proportion);
};

/**
 * @param {!number} proportion
 * @returns {!Rect}
 */
Rect.prototype.takeRightProportion = function(proportion) {
    return this.takeRight(this.w * proportion);
};

/**
 * @param {!number} proportion
 * @returns {!Rect}
 */
Rect.prototype.takeTopProportion = function(proportion) {
    return this.takeTop(this.h * proportion);
};

/**
 * @param {!number} proportion
 * @returns {!Rect}
 */
Rect.prototype.takeBottomProportion = function(proportion) {
    return this.takeBottom(this.h * proportion);
};

/**
 * @returns {!Rect}
 */
Rect.prototype.leftHalf = function() {
    return this.skipRight(this.w / 2);
};

/**
 * @returns {!Rect}
 */
Rect.prototype.rightHalf = function() {
    return this.skipLeft(this.w / 2);
};

/**
 * @returns {!Rect}
 */
Rect.prototype.topHalf = function() {
    return this.skipBottom(this.h / 2);
};

/**
 * @returns {!Rect}
 */
Rect.prototype.bottomHalf = function() {
    return this.skipTop(this.h / 2);
};

/**
 * @param {!number} dx The displacement to move the rect horizontally.
 * @param {!number} dy The displacement to move the rect vertically.
 * @returns {!Rect}
 */
Rect.prototype.shiftedBy = function(dx, dy) {
    return new Rect(this.x + dx, this.y + dy, this.w, this.h);
};


/**
 * @param {!number} dx The proportional amount to move the rect horizontally.
 * @param {!number} dy The proportional amount to move the rect vertically.
 * @returns {!Rect}
 */
Rect.prototype.proportionalShiftedBy = function(dx, dy) {
    return this.shiftedBy(dx * this.w, dy * this.h);
};

/**
 * @param {!number} newX
 * @returns {!Rect}
 */
Rect.prototype.withX = function (newX) {
    return new Rect(newX, this.y, this.w, this.h);
};

/**
 * @param {!number} newY
 * @returns {!Rect}
 */
Rect.prototype.withY = function (newY) {
    return new Rect(this.x, newY, this.w, this.h);
};

/**
 * @param {!number} newW
 * @returns {!Rect}
 */
Rect.prototype.withW = function (newW) {
    return new Rect(this.x, this.y, newW, this.h);
};
/**
 * @param {!number} newH
 * @returns {!Rect}
 */
Rect.prototype.withH = function (newH) {
    return new Rect(this.x, this.y, this.w, newH);
};
