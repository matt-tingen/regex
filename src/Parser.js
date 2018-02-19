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
    const sequence = [];
    while (!this.eof()) {
      sequence.push(this.parseExpression());
    }
    return { type: 'seq', values: sequence };
  }

  peekType() {
    return this.peek().type;
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
    } else {
      this.croakInvalidPunctuation();
    }

    if (!this.eof() && this.peekType() === 'rep') {
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

  parseCharacterClass() {
    // Consume the opening bracket
    this.next();

    const chars = [];

    // Until the character class is closed, punctuation other than a closing bracket is demoted to a
    // regular character.
    while (!this.eof() && !this.comparePeek(']')) {
      chars.push(this.next().value);
    }
    if (this.eof()) {
      this.croakUnexpectedEnd(']');
    } else if (!chars.length) {
      this.croak('Encountered empty character class.');
    }

    // Consume the closing bracket
    this.next();

    const values = chars.map(value => ({ type: 'char', value }));

    return {
      type: 'alt',
      values,
    };
  }

  parseGroup() {
    // Consume the opening parenthesis
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

    // Consume the closing parenthesis
    this.next();

    return {
      type: 'group',
      body: { type: 'seq', values },
    };
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
