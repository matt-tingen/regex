const test = require('ava');
const sinon = require('sinon');
const CharacterStream = require('./CharacterStream.js');
const TokenStream = require('./TokenStream.js');
const Parser = require('./Parser.js');

// Macros / Helpers
const ast = {
  char: value => ({ type: 'char', value }),
  str: chars => chars.split('').map(ast.char),
  group: (...bodyNodes) => ({ type: 'group', body: ast.seq(...bodyNodes) }),
  class: chars => ({ type: 'alt', values: ast.str(chars) }),
  seq: (...values) => ({ type: 'seq', values }),
  rep: (min, max, value) => ({ type: 'rep', min, max, value }),
};

const parserFromString = input => new Parser(new TokenStream(new CharacterStream(input)));

function testParsing(t, input, ...nodes) {
  const parser = parserFromString(input);
  const sequence = ast.seq(...nodes);
  t.deepEqual(parser.parse(), sequence);
}
testParsing.title = (providedTitle, input, type) => providedTitle || `Parses ${input}`;

function parsingThrows(t, input) {
  const parser = parserFromString(input);
  t.throws(parser.parse.bind(parser));
}
parsingThrows.title = (providedTitle, input) => providedTitle || `Croaks on ${input}`;

test(testParsing, 'abc', ...ast.str('abc'));
test(testParsing, '\\[abc\\]', ...ast.str('[abc]'));

test(testParsing, '[a]', ast.class('a'));
test(testParsing, '[abc]', ast.class('abc'));
test(testParsing, '[a+]', ast.class('a+'));
test(testParsing, '[(a)]', ast.class('(a)'));
test(testParsing, '[[]', ast.class('['));
test(testParsing, '[\\]]', ast.class(']'));

test(testParsing, '(a)', ast.group(ast.char('a')));
test(testParsing, '(abc)', ast.group(...ast.str('abc')));

test(testParsing, 'a?', ast.rep(0, 1, ast.char('a')));
test(testParsing, 'a*', ast.rep(0, Infinity, ast.char('a')));
test(testParsing, 'a+', ast.rep(1, Infinity, ast.char('a')));

test(testParsing, '(abc)?', ast.rep(0, 1, ast.group(...ast.str('abc'))));
test(testParsing, '[abc]?', ast.rep(0, 1, ast.class('abc')));
test(testParsing, '[c?]', ast.class('c?'));
test(testParsing, '(c?)', ast.group(ast.rep(0, 1, ast.char('c'))));
test(testParsing, 'abc+', ...ast.str('ab'), ast.rep(1, Infinity, ast.char('c')));
test(testParsing, '(abc?)', ast.group(...ast.str('ab'), ast.rep(0, 1, ast.char('c'))));

test(parsingThrows, ')');
test(parsingThrows, ']');
test(parsingThrows, '(');
test(parsingThrows, '[');
test(parsingThrows, '(abc');
test(parsingThrows, '[abc');
test(parsingThrows, '[]');
test(parsingThrows, '()');
test(parsingThrows, '+');
test(parsingThrows, 'c++');