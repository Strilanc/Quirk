//import { Suite, assertThat, fail } from "test/TestUtil.js"
//import Painter from "src/ui/Painter.js"
//import Point from "src/base/Point.js"
//import Rect from "src/base/Rect.js"
//import equate from "src/base/Equate.js"
//
//let suite = new Suite("Painter");
//
//suite.canvasAppearanceTest("clear", 20, 20, canvas => {
//    let painter = new Painter(canvas);
//    painter.clear('#123456');
//}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAHklEQVQ4jWMQMgn7T03MMGrgqIGjBo4aOGrgSDUQACM' +
//'egk9y1eLzAAAAAElFTkSuQmCC');
//
//suite.canvasAppearanceTest("strokeLine", 40, 40, canvas => {
//    let painter = new Painter(canvas);
//    painter.strokeLine(new Point(5, 10), new Point(32, 35), "blue", 3);
//    painter.strokeLine(new Point(30, 5), new Point(3, 20), "red", 1);
//}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABoUlEQVRYhe3XL0gDYRjH8W8wDGay2dbWBINhYLOtKQi' +
//'zrC2paWk2EcaaQTBpGwbXBgsm29qWDMKaQRBBRFDB4M9w5zwfzs3JtufAfcu1uw/vvc/9gVmz/mGCOW9DbIKcoCXoeFu+JcgITgS3gm1vTz9BSnAgUHh' +
//'MeZv6CbbDFTsRZMZ9+iro9I+wDUE33Gu5McMAVAnuiARqjADrD4BgYwKw/qUOI0CBLkDpATCPAdC+QbZBiwbmPQAqG+QVKBviJjkAIyFLUeQWZ/dPzF9' +
//'PcAD+kgo52mqRV5dlbXL+DFrzVgFfA/BC6mGXo7fIar6D1j1hMQOgVdCd2ZdFD9yAAdASqGeQO9PEdYYPgDKgjkHuTQv4y+80LYAuDbI2Wd3IaQ7UNMh' +
//'jb1VMqhtk3VsUk44NshmscKJSzSAvg72aqLRnkJ1g6hOVdgyyFzw/E5WKBnkXvIkSldbDd/Yn8hWU91aZtAZ6NKtZ8FaZtAK6MciSt8qkbPhFHkWWvVU' +
//'mLYb/NlHkvrfKpDTBX2IUeeitikmNCLDirfkhnYKq3opZs4b1Aa0zVGXvCpwCAAAAAElFTkSuQmCC');
//
//suite.canvasAppearanceTest("strokeRect", 40, 40, canvas => {
//    let painter = new Painter(canvas);
//    painter.strokeRect(new Rect(5, 10, 15, 20), "blue", 4);
//    painter.strokeRect(new Rect(2.5, 3.5, 5, 17), "red", 1);
//    painter.strokeRect(new Rect(20, 30, 5, 7), "red", 1);
//}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAkUlEQVRYhe3UQQqEMBBE0TpajlY3y9FqViOO9MJQkUS' +
//'mPvTGhf1AWiD9SwJUzWrXUYUJcKQA3VTcSfXs/gQY4Czg7TcEGGCAAb4eWM02QH9JgO6SAN0lAbpLlgCd2RDY0EVQBCWAp2lbAAmqo12BXQC3ARL8+cR' +
//'f6CSgV4UJcKQA3c5X+9AVewloF9zs/2Aa7gP137GCEm+UmAAAAABJRU5ErkJggg==');
