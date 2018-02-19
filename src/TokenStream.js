class TokenStream {
  constructor(characterStream) {
    this.chars = characterStream;
    this.token = null;

    this.escape = '\\';
    this.punctuation = ['[', ']', '(', ')', '+', '*', '?', '.'];

    this.escaped = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      v: '\v',
      '0': '\0',
    };
  }

  checkNext() {
    if (this.chars.eof()) {
      return null;
    }
    return this.checkPunctuation() || this.checkChar();
  }

  getFromEscapedChar(escaped) {
    return this.escaped[escaped] || escaped;
  }

  checkChar() {
    const raw = this.chars.next();
    const isEscape = raw === this.escape;
    if (this.eof() && isEscape) {
      this.croak('Empty escape encountered');
    }
    const char = isEscape ? this.getFromEscapedChar(this.chars.next()) : raw;

    return { type: 'char', value: char };
  }

  checkPunctuation() {
    if (this.punctuation.includes(this.chars.peek())) {
      return { type: 'punc', value: this.chars.next() };
    }
    return null;
  }

  next() {
    // Use the saved token from peek(), if available.
    const token = this.token || this.checkNext();
    this.token = null;
    return token;
  }

  peek() {
    // As an optimization, the peeked token is preserved for next()
    return (this.token = this.token || this.checkNext());
  }

  eof() {
    return !this.token && this.chars.eof();
  }

  croak(msg) {
    return this.chars.croak(msg);
  }
}

module.exports = TokenStream;
