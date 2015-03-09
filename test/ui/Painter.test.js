import { Suite, assertThat, fail } from "test/TestUtil.js"
import Painter from "src/ui/Painter.js"
import Point from "src/base/Point.js"
import Rect from "src/base/Rect.js"

let suite = new Suite("Painter");

suite.canvasAppearanceTest("clear", 20, 20, canvas => {
    let painter = new Painter(canvas);
    painter.clear('#123456');
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAHklEQVQ4jWMQMgn7T03MMGrgqIGjBo4aOGrgSDUQACM' +
'egk9y1eLzAAAAAElFTkSuQmCC');

suite.canvasAppearanceTest("strokeLine", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokeLine(new Point(5, 10), new Point(32, 35), "blue", 3);
    painter.strokeLine(new Point(30, 5), new Point(3, 20), "red", 1);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABoUlEQVRYhe3XL0gDYRjH8W8wDGay2dbWBINhYLOtKQi' +
'zrC2paWk2EcaaQTBpGwbXBgsm29qWDMKaQRBBRFDB4M9w5zwfzs3JtufAfcu1uw/vvc/9gVmz/mGCOW9DbIKcoCXoeFu+JcgITgS3gm1vTz9BSnAgUHh' +
'MeZv6CbbDFTsRZMZ9+iro9I+wDUE33Gu5McMAVAnuiARqjADrD4BgYwKw/qUOI0CBLkDpATCPAdC+QbZBiwbmPQAqG+QVKBviJjkAIyFLUeQWZ/dPzF9' +
'PcAD+kgo52mqRV5dlbXL+DFrzVgFfA/BC6mGXo7fIar6D1j1hMQOgVdCd2ZdFD9yAAdASqGeQO9PEdYYPgDKgjkHuTQv4y+80LYAuDbI2Wd3IaQ7UNMh' +
'jb1VMqhtk3VsUk44NshmscKJSzSAvg72aqLRnkJ1g6hOVdgyyFzw/E5WKBnkXvIkSldbDd/Yn8hWU91aZtAZ6NKtZ8FaZtAK6MciSt8qkbPhFHkWWvVU' +
'mLYb/NlHkvrfKpDTBX2IUeeitikmNCLDirfkhnYKq3opZs4b1Aa0zVGXvCpwCAAAAAElFTkSuQmCC');

suite.canvasAppearanceTest("strokeRect", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokeRect(new Rect(5, 10, 15, 20), "blue", 4);
    painter.strokeRect(new Rect(2.5, 3.5, 5, 17), "red", 1);
    painter.strokeRect(new Rect(20, 30, 5, 7), "red", 1);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAkUlEQVRYhe3UQQqEMBBE0TpajlY3y9FqViOO9MJQkUS' +
'mPvTGhf1AWiD9SwJUzWrXUYUJcKQA3VTcSfXs/gQY4Czg7TcEGGCAAb4eWM02QH9JgO6SAN0lAbpLlgCd2RDY0EVQBCWAp2lbAAmqo12BXQC3ARL8+cR' +
'f6CSgV4UJcKQA3c5X+9AVewloF9zs/2Aa7gP137GCEm+UmAAAAABJRU5ErkJggg==');

suite.canvasAppearanceTest("strokeCircle", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokeCircle(new Point(5, 10), 15, "blue", 3);
    painter.strokeCircle(new Point(20, 13), 5, "green", 1);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABdklEQVRYhe2XMUtCURSAP2pqsSkoLJwC/0OzDS9rT2i' +
'LVolwelCXcFGHpvwB/QYbw8WpocnBUUyEGl0TT8O7wrV3pRD03uB+cJb74N2PezjnngtLIUWQKYjoeFnuPytFioaggNy7NrIgZUNwArLv2siCdAzJR9c' +
'2FiQyBMeubRYgXUMycm1jQWqGYNO1jYW5Ymm7tklzcXxF6US42RMqO18oWig8SbWiwd3GO4WKsN0Xsq8PKOooBigaruUiFAPOT/OpSq6S1ZIOTzJJZR3' +
'EFOwZ3+soWi4FR8TkFhZJlRwK5YOgvc3E5FCMXArOUmxv1B6kOCLe+iQzTF91XhQJwNnlkOsDoVARdt+edFo9aTOz4jh8FkrRlNvNDxQjTxq11wOr1yP' +
'/XM8TkD5I1rUVejDtWOSOVr1xVzfasr6yMjryeq32o88ZaV3LyaU2/i0may6IP4uNk0fR2l9uEiX3p7STSUTGOnp6renpOyMQCAQCgUDgH/ANRQswZ2g' +
'MMfAAAAAASUVORK5CYII=');

suite.canvasAppearanceTest("fillCircle", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.fillCircle(new Point(5, 10), 15, "blue");
    painter.fillCircle(new Point(20, 13), 5, "green");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAA/0lEQVRYhe3WIWtCYRSH8ScsGMyXpYFZ65phLM4yLIp' +
'pwTAVsfgBXr+DWBZkcR9ADGbBbtgnsFgWjX+D9wZFFLx4PZPzwEm3/Lgv7+EFpBQzARW5bqmAAs1AD5aBAnWtA+egJ8tAgZrWgT/WgStQwTJQoFe7wGg' +
'pqo0vAk0CJTvA3J94/xCBwxkTyN8e+NY5hktmeFtgtDyFSybtcacAPo/OAwe0HPh/jxiJStvwJUnWTK26trtmdtMjUIqXtLFFbfzBavrJ/wt6vDLuYuB' +
'3Bn/uIuAC1ANFGeEANAVtTqA28UX4BOUyhO0h86AXUB3Uj6cOKu++eZ7neZ7neXfaFuFxi8XufliHAAAAAElFTkSuQmCC');

suite.canvasAppearanceTest("printText", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokeRect(new Rect(4.5, 2.5, 100, 100), "black", 1); // visual guide
    painter.strokeRect(new Rect(2.5, 14.5, 100, 100), "black", 1); // visual guide
    painter.printText("Blye", new Point(5, 3), "blue", 14, "monospace");
    painter.printText("Key\nReD", new Point(3, 15), "red", 10, "Helvetica");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABqUlEQVRYhe2Vu7WDMAyGNVM6z+E+MzBARmCBuwF9VqB' +
'mCJqMoRTIRLYlx8GPS4HO8QH8/PglWQCX1Tc8WRMBc/7jDoBI7ZH9+xWMDtwP580ooL0BAQgyOBhfwvSzAKIBwEWYrgDiy3c//tE328PzjrD3d8DAxeJ' +
'0DdAA4DPoW/x3HjL4yIVMKSjEYcrF+PzMx/um4j4mxXhWgqZiUIBJApoPVKhOvkt/AVw2oFxAvoarB0DqHkqu1DXDXbQI41qWa/Eb7iGsFwFrmqRe4Y4' +
'1N4szuWCnes0I4WGKazEiwG0OOwEmBJhrqVBiESDBDf8Jxc0DlOCoz/lsor4ZASy9D66/KSADsQzOO5zmWGoRbDNAAhvcgQxoFCJ/pLGV1q6t4HZAIUl' +
'Weg4OKFq4wc/aeGtAi35ccgWd0k75W1PA4PnLQtvjKjoESK73EqqVHVawl6GLt6Al7zVlTRM1EQHsFCdJ8m7j9yDra5IwXwGVSiIBji1KZNLFOZWEjal' +
'3ZjGgUzCsDFol6a4gdzFXTVPlDDE4sZobVZKuWRw8T2cXYKldgKV2AZbaKQHfHQUyx/sw+H8AAAAASUVORK5CYII=',
    3000); // Text rendering differs quite a bit from system to system... hard to test it effectively.

suite.canvasAppearanceTest("printCenteredText", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.printCenteredText("amanaplanaXanalpanama", new Point(20, 20), "blue", 10, "Helvetica", new Point(0.5, 0.5));
    painter.printCenteredText("amanaplanaXanalpanama", new Point(20, 20), "red", 8, "Helvetica", new Point(0.5, 0.5));
    painter.fillCircle(new Point(20, 20), 2, "green"); // visual guide

    painter.printCenteredText("racecar", new Point(20, 10), "red", 8, "Helvetica", new Point(0, 0.5));
    painter.printCenteredText("racecar", new Point(20, 10), "green", 8, "Helvetica", new Point(1, 0.5));
    painter.printCenteredText("racecar", new Point(20, 10), "blue", 8, "Helvetica", new Point(0.5, 0));
    painter.printCenteredText("racecar", new Point(20, 10), "black", 8, "Helvetica", new Point(0.5, 1));
    painter.fillCircle(new Point(20, 10), 2, "yellow"); // visual guide
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAD4klEQVRYhe2WXWgcVRTHfw8FUZC+CFXwg661ShQaRhY' +
'f0lAEq8VdpDBiw0aUbpEQKnYgfjR9KJOHWCXTFTSsoRAG2S4ONlDXbiFRaFCGKluTzUvZfQokFAysUFIQ+nZ8mHt3745bJaZCkfnDZefcc8+9v3v2zrk' +
'DiRIl2paGgHlA1LMYzynD3h+zUz388Xhz7m0BFtVzSv3uBz5U/RpsXtkarNjDH483594W4JABqDOgAVPG2HnDP9/DH4835/4buTi4WLgILsIEdtt+HSH' +
'FOC4We5TfosCzfEcaIY/g4nA/rR37+C17DpHTnBMIR0GK8LmAPAnyFDQErK9BPgU5CoWXYVxAVLNU07Yt4ICLh0tggIW4BLhYpBjnFa7iErCHEiA8xk1' +
'2ckFtL8rIAF8531AXQUSQ6WNsmP6jUDgGPwLyKNSfgAtfQrMAVw2wQDVb2aGA1QF0sYyshu2MmsAdv2X4PVycsz9T0oBylpKiMzPiKYD2PApC+8Mefqs' +
'7g9Hi6x0gcUBCEGFv1W/PdWBiFcRq24OT/n1vDBWy2UuSzV6S8wx7pv8Uk/4oxcUOizif8NHNPq63IrsNFAgRh8C6QAgugQLTGemcyUOOsPvKGgAjVuQ' +
'fnPR55ttrPBcIr+UbvHVwgZ1rqzy8sgxinWfY28fKMkhwhpOVJSzpp775PQcXAOawZQxP3qR0cRcbC0YGAwWmbUfA+4c3SJyoQVfGEA8kiPraY0PDH/b' +
'wx+ONuf+1ugBDo08D2qpvvQdQ3B+Pv+uAXnd2wDxTsQz18sfi7wrgPSh1OLe4M/EucvgPfagFvGmO39pqhnqureqTrke2HqRa1xsVr/Kmnx23C6WnH7z' +
'93iE+vk5fC2TLcxitzUSZXNNjTCyWpE7/poBTJeMP8tMKiNjMyTTHb6kg512+CPV4kFAt5DHBsC5VfQNvh2rzFoCO8RiTCU6vCtg10pUeazgCjsnELPk' +
'bujjW6d/8lee9Khn/BX7Z0LubJX+jRroyw8hUntmGgu26JXDJacB3DjxyWQPGbhIvz2zjMq9+UCNdia9RJeNXyfgmE2VyTYfPxGJJAo6IHhT9TdG5KJN' +
'r1khXBGydjZABAZEqGV/A+/0B0v7eh4Qjh08I0TdedBPAFO8v6wzazMkMI1M10pX4Gmoux2TiB15aVNeK5Ci3NGCZXFPfkVd4ca1GunKSM5VJTvk6GwK' +
'ywa6GuqJkhpEpgCoZXx0XT0DWeHxVjfFylFsaML5GlYxfZHTRZELvyqhRTlRgdS2DTtHtqnXm+PCvb6x4qv9OMXdco4tJ7dLeSjn4r3UvMiVKlChRokS' +
'JEv1P9ScqOR/fADuUiwAAAABJRU5ErkJggg==',
    3000); // Text rendering differs quite a bit from system to system... hard to test it effectively.

suite.canvasAppearanceTest("strokeGrid", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokeGrid(new Rect(2.5, 4.5, 5, 7), 3, 2, "red", 1);
    painter.strokeGrid(new Rect(20, 20, 10, 10), 2, 1, "blue", 2);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAYklEQVRYhe3WsQkAIAxE0dt/KUeLC1h5pyTwH6QJFr8' +
'KSkATJa2S6nLWj8BK7uIIdBHoGhHozJfA5C6OQBeBrgmBvX8zOdY5PUzruGeByXdRBLoIdBHoGhPY9lC/iAQAtLYBSqaxXIyuGfwAAAAASUVORK5CYII' +
'=');
