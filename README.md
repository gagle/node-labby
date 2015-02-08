labby
=====

#### Flavored Lab runner ####

[![npm][npm-image]][npm-url]

[lab][lab] is the test framework par excellence used in the [hapi][hapi] ecosystem but it can be also used in any non-hapi project. It's quite simple to use and has a built-in coverage system which uses [esprima][esprima].

Currently, the version 5.x of lab provides a limited interface, it's not as flexible as it should be, but more important, it doesn't include a programmatic way for executing the tests. For instance, you cannot execute a global `before()` or `after()` hooks. If you need to execute slow tasks to prepare the testing environment, you're forced to execute it for each test file.

[npm-image]: https://img.shields.io/npm/v/labby.svg?style=flat
[npm-url]: https://npmjs.org/package/labby
[lab]: https://github.com/hapijs/lab
[hapi]: https://github.com/hapijs/hapi
[esprima]: https://github.com/jquery/esprima