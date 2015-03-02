module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: [],
        files: [
            'out/src/external/traceur_runtime.js',
            'out/src/**/*.js',
            'out/test/**/*.js',
            'out/interop/GetTraceurGeneratedTestPackagesForKarmaTestRunner.js'
        ],
        exclude: [],
        preprocessors: {},
        reporters: ['progress'],
        port: 19876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Chrome', 'Firefox'],
        singleRun: true
    });
};
