class TokenStream {
  constructor(characterStream) {
    this.chars = characterStream;
    this.token = null;

    this.escape = '\\';
    this.punctuation = ['[', ']', '(', ')', '+', '*', '?'];

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
    return this.checkPunctuation() || this.checkString() || this.croakInvalidChar();
  }

  tokenFromBuffer(buffer, type) {
    return {
      type,
      value: buffer.join(''),
    };
  }

  atWordEnd() {
    return this.chars.eof() || this.chars.peek().match(this.whiteSpace);
  }

  croakInvalidChar(expectation) {
    const found = `"${this.chars.peek()}"`;
    const message = expectation
      ? `Expected ${expectation}, found ${found}.`
      : `Encountered unexpected character ${found}.`;
    this.croak(message);
  }

  getFromEscapedChar(escaped) {
    return this.escaped[escaped] || escaped;
  }

  checkString() {
    const buffer = [];
    let escapeNext = false;
    while (!this.eof() && (escapeNext || !this.peekPunctuation())) {
      const raw = this.chars.next();
      let char;
      if (escapeNext) {
        char = this.getFromEscapedChar(raw);
        escapeNext = false;
      } else if (raw === this.escape) {
        char = null;
        escapeNext = true;
      } else {
        char = raw;
      }
      if (char) {
        buffer.push(char);
      }
    }
    if (this.eof() && escapeNext) {
      this.croak('Empty escape encountered');
    }
    return this.tokenFromBuffer(buffer, 'str');
  }

  peekPunctuation() {
    return this.punctuation.includes(this.chars.peek());
  }

  checkPunctuation() {
    if (this.peekPunctuation()) {
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
    return this.chars.eof();
  }

  croak(msg) {
    return this.chars.croak(msg);
  }
}

module.exports = TokenStream;
