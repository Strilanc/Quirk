var force6 = e => e;

var THREE = {REVISION: '70'};

/**
 *
 * @param {!string} fragmentShaderSource
 *
 * @property {!string} fragmentShaderSource
 * @property {!Object.<!int, !{lifetimeCounter: !int, value: T}>} contextStashObject
 * @property {!Object.<!int, !Object.<!string, !{program: !THREE.WebGLProgram}>>} fragmentShader
 *
 * @constructor
 */
THREE.ShaderMaterial = function (fragmentShaderSource) {
    this.fragmentShaderSource = fragmentShaderSource;
    this.contextStash = {}
};

/**
 * @param {!THREE.Context} context
 * @param {!Object.<!string, !{type: !string, val: *}>} uniformArguments
 */
THREE.ShaderMaterial.prototype.bindAsProgramInto = function(context, uniformArguments) {
    var self = this;

    var grabbed = context.grabHelper(this.contextStash, function() {
        return {
            program: new THREE.WebGLProgram(context, self.fragmentShaderSource, Object.keys(uniformArguments))
        };
    });

    grabbed.program.loadInto(context, uniformArguments);
};

THREE.NEXT_UNIQUE_CONTEXT_ID = 0;
THREE.Context = function () {
    /**
     * @type {!HTMLCanvasElement}
     * @private
     */
    this.canvas = document.createElement('canvas');

    /**
     * @type {!WebGLRenderingContext}
     * @private
     */
    this.g = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    //noinspection JSValidateTypes
    if (this.g === null) {
        throw 'Error creating WebGL context.';
    }
    if (this.g.getExtension('OES_texture_float') === undefined) {
        throw new Error("WebGL support for 32-bit floats not present.")
    }

    /** @type {!int} */
    this.id = THREE.NEXT_UNIQUE_CONTEXT_ID++;
    /** @type {!int} */
    this.lifetimeCounter = 0;
    /**
     * @private
     */
    this._renderStash = {};

    var self = this;
    this.canvas.addEventListener(
        "webglcontextrestored",
        function (event) {
            event.preventDefault();
            self.lifetimeCounter++;
        },
        false);

    this.canvas.addEventListener(
        'webglcontextlost',
        function (event) {
            event.preventDefault();
            self.lifetimeCounter++;
        },
        false);

    this.maxTextureUnits = this.g.getParameter(WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS);
    this.maxTextureDiameter = this.g.getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE);
};

/**
 * @param {!THREE.ShaderMaterial} shader
 * @param {!Object.<!string, !{type: !string, val: *}>} uniformArguments
 * @param {!THREE.Target} renderTarget
 */
THREE.Context.prototype.render = function (shader, uniformArguments, renderTarget) {
    this.ensureAttributesAreBound();

    var s = WebGLRenderingContext;
    this.g.bindFramebuffer(s.FRAMEBUFFER, renderTarget.grab(this).framebuffer);
    shader.bindAsProgramInto(this, uniformArguments);

    this.g.drawElements(s.TRIANGLES, 6, s.UNSIGNED_SHORT, 0);
};

THREE.Context.prototype.checkError = function(previousOp) {
    var e = this.g.getError();
    var s = WebGLRenderingContext;
    if (e !== s.NO_ERROR) {
        var m = {};
        m[s.CONTEXT_LOST_WEBGL] = "CONTEXT_LOST_WEBGL";
        m[s.OUT_OF_MEMORY] = "OUT_OF_MEMORY";
        m[s.INVALID_ENUM] = "INVALID_ENUM";
        m[s.INVALID_VALUE] = "INVALID_VALUE";
        m[s.INVALID_OPERATION] = "INVALID_OPERATION";
        m[s.INVALID_FRAMEBUFFER_OPERATION] = "INVALID_FRAMEBUFFER_OPERATION";
        var d = m[e] !== undefined ? m[e] : "?";
        throw new Error("gl.getError() returned " + e + " (" + d + ") after " + previousOp + ".");
    }
};

/**
 * @param {!THREE.Target} renderTarget
 * @param {!Rect} rect
 * @param {!Uint8Array} bytes
 */
THREE.Context.prototype.readPixels = function(renderTarget, rect, bytes) {
    var s = WebGLRenderingContext;
    this.g.bindFramebuffer(s.FRAMEBUFFER, renderTarget.grab(this).framebuffer);
    this.g.readPixels(rect.x, rect.y, rect.w, rect.h, s.RGBA, s.UNSIGNED_BYTE, bytes);
};

/**
 * @returns {!WebGLRenderingContext}
 */
THREE.Context.prototype.getContext = function() {
    return this.g;
};

