/**
 * @param {!int} qubitCount
 * @param {!THREE.WebGLRenderTarget} texture
 *
 * @property {!int} qubitCount
 * @property {!THREE.WebGLRenderTarget} texture
 *
 * @constructor
 * @private
 */
function QuantumTexture(qubitCount, texture) {
    this.qubitCount = qubitCount;
    this.texture = texture;
    this.noRecycle = false;
}

QuantumTexture._shaderFileNames = [
    "passThrough.vert",
    "passThrough.frag",
    "packComponentFloatIntoBytes.frag",
    "initSingleControl.frag",
    "combineControls.frag",
    "applyCustomQubitOperation.frag",
    "wireProbabilitiesPipeline.frag"
];

/**
 * @type {{
 *   passThrough_vert: !string,
 *   passThrough_frag: !string,
 *   packComponentFloatIntoBytes_frag: !string,
 *   initSingleControl_frag: !string,
 *   combineControls_frag: !string,
 *   applyCustomQubitOperation_frag: !string,
 *   wireProbabilitiesPipeline_frag: !string
 * }}
 */
QuantumTexture._shaders = {};

/**
 * Asynchronously fetches the shader scripts and runs the success/failure callback when done.
 * @param {!string} root
 * @param {function()} successCallback
 * @param {function(!string)} failCallback
 */
QuantumTexture.loadThen = function(root, successCallback, failCallback) {
    QuantumTexture._sharedRenderer = new THREE.WebGLRenderer();
    QuantumTexture._sharedCamera = new THREE.Camera();
    QuantumTexture._sharedCamera.position.z = 1;
    QuantumTexture._sharedMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2),
        new THREE.MeshBasicMaterial({color: 0}));
    QuantumTexture._sharedScene = new THREE.Scene();
    QuantumTexture._sharedScene.add(QuantumTexture._sharedMesh);

    var remaining = QuantumTexture._shaderFileNames.length;
    var beginLoading = function(fileName) {
        var loc = root + "shaders/" + fileName;
        $.get(loc).then(function(src) {
            QuantumTexture._shaders[fileName.replace(".", "_")] = src;
            remaining -= 1;
            if (remaining === 0) {
                successCallback();
            }
        }, function() {
            if (remaining > 0) {
                remaining = -1;
                failCallback("Failed to load: " + loc);
            }
        });
    };

    for (var i = 0; i < QuantumTexture._shaderFileNames.length; i++) {
        beginLoading(QuantumTexture._shaderFileNames[i]);
    }
};

/**
 * Returns the size of the texture used to hold states involving the given number of qubits.
 * @param {!int} qubitCount
 * @returns {!{type: !string, value: !THREE.Vector2}}
 * @private
 */
QuantumTexture._textureSize = function(qubitCount) {
    return {
        type: 'v2',
        value: new THREE.Vector2(
            1 << Math.ceil(qubitCount / 2),
            1 << Math.floor(qubitCount / 2))
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
    var texture = new THREE.WebGLRenderTarget(
        size.value.x,
        size.value.y,
        {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            stencilBuffer: false,
            generateMipmaps: false,
            depthBuffer: false
        });
    return new QuantumTexture(qubitCount, texture);
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
    var dataTexture = new THREE.DataTexture(
        packedAmplitudesArray,
        s.value.x,
        s.value.y,
        THREE.RGBAFormat,
        THREE.FloatType,
        THREE.UVMapping,
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.NearestFilter,
        THREE.NearestFilter);
    dataTexture.needsUpdate = true;
    dataTexture.flipY = false;

    var result = QuantumTexture._blank(qubitCount);
    result._overwrite(dataTexture);
    return result;
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
    return QuantumTexture._blank(qubitCount)._render(QuantumTexture._cachedShader(
        QuantumTexture._shaders.initSingleControl_frag,
        {
            textureSize: QuantumTexture._textureSize(qubitCount),
            qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
            targetValue: { type: 'f', value: targetQubitValue ? 1 : 0 }
        }))._markCached();
};
QuantumTexture._controlBitTexture = cacheFunc3(QuantumTexture._controlBitTexture);

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
            var result = QuantumTexture._blank(qubitCount)._render(QuantumTexture._cachedShader(
                QuantumTexture._shaders.combineControls_frag,
                {
                    textureSize: QuantumTexture._textureSize(qubitCount),
                    controlTexture1: { type: 't', value: a.texture },
                    controlTexture2: { type: 't', value: c.texture }
                }));
            a._recycle();
            return result;
        }, noControl);
};

