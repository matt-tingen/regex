const test = require('ava');
const sinon = require('sinon');
const TokenStream = require('./TokenStream.js');
const CharacterStream = require('./CharacterStream.js');

// Macros / Helpers
const tokenStreamFromString = input => new TokenStream(new CharacterStream(input));

function testTokenization(t, input, type, value = input) {
  ['next', 'peek'].forEach(method => {
    const tokens = tokenStreamFromString(input);
    t.deepEqual(tokens[method](), { type, value });
  });
}
testTokenization.title = (providedTitle, input, type) =>
  providedTitle || `Identifies ${input} as ${type}`;

function tokenizationThrows(t, input) {
  ['next', 'peek'].forEach(method => {
    const tokens = tokenStreamFromString(input);
    t.throws(tokens[method].bind(tokens));
  });
}
tokenizationThrows.title = (providedTitle, input) => providedTitle || `Croaks on ${input}`;

// Basic Tokenization
test(testTokenization, '[', 'punc');
test(testTokenization, ']', 'punc');
test(testTokenization, '(', 'punc');
test(testTokenization, ')', 'punc');
test(testTokenization, '+', 'punc');
test(testTokenization, '*', 'punc');
test(testTokenization, '?', 'punc');

test(testTokenization, 'a', 'str');
test(testTokenization, 'abc', 'str');
test(testTokenization, '123', 'str');
test(testTokenization, 'this is a string', 'str');
test(testTokenization, '!# -=', 'str');

// String Escapes
test('Identifies new line', testTokenization, '\\n', 'str', '\n');
test('Identifies carriage return', testTokenization, '\\r', 'str', '\r');
test('Identifies tab', testTokenization, '\\t', 'str', '\t');
test('Identifies backspace', testTokenization, '\\b', 'str', '\b');
test('Identifies form feed', testTokenization, '\\f', 'str', '\f');
test('Identifies vertical tab', testTokenization, '\\v', 'str', '\v');
test('Identifies null char', testTokenization, '\\0', 'str', '\0');
test('Identifies escaped slash', testTokenization, '\\\\', 'str', '\\');
test('Allows escaping of non-escape character', testTokenization, `\\h`, 'str', `h`);

test('Identifies escaped bracket', testTokenization, '\\[', 'str', '[');
test('Identifies escaped plus', testTokenization, '\\+', 'str', '+');

// Errors
test.failing(tokenizationThrows, 'α'); // unicode is not supported
test(tokenizationThrows, '\\'); // empty escape

test('croak throws via character stream', t => {
  const chars = new CharacterStream('abc');
  sinon.spy(chars, 'croak');
  const tokens = new TokenStream(chars);

  t.throws(() => tokens.croak('msg'));
  t.true(chars.croak.calledOnce);
  t.true(chars.croak.calledWithExactly('msg'));
});

test.failing('provides meaningful message on unicode', t => {
  const chars = new CharacterStream('α');
  sinon.spy(chars, 'croak');
  const tokens = new TokenStream(chars);
  const message = 'Encountered unicode which is not supported';

  try {
    tokens.next();
  } catch (err) {}

  t.true(chars.croak.calledOnce);
  t.true(chars.croak.alwaysCalledWithExactly(message));
});

test('provides meaningful message on empty escape', t => {
  const chars = new CharacterStream('\\');
  sinon.spy(chars, 'croak');
  const tokens = new TokenStream(chars);
  const message = 'Empty escape encountered';

  try {
    tokens.next();
  } catch (err) {}

  t.true(chars.croak.calledOnce);
  t.true(chars.croak.alwaysCalledWithExactly(message));
});

// Multiple Tokens
test('next advances index', t => {
  const tokens = tokenStreamFromString('[abc]');
  t.deepEqual(tokens.next(), { type: 'punc', value: '[' });
  t.deepEqual(tokens.next(), { type: 'str', value: 'abc' });
});

test('peek does not advance index', t => {
  const tokens = tokenStreamFromString('[abc]');
  t.deepEqual(tokens.peek(), { type: 'punc', value: '[' });
  t.deepEqual(tokens.peek(), { type: 'punc', value: '[' });
});

test("doesn't discriminate misordered parenthesis", t => {
  const tokens = tokenStreamFromString(')(');
  t.deepEqual(tokens.next(), { type: 'punc', value: ')' });
  t.deepEqual(tokens.next(), { type: 'punc', value: '(' });
});

test("doesn't discriminate misordered brackets", t => {
  const tokens = tokenStreamFromString('][');
  t.deepEqual(tokens.next(), { type: 'punc', value: ']' });
  t.deepEqual(tokens.next(), { type: 'punc', value: '[' });
});

// EOF
test('eof returns true-negative', t => {
  const tokens = tokenStreamFromString('7');
  t.false(tokens.eof());
});

test('eof returns true-positive', t => {
  const tokens = tokenStreamFromString('7');
  tokens.next();
  t.true(tokens.eof());
});

// Optimizations
test('next after peek is short-cutted', t => {
  const tokens = tokenStreamFromString('[');
  sinon.spy(tokens, 'checkPunctuation');
  tokens.peek();
  tokens.next();
  t.true(tokens.checkPunctuation.calledOnce);
});
