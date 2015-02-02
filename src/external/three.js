var THREE = {REVISION: '70'};

//noinspection JSUnusedGlobalSymbols
/**
 * @type {{
 *   texParameteri: function,
 *   deleteTexture: function,
 *   uniform1i: function,
 *   uniform1f: function,
 *   uniform2f: function,
 *   getExtension: function,
 *   deleteShader: function,
 *   getProgramInfoLog: function,
 *   getError: function,
 *   readPixels: function,
 *   getProgramParameter: function,
 *   createShader: function,
 *   shaderSource: function,
 *   compileShader: function,
 *   getShaderParameter: function,
 *   getShaderInfoLog: function,
 *   deleteProgram: function,
 *   bindRenderbuffer: function,
 *   bindFramebuffer: function,
 *   framebufferRenderbuffer: function,
 *   attachShader: function,
 *   bindAttribLocation: function,
 *   linkProgram: function,
 *   getProgramParameter: function,
 *   createTexture: function,
 *   createFramebuffer: function,
 *   createRenderbuffer: function,
 *   pixelStorei: function,
 *   activeTexture: function,
 *   generateMipmap: function,
 *   getUniformLocation: function,
 *   getAttribLocation: function,
 *   createProgram: function,
 *   bindBuffer: function,
 *   enableVertexAttribArray: function,
 *   vertexAttribPointer: function,
 *   bufferData: function,
 *   useProgram: function,
 *   createBuffer: function,
 *   drawElements: function,
 *   framebufferTexture2D: function,
 *   renderbufferStorage: function,
 *   getShaderPrecisionFormat: function,
 *   blendEquation: function,
 *   blendFunc: function,
 *   viewport: function,
 *   deleteBuffer: function,
 *   bindTexture: function,
 *   texImage2D: function
 *   MAX_TEXTURE_IMAGE_UNITS: *,
 *   MAX_TEXTURE_SIZE: *,
 *   VERTEX_SHADER: *,
 *   HIGH_FLOAT: *,
 *   MEDIUM_FLOAT: *,
 *   FRAGMENT_SHADER: *,
 *   TEXTURE_2D: *,
 *   RENDERBUFFER: *,
 *   FRAMEBUFFER: *,
 *   NEAREST: *,
 *   FLOAT: *,
 *   STATIC_DRAW: *,
 *   RGBA: *,
 *   UNSIGNED_INT: *,
 *   UNSIGNED_SHORT: *,
 *   TRIANGLES: *,
 *   ARRAY_BUFFER: *,
 *   COLOR_ATTACHMENT0: *,
 *   RGBA4: *,
 *   LINK_STATUS: *,
 *   TEXTURE0: *,
 *   ELEMENT_ARRAY_BUFFER: *,
 *   TEXTURE_MAG_FILTER: *,
 *   UNSIGNED_BYTE: *,
 *   TEXTURE_MIN_FILTER: *,
 *   COMPILE_STATUS: *,
 *   VALIDATE_STATUS: *
 * }}
 */
var WebGLContext2d;

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
     * @private
     */
    this.g = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
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
};

/**
 * @param {!THREE.ShaderMaterial} shader
 * @param {!Object.<!string, !{type: !string, val: *}>} uniformArguments
 * @param {!THREE.Target} renderTarget
 */
THREE.Context.prototype.render = function (shader, uniformArguments, renderTarget) {
    this.g.bindFramebuffer(this.g.FRAMEBUFFER, renderTarget.grab(this).framebuffer);
    this.ensureAttributesAreBound();
    shader.bindAsProgramInto(this, uniformArguments);
    this.g.drawElements(this.g.TRIANGLES, 6, this.g.UNSIGNED_SHORT, 0);
};

/**
 * @param {!THREE.Target} renderTarget
 * @param {!Rect} rect
 * @param {!Uint8Array} bytes
 */
THREE.Context.prototype.readPixels = function(renderTarget, rect, bytes) {
    this.g.bindFramebuffer(this.g.FRAMEBUFFER, renderTarget.grab(this).framebuffer);
    this.g.readPixels(rect.x, rect.y, rect.w, rect.h, this.g.RGBA, this.g.UNSIGNED_BYTE, bytes);
};

