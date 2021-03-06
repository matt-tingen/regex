const test = require('ava');
const sinon = require('sinon');
const CharacterStream = require('./CharacterStream');
const TokenStream = require('./TokenStream');
const Parser = require('./Parser');
const { ast } = require('./testUtil');

// Macros / Helpers
const parserFromString = input => new Parser(new TokenStream(new CharacterStream(input)));

function testParsing(t, input, ...nodes) {
  const parser = parserFromString(input);
  const root = ast.group(...nodes);
  t.deepEqual(parser.parse(), root);
}
testParsing.title = (providedTitle, input, type) => providedTitle || `Parses ${input}`;

function parsingThrows(t, input) {
  const parser = parserFromString(input);
  t.throws(parser.parse.bind(parser));
}
parsingThrows.title = (providedTitle, input) => providedTitle || `Croaks on ${input}`;

test(testParsing, 'abc', ...ast.str('abc'));
test(testParsing, '\\[abc\\]', ...ast.str('[abc]'));

test(testParsing, '.', ast.dot());

test(testParsing, '[a]', ast.class('a'));
test(testParsing, '[abc]', ast.class('abc'));
test(testParsing, '[a+]', ast.class('a+'));
test(testParsing, '[(a)]', ast.class('(a)'));
test(testParsing, '[[]', ast.class('['));
test(testParsing, '[\\]]', ast.class(']'));
test(testParsing, '[-]', ast.class('-'));
test(testParsing, '[abc-]', ast.class('abc-'));
test(testParsing, '[-abc]', ast.class('-abc'));

test(testParsing, '[a-z]', ast.alt(ast.range('a', 'z')));
test(testParsing, '[0-9]', ast.alt(ast.range('0', '9')));
test(testParsing, '[a0-9b]', ast.alt(ast.char('a'), ast.range('0', '9'), ast.char('b')));
test(testParsing, '[a-z0-9]', ast.alt(ast.range('a', 'z'), ast.range('0', '9')));
test(testParsing, '[ --]', ast.alt(ast.range(' ', '-')));
test(testParsing, '[ --a]', ast.alt(ast.range(' ', '-'), ast.char('a')));
test(testParsing, '[ -~]', ast.alt(ast.range(' ', '~')));

test(testParsing, '(a)', ast.group(ast.char('a')));
test(testParsing, '(abc)', ast.group(...ast.str('abc')));

test(testParsing, '.?', ast.rep(0, 1, ast.dot()));
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
test(parsingThrows, '[z-a]');
test(parsingThrows, '[a-a]');
test(parsingThrows, '()');
test(parsingThrows, '+');
test(parsingThrows, 'c++');

// TODO: assertions about error messages
