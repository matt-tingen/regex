const CharacterStream = require('./CharacterStream');
const TokenStream = require('./TokenStream');
const Parser = require('./Parser');
const Matcher = require('./Matcher');

class Regex {
  constructor(pattern) {
    const string = pattern instanceof RegExp ? pattern.source : pattern;
    const parser = new Parser(new TokenStream(new CharacterStream(string)));
    this.ast = parser.parse();
  }

  match(input) {
    const matcher = new Matcher(this.ast, input);
    return matcher.match();
  }
}

module.exports = Regex;
