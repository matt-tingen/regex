const test = require('ava');
const sinon = require('sinon');
const Matcher = require('./Matcher');
const { ast } = require('./testUtil');

const patterns = {
  a: [ast.char('a')],
  '!': [ast.char('!')],
  '5': [ast.char('5')],
  ' ': [ast.char(' ')],
  abc: ast.str('abc'),
  'a?': [ast.rep(0, 1, ast.char('a'))],
  'a*': [ast.rep(0, Infinity, ast.char('a'))],
  'a+': [ast.rep(1, Infinity, ast.char('a'))],
  'abc?': [...ast.str('ab'), ast.rep(0, 1, ast.char('c'))],
  '[abc]': [ast.class('abc')],
  'a*b': [ast.rep(0, Infinity, ast.char('a')), ast.char('b')],
  '(abc)?': [ast.rep(0, 1, ast.group(...ast.str('abc')))],
  '[abc]?': [ast.rep(0, 1, ast.class('abc'))],
  '[c?]': [ast.class('c?')],
  '(a)': [ast.group(ast.char('a'))],
  '(abc)': [ast.group(...ast.str('abc'))],
  '(c?)': [ast.group(ast.rep(0, 1, ast.char('c')))],
  'abc+': [...ast.str('ab'), ast.rep(1, Infinity, ast.char('c'))],
  '(abc?)': [ast.group(...ast.str('ab'), ast.rep(0, 1, ast.char('c')))],
  '(ab+)*': [ast.rep(0, Infinity, ast.group(ast.char('a'), ast.rep(1, Infinity, ast.char('b'))))],
  'a+a': [ast.rep(1, Infinity, ast.char('a')), ast.char('a')],
  'a*aa': [ast.rep(0, Infinity, ast.char('a')), ...ast.str('aa')],
};

function checkPattern(input, pattern) {
  const nodes = patterns[pattern];
  if (!nodes) {
    throw new Error('Invalid testing pattern');
  }
  const sequence = ast.seq(...nodes);
  const matcher = new Matcher(sequence, input);
  return matcher.match();
}

function testMatch(t, input, pattern) {
  const match = checkPattern(input, pattern);
  t.true(match);
}
testMatch.title = (providedTitle, input, pattern) =>
  providedTitle || `${pattern} matches ${input || 'empty string'}`;

function testMiss(t, input, pattern) {
  const match = checkPattern(input, pattern);
  t.false(match);
}
testMiss.title = (providedTitle, input, pattern) =>
  providedTitle || `${pattern} does not match ${input || 'empty string'}`;

test(testMatch, 'a', 'a');
test(testMatch, '!', '!');
test(testMatch, '5', '5');
test(testMatch, ' ', ' ');
test(testMiss, 'b', 'a');

test(testMatch, 'abc', 'abc');
test(testMiss, 'ab', 'abc');
test(testMiss, 'abcd', 'abc');

test(testMatch, 'a', 'a?');
test(testMatch, '', 'a?');
test(testMiss, 'aa', 'a?');
test(testMiss, 'aaa', 'a?');
test(testMiss, 'b', 'a?');

test(testMatch, '', 'a*');
test(testMatch, 'a', 'a*');
test(testMatch, 'aaa', 'a*');
test(testMiss, 'b', 'a*');

test(testMatch, 'a', 'a+');
test(testMatch, 'aaa', 'a+');
test(testMiss, '', 'a+');
test(testMiss, 'b', 'a+');

test(testMatch, 'abc', 'abc?');
test(testMatch, 'ab', 'abc?');
test(testMiss, 'abcc', 'abc?');
test(testMiss, 'a', 'abc?');

test(testMatch, 'a', '[abc]');
test(testMatch, 'b', '[abc]');
test(testMatch, 'c', '[abc]');
test(testMiss, 'd', '[abc]');

test(testMatch, 'a', '(a)');
test(testMatch, 'abc', '(abc)');

test(testMatch, 'a', '[abc]?');
test(testMatch, 'b', '[abc]?');
test(testMatch, 'c', '[abc]?');
test(testMatch, '', '[abc]?');
test(testMiss, 'abc', '[abc]?');
test(testMiss, 'd', '[abc]?');

test(testMatch, 'c', '[c?]');
test(testMatch, '?', '[c?]');
test(testMiss, '', '[c?]');
test(testMiss, '[c?]', '[c?]');

test(testMatch, 'c', '(c?)');
test(testMatch, '', '(c?)');
test(testMiss, 'c?', '(c?)');

test(testMatch, 'abc', 'abc+');
test(testMatch, 'abcc', 'abc+');
test(testMatch, 'abcccccccccc', 'abc+');
test(testMiss, 'ab', 'abc+');
test(testMiss, 'abc+', 'abc+');

test(testMatch, 'aaab', 'a*b');
test(testMatch, 'ab', 'a*b');
test(testMatch, 'b', 'a*b');
test(testMiss, 'ba', 'a*b');
test(testMiss, 'abb', 'a*b');

test(testMatch, 'abc', '(abc)?');
test(testMatch, '', '(abc)?');
test(testMiss, 'ab', '(abc)?');

test(testMatch, '', '(ab+)*');
test(testMatch, 'ab', '(ab+)*');
test(testMatch, 'abbb', '(ab+)*');
test(testMatch, 'abbbab', '(ab+)*');
test(testMatch, 'ababbbb', '(ab+)*');
test(testMiss, 'aab', '(ab+)*');
test(testMiss, 'aabb', '(ab+)*');

// Backtracking
test.failing(testMatch, 'aa', 'a+a');
test.failing(testMatch, 'aa', 'a*aa');