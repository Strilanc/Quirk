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
    this.textureWidth = 1 << Math.ceil(qubitCount / 2);
    this.textureHeight = 1 << Math.floor(qubitCount / 2);
    this.texture = texture;
    this.amplitudeCount = 1 << this.qubitCount;
}

QuantumTexture._shaderFileNames = [
    "passThrough.vert",
    "passThrough.frag",
    "packComponentFloatIntoBytes.frag",
    "initSingleControl.frag",
    "combineControls.frag",
    "applyCustomQubitOperation.frag"
];

/**
 * @type {{
 *   passThrough_vert: !string,
 *   passThrough_frag: !string,
 *   packComponentFloatIntoBytes_frag: !string,
 *   initSingleControl_frag: !string,
 *   combineControls_frag: !string,
 *   applyCustomQubitOperation_frag: !string
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
        new THREE.PlaneGeometry(2, 2),
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

/**
 * Returns a new QuantumTexture, containing a texture of the right size but with unspecified contents.
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture._blank = function(qubitCount) {
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

/**
 * @param {!int} qubitCount
 * @param {!int} stateMask
 * @returns {!QuantumTexture}
 */
QuantumTexture.fromClassicalStateInRegisterOfSize = function(stateMask, qubitCount) {
    need(qubitCount >= 0, "qubitCount >= 0");
    need(stateMask >= 0 && stateMask < (1 << qubitCount), "stateMask >= 0 && stateMask < (1 << qubitCount)");

    var dataArray = new Float32Array((1 << qubitCount) * 4);
    dataArray[stateMask*4] = 1;

    var s = QuantumTexture._textureSize(qubitCount);
    var dataTexture = new THREE.DataTexture(
        dataArray,
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
 * Returns a QuantumTexture for the given number of qubits, initialized so all the qubits are zero.
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 */
QuantumTexture.fromZeroes = function(qubitCount) {
    return QuantumTexture.fromClassicalStateInRegisterOfSize(0, qubitCount);
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
    return QuantumTexture._blank(qubitCount)._render(new THREE.ShaderMaterial({
        uniforms: {
            textureSize: QuantumTexture._textureSize(qubitCount),
            qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
            targetValue: { type: 'f', value: targetQubitValue ? 1 : 0 }
        },
        vertexShader: QuantumTexture._shaders.passThrough_vert,
        fragmentShader: QuantumTexture._shaders.initSingleControl_frag
    }));
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
        return QuantumTexture._controlBitTexture(qubitCount, true, qubitCount);
    }

    var noControl = QuantumTexture._controlBitTexture(qubitCount, false, qubitCount);
    return range(qubitCount)
        .reduce(function(a, i) {
            var v = controlMask.desiredValueFor(i);
            if (v === null) {
                return a;
            }
            var c = QuantumTexture._controlBitTexture(i, notNull(v), qubitCount);
            return QuantumTexture._blank(qubitCount)._render(new THREE.ShaderMaterial({
                uniforms: {
                    textureSize: QuantumTexture._textureSize(qubitCount),
                    controlTexture1: { type: 't', value: a.texture },
                    controlTexture2: { type: 't', value: c.texture }
                },
                vertexShader: QuantumTexture._shaders.passThrough_vert,
                fragmentShader: QuantumTexture._shaders.combineControls_frag
            }));
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

/**
 * Overwrites the receiving instance's texture with the contents of the given texture.
 * Returns the receiving instance, to allow chaining.
 * @param {!Object} srcTexture
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.prototype._overwrite = function(srcTexture) {
    return this._render(new THREE.ShaderMaterial({
        uniforms: {
            resolution: QuantumTexture._textureSize(this.qubitCount),
            texture: { type: 't', value: srcTexture }
        },
        vertexShader: QuantumTexture._shaders.passThrough_vert,
        fragmentShader: QuantumTexture._shaders.passThrough_frag
    }));
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

    var result = QuantumTexture._blank(this.qubitCount);
    result._render(new THREE.ShaderMaterial({
        uniforms: {
            textureSize: QuantumTexture._textureSize(this.qubitCount),
            qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
            inputTexture: { type: 't', value: this.texture },
            controlTexture: { type: 't', value: QuantumTexture._controlMaskTexture(controls, this.qubitCount).texture },
            matrix_a: { type: 'v2', value: new THREE.Vector2(a.real, a.imag) },
            matrix_b: { type: 'v2', value: new THREE.Vector2(b.real, b.imag) },
            matrix_c: { type: 'v2', value: new THREE.Vector2(c.real, c.imag) },
            matrix_d: { type: 'v2', value: new THREE.Vector2(d.real, d.imag) }
        },
        vertexShader: QuantumTexture._shaders.passThrough_vert,
        fragmentShader: QuantumTexture._shaders.applyCustomQubitOperation_frag
    }));
    return result;
};

/**
 * Selects one component (e.g. red) from a texture, and copies all those values into a float array.
 * There is some precision loss due to the need to pack the values into bytes as an intermediate step.
 * @param {!int} componentIndex Which component should be converted (R=0, G=1,...).
 * @returns {!Float32Array}
 * @private
 */
QuantumTexture.prototype._extractColorComponent = function(componentIndex) {
    var dummyTexture = QuantumTexture._blank(this.qubitCount);
    dummyTexture._render(new THREE.ShaderMaterial({
        uniforms: {
            resolution: QuantumTexture._textureSize(this.qubitCount),
            selector: {type: 'i', value: componentIndex},
            texture: {type: 't', value: this.texture}
        },
        vertexShader: QuantumTexture._shaders.passThrough_vert,
        fragmentShader: QuantumTexture._shaders.packComponentFloatIntoBytes_frag
    }));

    var bytes = new Uint8Array(this.amplitudeCount * 4);
    var ctx = QuantumTexture._sharedRenderer.getContext();
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    ctx.readPixels(0, 0, this.textureWidth, this.textureHeight, ctx.RGBA, ctx.UNSIGNED_BYTE, bytes);

    var words = new Uint32Array(bytes.buffer);

    var intToFloat = function(v) {
        if ((v & (1 << 24)) !== 0) {
            return -((v & 0xffffff) / 1048576);
        }
        return v / 1048576;
    };

    var result = new Float32Array(words.length);
    for (var i = 0; i < result.length; i++) {
        result[i] = intToFloat(words[i]);
    }
    return result;
};

/**
 * Converts the receinv QuantumTexture's state into an array of amplitudes corresponding to each possible state.
 * @returns {!Array.<!Complex>}
 */
QuantumTexture.prototype.toAmplitudes = function() {
    var real = this._extractColorComponent(0);
    var imag = this._extractColorComponent(1);
    return range(real.length).map(function(i) { return new Complex(real[i], imag[i]); });
};
