/**
 * Renders a texture storing the same data as a given texture.
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
    gl_FragColor = texture2D(inputTexture, uv);
}
