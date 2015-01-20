#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

/**
 * A texture holding the complex coefficients of the superposition to operate on.
 * The real components are in the red component, and the imaginary components are in the green component.
 */
uniform sampler2D texture;

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
 * Vectors containing real and imaginary components of the coefficients from the 2x2 unitary matrix representing
 * the operation to apply. The components are laid out so that dot-producting them against a vector of the form
 * {inputOff.real, inputOff.imag, inputOn.real, inputOn.imag} gives the named output component.
 */
uniform vec4 dotProductCoefficients_RealOff,
             dotProductCoefficients_ImagOff,
             dotProductCoefficients_RealOn,
             dotProductCoefficients_ImagOn;

vec2 stateIndexToColRow(float s) {
    vec2 xy;
    xy.x = mod(s, textureSize.x);
    xy.y = floor(s / textureSize.x);
    return xy;
}

void main() {
    vec2 colRow = gl_FragCoord.xy - vec2(0.5, 0.5);
    vec2 uv = colRow.xy / textureSize.xy;

    bool doesNotMatchControls = texture2D(controlTexture, uv).x == 0.0;
    if (doesNotMatchControls) {
        gl_FragColor = texture2D(texture, uv);
        return;
    }

    float stateIndex = colRow.y * textureSize.x + colRow.x;
    bool stateBitValue = mod(stateIndex, qubitIndexMask / 0.5) > qubitIndexMask - 0.5;

    vec4 dotVectorReal, dotVectorImag;
    vec2 uvOff, uvOn;
    if (stateBitValue) {
        uvOff = stateIndexToColRow(stateIndex - qubitIndexMask) / textureSize.xy;
        uvOn = uv;
        dotVectorReal = dotProductCoefficients_RealOn;
        dotVectorImag = dotProductCoefficients_ImagOn;
    } else {
        uvOff = uv;
        uvOn = stateIndexToColRow(stateIndex + qubitIndexMask) / textureSize.xy;
        dotVectorReal = dotProductCoefficients_RealOff;
        dotVectorImag = dotProductCoefficients_ImagOff;
    }

    vec2 amplitudeOff = texture2D(texture, uvOff).xy;
    vec2 amplitudeOn = texture2D(texture, uvOn).xy;
    vec4 amplitudeCombo = vec4(amplitudeOff.r, amplitudeOff.g, amplitudeOn.r, amplitudeOn.g);

    vec2 stateAmplitudeAfter = vec2(
        dot(amplitudeCombo, dotVectorReal),
        dot(amplitudeCombo, dotVectorImag));
    gl_FragColor = vec4(stateAmplitudeAfter, 0, 1);
}
