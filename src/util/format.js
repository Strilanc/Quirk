/**
 * @param {!boolean} allowAbbreviation
 * @param {!number} maxAbbreviationError
 * @param {int|undefined} fixedDigits
 * @param {!string} itemSeparator
 *
 * @property {!boolean} allowAbbreviation
 * @property {!number} maxAbbreviationError
 * @property {int|undefined} fixedDigits
 * @property {!string} itemSeparator
 *
 * @constructor
 */
function Format(allowAbbreviation, maxAbbreviationError, fixedDigits, itemSeparator) {
    this.allowAbbreviation = allowAbbreviation;
    this.maxAbbreviationError = maxAbbreviationError;
    this.fixedDigits = fixedDigits;
    this.itemSeparator = itemSeparator;
}

Format.prototype.formatFloat = function(f) {
    if (this.allowAbbreviation) {
        return floatToCompactString(f, this.maxAbbreviationError, this.fixedDigits);
    }
    if (this.fixedDigits !== undefined) {
        return f.toFixed(this.fixedDigits);
    }
    return f + "";
};

/**
 * Returns an accurate result, but favoring looking nice over being small.
 * @type {!Format}
 */
Format.EXACT = new Format(true, 0, undefined, ", ");

/**
 * Returns an accurate result, favoring being small over looking nice.
 * @type {!Format}
 */
Format.MINIFIED = new Format(true, 0, undefined, ",");

/**
 * Returns an approximated result, strongly favoring looking nice.
 * @type {!Format}
 */
Format.SIMPLIFIED = new Format(true, 0.0005, 3, ", ");

/**
 * Returns an approximated result, but with the constraint that when it changes slightly it should "look the same".
 * (It should look good when varying and animated.)
 * @type {!Format}
 */
Format.CONSISTENT = new Format(false, 0, 3, ", ");
