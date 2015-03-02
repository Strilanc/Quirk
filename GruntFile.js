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
            build: {
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
            test_src_inline: {
                options: {
                    experimental: true,
                    copyRuntime: 'out/testsrc/external',
                    modules: 'inline'
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'out/testsrc/'
                }]
            },
            test_inline: {
                options: {
                    experimental: true,
                    modules: 'inline'
                },
                files: [{
                    expand: true,
                    cwd: 'test/',
                    src: ['**/*.js'],
                    dest: 'out/test/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-traceur');
    grunt.loadNpmTasks('grunt-jstestdriver-phantomjs');

    grunt.registerTask('build', ['traceur:build']);
    grunt.registerTask('test_build', ['traceur:test_src_inline', 'traceur:test_inline']);
    grunt.registerTask('test', ['test_build', 'jstdPhantom']);
};
