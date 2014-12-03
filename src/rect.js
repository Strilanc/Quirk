/**
 * A 2-d rectangle.
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @constructor
 */
function Rect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

/**
 *
 * @param {number} x The x-coordinate of the center of the square.
 * @param {number} y The y-coordinate of the center of the square.
 * @param {number} r Half of the diameter of the square.
 * @returns {Rect}
 */
Rect.centeredSquareWithRadius = function(x, y, r) {
    return new Rect(x - r, y - r, r*2, r*2);
};

Rect.prototype.isEqualTo = function(other) {
    return other instanceof Rect &&
        other.x == this.x &&
        other.y == this.y &&
        other.w == this.w &&
        other.h == this.h;
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.center = function() {
    return {x: this.x + this.w / 2, y: this.y + this.h / 2};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.topLeft = function() {
    return {x: this.x, y: this.y};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.topRight = function() {
    return {x: this.x + this.w, y: this.y};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.bottomLeft = function() {
    return {x: this.x, y: this.y + this.h};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.bottomRight = function() {
    return {x: this.x + this.w, y: this.y + this.h};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.centerLeft = function() {
    return {x: this.x, y: this.y + this.h/2};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.centerRight = function() {
    return {x: this.x + this.w, y: this.y + this.h/2};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.topCenter = function() {
    return {x: this.x + this.w/2, y: this.y};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.bottomCenter = function() {
    return {x: this.x + this.w/2, y: this.y + this.h};
};


/**
 * @returns number
 */
Rect.prototype.right = function() {
    return this.x + this.w;
};

/**
 * @returns number
 */
Rect.prototype.bottom = function() {
    return this.y + this.h;
};

/**
 * Returns the result of removing the given width from the left side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostWidth
 * @returns Rect
 */
Rect.prototype.skipLeft = function(lostWidth) {
    var d = Math.min(lostWidth, this.w);
    return new Rect(this.x + d, this.y, this.w - d, this.h);
};

/**
 * Returns the result of removing the given width from the right side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostWidth
 * @returns Rect
 */
Rect.prototype.skipRight = function(lostWidth) {
    var d = Math.min(lostWidth, this.w);
    return new Rect(this.x, this.y, this.w - d, this.h);
};

/**
 * Returns the result of removing the given height from the top side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostHeight
 * @returns Rect
 */
Rect.prototype.skipTop = function(lostHeight) {
    var d = Math.min(lostHeight, this.h);
    return new Rect(this.x, this.y + d, this.w, this.h - d);
};

/**
 * Returns the result of removing the given height from the bottom side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostHeight
 * @returns Rect
 */
Rect.prototype.skipBottom = function(lostHeight) {
    var d = Math.min(lostHeight, this.h);
    return new Rect(this.x, this.y, this.w, this.h - d);
};

/**
 * Returns the result of removing all but the given width from the left side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptWidth
 * @returns Rect
 */
Rect.prototype.takeLeft = function(keptWidth) {
    var d = Math.max(keptWidth, 0);
    return new Rect(this.x, this.y, d, this.h);
};

/**
 * Returns the result of removing all but the given width from the right side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptWidth
 * @returns Rect
 */
Rect.prototype.takeRight = function(keptWidth) {
    var d = Math.max(keptWidth, 0);
    return new Rect(this.x + this.w - d, this.y, d, this.h);
};

/**
 * Returns the result of removing all but the given height from the top side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptHeight
 * @returns Rect
 */
Rect.prototype.takeTop = function(keptHeight) {
    var d = Math.max(keptHeight, 0);
    return new Rect(this.x, this.y, this.w, d);
};

/**
 * Returns the result of removing all but the given height from the bottom side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptHeight
 * @returns Rect
 */
Rect.prototype.takeBottom = function(keptHeight) {
    var d = Math.max(keptHeight, 0);
    return new Rect(this.x, this.y + this.h - d, this.w, d);
};

/**
 * Returns the result of padding to each side of the rectangle by the given amount.
 *
 * @param {number} p The margin from the receiving rect's outside to the returned rect's inside.
 * @returns Rect
 */
Rect.prototype.paddedBy = function(p) {
    return new Rect(this.x - p, this.y - p, this.w + p * 2, this.h + p * 2);
};

/**
 * Determines if the given point is in the receiving rect or not.
 *
 * Note that the top and left of the rectangle are inclusive, but the bottom and right are exclusive.
 *
 * @param {{x: number, y: number}} p The query point.
 * @returns {boolean}
 */
Rect.prototype.containsPoint = function(p) {
    return p.x >= this.x &&
        p.x < this.x + this.w &&
        p.y >= this.y &&
        p.y < this.y + this.h;
};
Rect.prototype.topHalf = function() {
    return this.skipBottom(this.h / 2);
};

Rect.prototype.bottomHalf = function() {
    return this.skipTop(this.h / 2);
};

Rect.prototype.leftHalf = function() {
    return this.skipRight(this.w / 2);
};

Rect.prototype.rightHalf = function() {
    return this.skipLeft(this.w / 2);
};
