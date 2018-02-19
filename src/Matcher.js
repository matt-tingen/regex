class Matcher {
  constructor(ast, input) {
    this.ast = ast;
    this.fullInput = input;

    this.parents = new Map();
    this.parents.set(this.ast, null);
    // this.node = this.ast;
    this.index = 0;

    this.matchNode = this.matchNode.bind(this);
  }

  get input() {
    return this.fullInput.slice(this.index);
  }

  eof() {
    return this.index === this.fullInput.length;
  }

  backtrack(destination) {
    this.index = destination;
  }

  match() {
    return this.matchNode(this.ast) && this.eof();
  }

  isOptional(node) {
    return node.type === 'rep' && node.min === 0;
  }

  matchNode(node) {
    const { type } = node;
    if (type === 'seq') {
      return this.matchSequence(node);
    } else if (type === 'group') {
      return this.matchGroup(node);
    } else if (this.eof() && !this.isOptional(node)) {
      return false;
    } else if (type === 'char') {
      return this.matchChar(node);
    } else if (type === 'rep') {
      return this.matchRepetition(node);
    } else if (type === 'alt') {
      return this.matchAlternation(node);
    } else {
    }
  }

  matchChar({ value }) {
    const match = this.input[0] === value;
    if (match) {
      this.index++;
    }
    return match;
  }

  matchRepetition({ min, max, value }) {
    let repeats = 0;
    let match = true;
    while (match && !this.eof() && repeats !== max) {
      match = this.matchNode(value);
      if (match) {
        repeats++;
      }
    }

    return repeats >= min;
  }

  matchSequence({ values }) {
    return values.every(this.matchNode);
  }

  matchAlternation({ values }) {
    return values.some(this.matchNode);
  }

  matchGroup({ body }) {
    const bookmark = this.index;
    const match = this.matchSequence(body);

    if (!match) {
      this.backtrack(bookmark);
    }

    return match;
  }
}

module.exports = Matcher;
