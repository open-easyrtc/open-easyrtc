EasyRTC API Specs

File into this directory are Unitests built using Jasmine.

More infos about Jasmine can be found at:
- http://pivotal.github.io/jasmine/
- https://github.com/pivotal/jasmine/wiki
- http://www.adobe.com/devnet/html5/articles/unit-test-javascript-applications-with-jasmine.html
- http://www.slideshare.net/chrisjpowers/jasmine-6417624

Create a new test
=======================================================================

1. Create a file <MyNameSpace>.js into spec/api/easyrtc/ directory with

2. Import following template and replace <MyNameSpace> by your value

> /*
>   Script: <MyNameSpace>.js
>
>     This file is part of EasyRTC.
> */
>
> /*global
>     define, describe, it, expect, spyOn, jasmine
> */
>
> define(['EasyRTC/<MyNameSpace>'], function (MyNameSpace) {
>     'use strict';
>
>     describe("EasyRTC.<MyNameSpace>", function () {
>
>     });
> });

3. Add 'EasyRTC/<MyNameSpace>' module to spec/index.js

Available asserts
=======================================================================

expect(x).toEqual(y); compares objects or primitives x and y and passes if they are equivalent

expect(x).toBe(y); compares objects or primitives x and y and passes if they are the same object

expect(x).toMatch(pattern); compares x to string or regular expression pattern and passes if they match

expect(x).toBeDefined(); passes if x is not undefined

expect(x).toBeUndefined(); passes if x is undefined

expect(x).toBeNull(); passes if x is null

expect(x).toBeTruthy(); passes if x _evaluates_ to true.
    For example expect(1).toBeTruthy() passes.
    expect(x).toBe(true) is often more appropriate.

expect(x).toBeFalsy(); passes if x _evaluates_ to false.
    For example expect("").toBeFalsy() passes.
    expect(x).toBe(false) is often more appropriate.

expect(x).toContain(y); passes if array or string x contains y

expect(x).toBeLessThan(y); passes if x is less than y

expect(x).toBeGreaterThan(y); passes if x is greater than y

expect(function(){fn();}).toThrow(e); passes if function fn throws exception e when executed

expect(spiedMethod).toHaveBeenCalled(); passes if the spied method has been called
    Note that calls to the spied method are better tested with expect(spiedMethod.callCount).toBe(n)

Every matcher's criteria can be inverted by prepending .not:

expect(x).not.toEqual(y); compares objects or primitives x and y and passes if they are not equivalent

Install Karma
=======================================================================

See http://karma-runner.github.io/
