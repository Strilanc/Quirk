var force6 = e => e;

/**
 * @param {!int} qubitCount
 * @param {!THREE.Target} renderTarget
 *
 * @property {!int} qubitCount
 * @property {!THREE.Target} renderTarget
 *
 * @constructor
 * @private
 */
function QuantumTexture(qubitCount, renderTarget) {
    this.qubitCount = qubitCount;
    this.renderTarget = renderTarget;
    this.noRecycle = false;
}

QuantumTexture._shaderFileNames = [
];

/**
 * Returns the size of the texture used to hold states involving the given number of qubits.
 * @param {!int} qubitCount
 * @returns {!{type: !string, value: !{x: !int, y: !int}}}
 * @private
 */
QuantumTexture._textureSize = function(qubitCount) {
    return {
        type: 'v2',
        value: {
            x: 1 << Math.ceil(qubitCount / 2),
            y: 1 << Math.floor(qubitCount / 2)
        }
    };
};

QuantumTexture._pool = [];

/**
 * Returns a new QuantumTexture, containing a texture of the right size but with unspecified contents.
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture._blank = function(qubitCount) {
    need(qubitCount >= 0, qubitCount);
    while (QuantumTexture._pool.length <= qubitCount) {
        QuantumTexture._pool.push([]);
    }
    if (QuantumTexture._pool[qubitCount].length > 0) {
        return QuantumTexture._pool[qubitCount].pop();
    }

    var size = QuantumTexture._textureSize(qubitCount);
    var renderTarget = new THREE.Target(
        size.value.x,
        size.value.y);
    return new QuantumTexture(qubitCount, renderTarget);
};

QuantumTexture.prototype._recycle = function() {
    if (this.noRecycle) {
        return;
    }
    while (QuantumTexture._pool.length <= this.qubitCount) {
        QuantumTexture._pool.push([]);
    }
    if (QuantumTexture._pool[this.qubitCount].length < 5) {
        QuantumTexture._pool[this.qubitCount].push(this);
    }
};

QuantumTexture.prototype._markCached = function() {
    this.noRecycle = true;
    return this;
};

/**
 * Creates a QuantumTexture initialized with the given float data.
 * @param {!Float32Array} packedAmplitudesArray
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture._packed = function(packedAmplitudesArray) {
    var stateCount = packedAmplitudesArray.length / 4;
    need(isPowerOf2(stateCount));
    var qubitCount = Math.round(lg(stateCount));

    var s = QuantumTexture._textureSize(qubitCount);
    return QuantumTexture._blank(qubitCount)._render(QuantumTexture.SHADERS.passThrough, {
        textureSize: QuantumTexture._textureSize(qubitCount),
        inputTexture: {
            type: 'data_t', value: {
                data: packedAmplitudesArray,
                width: s.value.x,
                height: s.value.y
            }
        }
    });
};

/**
 * Returns a QuantumTexture of the correct size, with the half of states that should not be affected marked with 0s.
 * @param {!int} qubitIndex
 * @param {!boolean} targetQubitValue
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture._controlBitTexture = function(qubitIndex, targetQubitValue, qubitCount) {
    need(qubitIndex >= 0, "qubitIndex >= 0");
    need(targetQubitValue === false || targetQubitValue === true);
    need(qubitCount >= 0, "qubitCount >= 0");
    return QuantumTexture._blank(qubitCount)._render(QuantumTexture.SHADERS.singleControl, {
        textureSize: QuantumTexture._textureSize(qubitCount),
        qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
        targetValue: { type: 'f', value: targetQubitValue ? 1 : 0 }
    })._markCached();
};
QuantumTexture._controlBitTexture = cacheFunc3(QuantumTexture._controlBitTexture);
QuantumTexture._sharedRenderer = new THREE.Context();

QuantumTexture._zeroTexture = function(qubitCount) {
    need(qubitCount >= 0);
    return QuantumTexture._controlBitTexture(qubitCount, true, qubitCount);
};

/**
 * Returns a QuantumTexture of the correct size, with states that should not be affected marked with 0s in the texture.
 * @param {!ControlMask} controlMask
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture._controlMaskTexture = function(controlMask, qubitCount) {
    // If higher bits need to be on, assume the control is simply unsatisfiable.
    if (controlMask.desiredValueMask >= (1 << qubitCount)) {
        return QuantumTexture._zeroTexture(qubitCount);
    }

    var noControl = QuantumTexture._controlBitTexture(qubitCount, false, qubitCount);
    return range(qubitCount)
        .reduce(function(a, i) {
            var v = controlMask.desiredValueFor(i);
            if (v === null) {
                return a;
            }
            var c = QuantumTexture._controlBitTexture(i, notNull(v), qubitCount);
            var result = QuantumTexture._blank(qubitCount)._render(QuantumTexture.SHADERS.combineControls,  {
                textureSize: QuantumTexture._textureSize(qubitCount),
                controlTexture1: { type: 'renderTarget_t', value: a.renderTarget },
                controlTexture2: { type: 'renderTarget_t', value: c.renderTarget }
            });
            a._recycle();
            return result;
        }, noControl);
};

/**
 * Overwrites the receiving instance's texture with the output of the given shader.
 * Returns the receiving instance, to allow chaining.
 * @param {!THREE.ShaderMaterial} shader
 * @param {!Object.<!string, !{type: !string, val: *}>} uniformArguments
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.prototype._render = function(shader, uniformArguments) {
    QuantumTexture._sharedRenderer.render(
        shader,
        uniformArguments,
        this.renderTarget);
    return this;
};

QuantumTexture.SHADERS = {
    singleQubitOperation: new THREE.ShaderMaterial(FragmentShaders.APPLY_CUSTOM_QUBIT_OPERATION),
    conditionalProbabilitiesPipeline: new THREE.ShaderMaterial(FragmentShaders.CONDITIONAL_PROBABILITIES_PIPELINE),
    toProbabilities: new THREE.ShaderMaterial(FragmentShaders.FROM_AMPLITUDES_TO_PROBABILITIES),
    singleControl: new THREE.ShaderMaterial(FragmentShaders.INIT_SINGLE_CONTROL),
    combineControls: new THREE.ShaderMaterial(FragmentShaders.COMBINE_CONTROLS),
    overlay: new THREE.ShaderMaterial(FragmentShaders.OVERLAY),
    packFloats: new THREE.ShaderMaterial(FragmentShaders.PACK_COMPONENT_FLOAT_INTO_BYTES),
    passThrough: new THREE.ShaderMaterial(FragmentShaders.PASS_THROUGH)
};

/**
 * @param {!int} v
 * @returns {!number}
 * @private
 */
