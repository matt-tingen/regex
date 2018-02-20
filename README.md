This is a basic regular expression engine. It currently supports only a handful of features.

# Usage

```js
const float = new Regex('[0-9]*\\.[0-9]+');
float.match('3.50'); // true
float.match('42'); // false
```

You can also use a `RegExp` literal as the source pattern.
This is primarily useful for syntax highlighting and escapes.
However, when doing this, errors in the pattern will be thrown by `RegExp` rather than `Regex`.

```js
new Regex(/[0-9]*\.[0-9]+/);
```

# Features

Supported features are:

* Basic character matching
* Dot e.g. `.+`
* Repetition e.g.`a?b*c+`
* Grouping e.g. `(abc)`
* Character classes e.g. `[abc]`

All other regex features are not supported.
The most notable omission is backtracking. For example, `new Regex('a+a').match('aa')` yields a false-negative.
