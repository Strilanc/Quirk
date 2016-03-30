module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: [],
        files: ['out/test.js'],
        exclude: [],
        preprocessors: {},
        reporters: ['dots'],
        port: 19876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Firefox', 'Chrome'],
        singleRun: true
    });
};
