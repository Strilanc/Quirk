const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        let caughtPageError = false;
        page.on('console', message => console.log(message.text()));
        page.on('pageerror', ({message}) => {
            caughtPageError = true;
            console.error("Page error bubbled into PuppeteerRunTests.js: " + message);
        });

        const outDirUrl = 'file:///' + __dirname.split('\\').join('/') + '/out/';
        await page.goto(outDirUrl + 'test.html#blocking');
        await page.waitForSelector('#done', {timeout: 5 * 60 * 1000});
        let anyFailures = await page.evaluate('__any_failures');

        await browser.close();
        if (anyFailures || caughtPageError) {
            process.exit(1);
        }
    } catch (ex) {
        console.error("Error bubbled up into PuppeteerRunTests.js: " + ex);
        process.exit(1);
    }
})();
