class CharacterStream {
  constructor(input) {
    this.input = input;
    this.index = 0;
  }

  peek() {
    return this.input[this.index] || '';
  }

  next() {
    const char = this.peek();
    if (char) {
      this.index++;
    }
    return char;
  }

  eof() {
    return this.index === this.input.length;
  }

  croak(msg) {
    throw new Error(`Croaked at :${this.index} - ${msg}`);
  }
}

module.exports = CharacterStream;
