const test = require('ava');
const sinon = require('sinon');
const Regex = require('./Regex');

function testMatch(t, input, pattern) {
  const regex = new Regex(pattern);
  t.true(regex.match(input));
}
testMatch.title = (providedTitle, input, pattern) =>
  providedTitle || `${pattern} matches ${input || 'empty string'}`;

function testMiss(t, input, pattern) {
  const regex = new Regex(pattern);
  t.false(regex.match(input));
}
testMiss.title = (providedTitle, input, pattern) =>
  providedTitle || `${pattern} does not match ${input || 'empty string'}`;

test(testMatch, 'this is a test', 'this is a test');
test(testMatch, 'abbbab', '(ab+)*');
test(testMatch, '', '(ab+)*');
test(testMiss, 'aab', '(ab+)*');

test('Regex is reusable', t => {
  const regex = new Regex('a*');

  t.true(regex.match(''));
  t.true(regex.match('a'));
  t.true(regex.match(''));
  t.true(regex.match('aaaaa'));
  t.false(regex.match('b'));
  t.true(regex.match('a'));
});

test('Accepts RegExp as constructor argument', t => {
  const regex = new Regex(/a+/);
  t.true(regex.match('aa'));
});
