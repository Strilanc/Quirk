const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        let caughtPageError = false;
        page.on('console', message => console.log(message.text()));
        page.on('pageerror', ({message}) => {
            caughtPageError = true;
            console.error("Page error bubbled into PuppeteerSampleCircuit.js: " + message);
        });
        const outDirUrl = 'file:///' + __dirname.split('\\').join('/') + '/out/';
        const circuitJson = '{"cols":[["H"],["Bloch"],["Amps1"],[],["Density"],["•","X"],["Chance2"]]}';
        await page.goto(outDirUrl + 'quirk.html#circuit=' + circuitJson);
        await page.waitForSelector('#loading-div', {visible: false, timeout: 5 * 1000});
        await page.screenshot({path: 'screenshot.png'});
        await browser.close();
    } catch (ex) {
        console.error("Error bubbled up into PuppeteerSampleCircuit.js: " + ex);
        process.exit(1);
    }
})();
