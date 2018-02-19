const ast = {
  char: value => ({ type: 'char', value }),
  str: chars => chars.split('').map(ast.char),
  group: (...values) => ({ type: 'group', values }),
  class: chars => ({ type: 'alt', values: ast.str(chars) }),
  rep: (min, max, value) => ({ type: 'rep', min, max, value }),
};

module.exports = {
  ast,
};
