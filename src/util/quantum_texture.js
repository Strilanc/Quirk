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

/**
 * @param {!string} root
 * @param {function()} successCallback
 * @param {function(!string)} failCallback
 */
QuantumTexture.loadThen = function(root, successCallback, failCallback) {
    QuantumTexture.renderer = new THREE.WebGLRenderer();
    QuantumTexture.camera = new THREE.Camera();
    QuantumTexture.camera.position.z = 1;
    QuantumTexture.meshForMaterial = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({color: 0}));
    QuantumTexture.scene = new THREE.Scene();
    QuantumTexture.scene.add(QuantumTexture.meshForMaterial);

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
    QuantumTexture.shaders = {};
    var shaderFileNames = [
        "passThrough.vert",
        "passThrough.frag",
        "packComponentFloatIntoBytes.frag",
        "initSingleControl.frag",
        "combineControls.frag",
        "applyCustomQubitOperation.frag"
    ];
    var remaining = shaderFileNames.length;
    var beginLoading = function(fileName) {
        var loc = root + "shaders/" + fileName;
        $.get(loc).then(function(src) {
            QuantumTexture.shaders[fileName.replace(".", "_")] = src;
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

    for (var i = 0; i < shaderFileNames.length; i++) {
        beginLoading(shaderFileNames[i]);
    }
};

/**
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.fromBlankFor = function(qubitCount) {
    return new QuantumTexture(qubitCount, QuantumTexture.makeTextureForQubitCount(qubitCount));
};

/**
 * @param {!int} qubitCount
 * @returns {!{type: !string, value: !THREE.Vector2}}
 * @private
 */
QuantumTexture.qubitCountToTextureSize = function(qubitCount) {
    return {
        type: 'v2',
        value: new THREE.Vector2(
            1 << Math.ceil(qubitCount / 2),
            1 << Math.floor(qubitCount / 2))
    };
};

/**
 * @param {!THREE.ShaderMaterial} shader
 * @param {!THREE.WebGLRenderTarget} destTexture
 * @returns {*}
 * @private
 */
QuantumTexture.renderWithShaderTo = function(shader, destTexture) {
    QuantumTexture.meshForMaterial.material = shader;
    QuantumTexture.renderer.render(
        QuantumTexture.scene,
        QuantumTexture.camera,
        destTexture);
};

/**
 * @param {!int} qubitCount
 * @param {!THREE.ShaderMaterial} shader
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.createWithShader = function(qubitCount, shader) {
    var destTexture = QuantumTexture.makeTextureForQubitCount(qubitCount);
    QuantumTexture.renderWithShaderTo(shader, destTexture);
    return new QuantumTexture(qubitCount, destTexture);
};

/**
 * @param {!int} qubitCount
 * @returns {!THREE.WebGLRenderTarget}
 * @private
 */
QuantumTexture.makeTextureForQubitCount = function(qubitCount) {
    var size = QuantumTexture.qubitCountToTextureSize(qubitCount);
    return new THREE.WebGLRenderTarget(
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
};

/**
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.prototype.blankClone = function() {
    return new QuantumTexture(this.qubitCount, QuantumTexture.makeTextureForQubitCount(this.qubitCount));
};

/**
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.prototype.clone = function() {
    var result = this.blankClone();
    result.overwriteTextureWithTextureFrom(this);
    return result;
};

/**
 * @param {!THREE.ShaderMaterial} shader
 * @private
 */
QuantumTexture.prototype.overwriteTextureWithShaderRendering = function(shader) {
    QuantumTexture.renderWithShaderTo(shader, this.texture);
};

/**
 * @param {!QuantumTexture} other
 * @private
 */
QuantumTexture.prototype.overwriteTextureWithTextureFrom = function(other) {
    need(this.qubitCount === other.qubitCount, "this.qubitCount === other.qubitCount");
    this.overwriteTexture(other.texture);
};

/**
 * @param {!Object} srcTexture
 * @private
 */
QuantumTexture.prototype.overwriteTexture = function(srcTexture) {
    QuantumTexture.renderWithShaderTo(new THREE.ShaderMaterial({
        uniforms: {
            resolution: QuantumTexture.qubitCountToTextureSize(this.qubitCount),
            texture: { type: 't', value: srcTexture }
        },
        vertexShader: QuantumTexture.shaders.passThrough_vert,
        fragmentShader: QuantumTexture.shaders.passThrough_frag
    }), this.texture);
};

/**
 * @private
 */
QuantumTexture.prototype.tryReleaseForReuse = function() {
};

/**
 * @param {!ControlMask} controlMask
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 * @private
 */
QuantumTexture.makeControlMaskTexture = function(controlMask, qubitCount) {
    var fromSingleControl = function(index, value) {
        return QuantumTexture.createWithShader(qubitCount, new THREE.ShaderMaterial({
            uniforms: {
                textureSize: QuantumTexture.qubitCountToTextureSize(qubitCount),
                qubitIndexMask: { type: 'f', value: 1 << index },
                targetValue: { type: 'f', value: value ? 1 : 0 }
            },
            vertexShader: QuantumTexture.shaders.passThrough_vert,
            fragmentShader: QuantumTexture.shaders.initSingleControl_frag
        }));
    };

    // If higher bits need to be on, assume the control is simply unsatisfiable.
    if (controlMask.desiredValueMask >= (1 << qubitCount)) {
        return fromSingleControl(qubitCount, true).texture;
    }

    var accumulator = fromSingleControl(qubitCount, false).clone();

    for (var i = 0; i < qubitCount; i++) {
        var v = controlMask.desiredValueFor(i);
        if (v === null) {
            continue;
        }

        var next = QuantumTexture.createWithShader(qubitCount, new THREE.ShaderMaterial({
            uniforms: {
                textureSize: QuantumTexture.qubitCountToTextureSize(qubitCount),
                controlTexture1: { type: 't', value: accumulator.texture },
                controlTexture2: { type: 't', value: fromSingleControl(i, v).texture }
            },
            vertexShader: QuantumTexture.shaders.passThrough_vert,
            fragmentShader: QuantumTexture.shaders.combineControls_frag
        }));

        accumulator.tryReleaseForReuse();
        accumulator = next;
    }

    return accumulator.texture;
};

/**
 * Returns a texture holding the result of applying an operation to the receiving texture's quantum state.
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

    var result = this.blankClone();
    result.overwriteTextureWithShaderRendering(new THREE.ShaderMaterial({
        uniforms: {
            textureSize: QuantumTexture.qubitCountToTextureSize(this.qubitCount),
            qubitIndexMask: { type: 'f', value: 1 << qubitIndex },
            texture: { type: 't', value: this.texture },
            controlTexture: { type: 't', value: QuantumTexture.makeControlMaskTexture(controls, this.qubitCount) },
            dotProductCoefficients_RealOff: { type: 'v4', value: new THREE.Vector4(a.real, -a.imag, c.real, c.imag) },
            dotProductCoefficients_ImagOff: { type: 'v4', value: new THREE.Vector4(a.imag, a.real, c.imag, c.real) },
            dotProductCoefficients_RealOn: { type: 'v4', value: new THREE.Vector4(b.real, -b.imag, d.real, -d.imag) },
            dotProductCoefficients_ImagOn: { type: 'v4', value: new THREE.Vector4(b.imag, b.real, d.imag, d.real) }
        },
        vertexShader: QuantumTexture.shaders.passThrough_vert,
        fragmentShader: QuantumTexture.shaders.applyCustomQubitOperation_frag
    }));
    return result;
};

/**
 * @param {!int} qubitCount
 * @returns {!QuantumTexture}
 */
QuantumTexture.fromZeroes = function(qubitCount) {
    return QuantumTexture.fromClassicalStateInRegisterOfSize(0, qubitCount);
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

    var s = QuantumTexture.qubitCountToTextureSize(qubitCount);
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

    var result = QuantumTexture.fromBlankFor(qubitCount);
    result.overwriteTexture(dataTexture);
    return result;
};

/**
 * Selects one component (e.g. red) from a texture, and copies all those values into a float array.
 * There is some precision loss due to the need to pack the values into bytes as an intermediate step.
 * @param {!int} componentIndex Which component should be converted (R=0, G=1,...).
 * @returns {!Float32Array}
 * @private
 */
QuantumTexture.prototype.textureComponentToFloatArray = function(componentIndex) {
    var dummyTexture = QuantumTexture.makeTextureForQubitCount(this.qubitCount);
    QuantumTexture.renderWithShaderTo(new THREE.ShaderMaterial({
        uniforms: {
            resolution: QuantumTexture.qubitCountToTextureSize(this.qubitCount),
            selector: {type: 'i', value: componentIndex},
            texture: {type: 't', value: this.texture}
        },
        vertexShader: QuantumTexture.shaders.passThrough_vert,
        fragmentShader: QuantumTexture.shaders.packComponentFloatIntoBytes_frag
    }), dummyTexture);

    var bytes = new Uint8Array(this.amplitudeCount * 4);
    var ctx = QuantumTexture.renderer.getContext();
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
 * @returns {!Array.<!Complex>}
 */
QuantumTexture.prototype.toAmplitudes = function() {
    var real = this.textureComponentToFloatArray(0);
    var imag = this.textureComponentToFloatArray(1);
    return range(real.length).map(function(i) { return new Complex(real[i], imag[i]); });
};
