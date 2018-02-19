const ast = {
  char: value => ({ type: 'char', value }),
  str: chars => chars.split('').map(ast.char),
  group: (...bodyNodes) => ({ type: 'group', body: ast.seq(...bodyNodes) }),
  class: chars => ({ type: 'alt', values: ast.str(chars) }),
  seq: (...values) => ({ type: 'seq', values }),
  rep: (min, max, value) => ({ type: 'rep', min, max, value }),
};

module.exports = {
  ast,
};
