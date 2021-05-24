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

import {Suite, assertThat} from "../TestUtil.js"
import {Painter} from "../../src/draw/Painter.js"

import {Point} from "../../src/math/Point.js"
import {Rect} from "../../src/math/Rect.js"

let suite = new Suite("Painter");

suite.test("paintableArea", () => {
    let c = /** @type !HTMLCanvasElement */ document.createElement("canvas");
    c.width = 23;
    c.height = 34;
    assertThat(new Painter(c).paintableArea()).isEqualTo(new Rect(0, 0, 23, 34));
});

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("clear", 20, 20, canvas => {
    let painter = new Painter(canvas);
    painter.clear('#123456');
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAHklEQVQ4jWMQMgn7T03MMGrgqIGjBo4aOGrgSDUQACM' +
'egk9y1eLzAAAAAElFTkSuQmCC');

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("strokeRect", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokeRect(new Rect(5, 10, 15, 20), "blue", 4);
    painter.strokeRect(new Rect(2.5, 3.5, 5, 17), "red", 1);
    painter.strokeRect(new Rect(20, 30, 5, 7), "red", 1);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAkUlEQVRYhe3UQQqEMBBE0TpajlY3y9FqViOO9MJQkUS' +
'mPvTGhf1AWiD9SwJUzWrXUYUJcKQA3VTcSfXs/gQY4Czg7TcEGGCAAb4eWM02QH9JgO6SAN0lAbpLlgCd2RDY0EVQBCWAp2lbAAmqo12BXQC3ARL8+cR' +
'f6CSgV4UJcKQA3c5X+9AVewloF9zs/2Aa7gP137GCEm+UmAAAAABJRU5ErkJggg==');

//noinspection SpellCheckingInspection
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

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("fillCircle", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.fillCircle(new Point(5, 10), 15, "blue");
    painter.fillCircle(new Point(20, 13), 5, "green");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAA/0lEQVRYhe3WIWtCYRSH8ScsGMyXpYFZ65phLM4yLIp' +
'pwTAVsfgBXr+DWBZkcR9ADGbBbtgnsFgWjX+D9wZFFLx4PZPzwEm3/Lgv7+EFpBQzARW5bqmAAs1AD5aBAnWtA+egJ8tAgZrWgT/WgStQwTJQoFe7wGg' +
'pqo0vAk0CJTvA3J94/xCBwxkTyN8e+NY5hktmeFtgtDyFSybtcacAPo/OAwe0HPh/jxiJStvwJUnWTK26trtmdtMjUIqXtLFFbfzBavrJ/wt6vDLuYuB' +
'3Bn/uIuAC1ANFGeEANAVtTqA28UX4BOUyhO0h86AXUB3Uj6cOKu++eZ7neZ7neXfaFuFxi8XufliHAAAAAElFTkSuQmCC');

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("printLine_simple", 40, 40, canvas => {
    let painter = new Painter(canvas);
    let r = new Rect(5, 5, 30, 30);
    painter.strokeRect(r, "green");
    let used = painter.printLine(
        "test",
        r,
        0,
        "black",
        12,
        "monospace");
    assertThat(used).isApproximatelyEqualTo(new Rect(5, 18.5, 28, 12), 2.5);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAA1klEQVRYhe2YwQ3CMAxF/zaskVPFIB0kl06SQbhkEhY' +
'pBwo1lgkpTkmF/o96iB39/+SoPRSgqKMpIiB2W6EGMCLi0gHunlkJWHGwsapzCejNJaA3l4DeXAJ6cwnozSWgN5eA3tzXg3kHFNtzE+AZCcCsHmk8qp6' +
'W7KWlNhQ9G09Q1k8ArmI/LTWr996zIaA1iVlByfrQA3D8bPTUrhNMopOxTkOHlgD03vb8EnDCelVyavoa5YuSUb5i2/Nfv4O/EwG9IqBXGwEP/fModIB' +
'7rOC8B4pqrhsoxyh6D5LV0gAAAABJRU5ErkJggg==',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("printLine_aligned", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.clear("gray");
    let used1 = painter.printLine(
        "A",
        new Rect(0, 0, 40, 40).leftHalf(),
        0,
        "red",
        24,
        "monospace");
    let used2 = painter.printLine(
        "long",
        new Rect(0, 0, 40, 40).rightHalf(),
        1,
        "green",
        24,
        "monospace");
    assertThat(used1).isApproximatelyEqualTo(new Rect(0, 12, 14.4, 24), 2.5);
    assertThat(used2).isApproximatelyEqualTo(new Rect(20, 23.25, 20, 9), 2.5);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABYUlEQVRYhe3WoW7DMBQF0MdKzIKMwsyCzALDCg2L/QH' +
'5hfsL5cWjY4NlZUNlZWVDQ0FFd6CzV6WNmm7T7EkGV6riqjp+z8+NAGDOkdSAAizA1IACLMDUgAIswNSAAvwz4MEYUuQqx7rOA3iZbddxUIpPqxUpwnX' +
'f5wU81jX3TUMAHJTirm3zAW68J0W48Z4AuGtbvldVPsAxaAxODnyvqquWvmkdW54UODUUYWiSA/dNc/NaWfc9KcJn59ICT4vFzbsw5GDMrB9VUFT4nYp' +
'H4MtyydNiMfnFe+vjGMzbzGzgwZi7FRqU4rbrvgXU0BRIrKyGjs8EQg8fqy8QGpjPtQfO2NQZvQfs0LHDeWMOjhaWHj5iw7qFpYOLUAd3Bs6d0kf++uY' +
'ALewkMHyWQamrYRhfyq/Wzh6Y864lJiButTi09nKoQosF8lXBHGNg8gSGympoAv/phTXXFGABpk4B/jQftjpRyNhAo6oAAAAASUVORK5CYII=',
    1000); // Text rendering differs quite a bit from system to system... hard to test it effectively.

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("strokePolygon", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.strokePolygon([
        new Point(2.5, 4.5),
        new Point(22.5, 4.5),
        new Point(14.5, 13),
        new Point(4, 13)
    ], "red", 1);
    painter.strokePolygon([
        new Point(12, 10),
        new Point(39, 34),
        new Point(10, 33)
    ], "blue", 3);
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACYElEQVRYhe2XPWgUURSFv0IJAUGMXYIWUfEHixSJKQT' +
'TRYjiDyRgoeBWoqlE2EJSJCCIRFtjJYtNEAkIajCNiLFxIzbBYmGRoBERCStoLNIci3kJl5fMuJt5M7HYC6/Zd++539y9c9iFZjTjPwjBNoEyOP0hIec' +
'FXQF0jgt+C86H4LLCk4JLCRnddWh0Cb4LLoZkWxW/KbiTkDEAKibUHxB8ElwJDucanBG8SMi47FZrfIPadrci1zOBc006BZ8TMopm/0umbqfgnWAkMzj' +
'T7Kdgd8ztXe8lnT7F812CV4LbmcM5wLeCvpjbR76LHKRSK3OslAucA3wgeCwY9c8RPlZj7G4B1Jsn5Do4wWg7X76tQg3y5LUHuQw6nRtkDPqiAdoTAWn' +
'ZAy1sJeCKAWlxn/W6r9hCxnpllnBtBqDm3XWC5jzIdV6ZNeBh07yywf0O0LQHWcoTsM80nk3IK/leGcFnDzhkmk79I3fcg5yL1iBbwGHTcKKO/KIHuZC' +
'xV2rMNBurs6aQo1dqwjQabqAuL6/UlGkw1GBtHl6pWSMe82MisT5rr1TFCB/apEaWXqmaEW1LqVUK7JVqMWIr6eDWNEN6pfYaocUwgBDQK9VtRD6EA4R' +
'AXqkBI/AyLCAE8Mq1v5sCvQdddU9+AXQW1A86AeoBHQXtA3VEL5Na6+yRxis1CPrlFTd6/oCWQF9BVdA8qAx6A5oBPQU9A/3YpFdqe0rAFKfu0C3QPdB' +
'90EPQpHvyGTeJsptM1U1qyU0uL8A0oVa3kx2g/W5Xe9zungSdcztdAF0D3QCNRENpRjO2Nv4CO0/DOtNuBZYAAAAASUVORK5CYII=');

//noinspection SpellCheckingInspection
suite.canvasAppearanceTest("fillPolygon", 40, 40, canvas => {
    let painter = new Painter(canvas);
    painter.fillPolygon([
        new Point(2.5, 4.5),
        new Point(22.5, 4.5),
        new Point(14.5, 13),
        new Point(4, 13)
    ], "red");
    painter.fillPolygon([
        new Point(12, 10),
        new Point(39, 34),
        new Point(10, 33)
    ], "blue");
}, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABgklEQVRYhe3VIUgDUQDG8X9YGKIYjIIOBBHB4owTjKJ' +
'YxKIomATBMLAIKwvK4ppjRcPQIpoc2AazCoLBOlZETBYxLHyWQx5Dz2333jvDffCFu/Tj7vE9SJLkn0SQExQtdsY2cFMgSy0JUraBWUu4smDYKi4Ajgh' +
'eIuIqgjHrOAPZiIA7E4w7wwXA6oC4S8GUU1wAPAyDfJJWnnL3+xvBrHNcAFwLA7bICKQNrtQhJUFdMO8FFwCnw4BNFr8fV6i/HlPY8YbrLVrvMt+CcnG' +
'rjGjvhw97D1qNWxZEhV/+/hNoK24doHLIEW2D9uMG1v6YxHfQUZzAux63uwQajQP40McFcwqa8A1s93kLXoDmfOGGQB8DXNW+tlKTA+B8bqWyEYA+tlL' +
'LEYGut1LbFoAut1J5S0BXW6kTy0DbW6mqA6Cwt5W6dgQUdrZSTYdAEX0r9ewYKKJtpd48AEW0rVQalDG6AFoyumv0AFQ0WgGdB62BGkYfQS2jHVB+QGS' +
'SJEn+Vb4Ae+TXYBV8z6IAAAAASUVORK5CYII=');
