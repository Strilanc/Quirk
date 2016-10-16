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
        browserNoActivityTimeout: 30000,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Chrome', 'Firefox'],
        singleRun: true
    });
};
