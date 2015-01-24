/**
 * Renders a control texture equal to the intersection of two input control textures. The output texture prevents any
 * operation prevented by either of the input textures.
 */

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
 * A texture with flags that determine which states get affected by operations.
 * The red component is 1 for states that should participate, and 0 otherwise.
 */
uniform sampler2D controlTexture1;

/**
 * Another texture with flags that determine which states get affected by operations.
 * The red component is 1 for states that should participate, and 0 otherwise.
 */
uniform sampler2D controlTexture2;

void main() {
    vec2 uv = gl_FragCoord.xy / textureSize.xy;
    float c1 = texture2D(controlTexture1, uv).x;
    float c2 = texture2D(controlTexture2, uv).x;
    gl_FragColor = vec4(c1 * c2, 0, 0, 0);
}
