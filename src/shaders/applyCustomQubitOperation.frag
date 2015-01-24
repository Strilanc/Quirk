/**
 * Renders the result of applying a custom optionally-controlled single-qubit operation to a superposition.
 */

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

/**
 * A texture holding the complex coefficients of the superposition to operate on.
 * The real components are in the red component, and the imaginary components are in the green component.
 */
uniform sampler2D inputTexture;

/**
 * A texture with flags that determine which states get affected by the operation.
 * The red component is 1 for states that should participate, and 0 otherwise.
 */
uniform sampler2D controlTexture;

/**
 * The width and height of the textures being operated on.
 */
uniform vec2 textureSize;

/**
 * A power of two (2^n) with the exponent n determined by the index of the qubit to operate on.
 */
uniform float qubitIndexMask;

/**
 * The row-wise complex coefficients of the matrix to apply. Laid out normally, they would be:
 * M = |a b|
 *     |c d|
 */
uniform vec2 matrix_a, matrix_b, matrix_c, matrix_d;

/**
 * Does a bitwise-and of the given integer value against a single-bit bit mask.
 * @param value The (approximate) integer to extract a bit from.
 * @param singleBitMask A power of two corresponding to the bit to retain (all others get masked out).
 */
float filterBit(float value, float bit) {
    value += 0.5;
    return mod(value, bit * 2.0) - mod(value, bit);
}

/**
 * Does a bitwise-xor of the given integer value against a single-bit bit mask.
 * @param value The (approximate) integer to toggle a bit in.
 * @param singleBitMask A power of two corresponding to the bit to toggle (all others get left alone).
 */
float toggleBit(float value, float bit) {
    float hasBit = filterBit(value, bit);
    return value + bit - 2.0 * hasBit;
}

vec2 stateToPixelUv(float state) {
    float c = state + 0.5;
    float r = mod(c, textureSize.x);
    float d = floor(c / textureSize.x) + 0.5;
    return vec2(r, d) / textureSize.xy;
}

void main() {
    // Which part of the multiplication are we doing?
    vec2 pixelXy = gl_FragCoord.xy - vec2(0.5, 0.5);
    vec2 pixelUv = gl_FragCoord.xy / textureSize;
    float state = pixelXy.y * textureSize.x + pixelXy.x;
    float opposingState = toggleBit(state, qubitIndexMask);
    vec2 opposingPixelUv = stateToPixelUv(opposingState);
    bool targetBitIsOff = state < opposingState;

    // Does this part of the superposition match the controls?
    bool blockedByControls = texture2D(controlTexture, pixelUv).x == 0.0;
    if (blockedByControls) {
        gl_FragColor = texture2D(inputTexture, pixelUv);
        return;
    }

    // The row we operate against is determined by the output pixel's operated-on-bit's value
    vec2 c1, c2;
    if (targetBitIsOff) {
        c1 = matrix_a;
        c2 = matrix_b;
    } else {
        c1 = matrix_d;
        c2 = matrix_c;
    }

    // Do (our part of) the matrix multiplication
    vec4 amplitudeCombo = vec4(texture2D(inputTexture, pixelUv).xy,
                               texture2D(inputTexture, opposingPixelUv).xy);
    vec4 dotReal = vec4(c1.x, -c1.y,
                        c2.x, -c2.y);
    vec4 dotImag = vec4(c1.y, c1.x,
                        c2.y, c2.x);
    vec2 outputAmplitude = vec2(dot(amplitudeCombo, dotReal),
                                dot(amplitudeCombo, dotImag));

    gl_FragColor = vec4(outputAmplitude, 0, 0);
}
