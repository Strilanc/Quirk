LoadTest = AsyncTestCase("LoadTest");

LoadTest.prototype.testLoad = function(queue) {
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
                done();
                loadedElseReason = true;
            },
            function(s) {
                done();
                loadedElseReason = s;
            });
    });

    queue.call(function() {
        assertThat(loadedElseReason).isEqualTo(true);
    });
};
