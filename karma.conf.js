//noinspection JSUnresolvedVariable
module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: [],
        files: ['out/all_tests.js'],
        exclude: [],
        preprocessors: {},
        reporters: ['progress'],
        port: 19876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Firefox', 'Chrome'],
        singleRun: true
    });
};
