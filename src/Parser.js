const repeatData = {
  '?': { min: 0, max: 1 },
  '*': { min: 0, max: Infinity },
  '+': { min: 1, max: Infinity },
};

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
  }

  parse() {
    const values = [];
    while (!this.eof()) {
      values.push(this.parseExpression());
    }
    return { type: 'group', values };
  }

  peekType() {
    return this.peek().type;
  }

  isRepeat({ type, value }) {
    return type === 'punc' && value in repeatData;
  }

  parseExpression() {
    const { type, value } = this.peek();
    let expression;

    if (type === 'char') {
      expression = this.parseChar();
    } else if (value === '[') {
      expression = this.parseCharacterClass();
    } else if (value === '(') {
      expression = this.parseGroup();
    } else if (value === '.') {
      expression = this.parseDot();
    } else {
      this.croakInvalidPunctuation();
    }

    if (!this.eof() && this.isRepeat(this.peek())) {
      expression = this.parseRepeat(expression);
    }

    return expression;
  }

  croakInvalidPunctuation(expectation) {
    const found = `"${this.peek().value}"`;
    const message = expectation
      ? `Expected ${expectation}, found ${found}.`
      : `Encountered unexpected character ${found}.`;
    this.croak(message);
  }

  croakUnexpectedEnd(expectation) {
    const message = `Expected ${expectation}, found EOF.`;
    this.croak(message);
  }

  parseRepeat(expression) {
    const { value } = this.next();
    const { min, max } = repeatData[value];
    return {
      type: 'rep',
      min,
      max,
      value: expression,
    };
  }

  parseChar() {
    // A char token is exactly the same as a char AST node.
    return this.next();
  }

  // Because there's never a reason to treat a char token specially, there would never be a reason
  // to see if the next token is a char with a particular value. Therefore, this only checks for
  // punc.
  comparePeek(value) {
    const token = this.peek();
    return token.type === 'punc' && token.value === value;
  }

  validateRange({ from, to }) {
    if (from.charCodeAt(0) >= to.charCodeAt(0)) {
      this.croak('Encountered non-positive length character range.');
    }
  }

  parseCharacterClass() {
    // Consume the opening bracket.
    this.next();

    const values = [];
    let prev = null;

    while (!this.eof() && !this.comparePeek(']')) {
      if (prev && prev.type === 'char' && this.comparePeek('-')) {
        prev = { type: 'range', from: prev.value };
        // Consume the dash.
        this.next();
      } else {
        const { value } = this.next();

        if (prev && prev.type === 'range') {
          prev.to = value;
          this.validateRange(prev);
          values.push(prev);
          prev = null;
        } else {
          if (prev) {
            values.push(prev);
          }

          // Within a character class, punctuation other than closing bracket and significant dashes
          // are demoted to a regular characters.
          prev = { type: 'char', value };
        }
      }
    }

    if (prev) {
      if (prev.type === 'range') {
        values.push({ type: 'char', value: prev.from });
        values.push({ type: 'char', value: '-' });
      } else {
        values.push(prev);
      }
    }

    if (this.eof()) {
      this.croakUnexpectedEnd(']');
    } else if (!values.length) {
      this.croak('Encountered empty character class.');
    }

    // Consume the closing bracket.
    this.next();

    return {
      type: 'alt',
      values,
    };
  }

  parseGroup() {
    // Consume the opening parenthesis.
    this.next();

    const values = [];
    while (!this.eof() && !this.comparePeek(')')) {
      values.push(this.parseExpression());
    }

    if (this.eof()) {
      this.croakUnexpectedEnd(')');
    } else if (!values.length) {
      this.croak('Encountered empty group.');
    }

    // Consume the closing parenthesis.
    this.next();

    return {
      type: 'group',
      values,
    };
  }

  parseDot() {
    // Consume the dot.
    this.next();

    return { type: 'dot' };
  }

  peek() {
    return this.tokens.peek();
  }

  next() {
    return this.tokens.next();
  }

  eof() {
    return this.tokens.eof();
  }

  croak(msg) {
    return this.tokens.croak(msg);
  }
}

module.exports = Parser;