QuantumTexture.intToFloat = function(v) {
    var sign = v >> 31 === 0 ? +1 : -1;
    var exponent = ((v >> 23) & 0xFF) - 64;
    var mantissa = (1 << 23) | (v & ((1 << 23) - 1));

    if (exponent == -64 && mantissa == 1 << 23) {
        return 0;
    }

    return mantissa * Math.pow(2, exponent - 23) * sign;
};



/**
 * Selects one component (e.g. red) from a texture, and copies all those values into a float array.
 * There is some precision loss due to the need to pack the values into bytes as an intermediate step.
 * @param {!int} componentIndex Which component should be converted (R=0, G=1,...).
 * @param {=Rect} rect The area of the texture to sample. Defaults to the entire texture.
 * @returns {!function() : !Float32Array}
 * @private
 */
QuantumTexture.prototype._prepareExtractColorComponent = function(componentIndex, rect) {
    rect = rect || new Rect(0, 0, this.renderTarget.width, this.renderTarget.height);
    // Trigger rendering without explicitly storing the result. We'll access the result indirectly.
    var target = QuantumTexture._blank(this.qubitCount)._render(QuantumTexture.SHADERS.packFloats, {
        textureSize: QuantumTexture._textureSize(this.qubitCount),
        selector: {type: 'i', value: componentIndex},
        texture: {type: 'renderTarget_t', value: this.renderTarget}
    });

    var bytes = new Uint8Array(rect.w * rect.h * 4);

    return function() {
        QuantumTexture._sharedRenderer.readPixels(target.renderTarget, rect, bytes);
        target._recycle();

        var words = new Uint32Array(bytes.buffer);
        var result = new Float32Array(words.length);
        for (var i = 0; i < result.length; i++) {
            result[i] = QuantumTexture.intToFloat(words[i]);
        }
        return result;
    }
};

/**
 * Creates a QuantumTexture storing the given amplitudes.
 * @param {!Array<!Complex>} amplitudes
 * @returns {!QuantumTexture}
 */
QuantumTexture.fromAmplitudes = function(amplitudes) {
    need(isPowerOf2(amplitudes.length));

    var dataArray = new Float32Array(amplitudes.length * 4);
    for (var i = 0; i < amplitudes.length; i++) {
        dataArray[i*4] = amplitudes[i].real;
        dataArray[i*4 + 1] = amplitudes[i].imag;
    }

    return QuantumTexture._packed(dataArray);
};

/**
 * Creates a QuantumTexture initialized into a classical state, where a single possibility gets all the amplitude.
 * @param {!int} qubitCount
 * @param {!int} stateIndex
 * @returns {!QuantumTexture}
 */
QuantumTexture.fromClassicalStateInRegisterOfSize = function(stateIndex, qubitCount) {
    need(qubitCount >= 0, "qubitCount >= 0");
    need(stateIndex >= 0 && stateIndex < (1 << qubitCount), "stateMask >= 0 && stateMask < (1 << qubitCount)");

    var dataArray = new Float32Array((1 << qubitCount) * 4);
    dataArray[stateIndex*4] = 1;
    return QuantumTexture._packed(dataArray);
};

/**
 * Returns a QuantumTexture for the given number of qubits, initialized so all the qubits are zero.
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 */
QuantumTexture.fromZeroes = function(qubitCount) {
    return QuantumTexture.fromClassicalStateInRegisterOfSize(0, qubitCount);
};

