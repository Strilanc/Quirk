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

import {DetailedError} from "../base/DetailedError.js"
import {seq} from "../base/Seq.js"

/**
 * @param {!Array.<!String>} tokens
 * @returns {!Array.<!String>}
 * @private
 */
function _mergeScientificFloatTokens(tokens) {
    tokens = [...tokens];
    for (let i = tokens.indexOf('e', 1); i !== -1; i = tokens.indexOf('e', i + 1)) {
        let s = i - 1;
        let e = i + 1;
        if (!tokens[s].match(/[0-9]/)) {
            continue;
        }
        if ((tokens[e] + '').match(/[+-]/)) {
            e += 1;
        }

        if ((tokens[e] + '').match(/[0-9]/)) {
            e += 1;
            tokens.splice(s, e - s, tokens.slice(s, e).join(''));
            i -= 1;
        }
    }
    return tokens;
}

/**
 * @param {!String} text
 * @returns {!Array.<!String>}
 * @private
 */
function _tokenize(text) {
    let tokens = seq(text.toLowerCase().split(/\s/)).
        flatMap(part => seq(part).
            segmentBy(e => {
                if (e.trim() === '') {
                    return " ";
                }
                if (e.match(/[\.0-9]/)) {
                    return "#";
                }
                if (e.match(/[_a-z]/)) {
                    return "a";
                }
                return NaN; // Always split.
            }).
            map(e => e.join(''))).
        filter(e => e.trim() !== '').
        toArray();

    return _mergeScientificFloatTokens(tokens);
}

/**
 * @param {!string} token
 * @param {!Map.<!string, T|!string|!number>} tokenMap
 * @returns {!string|T|!{unary_action: undefined|!function(T):T, binary_action: undefined|!function(T, T): T}}
 * @template T
 * @private
 */
function _translate_token(token, tokenMap) {
    if (token.match(/[0-9]+(\.[0-9]+)?/)) {
        return parseFloat(token);
    }

    if (tokenMap.has(token)) {
        return tokenMap.get(token);
    }

    throw new DetailedError("Unrecognized token", {token});
}

/**
 * Parses a value from an infix arithmetic expression.
 * @param {!string} text
 * @param {!Map.<!string, T|!string|!number>} tokenMap
 * @returns {T}
 * @template T
 */
function parseFormula(text, tokenMap) {
    let tokens = _tokenize(text).map(e => _translate_token(e, tokenMap));

    // Cut off trailing operation, so parse fails less often as users are typing.
    if (tokens.length > 0 && tokens[tokens.length - 1].priority !== undefined) {
        tokens = tokens.slice(0, tokens.length - 1);
    }

    let ops = [];
    let vals = [];

    // Hack: use the 'priority' field as a signal of 'is an operation'
    let isValidEndToken = token => token !== "(" && token.priority === undefined;
    let isValidEndState = () => vals.length === 1 && ops.length === 0;

    let apply = op => {
        if (op === "(") {
            throw new DetailedError("Bad expression: unmatched '('", {text});
        }
        if (vals.length < 2) {
            throw new DetailedError("Bad expression: operated on nothing", {text});
        }
        let b = vals.pop();
        let a = vals.pop();
        vals.push(op.f(a, b));
    };

    let closeParen = () => {
        while (true) {
            if (ops.length === 0) {
                throw new DetailedError("Bad expression: unmatched ')'", {text});
            }
            let op = ops.pop();
            if (op === "(") {
                break;
            }
            apply(op);
        }
    };

    let burnOps = w => {
        while (ops.length > 0 && vals.length >= 2 && vals[vals.length - 1] !== undefined) {
            let top = ops[ops.length - 1];
            if (top.w === undefined || top.w < w) {
                break;
            }
            apply(ops.pop());
        }
    };

    let feedOp = (couldBeBinary, token) => {
        // Implied multiplication?
        let mul = tokenMap.get("*");
        if (couldBeBinary && token.binary_action === undefined && token !== ")") {
            burnOps(mul.priority);
            ops.push({f: mul.binary_action, w: mul.priority});
        }

        if (couldBeBinary && token.binary_action !== undefined) {
            burnOps(token.priority);
            ops.push({f: token.binary_action, w: token.priority});
        } else if (token.unary_action !== undefined) {
            burnOps(token.priority);
            vals.push(undefined);
            ops.push({f: (a, b) => token.unary_action(b), w: Infinity});
        } else if (token.binary_action !== undefined) {
            throw new DetailedError("Bad expression: binary op in bad spot", {text});
        }
    };

    let wasValidEndToken = false;
    for (let token of tokens) {
        feedOp(wasValidEndToken, token);
        wasValidEndToken = isValidEndToken(token);

        if (token === "(") {
            ops.push("(");
        } else if (token === ")") {
            closeParen();
        } else if (wasValidEndToken) {
            vals.push(token);
        }
    }

    burnOps(-Infinity);

    if (!isValidEndState()) {
        throw new DetailedError("Incomplete expression", {text});
    }

    return vals[0];
}

export {parseFormula};
