#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

/**
 * The width and height of the textures being operated on.
 */
uniform vec2 textureSize;

/**
 * A power of two (2^n) with the exponent n determined by the index of the qubit acting as a control.
 */
uniform float qubitIndexMask;

/**
 * The value that the qubit must have for the control to be satisfied.
 */
uniform float targetValue;

void main() {
    vec2 rowCol = gl_FragCoord.xy - vec2(0.5, 0.5);
    float stateIndex = rowCol.y * textureSize.x + rowCol.x;
    float stateBitValue = float(mod(stateIndex, qubitIndexMask / 0.5) > qubitIndexMask - 0.5);

    float match = mod(stateBitValue + targetValue + 1.0, 2.0);
    gl_FragColor = vec4(match, 0, 0, 0);
}
