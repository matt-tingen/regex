This is a basic regular expression engine. It currently supports only a handful of features.

# Usage

```js
const regex = new Regex('(ab)+[cd]?');
regex.match('abc'); // true
regex.match('abcd'); // false
```

You can also use a RegExp literal as the source pattern.
This is primarily useful for syntax highlighting.

```js
const regex = new Regex(/(ab)+[cd]?/);
```

# Features

Supported features are:

* Basic character matching
* Repetition e.g.`a?b*c+`
* Grouping e.g. `(abc)`
* Character classes e.g. `[abc]`

All other regex features are not supported.
Notable omissions are:

* **Backtracking** e.g. `new Regex('a+a').match('aa')`
* Dot (`.`)
* Ranges in character classes (`[a-z]`)