THREE.Context.prototype.ensureAttributesAreBound = function() {
    var g = this.getContext();
    this.grabHelper(this._renderStash, function() {
        var result = {
            positionBuffer: g.createBuffer(),
            indexBuffer: g.createBuffer()
        };

        var positions = new Float32Array([-1, +1,
            +1, +1,
            -1, -1,
            +1, -1]);
        var s = WebGLRenderingContext;
        g.bindBuffer(s.ARRAY_BUFFER, result.positionBuffer);
        g.bufferData(s.ARRAY_BUFFER, positions, s.STATIC_DRAW);
        // Note: should not be rebound anywhere else

        var indices = new Uint16Array([0, 2, 1,
            2, 3, 1]);
        g.bindBuffer(s.ELEMENT_ARRAY_BUFFER, result.indexBuffer);
        g.bufferData(s.ELEMENT_ARRAY_BUFFER, indices, s.STATIC_DRAW);
        // Note: should not be rebound anywhere else

        return undefined;
    });
};

/**
 * @param {!Object.<!int, !{lifetimeCounter: !int, value: T}>} contextStashObject
 * @param {!function(): T} initializer
 * @returns {T}
 * @template T
 */
THREE.Context.prototype.grabHelper = function(contextStashObject, initializer) {
    var stashArea = contextStashObject[this.id];
    if (stashArea === undefined) {
        stashArea = {
            lifetimeCounter: this.lifetimeCounter - 1,
            value: undefined
        };
        contextStashObject[this.id] = stashArea;
    }

    if (stashArea.lifetimeCounter < this.lifetimeCounter) {
        stashArea.lifetimeCounter = this.lifetimeCounter;
        stashArea.value = initializer();
    }

    return stashArea.value;
};

THREE.Context.prototype.getMaximumShaderFloatPrecision = function() {
    var g = this.getContext();
    var s = WebGLRenderingContext;

    var isHighPrecisionAvailable =
        g.getShaderPrecisionFormat(s.VERTEX_SHADER, s.HIGH_FLOAT).precision > 0 &&
        g.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.HIGH_FLOAT).precision > 0;
    if (isHighPrecisionAvailable) {
        return 'highp';
    }

    console.warn('WebGL high precision not available.');
    var isMediumPrecisionAvailable =
        g.getShaderPrecisionFormat(s.VERTEX_SHADER, s.MEDIUM_FLOAT).precision > 0 &&
        g.getShaderPrecisionFormat(s.FRAGMENT_SHADER, s.MEDIUM_FLOAT).precision > 0;
    if (isMediumPrecisionAvailable) {
        return 'mediump';
    }

    console.warn('WebGL medium precision not available.');
    return 'lowp';
};

/**
 * @param {!int} width
 * @param {!int} height
 *
 * @property {!int} width
 * @property {!int} height
 * @property {!Object.<!int, !Object.<!string, *>>} contextStash
 *
 * @constructor
 */
THREE.Target = function(width, height) {
    this.width = width;
    this.height = height;
    this.contextStash = {};
};

/**
 * @param {!THREE.Context} context
 * @result {!{texture:*, framebuffer:*, renderbuffer:*}}
 */
THREE.Target.prototype.grab = function(context) {
    var self = this;
    var g = context.getContext();
    return context.grabHelper(this.contextStash, function() {
        var result = {
            texture: g.createTexture(),
            framebuffer: g.createFramebuffer(),
            renderbuffer: g.createRenderbuffer()
        };

        var s = WebGLRenderingContext;
        g.bindTexture(s.TEXTURE_2D, result.texture);
        g.bindFramebuffer(s.FRAMEBUFFER, result.framebuffer);
        g.bindRenderbuffer(s.RENDERBUFFER, result.renderbuffer);

        g.texParameteri(s.TEXTURE_2D, s.TEXTURE_MAG_FILTER, s.NEAREST);
        g.texParameteri(s.TEXTURE_2D, s.TEXTURE_MIN_FILTER, s.NEAREST);
        g.texImage2D(s.TEXTURE_2D, 0, s.RGBA, self.width, self.height, 0, s.RGBA, s.FLOAT, null);
        g.framebufferTexture2D(s.FRAMEBUFFER, s.COLOR_ATTACHMENT0, s.TEXTURE_2D, result.texture, 0);
        g.renderbufferStorage(s.RENDERBUFFER, s.RGBA4, self.width, self.height);

        g.bindTexture(s.TEXTURE_2D, null);
        g.bindFramebuffer(s.FRAMEBUFFER, null);
        g.bindRenderbuffer(s.RENDERBUFFER, null);

        return result;
    });
};

/**
 * @param {!THREE.Context} renderer
 * @param {!string} fragmentShaderSource
 * @param {!Array<!string>} uniformParameterNames
 * @returns {!THREE.WebGLProgram}
 * @constructor
 */
