import {WglArg} from "src/webgl/WglArg.js"
import {WglShader} from "src/webgl/WglShader.js"
import {currentShaderCoder, makePseudoShaderWithInputsAndOutputAndCode, Inputs, Outputs} from "src/webgl/ShaderCoders.js"

/**
 * Creates a shader for a quantum gate based on a minimalist input like `return cmul(inp(0.0), vec2(0.0, 1.0));`.
 *
 * Available methods and values:
 * - float out_id: The state for which we're computing an amplitude. Note that this state is relativized: when in a
 *                      circuit with more qubits than the gate's span, it determines only the qubits covered by the
 *                      gate. The ketShader mechanism handles iterating your operation over all states of the other
 *                      qubits (i.e. it deals with the tensor product stuff and controlled operation stuff for you).
 * - vec2 inp(float k): returns the amplitude of state k (as a vec2 with x=real, y=imaginary components). Note that
 *                      k is also a relativized state.
 * - float full_out_id: The non-relativized state id. Useful if you want to use the value of other qubits as an
 *                      input (which e.g. the arithmetic gates do).
 * - vec2 cmul(vec2 a, vec2 b): returns the product of two complex numbers represented as a vec2.
 * - vec2 amp: The input amplitude of the output state being computed. This value had to be retrieved for the case where
 *             controls aren't satisfied, and as a convenience/optimization-opportunity it's handed to your code.
 * - float span [if you gave an undefined span]: Two to the power of the gate height.
 *
 * @param {!String} head Code that goes outside the output-computing function, for declaring uniforms and helper funcs.
 * @param {!String} body Code that goes inside the output-computing function.
 * @param {null|!int=null} span The height of the gate; the number of qubits it spans.
 * @param {!Array.<!ShaderPartDescription>} inputs
 * @return {!{withArgs: !function(args: ...!WglArg) : !WglConfiguredShader}} A function that, when given the args
 * returned by ketArgs when given your input texture and also a WglArg for each custom uniform you defined, returns
 * a WglConfiguredShader that can be used to renderTo a destination texture.
 */
const ketShader = (head, body, span=null, inputs=[]) => ({withArgs: makePseudoShaderWithInputsAndOutputAndCode(
    [
        ...inputs,
        Inputs.vec2('ketgen_ket'),
        Inputs.bool('ketgen_control')
    ],
    Outputs.vec2(),
    `
    uniform float _ketgen_step;
    ${span === null ? 'uniform float span;' : ''}
    float _ketgen_off;
    float full_out_id;

    ${body.match(/\bcmul\b/) ? 'vec2 cmul(vec2 c1, vec2 c2) { return mat2(c1.x, c1.y, -c1.y, c1.x) * c2; }' : ''}
    ${body.match(/\binp\b/) ? 'vec2 inp(float k) { return read_ketgen_ket(_ketgen_off + _ketgen_step*k); }' : ''}

    ${head}

    vec2 _ketgen_output_for(float out_id, vec2 amp) {
        ${body}
    }

    vec2 outputFor(float k) {
        full_out_id = k;

        float relevant_out_id = mod(floor(full_out_id / _ketgen_step), ${span === null ? 'span' : (1<<span)+'.0'});
        _ketgen_off = full_out_id - relevant_out_id*_ketgen_step;

        float c = read_ketgen_control(full_out_id);
        vec2 vc = read_ketgen_ket(full_out_id);
        vec2 vt = _ketgen_output_for(relevant_out_id, vc);
        return (1.0-c)*vc + c*vt;
    }`)});

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShaderPermute = (head, body, span=null) => ketShader(
    head + `float _ketgen_input_for(float out_id) { ${body} }`,
    'return inp(_ketgen_input_for(out_id));',
    span);

/**
 * @param {!String} head
 * @param {!String} body
 * @param {null|!int=null} span
 */
const ketShaderPhase = (head, body, span=null) => ketShader(
    head + `vec2 _ketgen_phase_for(float out_id) { ${body} }`,
    'return cmul(amp, _ketgen_phase_for(out_id));',
    span);

/**
 * @param {!CircuitEvalContext} ctx
 * @param {undefined|!int=undefined} span
 * @returns {!Array.<!WglArg>}
 */
function ketArgs(ctx, span=undefined) {
    let result = [
        ctx.stateTrader.currentTexture,
        ctx.controlsTexture,
        WglArg.float("_ketgen_step", 1 << ctx.row)
    ];
    if (span !== undefined) {
        result.push(WglArg.float('span', 1 << span));
    }
    return result;
}

export {ketArgs, ketShader, ketShaderPermute, ketShaderPhase}
