LoadTest = AsyncTestCase("LoadTest");

LoadTest.prototype.testLoad = skipTestIfWebGlNotAvailable(function(queue) {
    // JQuery
    assertTrue($ !== undefined);
    // Three.js
    assertTrue(THREE !== undefined);

    var loadedElseReason = false;
    queue.call(function(callbacks) {
        var done = callbacks.add(function() {});
        QuantumTexture.loadThen(
            "/test/src/",
            function() {
                try {
                    runInitializationFunctions();
                    loadedElseReason = true;
                } catch (ex) {
                    loadedElseReason = ex;
                } finally {
                    done();
                }
            },
            function(s) {
                loadedElseReason = s;
                done();
            });
    });

    queue.call(function() {
        assertThat(loadedElseReason).isEqualTo(true);
    });
});
