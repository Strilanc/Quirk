/**
 * Turns each amplitude into a probability, by dot-producting pixels against themselves.
 */

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform vec2 textureSize;
uniform sampler2D inputTexture;

void main() {
    vec2 uv = gl_FragCoord.xy / textureSize.xy;
    vec4 amps = texture2D(inputTexture, uv);
    float p = dot(amps, amps);
    gl_FragColor = vec4(p, 0, 0, 0);
}