THREE.WebGLProgram = function(renderer, fragmentShaderSource, uniformParameterNames) {
    var g = renderer.getContext();

    var precision = renderer.getMaximumShaderFloatPrecision();
    var vertexShader = [
        'precision ' + precision + ' float;',
        'precision ' + precision + ' int;',
        'attribute vec2 position;',
        'void main() {',
        '  gl_Position = vec4(position, 0, 1);',
        '}'
    ].join('\n');
    var fullFragmentShader = [
        "precision " + precision + " float;",
        "precision " + precision + " int;",
        fragmentShaderSource
    ].join("\n");

    var s = WebGLRenderingContext;
    var glVertexShader = THREE.WebGLProgram.compileShader(g, s.VERTEX_SHADER, vertexShader);
    var glFragmentShader = THREE.WebGLProgram.compileShader(g, s.FRAGMENT_SHADER, fullFragmentShader);

    var program = g.createProgram();
    g.attachShader(program, glVertexShader);
    g.attachShader(program, glFragmentShader);
    g.linkProgram(program);

    if (g.getProgramInfoLog(program) !== '') {
        console.warn('gl.getProgramInfoLog()', g.getProgramInfoLog(program));
    }

    if (g.getProgramParameter(program, s.LINK_STATUS) === false) {
        throw new Error(
            "Failed to link shader program." +
            "\n" +
            "\n" +
            "gl.VALIDATE_STATUS: " + g.getProgramParameter(program, s.VALIDATE_STATUS) +
            "\n" +
            "gl.getError(): " + g.getError());
    }

    g.deleteShader(glVertexShader);
    g.deleteShader(glFragmentShader);

    this.uniformLocations = uniformParameterNames.mapKeysTo(function (e) {
        return g.getUniformLocation(program, e);
    });
    this.positionAttributeLocation = g.getAttribLocation(program, 'position');

    this.program = program;

    return this;
};

/**
 * @param {!THREE.Context} context
 * @param {!Object.<!string, !{type: !string, val: *}>} uniformArgs
 */
THREE.WebGLProgram.prototype.loadInto = function(context, uniformArgs) {
    var g = context.getContext();

    var nextTextureUnitIndex = 0;
    var getNextTextureUnitIndex = function() {
        var textureUnit = nextTextureUnitIndex++;
        if (textureUnit >= context.maxTextureUnits) {
            throw new Error('WebGLRenderer: not enough texture units (' + context.maxTextureUnits + ')');
        }
        return textureUnit;
    };

    var typeActionMap = {
        i: function(loc, val) { g.uniform1i(loc, val); },
        f: function(loc, val) { g.uniform1f(loc, val); },
        v2: function(loc, val) { g.uniform2f(loc, val.x, val.y); },

        /**
         * @param {*} loc
         * @param {!THREE.Target} val
         */
        renderTarget_t: function(loc, val) {
            var textureUnit = getNextTextureUnitIndex();
            g.uniform1i(loc, textureUnit);
            g.activeTexture(WebGLRenderingContext.TEXTURE0 + textureUnit);
            g.bindTexture(WebGLRenderingContext.TEXTURE_2D, val.grab(context).texture);
        },

        /**
         * @param {*} loc
         * @param {!{data: !Float32Array, width: int, height: int}} val
         */
        data_t: function(loc, val) {
            if (val.width > context.maxTextureDiameter || val.height > context.maxTextureDiameter) {
                throw new Error("Texture image (" + val.width + " x " + val.height +
                    ") exceeds maximum diameter (" + context.maxTextureDiameter + ").");
            }

            var s = WebGLRenderingContext;
            var textureUnit = getNextTextureUnitIndex();
            g.uniform1i(loc, textureUnit);
            g.activeTexture(s.TEXTURE0 + textureUnit);

            var texture = g.createTexture();
            g.bindTexture(s.TEXTURE_2D, texture);
            g.texParameteri(s.TEXTURE_2D, s.TEXTURE_MAG_FILTER, s.NEAREST);
            g.texParameteri(s.TEXTURE_2D, s.TEXTURE_MIN_FILTER, s.NEAREST);
            g.texImage2D(s.TEXTURE_2D, 0, s.RGBA, val.width, val.height, 0, s.RGBA, s.FLOAT, val.data);
        }
    };

    g.useProgram(this.program);

    var keys = Object.keys(uniformArgs);
    for (var i = 0; i < keys.length; i++) {
        var name = keys[i];
        var uniform = uniformArgs[name];
        var location = this.uniformLocations[name];
        typeActionMap[uniform.type](location, uniform.value);
    }

    g.enableVertexAttribArray(this.positionAttributeLocation);
    g.vertexAttribPointer(this.positionAttributeLocation, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
};

/**
 * @param {*} gl
 * @param {*} type
 * @param {!string} sourceCode
 * @returns {*}
 */
THREE.WebGLProgram.compileShader = function(gl, type, sourceCode) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (gl.getShaderInfoLog(shader) !== '') {
        console.warn('THREE.WebGLShader: gl.getShaderInfoLog()', gl.getShaderInfoLog(shader));
        console.warn(sourceCode);
    }

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
        throw new Error('THREE.WebGLShader: Shader compile failed: ' + sourceCode + gl.getError());
    }

    return shader;
};
