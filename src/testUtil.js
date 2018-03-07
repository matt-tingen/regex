const ast = {
  char: value => ({ type: 'char', value }),
  str: chars => chars.split('').map(ast.char),
  group: (...values) => ({ type: 'group', values }),
  alt: (...values) => ({ type: 'alt', values }),
  class: chars => ast.alt(...ast.str(chars)),
  rep: (min, max, value) => ({ type: 'rep', min, max, value }),
  dot: () => ({ type: 'dot' }),
  range: (from, to) => ({ type: 'range', from, to }),
};

const repeat = (str, n) => Array(n + 1).join(str);

module.exports = {
  ast,
  repeat,
};
