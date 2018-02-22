class Matcher {
  constructor(ast, input) {
    this.ast = ast;
    this.fullInput = input;
    this.index = 0;

    this.stack = [];
    this.matchNode = this.matchNode.bind(this);
  }

  get input() {
    return this.fullInput.slice(this.index);
  }

  croak(msg) {
    throw new Error(msg);
  }

  eof() {
    return this.index === this.fullInput.length;
  }

  // bookmark() {
  //   const previous = this.index;
  //   return () => {
  //     this.index = previous;
  //   };
  // }

  // consume(node) {
  //   this.pushState(node);
  //   this.index++;
  // }

  // pushState(node) {
  //   const revert = this.bookmark();
  //   this.stack.push({ node, revert });
  // }

  // backtrack() {
  //   return this.stack.pop() || null;
  // }

  match() {
    return this.matchNode(this.ast) && this.eof();
  }

  isOptional(node) {
    return node.type === 'rep' && node.min === 0;
  }

  matchNode(node, meta) {
    return this.processNode(node, meta).match;
  }

  processNode(node, meta) {
    console.log('\nprocess', node, meta);
    const matchers = {
      group: this.matchGroup,
      char: this.matchChar,
      range: this.matchRange,
      rep: this.matchRepetition,
      alt: this.matchAlternation,
      dot: this.matchDot,
    };
    const { type } = node;
    const matcher = matchers[type];
    if (!matcher) {
      this.croak('Encountered unknown node type "${type}".');
    }

    return matcher.call(this, node, meta);
  }

  matchDot() {
    if (this.eof()) {
      return { match: false };
    }
    this.index++;
    return {
      match: true,
      flexible: false,
    };
  }

  matchChar({ value }) {
    if (this.eof()) {
      return { match: false };
    }
    const match = this.input[0] === value;
    if (match) {
      this.index++;
    }
    return {
      match,
      flexible: false,
    };
  }

  matchRange({ from, to }) {
    if (this.eof()) {
      return { match: false };
    }
    const code = this.input[0].charCodeAt(0);
    const match = from.charCodeAt(0) <= code && code <= to.charCodeAt(0);
    if (match) {
      this.index++;
    }
    return {
      match,
      flexible: false,
    };
  }

  matchRepetition({ min, max, value }, meta) {
    let count = 0;
    let lastRepeatMatched = true;
    let effectiveMax = max;
    if (meta) {
      effectiveMax = meta.count - 1;
      this.index--;
    }
    let foo = 0;
    console.log(effectiveMax, meta, this.input.length);
    while (lastRepeatMatched && !this.eof() && count !== effectiveMax) {
      if (++foo > 20) throw new Error('inf loop');

      lastRepeatMatched = this.matchNode(value);
      if (lastRepeatMatched) {
        count++;
      }
    }

    return {
      match: count >= min,
      flexible: count > min,
      meta: { count },
    };
  }

  matchAlternation({ values }) {
    const match = values.some(this.matchNode);
    // TODO: should be flexible unless last value matched
    return {
      match,
      flexible: false,
    };
  }

  matchGroup({ values }) {
    let allGood;
    let done = false;
    const metaMap = new Map();
    const indexStateStack = [this.index];

    let i = 0;
    let baseIndex = 0; // All nodes below this index are inflexible.
    let foo = 0;
    while (!done) {
      if (++foo > 20) throw new Error('inf loop');

      const node = values[i];
      const isLast = i === values.length - 1;
      const { match, meta, flexible } = this.processNode(node, metaMap.get(node));
      console.log(i, match, flexible, meta);

      if (meta) {
        metaMap.set(node, meta);
      }

      if (match) {
        if (i === baseIndex && !flexible) {
          baseIndex++;
        }

        if (isLast) {
          done = true;
          allGood = true;
        } else {
          i++;
          indexStateStack.push(this.index);
        }
      } else {
        console.log(isLast, baseIndex, i);

        if (baseIndex === i) {
          done = true;
          allGood = false;
        } else {
          i--;
          console.log('prepop', indexStateStack, this.index);
          this.index = indexStateStack.pop();
          console.log('postpop', indexStateStack, this.index);
          // TODO NEXT: Need to also undo any of `this.index` that was incremented/consumed. Maybe
          // make bookmarks for each node, store it in a map if the node is flexible. Map value
          // would need to be a stack in case a node has to be backtracked to multiple times.
        }
      }
    }

    if (!allGood) {
      this.index = indexStateStack[0];
    }

    return {
      match: allGood,
      flexible: false,
    };
  }
}

module.exports = Matcher;
