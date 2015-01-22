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

vec2 stateIndexToColRow(float s) {
    float c = s + 0.5;
    return vec2(
        mod(c, textureSize.x) - 0.5,
        floor(c / textureSize.x));
}

void main() {
    vec2 colRow = gl_FragCoord.xy - vec2(0.5, 0.5);
    vec2 uv = colRow.xy / textureSize.xy;

    // Check if this part of the superposition is not changing due to not matching a control bit.
    bool doesNotMatchControls = texture2D(controlTexture, uv).x == 0.0;
    if (doesNotMatchControls) {
        gl_FragColor = texture2D(inputTexture, uv);
        return;
    }

    // Determine the value of the operated-on bit for the output pixel we're working on
    float stateIndex = colRow.y * textureSize.x + colRow.x;
    float stateBitScalar = mod(stateIndex, qubitIndexMask * 2.0) - mod(stateIndex, qubitIndexMask);
    bool stateBitBool = 2.0 * stateBitScalar > qubitIndexMask;

    // The row we operate against is determined by the output pixel's operated-on-bit's value
    vec2 r, s;
    if (stateBitBool) {
        r = matrix_d;
        s = matrix_c;
    } else {
        r = matrix_a;
        s = matrix_b;
    }

    // Grab the amplitude of the opposing state (the one you get by flipping the operated-on bit)
    float otherStateIndex = stateIndex + qubitIndexMask - 2.0 * stateBitScalar;
    vec2 uvOther = stateIndexToColRow(otherStateIndex) / textureSize.xy;

    // Do (part of) the matrix multiplication
    vec4 amplitudeCombo = vec4(texture2D(inputTexture, uv).xy,
                               texture2D(inputTexture, uvOther).xy);
    vec4 dotReal = vec4(r.x, -r.y,
                        s.x, -s.y);
    vec4 dotImag = vec4(r.y, r.x,
                        s.y, s.x);
    vec2 outputAmplitude = vec2(dot(amplitudeCombo, dotReal), dot(amplitudeCombo, dotImag));

    gl_FragColor = vec4(outputAmplitude, 0, 0);
}
