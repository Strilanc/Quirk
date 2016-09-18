var path = require('path');

module.exports = function(grunt) {
    //noinspection JSUnresolvedFunction
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        traceur: {
            'translate-src': {
                options: {
                    experimental: true,
                    copyRuntime: 'out/tmp/traceur/bootstrap_pre_src',
                    moduleNaming: {
                        stripPrefix: 'out/tmp/traceur'
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'out/tmp/traceur/src/'
                }]
            },
            'translate-test': {
                options: {
                    experimental: true,
                    moduleNaming: {
                        stripPrefix: 'out/tmp/traceur'
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'test/',
                    src: ['**/*.js'],
                    dest: 'out/tmp/traceur/test/'
                }]
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            },
            'unit-chrome': {
                configFile: 'karma.conf.js',
                browsers: ['Chrome']
            },
            'unit-firefox': {
                configFile: 'karma.conf.js',
                browsers: ['Firefox']
            },
            'unit-travis': {
                configFile: 'karma.conf.js',
                browsers: ['Firefox']
            }
        },
        concat: {
            'concat-traceur-src': {
                options: {
                    separator: ';'
                },
                src: [
                    'out/tmp/traceur/bootstrap_pre_src/**/*.js',
                    'out/tmp/traceur/src/**/*.js',
                    'out/tmp/traceur/bootstrap_post_src/**/*.js'
                ],
                dest: 'out/tmp/concatenated-src.js'
            },
            'concat-traceur-test': {
                options: {
                    separator: ';'
                },
                src: [
                    'out/tmp/traceur/bootstrap_pre_src/**/*.js',
                    'out/tmp/traceur/bootstrap_pre_test/**/*.js',
                    'out/tmp/traceur/src/**/*.js',
                    'out/tmp/traceur/test/**/*.js',
                    'out/tmp/traceur/bootstrap_post_test/**/*.js'
                ],
                dest: 'out/test.js'
            }
        },
        uglify: {
            'uglify-concatenated-src': {
                options: {
                    maxLineLen: 128
                },
                files: {
                    'out/tmp/minified-src.js': ['out/tmp/concatenated-src.js']
                }
            }
        },
        include_file: {
            options: {
                src: ['template/quirk.template.html'],
                dest: 'out/tmp/'
            },
            your_target: {
                // Target-specific file lists and/or options go here.
            }
        },
        clean: {
            'clean-tmp': ['out/tmp'],
            'clean-out': ['out/']
        },
        makeTestPostBootstrap: {
            options: {
                from: null,
                to: null
            }
        }
    });

    grunt.registerTask('bootstrap-get-packages', function(src, dst) {
        var packagedFiles = grunt.file.glob.sync(src);
        var getters = packagedFiles.map(function(e) {
            return '$traceurRuntime.getModule("' + e + '");';
        }).join('\n');
        grunt.file.write(dst, getters);
    });

    grunt.registerTask('inject-js-into-html', function(htmlSrc, jsSrc, dst) {
        var html = grunt.file.read(htmlSrc);
        var js = grunt.file.read(jsSrc);
        var errPart = grunt.file.read('template/error.partial.html');
        var forgePart = grunt.file.read('template/forge.partial.html');
        var exportPart = grunt.file.read('template/export.partial.html');
        var loadingPart = grunt.file.read('template/loading.partial.html');
        var output = html;
        output = output.split("<!-- INCLUDE SOURCE PART -->").join(js);
        output = output.split("<!-- INCLUDE LOADING PART -->").join(loadingPart);
        output = output.split("<!-- INCLUDE ERROR PART -->").join(errPart);
        output = output.split("<!-- INCLUDE FORGE PART -->").join(forgePart);
        output = output.split("<!-- INCLUDE EXPORT PART -->").join(exportPart);
        grunt.file.write(dst, output);
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-traceur');

    grunt.registerTask('build-src', [
        'clean:clean-tmp',
        'traceur:translate-src',
        'bootstrap-get-packages:src/main.js:out/tmp/traceur/bootstrap_post_src/run_main.js',
        'concat:concat-traceur-src',
        'uglify:uglify-concatenated-src',
        'inject-js-into-html:template/quirk.template.html:out/tmp/minified-src.js:out/quirk.html',
        'clean:clean-tmp'
    ]);
    grunt.registerTask('build-debug', [
        'clean:clean-tmp',
        'traceur:translate-src',
        'bootstrap-get-packages:src/main.js:out/tmp/traceur/bootstrap_post_src/run_main.js',
        'concat:concat-traceur-src',
        'inject-js-into-html:template/quirk.template.html:out/tmp/concatenated-src.js:out/quirk.html',
        'clean:clean-tmp'
    ]);
    grunt.registerTask('build-test', [
        'clean:clean-tmp',
        'traceur:translate-src',
        'traceur:translate-test',
        'bootstrap-get-packages:test/**/*.test.js:out/tmp/traceur/bootstrap_post_test/run_tests.js',
        'concat:concat-traceur-test',
        'clean:clean-tmp'
    ]);

    grunt.registerTask('test-chrome', ['build-test', 'karma:unit-chrome']);
    grunt.registerTask('test-firefox', ['build-test', 'karma:unit-firefox']);
    grunt.registerTask('test-travis', ['build-test', 'karma:unit-travis']);
    grunt.registerTask('test', ['build-test', 'karma:unit']);
};
