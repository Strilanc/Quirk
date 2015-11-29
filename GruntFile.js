var path = require('path');

module.exports = function(grunt) {
    //noinspection JSUnresolvedFunction
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        traceur: {
            translate_src: {
                options: {
                    experimental: true,
                    copyRuntime: 'out/tmp/traceur/bootstrap_pre_src',
                    moduleNaming: {
                        stripPrefix: "out/tmp/traceur"
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'out/tmp/traceur/src/'
                }]
            },
            translate_test: {
                options: {
                    experimental: true,
                    moduleNaming: {
                        stripPrefix: "out/tmp/traceur"
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
            unit_just_firefox_for_travis: {
                configFile: 'karma.conf.js',
                browsers: ['Firefox']
            }
        },
        concat: {
            concat_traceur_src: {
                options: {
                    separator: ';'
                },
                src: [
                    'out/tmp/traceur/bootstrap_pre_src/**/*.js',
                    'out/tmp/traceur/src/**/*.js',
                    'out/tmp/traceur/bootstrap_post_src/**/*.js'
                ],
                dest: 'out/all_src.js'
            },
            concat_traceur_test: {
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
                dest: 'out/all_tests.js'
            }
        },
        clean: {
            clean_out_tmp: ["out/tmp"],
            clean_out_out: ["out/"]
        },
        copy: {
            copy_res_to_out: {
                cwd: 'res/',
                src: '*',
                dest: 'out/',
                expand: true
            }
        },
        makeTestPostBootstrap: {
            options: {
                from: null,
                to: null
            }
        }
    });

    grunt.registerTask('bootstrap_get_packages', function(src, dst) {
        var packagedFiles = grunt.file.glob.sync(src);
        var getters = packagedFiles.map(function(e) {
            return 'System.get("' + e + '");';
        }).join("\n");
        grunt.file.write(dst, getters);
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-traceur');

    grunt.registerTask('build_src', [
        'clean:clean_out_tmp',
        'traceur:translate_src',
        'bootstrap_get_packages:src/**/*.js:out/tmp/traceur/bootstrap_post_src/run_main.js',
        'concat:concat_traceur_src',
        'copy:copy_res_to_out',
        'clean:clean_out_tmp'
    ]);
    grunt.registerTask('build_test', [
        'clean:clean_out_tmp',
        'traceur:translate_src',
        'traceur:translate_test',
        'bootstrap_get_packages:test/**/*.test.js:out/tmp/traceur/bootstrap_post_test/run_tests.js',
        'concat:concat_traceur_test',
        'clean:clean_out_tmp'
    ]);
    grunt.registerTask('build', ['build_src', 'build_test']);

    grunt.registerTask('test_just_firefox_for_travis_ci', ['build_test', 'karma:unit_just_firefox_for_travis']);
    grunt.registerTask('test', ['build_test', 'karma:unit']);
};