/**
 * Returns a texture holding the result of applying a single-qubit operation to the receiving texture's quantum state.
 * @param {!int} qubitIndex The index of the qubit to apply the operation to.
 * @param {!Matrix} operation A 2x2 matrix.
 * @param {!ControlMask} controls
 */
QuantumTexture.prototype.withQubitOperationApplied = function(qubitIndex, operation, controls) {
    need(controls.desiredValueFor(qubitIndex) === null, "Can't control an operation with the qubit it modifies.");
    need(qubitIndex >= 0 && qubitIndex < this.qubitCount, "qubitIndex >= 0 && qubitIndex < this.qubitCount");
    need(operation.width() == 2 && operation.height() == 2, "operation.width() == 2 && operation.height() == 2");

    var a = operation.rows[0][0];
    var b = operation.rows[0][1];
    var c = operation.rows[1][0];
    var d = operation.rows[1][1];

    var control = QuantumTexture._controlMaskTexture(controls, this.qubitCount);
    var result = QuantumTexture._blank(this.qubitCount)._render(QuantumTexture.SHADERS.singleQubitOperation, {
        textureSize: QuantumTexture._textureSize(this.qubitCount),
        qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
        inputTexture: { type: 'renderTarget_t', value: this.renderTarget },
        controlTexture: { type: 'renderTarget_t', value: control.renderTarget },
        matrix_a: { type: 'v2', value: {x: a.real, y: a.imag} },
        matrix_b: { type: 'v2', value: {x: b.real, y: b.imag} },
        matrix_c: { type: 'v2', value: {x: c.real, y: c.imag} },
        matrix_d: { type: 'v2', value: {x: d.real, y: d.imag} }
    });
    control._recycle();
    return result;
};

/**
 * Converts the receiving QuantumTexture's state into an array of amplitudes corresponding to each possible state.
 * @returns {!Array<!Complex>}
 */
QuantumTexture.prototype.toAmplitudes = function() {
    var realPrep = this._prepareExtractColorComponent(0);
    var imagPrep = this._prepareExtractColorComponent(1);
    var real = realPrep();
    var imag = imagPrep();
    return range(real.length).map(function(i) { return new Complex(real[i], imag[i]); });
};

QuantumTexture.prototype.toAmplitudesPrep = function() {
    var realPrep = this._prepareExtractColorComponent(0);
    var imagPrep = this._prepareExtractColorComponent(1);
    return function() {
        var real = realPrep();
        var imag = imagPrep();
        return range(real.length).map(function (i) {
            return new Complex(real[i], imag[i]);
        });
    };
};

/**
 * Returns the probability that each qubit would end up true, if measured.
 * Note that, when qubits are entangled, some conditional probabilities will not match these probabilities.
 * @returns {!Array<!float>}
 */
QuantumTexture.prototype.perQubitProbabilities = function() {
    var p = this.controlProbabilities(-1);
    return range(this.qubitCount).map(function(i) { return p[1 << i]; });
};

/**
 * Returns the probability that the qubits would match a must-be-on control mask if measured, for each possible mask.
 * @param {!int} mask Determines whether controls are must-be-true or must-be-false, bit by bit.
 * @returns {!Float32Array}
 */
QuantumTexture.prototype.controlProbabilities = function(mask) {
    var size = QuantumTexture._textureSize(this.qubitCount);
    var acc = QuantumTexture._blank(this.qubitCount)._render(QuantumTexture.SHADERS.toProbabilities, {
        textureSize: size,
        inputTexture: {type: 'renderTarget_t', value: this.renderTarget}
    });

    for (var i = 0; i < this.qubitCount; i++) {
        var oldAcc = acc;
        acc = QuantumTexture._blank(this.qubitCount)._render(QuantumTexture.SHADERS.conditionalProbabilitiesPipeline, {
            textureSize: size,
            stepPower: {type: 'f', value: 1 << i},
            inputTexture: {type: 'renderTarget_t', value: acc.renderTarget},
            conditionValue: {type: 'f', value: (mask & (1 << i)) !== 0}
        });
        oldAcc._recycle();
    }


    var ps = acc._prepareExtractColorComponent(0)();
    acc._recycle();
    return ps;
};

/**
 * Determines if the receiving quantum texture is storing the same superposition as the given quantum texture.
 * Returns false if the given value is not a QuantumTexture.
 * @param {!QuantumTexture|*} other
 * @returns {!boolean}
 */
QuantumTexture.prototype.isEqualTo = function(other) {
    return other instanceof QuantumTexture &&
        this.qubitCount === other.qubitCount &&
        this.toAmplitudes().isEqualToBy(other.toAmplitudes(), CUSTOM_IS_EQUAL_TO_EQUALITY)
};

/**
 * Returns a description of the receiving QuantumTexture.
 * @returns {!string}
 */
QuantumTexture.prototype.toString = function() {
    return this.toAmplitudes().toArrayString();
};