/**
 * Overwrites the receiving instance's texture with the output of the given shader.
 * Returns the receiving instance, to allow chaining.
 * @param {!THREE.ShaderMaterial} shader
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.prototype._render = function(shader) {
    QuantumTexture._sharedMesh.material = shader;
    QuantumTexture._sharedRenderer.render(
        QuantumTexture._sharedScene,
        QuantumTexture._sharedCamera,
        this.texture);
    return this;
};

QuantumTexture._cachedShaderMap = {};

QuantumTexture._cachedShader = function(shaderText, uniforms) {
    var shader = QuantumTexture._cachedShaderMap[shaderText];
    if (shader === undefined) {
        shader = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: QuantumTexture._shaders.passThrough_vert,
            fragmentShader: shaderText
        });
        QuantumTexture._cachedShaderMap[shaderText] = shader;
        return shader;
    }

    for (var k in uniforms) {
        if (uniforms.hasOwnProperty(k)) {
            shader.uniforms[k].value = uniforms[k].value;
        }
    }
    return shader;
};

/**
 * Overwrites the receiving instance's texture with the contents of the given texture.
 * Returns the receiving instance, to allow chaining.
 * @param {!Object} srcTexture
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.prototype._overwrite = function(srcTexture) {
    return this._render(QuantumTexture._cachedShader(
        QuantumTexture._shaders.passThrough_frag,
        {
            resolution: QuantumTexture._textureSize(this.qubitCount),
            texture: { type: 't', value: srcTexture }
        }));
};

/**
 * Selects one component (e.g. red) from a texture, and copies all those values into a float array.
 * There is some precision loss due to the need to pack the values into bytes as an intermediate step.
 * @param {!int} componentIndex Which component should be converted (R=0, G=1,...).
 * @param {=Rect} rect The area of the texture to sample. Defaults to the entire texture.
 * @returns {!Float32Array}
 * @private
 */
QuantumTexture.prototype._extractColorComponent = function(componentIndex, rect) {
    rect = rect || new Rect(0, 0, this.texture.width, this.texture.height);
    // Trigger rendering without explicitly storing the result. We'll access the result indirectly.
    QuantumTexture._blank(this.qubitCount)._render(QuantumTexture._cachedShader(
        QuantumTexture._shaders.packComponentFloatIntoBytes_frag,
        {
            resolution: QuantumTexture._textureSize(this.qubitCount),
            selector: {type: 'i', value: componentIndex},
            texture: {type: 't', value: this.texture}
        }))._recycle();

    var bytes = new Uint8Array(rect.w * rect.h * 4);
    var ctx = QuantumTexture._sharedRenderer.getContext();
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    ctx.readPixels(rect.x, rect.y, rect.w, rect.h, ctx.RGBA, ctx.UNSIGNED_BYTE, bytes);

    var words = new Uint32Array(bytes.buffer);

    var intToFloat = function(v) {
        var sign = v >> 31 === 0 ? +1 : -1;
        var exponent = ((v >> 23) & 0xFF) - 64;
        var mantissa = (1 << 23) | (v & ((1 << 23) - 1));

        if (exponent == -64 && mantissa == 1 << 23) {
            return 0;
        }

        return mantissa * Math.pow(2, exponent - 23) * sign;
    };

    var result = new Float32Array(words.length);
    for (var i = 0; i < result.length; i++) {
        result[i] = intToFloat(words[i]);
    }
    return result;
};

/**
 * Creates a QuantumTexture storing the given amplitudes.
 * @param {!Array.<!Complex>} amplitudes
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

    return QuantumTexture._blank(this.qubitCount)._render(QuantumTexture._cachedShader(
        QuantumTexture._shaders.applyCustomQubitOperation_frag,
        {
            textureSize: QuantumTexture._textureSize(this.qubitCount),
            qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
            inputTexture: { type: 't', value: this.texture },
            controlTexture: { type: 't', value: QuantumTexture._controlMaskTexture(controls, this.qubitCount).texture },
            matrix_a: { type: 'v2', value: new THREE.Vector2(a.real, a.imag) },
            matrix_b: { type: 'v2', value: new THREE.Vector2(b.real, b.imag) },
            matrix_c: { type: 'v2', value: new THREE.Vector2(c.real, c.imag) },
            matrix_d: { type: 'v2', value: new THREE.Vector2(d.real, d.imag) }
        }));
};

/**
 * Converts the receiving QuantumTexture's state into an array of amplitudes corresponding to each possible state.
 * @returns {!Array.<!Complex>}
 */
QuantumTexture.prototype.toAmplitudes = function() {
    var real = this._extractColorComponent(0);
    var imag = this._extractColorComponent(1);
    return range(real.length).map(function(i) { return new Complex(real[i], imag[i]); });
};

/**
 * Returns the probability that each qubit would end up true, if measured.
 * Note that, when qubits are entangled, some conditional probabilities will not match these probabilities.
 * @returns {!Array.<!float>}
 */
QuantumTexture.prototype.perQubitProbabilities = function() {
    var acc = QuantumTexture._zeroTexture(this.qubitCount);
    var size = QuantumTexture._textureSize(this.qubitCount);
    for (var i = 0; i < this.qubitCount * 2; i++) {
        var oldAcc = acc;

        acc = QuantumTexture._blank(this.qubitCount)._render(QuantumTexture._cachedShader(
            QuantumTexture._shaders.wireProbabilitiesPipeline_frag,
            {
                textureSize: size,
                stepPower: {type: 'f', value: 1 << i},
                stateTexture: {type: 't', value: this.texture},
                accumulatorTexture: {type: 't', value: acc.texture}
            }));
        oldAcc._recycle();
    }
    var lastRow = size.value.y - 1;
    var resultArea = acc._extractColorComponent(0, new Rect(0, lastRow, this.qubitCount, 1));
    acc._recycle();

    var n = this.qubitCount;
    return range(n).map(function(i) { return 1 - resultArea[n - i - 1]; });
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
