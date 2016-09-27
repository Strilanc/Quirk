import {Controls} from "src/circuit/Controls.js"
import {DetailedError} from "src/base/DetailedError.js"
import {Matrix} from "src/math/Matrix.js"
import {Seq} from "src/base/Seq.js"
import {Shaders} from "src/webgl/Shaders.js"
import {Util} from "src/base/Util.js"
import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {WglConfiguredShader} from "src/webgl/WglShader.js"
import {initializedWglContext} from "src/webgl/WglContext.js"

/**
 * @param {!String} body
 * @param {!String=""} head
 * @param {null|!int=1} span
 */
const ketShader = (body, head='', span=1) => new WglShader(`
    uniform sampler2D _ksu_ket;
    uniform sampler2D _ksu_control;
    uniform vec2 _ksu_size;
    uniform float _ksu_step;
    ${span === null ? 'uniform float span;' : ''}
    ${head}

    float off;

    vec2 cmul(vec2 c1, vec2 c2) {
        return mat2(c1.x, c1.y, -c1.y, c1.x) * c2;
    }

    vec2 _ksu_toUv(float k) {
        return vec2(mod(k, _ksu_size.x) + 0.5, floor(k / _ksu_size.x) + 0.5) / _ksu_size;
    }

    vec2 inp(float k) {
        return texture2D(_ksu_ket, _ksu_toUv(off + _ksu_step*k)).xy;
    }

    vec2 _ksu_output_for(float out_id, vec2 amp) {
        ${body}
    }

    void main() {
        vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
        float full_out_id = xy.y * _ksu_size.x + xy.x;
        float relevant_out_id = mod(floor(full_out_id / _ksu_step), ${span === null ? 'span' : (1<<span)+'.0'});
        off = full_out_id - relevant_out_id*_ksu_step;

        float c = texture2D(_ksu_control, _ksu_toUv(full_out_id)).x;
        vec2 vc = texture2D(_ksu_ket, _ksu_toUv(full_out_id)).xy;
        vec2 vt = _ksu_output_for(relevant_out_id, vc);

        vec2 v = (1.0-c)*vc + c*vt;
        gl_FragColor = vec4(v.x, v.y, 0.0, 0.0);
    }`);

/**
 * @param {!String} body
 * @param {!String=""} head
 * @param {null|!int=1} span
 */
const ketShaderPermute = (body, head='', span=1) => ketShader(
    'return inp(_ksu_input_for(out_id));',
    head + `float _ksu_input_for(float out_id) { ${body} }`,
    span);

/**
 * @param {!String} body
 * @param {!String=""} head
 * @param {null|!int=1} span
 */
const ketShaderPhase = (body, head='', span=1) => ketShader(
    'return cmul(amp, _ksu_phase_for(out_id));',
    head + `vec2 _ksu_phase_for(float out_id) { ${body} }`,
    span);

/**
 * @param {!CircuitEvalArgs} args
 * @param {undefined|!int=undefined} span
 * @returns {!Array.<!WglArg>}
 */
function ketArgs(args, span=undefined) {
    let result = [
        WglArg.texture("_ksu_ket", args.stateTexture, 0),
        WglArg.texture("_ksu_control", args.controlsTexture, 1),
        WglArg.vec2("_ksu_size", args.stateTexture.width, args.stateTexture.height),
        WglArg.float("_ksu_step", 1 << args.row)
    ];
    if (span !== undefined) {
        result.push(WglArg.float('span', 1 << span));
    }
    return result;
}

export {ketArgs, ketShader, ketShaderPermute, ketShaderPhase}
