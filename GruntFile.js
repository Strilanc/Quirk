module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      js : {
        src : [
          'src/util/util.js',
          'src/util/complex.js',
          'src/util/matrix.js',
          'src/util/rect.js',
          'src/util/*.js',
          'src/ui/*.js',
          'src/main.js',
        ],
        dest : 'out/combined.js'
      }
    },
    watch: {
      files: ['src/**/*.js'],
      tasks: ['concat']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', [
    'concat:js'
  ]);

};