/**
 * @returns {*}
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
        g.bindBuffer(g.ARRAY_BUFFER, result.positionBuffer);
        g.bufferData(g.ARRAY_BUFFER, positions, g.STATIC_DRAW);

        var indices = new Uint16Array([0, 2, 1,
            2, 3, 1]);
        g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, result.indexBuffer);
        g.bufferData(g.ELEMENT_ARRAY_BUFFER, indices, g.STATIC_DRAW);

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
    var gl = this.getContext();

    var isHighPrecisionAvailable =
        gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT).precision > 0 &&
        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0;
    if (isHighPrecisionAvailable) {
        return 'highp';
    }

    console.warn('WebGL high precision not available.');
    var isMediumPrecisionAvailable =
        gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT).precision > 0 &&
        gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT).precision > 0;
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

        g.bindTexture(g.TEXTURE_2D, result.texture);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, self.width, self.height, 0, g.RGBA, g.FLOAT, null);
        g.bindTexture(g.TEXTURE_2D, null);

        g.bindFramebuffer(g.FRAMEBUFFER, result.framebuffer);
        g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, result.texture, 0);
        g.bindFramebuffer(g.FRAMEBUFFER, null);

        g.bindRenderbuffer(g.RENDERBUFFER, result.renderbuffer);
        g.renderbufferStorage(g.RENDERBUFFER, g.RGBA4, self.width, self.height);
        g.bindRenderbuffer(g.RENDERBUFFER, null);

        return result;
    });
};

/**
 * @param {!THREE.Context} renderer
 * @param {!string} fragmentShaderSource
 * @param {!Array.<!string>} uniformParameterNames
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
        'precision ' + precision + ' float;',
        'precision ' + precision + ' int;',
        fragmentShaderSource
    ].join('\n');

    var glVertexShader = THREE.WebGLProgram.compileShader(g, g.VERTEX_SHADER, vertexShader);
    var glFragmentShader = THREE.WebGLProgram.compileShader(g, g.FRAGMENT_SHADER, fullFragmentShader);

    var program = g.createProgram();
    g.attachShader(program, glVertexShader);
    g.attachShader(program, glFragmentShader);
    g.linkProgram(program);

    if (g.getProgramInfoLog(program) !== '') {
        console.warn('gl.getProgramInfoLog()', g.getProgramInfoLog(program));
    }

    if (g.getProgramParameter(program, g.LINK_STATUS) === false) {
        throw new Error(
            "Failed to link shader program." +
            "\n" +
            "\n" +
            "gl.VALIDATE_STATUS: " + g.getProgramParameter(program, g.VALIDATE_STATUS) +
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
    var maxTextureUnits = g.getParameter(g.MAX_TEXTURE_IMAGE_UNITS);
    var maxTextureDiameter = g.getParameter(g.MAX_TEXTURE_SIZE);

    var nextTextureUnitIndex = 0;
    var getNextTextureUnitIndex = function() {
        var textureUnit = nextTextureUnitIndex++;
        if (textureUnit >= maxTextureUnits) {
            throw new Error('WebGLRenderer: not enough texture units (' + maxTextureUnits + ')');
        }
        return textureUnit;
    };

    var typeActionMap = {
        i: function(loc, val) { g.uniform1i(loc, val); },
        f: function(loc, val) { g.uniform1f(loc, val); },
        v2: function(loc, val) { g.uniform2f(loc, val.x, val.y); },

        /**
         * @param {!string} loc
         * @param {!THREE.Target} val
         */
        renderTarget_t: function(loc, val) {
            var textureUnit = getNextTextureUnitIndex();
            g.uniform1i(loc, textureUnit);
            g.activeTexture(g.TEXTURE0 + textureUnit);
            g.bindTexture(g.TEXTURE_2D, val.grab(context).texture);
        },

        /**
         * @param {!string} loc
         * @param {!{data: !Float32Array, width: int, height: int}} val
         */
        data_t: function(loc, val) {
            if (val.width > maxTextureDiameter || val.height > maxTextureDiameter) {
                throw new Error("Texture image (" + val.width + " x " + val.height +
                    ") exceeds maximum diameter (" + maxTextureDiameter + ").");
            }

            var textureUnit = getNextTextureUnitIndex();
            g.uniform1i(loc, textureUnit);
            g.activeTexture(g.TEXTURE0 + textureUnit);

            var texture = g.createTexture();
            g.bindTexture(g.TEXTURE_2D, texture);
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, val.width, val.height, 0, g.RGBA, g.FLOAT, val.data);
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
    g.vertexAttribPointer(this.positionAttributeLocation, 2, g.FLOAT, false, 0, 0);
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
        throw new Error('THREE.WebGLShader: Shader compiled failed: ' + sourceCode + gl.getError());
    }

    return shader;
};
