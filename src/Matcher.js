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

  get matchedInput() {
    return this.fullInput.slice(0, this.index);
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
    };
  }

  matchRepetition({ min, max, value }, meta) {
    let count = 0;
    let effectiveMax = meta ? meta.count - 1 : max;
    // Don't reuse meta.repeatMeta because any matches which previously had metadata, but don't on
    // this run would falsely have their stale metadata in the array.
    const instanceMetas = [];

    let foo = 0;
    console.log('rep <=', effectiveMax);
    while (count < effectiveMax) {
      if (++foo > 20) throw new Error('inf loop');
      const prevIndex = this.index;
      const { match, meta: instanceMeta } = this.processNode(
        value,
        meta && meta.instanceMetas[count],
      );

      if (match) {
        count++;

        // Zero-length matches would match an infinite number of times.
        if (this.index === prevIndex) {
          break;
        }
      } else {
        break;
      }

      instanceMetas[count] = instanceMeta;
    }

    const flexible = count > min || instanceMetas.some(m => m);
    const result = { match: count >= min };
    return flexible
      ? {
          ...result,
          meta: { count, instanceMetas },
        }
      : result;
  }

  matchAlternation({ values }) {
    const match = values.some(this.matchNode);
    // TODO: should be flexible unless last value matched. However this doesn't matter so long as
    // the only alternations are character classes.
    return {
      match,
    };
  }

  matchGroup({ values }, meta) {
    let allGood;
    let done = false;
    const metaMap = meta ? meta.map : new Map();
    const indexStateStack = [this.index];
    const trace = [];

    let i = 0;
    let baseIndex = 0; // All nodes below this index are inflexible.
    let foo = 0;
    while (!done) {
      if (++foo > 50) throw new Error('inf loop');

      const startIndex = this.index;
      const node = values[i];
      const isLast = i === values.length - 1;
      const { match, meta } = this.processNode(node, metaMap.get(node));
      trace.push(this.matchedInput);

      if (meta) {
        metaMap.set(node, meta);
      } else {
        metaMap.delete(node);
      }

      if (match) {
        if (isLast) {
          done = true;
          allGood = true;
        } else {
          if (i === baseIndex && !meta) {
            baseIndex++;
          }

          i++;
          indexStateStack.push(startIndex);
        }
      } else {
        if (baseIndex === i) {
          done = true;
          allGood = false;
        } else {
          // Backtrack to the most recect node which returned metadata, indicating that it can
          // backtrack.
          do {
            i--;
            this.index = indexStateStack.pop();
          } while (!metaMap.has(values[i]));
        }
      }
    }

    console.log('group allGood', allGood);
    if (!allGood) {
      this.index = indexStateStack[0];
      trace.push(this.matchedInput);
    }

    console.log(trace.join('\n'));

    const result = {
      match: allGood,
    };
    return metaMap.size
      ? {
          ...result,
          meta: {
            map: metaMap,
          },
        }
      : result;
  }
}

module.exports = Matcher;
