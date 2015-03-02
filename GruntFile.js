module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jstdPhantom: {
            options: {
                useLatest : true,
                port: 9876
            },
            files: ['jsTestDriver.conf']
        },
        traceur: {
            build_src: {
                options: {
                    experimental: true,
                    copyRuntime: 'out/src/external'
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'out/src/'
                }]
            },
            build_test: {
                options: {
                    experimental: true,
                },
                files: [{
                    expand: true,
                    cwd: 'test/',
                    src: ['**/*.js'],
                    dest: 'out/test/'
                }]
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            },
            cross_unit: {
                configFile: 'karma.conf.js',
                browsers: ['Firefox', 'Chrome']
            }
        }
    });

    var karmaInterop = function() {
        //noinspection JSUnresolvedFunction
        var testFiles = grunt.file.glob.sync("test/**/*.test.js");
        var getters = testFiles.map(function(e) {
            return 'System.get("' + e + '");';
        }).join("\n");
        grunt.file.write("out/interop/GetTraceurGeneratedTestPackagesForKarmaTestRunner.js", getters);
    };
    karmaInterop();

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-traceur');

    grunt.registerTask('build', ['traceur:build_src']);

    grunt.registerTask('test', [
        'traceur:build_src',
        'traceur:build_test',
        'karma:unit'
    ]);

    grunt.registerTask('cross_test', [
        'traceur:build_src',
        'traceur:build_test',
        'karma:cross_unit'
    ]);
};
