/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
