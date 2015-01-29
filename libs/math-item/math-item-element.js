var FlorianMath;
(function (FlorianMath) {
    'use strict';
    FlorianMath.Promise = (function (local) {
        return ("Promise" in local && "resolve" in local.Promise && "reject" in local.Promise && "all" in local.Promise && "race" in local.Promise && (function () {
            var resolve;
            new local.Promise(function (r) {
                resolve = r;
            });
            return typeof resolve === 'function';
        }));
    })(window) ? window.Promise : (function (window) {
        "use strict";
        function $$utils$$objectOrFunction(x) {
            return typeof x === 'function' || (typeof x === 'object' && x !== null);
        }
        function $$utils$$isFunction(x) {
            return typeof x === 'function';
        }
        function $$utils$$isMaybeThenable(x) {
            return typeof x === 'object' && x !== null;
        }
        var $$utils$$_isArray;
        if (!Array.isArray) {
            $$utils$$_isArray = function (x) {
                return Object.prototype.toString.call(x) === '[object Array]';
            };
        }
        else {
            $$utils$$_isArray = Array.isArray;
        }
        var $$utils$$isArray = $$utils$$_isArray;
        var $$utils$$now = Date.now || function () {
            return new Date().getTime();
        };
        function $$utils$$F() {
        }
        var $$utils$$o_create = (Object.create || function (o) {
            if (arguments.length > 1) {
                throw new Error('Second argument not supported');
            }
            if (typeof o !== 'object') {
                throw new TypeError('Argument must be an object');
            }
            $$utils$$F.prototype = o;
            return new $$utils$$F();
        });
        var $$asap$$len = 0;
        var $$asap$$default = function asap(callback, arg) {
            $$asap$$queue[$$asap$$len] = callback;
            $$asap$$queue[$$asap$$len + 1] = arg;
            $$asap$$len += 2;
            if ($$asap$$len === 2) {
                // If len is 1, that means that we need to schedule an async flush.
                // If additional callbacks are queued before the queue is flushed, they
                // will be processed by this flush that we are scheduling.
                $$asap$$scheduleFlush();
            }
        };
        var $$asap$$browserGlobal = (typeof window !== 'undefined') ? window : {};
        var $$asap$$BrowserMutationObserver = $$asap$$browserGlobal.MutationObserver || $$asap$$browserGlobal.WebKitMutationObserver;
        // test for web worker but not in IE10
        var $$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
        // node
        function $$asap$$useNextTick() {
            return function () {
                process.nextTick($$asap$$flush);
            };
        }
        function $$asap$$useMutationObserver() {
            var iterations = 0;
            var observer = new $$asap$$BrowserMutationObserver($$asap$$flush);
            var node = document.createTextNode('');
            observer.observe(node, { characterData: true });
            return function () {
                node.data = (iterations = ++iterations % 2);
            };
        }
        // web worker
        function $$asap$$useMessageChannel() {
            var channel = new MessageChannel();
            channel.port1.onmessage = $$asap$$flush;
            return function () {
                channel.port2.postMessage(0);
            };
        }
        function $$asap$$useSetTimeout() {
            return function () {
                setTimeout($$asap$$flush, 1);
            };
        }
        var $$asap$$queue = new Array(1000);
        function $$asap$$flush() {
            for (var i = 0; i < $$asap$$len; i += 2) {
                var callback = $$asap$$queue[i];
                var arg = $$asap$$queue[i + 1];
                callback(arg);
                $$asap$$queue[i] = undefined;
                $$asap$$queue[i + 1] = undefined;
            }
            $$asap$$len = 0;
        }
        var $$asap$$scheduleFlush;
        // Decide what async method to use to triggering processing of queued callbacks:
        if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
            $$asap$$scheduleFlush = $$asap$$useNextTick();
        }
        else if ($$asap$$BrowserMutationObserver) {
            $$asap$$scheduleFlush = $$asap$$useMutationObserver();
        }
        else if ($$asap$$isWorker) {
            $$asap$$scheduleFlush = $$asap$$useMessageChannel();
        }
        else {
            $$asap$$scheduleFlush = $$asap$$useSetTimeout();
        }
        function $$$internal$$noop() {
        }
        var $$$internal$$PENDING = void 0;
        var $$$internal$$FULFILLED = 1;
        var $$$internal$$REJECTED = 2;
        var $$$internal$$GET_THEN_ERROR = new $$$internal$$ErrorObject();
        function $$$internal$$selfFullfillment() {
            return new TypeError("You cannot resolve a promise with itself");
        }
        function $$$internal$$cannotReturnOwn() {
            return new TypeError('A promises callback cannot return that same promise.');
        }
        function $$$internal$$getThen(promise) {
            try {
                return promise.then;
            }
            catch (error) {
                $$$internal$$GET_THEN_ERROR.error = error;
                return $$$internal$$GET_THEN_ERROR;
            }
        }
        function $$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler, msg) {
            try {
                then.call(value, fulfillmentHandler, rejectionHandler);
            }
            catch (e) {
                return e;
            }
        }
        function $$$internal$$handleForeignThenable(promise, thenable, then) {
            $$asap$$default(function (promise) {
                var sealed = false;
                var error = $$$internal$$tryThen(then, thenable, function (value) {
                    if (sealed) {
                        return;
                    }
                    sealed = true;
                    if (thenable !== value) {
                        $$$internal$$resolve(promise, value);
                    }
                    else {
                        $$$internal$$fulfill(promise, value);
                    }
                }, function (reason) {
                    if (sealed) {
                        return;
                    }
                    sealed = true;
                    $$$internal$$reject(promise, reason);
                }, 'Settle: ' + (promise._label || ' unknown promise'));
                if (!sealed && error) {
                    sealed = true;
                    $$$internal$$reject(promise, error);
                }
            }, promise);
        }
        function $$$internal$$handleOwnThenable(promise, thenable) {
            if (thenable._state === $$$internal$$FULFILLED) {
                $$$internal$$fulfill(promise, thenable._result);
            }
            else if (promise._state === $$$internal$$REJECTED) {
                $$$internal$$reject(promise, thenable._result);
            }
            else {
                $$$internal$$subscribe(thenable, undefined, function (value) {
                    $$$internal$$resolve(promise, value);
                }, function (reason) {
                    $$$internal$$reject(promise, reason);
                });
            }
        }
        function $$$internal$$handleMaybeThenable(promise, maybeThenable) {
            if (maybeThenable.constructor === promise.constructor) {
                $$$internal$$handleOwnThenable(promise, maybeThenable);
            }
            else {
                var then = $$$internal$$getThen(maybeThenable);
                if (then === $$$internal$$GET_THEN_ERROR) {
                    $$$internal$$reject(promise, $$$internal$$GET_THEN_ERROR.error);
                }
                else if (then === undefined) {
                    $$$internal$$fulfill(promise, maybeThenable);
                }
                else if ($$utils$$isFunction(then)) {
                    $$$internal$$handleForeignThenable(promise, maybeThenable, then);
                }
                else {
                    $$$internal$$fulfill(promise, maybeThenable);
                }
            }
        }
        function $$$internal$$resolve(promise, value) {
            if (promise === value) {
                $$$internal$$reject(promise, $$$internal$$selfFullfillment());
            }
            else if ($$utils$$objectOrFunction(value)) {
                $$$internal$$handleMaybeThenable(promise, value);
            }
            else {
                $$$internal$$fulfill(promise, value);
            }
        }
        function $$$internal$$publishRejection(promise) {
            if (promise._onerror) {
                promise._onerror(promise._result);
            }
            $$$internal$$publish(promise);
        }
        function $$$internal$$fulfill(promise, value) {
            if (promise._state !== $$$internal$$PENDING) {
                return;
            }
            promise._result = value;
            promise._state = $$$internal$$FULFILLED;
            if (promise._subscribers.length === 0) {
            }
            else {
                $$asap$$default($$$internal$$publish, promise);
            }
        }
        function $$$internal$$reject(promise, reason) {
            if (promise._state !== $$$internal$$PENDING) {
                return;
            }
            promise._state = $$$internal$$REJECTED;
            promise._result = reason;
            $$asap$$default($$$internal$$publishRejection, promise);
        }
        function $$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
            var subscribers = parent._subscribers;
            var length = subscribers.length;
            parent._onerror = null;
            subscribers[length] = child;
            subscribers[length + $$$internal$$FULFILLED] = onFulfillment;
            subscribers[length + $$$internal$$REJECTED] = onRejection;
            if (length === 0 && parent._state) {
                $$asap$$default($$$internal$$publish, parent);
            }
        }
        function $$$internal$$publish(promise) {
            var subscribers = promise._subscribers;
            var settled = promise._state;
            if (subscribers.length === 0) {
                return;
            }
            var child, callback, detail = promise._result;
            for (var i = 0; i < subscribers.length; i += 3) {
                child = subscribers[i];
                callback = subscribers[i + settled];
                if (child) {
                    $$$internal$$invokeCallback(settled, child, callback, detail);
                }
                else {
                    callback(detail);
                }
            }
            promise._subscribers.length = 0;
        }
        function $$$internal$$ErrorObject() {
            this.error = null;
        }
        var $$$internal$$TRY_CATCH_ERROR = new $$$internal$$ErrorObject();
        function $$$internal$$tryCatch(callback, detail) {
            try {
                return callback(detail);
            }
            catch (e) {
                $$$internal$$TRY_CATCH_ERROR.error = e;
                return $$$internal$$TRY_CATCH_ERROR;
            }
        }
        function $$$internal$$invokeCallback(settled, promise, callback, detail) {
            var hasCallback = $$utils$$isFunction(callback), value, error, succeeded, failed;
            if (hasCallback) {
                value = $$$internal$$tryCatch(callback, detail);
                if (value === $$$internal$$TRY_CATCH_ERROR) {
                    failed = true;
                    error = value.error;
                    value = null;
                }
                else {
                    succeeded = true;
                }
                if (promise === value) {
                    $$$internal$$reject(promise, $$$internal$$cannotReturnOwn());
                    return;
                }
            }
            else {
                value = detail;
                succeeded = true;
            }
            if (promise._state !== $$$internal$$PENDING) {
            }
            else if (hasCallback && succeeded) {
                $$$internal$$resolve(promise, value);
            }
            else if (failed) {
                $$$internal$$reject(promise, error);
            }
            else if (settled === $$$internal$$FULFILLED) {
                $$$internal$$fulfill(promise, value);
            }
            else if (settled === $$$internal$$REJECTED) {
                $$$internal$$reject(promise, value);
            }
        }
        function $$$internal$$initializePromise(promise, resolver) {
            try {
                resolver(function resolvePromise(value) {
                    $$$internal$$resolve(promise, value);
                }, function rejectPromise(reason) {
                    $$$internal$$reject(promise, reason);
                });
            }
            catch (e) {
                $$$internal$$reject(promise, e);
            }
        }
        function $$$enumerator$$makeSettledResult(state, position, value) {
            if (state === $$$internal$$FULFILLED) {
                return {
                    state: 'fulfilled',
                    value: value
                };
            }
            else {
                return {
                    state: 'rejected',
                    reason: value
                };
            }
        }
        function $$$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
            this._instanceConstructor = Constructor;
            this.promise = new Constructor($$$internal$$noop, label);
            this._abortOnReject = abortOnReject;
            if (this._validateInput(input)) {
                this._input = input;
                this.length = input.length;
                this._remaining = input.length;
                this._init();
                if (this.length === 0) {
                    $$$internal$$fulfill(this.promise, this._result);
                }
                else {
                    this.length = this.length || 0;
                    this._enumerate();
                    if (this._remaining === 0) {
                        $$$internal$$fulfill(this.promise, this._result);
                    }
                }
            }
            else {
                $$$internal$$reject(this.promise, this._validationError());
            }
        }
        $$$enumerator$$Enumerator.prototype._validateInput = function (input) {
            return $$utils$$isArray(input);
        };
        $$$enumerator$$Enumerator.prototype._validationError = function () {
            return new Error('Array Methods must be provided an Array');
        };
        $$$enumerator$$Enumerator.prototype._init = function () {
            this._result = new Array(this.length);
        };
        var $$$enumerator$$default = $$$enumerator$$Enumerator;
        $$$enumerator$$Enumerator.prototype._enumerate = function () {
            var length = this.length;
            var promise = this.promise;
            var input = this._input;
            for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
                this._eachEntry(input[i], i);
            }
        };
        $$$enumerator$$Enumerator.prototype._eachEntry = function (entry, i) {
            var c = this._instanceConstructor;
            if ($$utils$$isMaybeThenable(entry)) {
                if (entry.constructor === c && entry._state !== $$$internal$$PENDING) {
                    entry._onerror = null;
                    this._settledAt(entry._state, i, entry._result);
                }
                else {
                    this._willSettleAt(c.resolve(entry), i);
                }
            }
            else {
                this._remaining--;
                this._result[i] = this._makeResult($$$internal$$FULFILLED, i, entry);
            }
        };
        $$$enumerator$$Enumerator.prototype._settledAt = function (state, i, value) {
            var promise = this.promise;
            if (promise._state === $$$internal$$PENDING) {
                this._remaining--;
                if (this._abortOnReject && state === $$$internal$$REJECTED) {
                    $$$internal$$reject(promise, value);
                }
                else {
                    this._result[i] = this._makeResult(state, i, value);
                }
            }
            if (this._remaining === 0) {
                $$$internal$$fulfill(promise, this._result);
            }
        };
        $$$enumerator$$Enumerator.prototype._makeResult = function (state, i, value) {
            return value;
        };
        $$$enumerator$$Enumerator.prototype._willSettleAt = function (promise, i) {
            var enumerator = this;
            $$$internal$$subscribe(promise, undefined, function (value) {
                enumerator._settledAt($$$internal$$FULFILLED, i, value);
            }, function (reason) {
                enumerator._settledAt($$$internal$$REJECTED, i, reason);
            });
        };
        var $$promise$all$$default = function all(entries, label) {
            return new $$$enumerator$$default(this, entries, true, label).promise;
        };
        var $$promise$race$$default = function race(entries, label) {
            /*jshint validthis:true */
            var Constructor = this;
            var promise = new Constructor($$$internal$$noop, label);
            if (!$$utils$$isArray(entries)) {
                $$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
                return promise;
            }
            var length = entries.length;
            function onFulfillment(value) {
                $$$internal$$resolve(promise, value);
            }
            function onRejection(reason) {
                $$$internal$$reject(promise, reason);
            }
            for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
                $$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
            }
            return promise;
        };
        var $$promise$resolve$$default = function resolve(object, label) {
            /*jshint validthis:true */
            var Constructor = this;
            if (object && typeof object === 'object' && object.constructor === Constructor) {
                return object;
            }
            var promise = new Constructor($$$internal$$noop, label);
            $$$internal$$resolve(promise, object);
            return promise;
        };
        var $$promise$reject$$default = function reject(reason, label) {
            /*jshint validthis:true */
            var Constructor = this;
            var promise = new Constructor($$$internal$$noop, label);
            $$$internal$$reject(promise, reason);
            return promise;
        };
        var $$es6$promise$promise$$counter = 0;
        function $$es6$promise$promise$$needsResolver() {
            throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
        }
        function $$es6$promise$promise$$needsNew() {
            throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }
        var $$es6$promise$promise$$default = $$es6$promise$promise$$Promise;
        /**
          Promise objects represent the eventual result of an asynchronous operation. The
          primary way of interacting with a promise is through its `then` method, which
          registers callbacks to receive either a promise?s eventual value or the reason
          why the promise cannot be fulfilled.
    
          Terminology
          -----------
    
          - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
          - `thenable` is an object or function that defines a `then` method.
          - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
          - `exception` is a value that is thrown using the throw statement.
          - `reason` is a value that indicates why a promise was rejected.
          - `settled` the final resting state of a promise, fulfilled or rejected.
    
          A promise can be in one of three states: pending, fulfilled, or rejected.
    
          Promises that are fulfilled have a fulfillment value and are in the fulfilled
          state.  Promises that are rejected have a rejection reason and are in the
          rejected state.  A fulfillment value is never a thenable.
    
          Promises can also be said to *resolve* a value.  If this value is also a
          promise, then the original promise's settled state will match the value's
          settled state.  So a promise that *resolves* a promise that rejects will
          itself reject, and a promise that *resolves* a promise that fulfills will
          itself fulfill.
    
    
          Basic Usage:
          ------------
    
          ```js
          var promise = new Promise(function(resolve, reject) {
            // on success
            resolve(value);
    
            // on failure
            reject(reason);
          });
    
          promise.then(function(value) {
            // on fulfillment
          }, function(reason) {
            // on rejection
          });
          ```
    
          Advanced Usage:
          ---------------
    
          Promises shine when abstracting away asynchronous interactions such as
          `XMLHttpRequest`s.
    
          ```js
          function getJSON(url) {
            return new Promise(function(resolve, reject){
              var xhr = new XMLHttpRequest();
    
              xhr.open('GET', url);
              xhr.onreadystatechange = handler;
              xhr.responseType = 'json';
              xhr.setRequestHeader('Accept', 'application/json');
              xhr.send();
    
              function handler() {
                if (this.readyState === this.DONE) {
                  if (this.status === 200) {
                    resolve(this.response);
                  } else {
                    reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
                  }
                }
              };
            });
          }
    
          getJSON('/posts.json').then(function(json) {
            // on fulfillment
          }, function(reason) {
            // on rejection
          });
          ```
    
          Unlike callbacks, promises are great composable primitives.
    
          ```js
          Promise.all([
            getJSON('/posts'),
            getJSON('/comments')
          ]).then(function(values){
            values[0] // => postsJSON
            values[1] // => commentsJSON
    
            return values;
          });
          ```
    
          @class Promise
          @param {function} resolver
          Useful for tooling.
          @constructor
        */
        function $$es6$promise$promise$$Promise(resolver) {
            this._id = $$es6$promise$promise$$counter++;
            this._state = undefined;
            this._result = undefined;
            this._subscribers = [];
            if ($$$internal$$noop !== resolver) {
                if (!$$utils$$isFunction(resolver)) {
                    $$es6$promise$promise$$needsResolver();
                }
                if (!(this instanceof $$es6$promise$promise$$Promise)) {
                    $$es6$promise$promise$$needsNew();
                }
                $$$internal$$initializePromise(this, resolver);
            }
        }
        $$es6$promise$promise$$Promise.all = $$promise$all$$default;
        $$es6$promise$promise$$Promise.race = $$promise$race$$default;
        $$es6$promise$promise$$Promise.resolve = $$promise$resolve$$default;
        $$es6$promise$promise$$Promise.reject = $$promise$reject$$default;
        $$es6$promise$promise$$Promise.prototype = {
            constructor: $$es6$promise$promise$$Promise,
            /**
              The primary way of interacting with a promise is through its `then` method,
              which registers callbacks to receive either a promise's eventual value or the
              reason why the promise cannot be fulfilled.
    
              ```js
              findUser().then(function(user){
                // user is available
              }, function(reason){
                // user is unavailable, and you are given the reason why
              });
              ```
    
              Chaining
              --------
    
              The return value of `then` is itself a promise.  This second, 'downstream'
              promise is resolved with the return value of the first promise's fulfillment
              or rejection handler, or rejected if the handler throws an exception.
    
              ```js
              findUser().then(function (user) {
                return user.name;
              }, function (reason) {
                return 'default name';
              }).then(function (userName) {
                // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
                // will be `'default name'`
              });
    
              findUser().then(function (user) {
                throw new Error('Found user, but still unhappy');
              }, function (reason) {
                throw new Error('`findUser` rejected and we're unhappy');
              }).then(function (value) {
                // never reached
              }, function (reason) {
                // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
                // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
              });
              ```
              If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
    
              ```js
              findUser().then(function (user) {
                throw new PedagogicalException('Upstream error');
              }).then(function (value) {
                // never reached
              }).then(function (value) {
                // never reached
              }, function (reason) {
                // The `PedgagocialException` is propagated all the way down to here
              });
              ```
    
              Assimilation
              ------------
    
              Sometimes the value you want to propagate to a downstream promise can only be
              retrieved asynchronously. This can be achieved by returning a promise in the
              fulfillment or rejection handler. The downstream promise will then be pending
              until the returned promise is settled. This is called *assimilation*.
    
              ```js
              findUser().then(function (user) {
                return findCommentsByAuthor(user);
              }).then(function (comments) {
                // The user's comments are now available
              });
              ```
    
              If the assimliated promise rejects, then the downstream promise will also reject.
    
              ```js
              findUser().then(function (user) {
                return findCommentsByAuthor(user);
              }).then(function (comments) {
                // If `findCommentsByAuthor` fulfills, we'll have the value here
              }, function (reason) {
                // If `findCommentsByAuthor` rejects, we'll have the reason here
              });
              ```
    
              Simple Example
              --------------
    
              Synchronous Example
    
              ```javascript
              var result;
    
              try {
                result = findResult();
                // success
              } catch(reason) {
                // failure
              }
              ```
    
              Errback Example
    
              ```js
              findResult(function(result, err){
                if (err) {
                  // failure
                } else {
                  // success
                }
              });
              ```
    
              Promise Example;
    
              ```javascript
              findResult().then(function(result){
                // success
              }, function(reason){
                // failure
              });
              ```
    
              Advanced Example
              --------------
    
              Synchronous Example
    
              ```javascript
              var author, books;
    
              try {
                author = findAuthor();
                books  = findBooksByAuthor(author);
                // success
              } catch(reason) {
                // failure
              }
              ```
    
              Errback Example
    
              ```js
    
              function foundBooks(books) {
    
              }
    
              function failure(reason) {
    
              }
    
              findAuthor(function(author, err){
                if (err) {
                  failure(err);
                  // failure
                } else {
                  try {
                    findBoooksByAuthor(author, function(books, err) {
                      if (err) {
                        failure(err);
                      } else {
                        try {
                          foundBooks(books);
                        } catch(reason) {
                          failure(reason);
                        }
                      }
                    });
                  } catch(error) {
                    failure(err);
                  }
                  // success
                }
              });
              ```
    
              Promise Example;
    
              ```javascript
              findAuthor().
                then(findBooksByAuthor).
                then(function(books){
                  // found books
              }).catch(function(reason){
                // something went wrong
              });
              ```
    
              @method then
              @param {Function} onFulfilled
              @param {Function} onRejected
              Useful for tooling.
              @return {Promise}
            */
            then: function (onFulfillment, onRejection) {
                var parent = this;
                var state = parent._state;
                if (state === $$$internal$$FULFILLED && !onFulfillment || state === $$$internal$$REJECTED && !onRejection) {
                    return this;
                }
                var child = new this.constructor($$$internal$$noop);
                var result = parent._result;
                if (state) {
                    var callback = arguments[state - 1];
                    $$asap$$default(function () {
                        $$$internal$$invokeCallback(state, child, callback, result);
                    }, undefined);
                }
                else {
                    $$$internal$$subscribe(parent, child, onFulfillment, onRejection);
                }
                return child;
            },
            /**
              `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
              as the catch block of a try/catch statement.
    
              ```js
              function findAuthor(){
                throw new Error('couldn't find that author');
              }
    
              // synchronous
              try {
                findAuthor();
              } catch(reason) {
                // something went wrong
              }
    
              // async with promises
              findAuthor().catch(function(reason){
                // something went wrong
              });
              ```
    
              @method catch
              @param {Function} onRejection
              Useful for tooling.
              @return {Promise}
            */
            'catch': function (onRejection) {
                return this.then(null, onRejection);
            }
        };
        return $$es6$promise$promise$$default;
    })(window);
})(FlorianMath || (FlorianMath = {}));
/// <reference path="promise.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty, nativeKeys = Object.keys;
    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }
    function has(obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    }
    function keys(obj) {
        if (!isObject(obj))
            return [];
        if (nativeKeys)
            return nativeKeys(obj);
        var keys = [];
        for (var key in obj)
            if (has(obj, key))
                keys.push(key);
        return keys;
    }
    function each(obj, iteratee, context) {
        if (obj == null)
            return obj;
        var i, length = obj.length;
        if (length === +length) {
            for (i = 0; i < length; i++) {
                iteratee.call(context, obj[i], i, obj);
            }
        }
        else {
            var ks = keys(obj);
            for (i = 0, length = ks.length; i < length; i++) {
                iteratee.call(context, obj[ks[i]], ks[i], obj);
            }
        }
        return obj;
    }
    function map(obj, iteratee, context) {
        if (obj == null)
            return [];
        var ks = obj.length !== +obj.length && keys(obj), length = (ks || obj).length, results = Array(length), currentKey;
        for (var index = 0; index < length; index++) {
            currentKey = ks ? ks[index] : index;
            results[index] = iteratee.call(context, obj[currentKey], currentKey, obj);
        }
        return results;
    }
    function filter(list, predicate, context) {
        var result = [];
        each(list, function (value, index, list) {
            if (predicate.call(context, value, index, list))
                result.push(value);
        });
        return result;
    }
    function contains(list, elem) {
        return indexOf(list, elem) >= 0;
    }
    /*function difference<T>(list1: List<T>, list2: List<T>): T[] {
        return filter(list1, (item: T) => !contains(list2, item));
    }

    function union<T>(list1: List<T>, list2: List<T>): T[] {
        var result = difference(list1, list2);
        Array.prototype.push.apply(result, list2);
        return result;
    }*/
    function indexOf(array, item) {
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }
    var trim = String.prototype.trim ? function (st) { return st.trim(); } : (function () {
        var characters = '[\\s\\uFEFF\\xA0]';
        var regex = new RegExp('^' + characters + '+|' + characters + '+$', 'g');
        return function (st) { return st.replace(regex, ''); };
    })();
    FlorianMath._utils = {
        common: {
            each: each,
            map: map,
            filter: filter,
            indexOf: indexOf,
            contains: contains,
            //union: union,
            //difference: difference,
            //without: <T>(list: List<T>, elem: T) => filter(list, (item: T) => item !== elem),
            trim: trim,
            words: function (st) {
                st = trim(st);
                return st ? st.split(/\s+/) : [];
            },
            isArray: function (obj) { return Object.prototype.toString.call(obj) === '[object Array]'; },
            toArray: function (list) { return map(list, function (item) { return item; }); }
        },
        makePromiseWithResolve: function () {
            var resolver, promise;
            promise = new FlorianMath.Promise(function (resolve) {
                resolver = resolve;
            });
            promise.isResolved = false;
            promise.resolve = function (val) {
                promise.isResolved = true;
                resolver(val);
            };
            return promise;
        }
    };
})(FlorianMath || (FlorianMath = {}));
/// <reference path="common-utils.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    function addEventListenerFn(el, type, callback) {
        if (el.addEventListener)
            el.addEventListener(type, callback, false);
        else
            el.attachEvent('on' + type, callback);
    }
    function getNodeChildren(n, filter) {
        var result = [], c = n.firstChild;
        while (c) {
            if (!filter || filter(c))
                result.push(c);
            c = c.nextSibling;
        }
        return result;
    }
    FlorianMath._utils.dom = {
        addEventListenerFn: addEventListenerFn,
        ready: (function () {
            var promise = document.readyState === 'complete' ? FlorianMath.Promise.resolve() : new FlorianMath.Promise(function (resolve) {
                var fired = false;
                function trigger() {
                    if (fired)
                        return;
                    fired = true;
                    resolve();
                }
                if (document.addEventListener) {
                    document.addEventListener('DOMContentLoaded', trigger);
                }
                if (document.attachEvent) {
                    document.attachEvent('onreadystatechange', function () {
                        if (document.readyState === 'complete')
                            trigger();
                    });
                }
                addEventListenerFn(window, 'load', trigger);
            });
            return function () { return promise; };
        })(),
        async: typeof requestAnimationFrame === 'function' ? function (fn) {
            requestAnimationFrame(fn);
        } : function (fn) {
            setTimeout(fn, 0);
        },
        getNodeChildren: getNodeChildren,
        getElementChildren: function (n) { return getNodeChildren(n, function (c) { return c.nodeType === 1; }); }
    };
})(FlorianMath || (FlorianMath = {}));
/// <reference path="common-utils.ts" />
/// <reference path="dom-utils.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var _ = FlorianMath._utils.common;
    var dom = FlorianMath._utils.dom;
    FlorianMath._utils.xml = {
        // http://stackoverflow.com/a/7951947/212069
        parseXML: typeof DOMParser === 'function' ? function (data) { return (new DOMParser()).parseFromString(data, 'text/xml'); } : typeof ActiveXObject === 'function' && new ActiveXObject('Microsoft.XMLDOM') ? function (data) {
            var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = 'false';
            xmlDoc.loadXML(data);
            return xmlDoc;
        } : function () {
            throw new Error('parseXML not supported');
        },
        prettifyMathML: (function () {
            var mathml_token_elements = ['mi', 'mn', 'mo', 'ms', 'mtext', 'ci', 'cn', 'cs', 'csymbol', 'annotation'];
            function tagToString(n, inner, indent) {
                var name = n.nodeName.toLowerCase();
                var ret = '<' + name + _.map(n.attributes, function (attr) { return ' ' + attr.name + '="' + attr.value + '"'; }).join('');
                if (indent)
                    ret = indent + ret;
                return inner ? ret + '>' + inner + '</' + name + '>' : ret + ' />';
            }
            function serializeInner(n) {
                return _.map(dom.getNodeChildren(n), function (c) { return serializeNode(c); }).join('');
            }
            function serializeNode(n) {
                switch (n.nodeType) {
                    case 1: return tagToString(n, serializeInner(n));
                    case 3: return n.nodeValue;
                    case 8: return '<!--' + n.nodeValue + '-->';
                }
                return '';
            }
            function prettifyElement(el, indent) {
                if (el.nodeType !== 1)
                    throw new Error('prettifyMathML: expected Element node');
                var name = el.nodeName.toLowerCase(), inner = '';
                if (_.contains(mathml_token_elements, name)) {
                    inner = _.words(serializeInner(el)).join(' ');
                }
                else {
                    var items = _.map(dom.getElementChildren(el), function (c) { return prettifyElement(c, indent + '  '); });
                    if (items)
                        inner = '\n' + items.join('\n') + '\n' + indent;
                }
                return tagToString(el, inner, indent);
            }
            return function (el) { return prettifyElement(el, ''); };
        })()
    };
})(FlorianMath || (FlorianMath = {}));
/// <reference path="promise.ts" />
/// <reference path="common-utils.ts" />
/// <reference path="dom-utils.ts" />
/// <reference path="xml-utils.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var _ = FlorianMath._utils.common, dom = FlorianMath._utils.dom;
    var Handler = (function () {
        function Handler() {
        }
        Handler.prototype.ready = function (el) {
            el.clonePresentation = function (dest) {
                _.each(dom.getNodeChildren(this), function (child) {
                    dest.appendChild(child.cloneNode(true));
                });
                return FlorianMath.Promise.resolve();
            };
        };
        Handler.prototype.canHandle = function (el) {
            return false;
        };
        return Handler;
    })();
    FlorianMath.Handler = Handler;
    var HandlerStore = (function () {
        function HandlerStore() {
            this.handlerDict = {};
            this.handlerOrder = [];
        }
        HandlerStore.prototype.put = function (type, handler) {
            var previous = this.remove(type);
            this.handlerDict[type] = handler;
            this.handlerOrder.splice(0, 0, type);
            return previous;
        };
        HandlerStore.prototype.get = function (type) {
            return this.handlerDict[type];
        };
        HandlerStore.prototype.remove = function (type) {
            if (type in this.handlerDict) {
                var k = _.indexOf(this.handlerOrder, type);
                if (k >= 0)
                    this.handlerOrder.splice(k, 1);
                delete this.handlerDict[type];
            }
            return null;
        };
        HandlerStore.prototype.find = function (fn) {
            for (var k = 0; k < this.handlerOrder.length; k++) {
                var handler = this.handlerDict[this.handlerOrder[k]];
                if (fn(handler))
                    return handler;
            }
        };
        return HandlerStore;
    })();
    var handlerStore = new HandlerStore();
    function registerHandler(type, handler) {
        return handlerStore.put(type, handler);
    }
    FlorianMath.registerHandler = registerHandler;
    // Default container
    FlorianMath.container = [];
    // MathItem callbacks
    function mathItemAttached(mathItem) {
        var rendered = FlorianMath._utils.makePromiseWithResolve();
        mathItem.setAttribute('role', 'math');
        mathItem._id = FlorianMath.container.length;
        FlorianMath.container.push(mathItem);
        mathItem._handler = handlerStore.get(mathItem.getAttribute('handler')) || handlerStore.find(function (h) { return h.canHandle(mathItem); });
        mathItem.rendered = function () { return rendered; };
        dom.async(function () {
            mathItemDOMReady(mathItem);
        });
    }
    function mathItemDOMReady(mathItem) {
        mathItem._handler.ready(mathItem);
    }
    function mathItemDetached(mathItem) {
        var index = mathItem._id;
        delete FlorianMath.container[index];
    }
    function addMathItem(el) {
        mathItemAttached(el);
    }
    FlorianMath.addMathItem = addMathItem;
    function removeMathItem(el) {
        mathItemDetached(el);
    }
    FlorianMath.removeMathItem = removeMathItem;
    if (document.registerElement) {
        var proto = Object.create(HTMLElement.prototype);
        proto.attachedCallback = function () {
            mathItemAttached(this);
        };
        proto.detachedCallback = function () {
            mathItemDetached(this);
        };
        document.registerElement('math-item', {
            prototype: proto
        });
    }
    else {
        // make browser accept this tag for IE < 9
        document.createElement('math-item');
        dom.ready().then(function () {
            var items = document.querySelectorAll('math-item');
            _.each(items, function (item) {
                addMathItem(item);
            });
        });
    }
})(FlorianMath || (FlorianMath = {}));
/// <reference path="promise.ts" />
/// <reference path="common-utils.ts" />
/// <reference path="dom-utils.ts" />
/// <reference path="xml-utils.ts" />
/// <reference path="math-item.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var dom = FlorianMath._utils.dom;
    function plainMarkup(el) {
        return FlorianMath.Promise.resolve([{ type: 'HTML', markup: el.innerHTML }]);
    }
    var PlainHandler = (function (_super) {
        __extends(PlainHandler, _super);
        function PlainHandler() {
            _super.apply(this, arguments);
        }
        PlainHandler.prototype.canHandle = function (el) {
            return true; // act as a catch-all
        };
        PlainHandler.prototype.ready = function (el) {
            _super.prototype.ready.call(this, el);
            el.getMarkup = function () { return plainMarkup(el); };
            el.rendered().resolve();
        };
        return PlainHandler;
    })(FlorianMath.Handler);
    function getMathMLMarkup(el, root) {
        if (root === null)
            return FlorianMath.Promise.resolve([]);
        return FlorianMath.Promise.resolve([
            { type: 'MathML', subtype: 'original', markup: el.innerHTML },
            { type: 'MathML', subtype: 'prettified', markup: FlorianMath._utils.xml.prettifyMathML(root) }
        ]);
    }
    var MathMLHandler = (function (_super) {
        __extends(MathMLHandler, _super);
        function MathMLHandler() {
            _super.apply(this, arguments);
        }
        MathMLHandler.getMathRoot = function (el) {
            var children = dom.getElementChildren(el);
            if (children.length === 1 && children[0].nodeName.toLowerCase() === 'math')
                return children[0];
            if (children.length && children[0] instanceof HTMLUnknownElement) {
                var doc = FlorianMath._utils.xml.parseXML(el.innerHTML);
                if (doc.documentElement && doc.documentElement.nodeName.toLowerCase() === 'math')
                    return doc.documentElement;
            }
            return null;
        };
        MathMLHandler.prototype.canHandle = function (el) {
            return MathMLHandler.getMathRoot(el) !== null;
        };
        MathMLHandler.prototype.ready = function (el) {
            _super.prototype.ready.call(this, el);
            var root = MathMLHandler.getMathRoot(el);
            el.getMarkup = function () { return getMathMLMarkup(el, root); };
            if (!el.hasAttribute('display')) {
                var value = root.getAttribute('display') || root.getAttribute('mode');
                if (value)
                    el.setAttribute('display', value);
            }
            el.rendered().resolve();
        };
        return MathMLHandler;
    })(FlorianMath.Handler);
    FlorianMath.registerHandler('plain-html', new PlainHandler());
    FlorianMath.registerHandler('native-mathml', new MathMLHandler());
})(FlorianMath || (FlorianMath = {}));
// MathJax extensions
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    function mathjaxClone(src, dest) {
        var script = src.querySelector('script[type]');
        if (script) {
            script = script.cloneNode(true);
            script.removeAttribute('id');
            script.removeAttribute('MathJax');
            dest.appendChild(script);
        }
        return new FlorianMath.Promise(function (resolve) {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, dest], resolve);
        });
    }
    function mathjaxMarkup(el, original, internal) {
        var result = [];
        var jaxs = MathJax.Hub.getAllJax(el);
        if (jaxs && jaxs.length === 1) {
            var jax = jaxs[0];
            result.push({ type: original[0], subtype: original[1], markup: jax.originalText });
            if (jax.root.toMathML) {
                result.push({ type: internal[0], subtype: internal[1], markup: '' });
                return new FlorianMath.Promise(function (resolve) {
                    function getMathML() {
                        try {
                            result[1].markup = jax.root.toMathML('');
                            resolve(result);
                        }
                        catch (err) {
                            // to trigger: https://groups.google.com/d/msg/mathjax-dev/ZYirx681dv0/RWspFIVwA2AJ
                            if (!err.restart) {
                                throw err;
                            }
                            MathJax.Callback.After(getMathML, err.restart);
                        }
                    }
                    getMathML();
                });
            }
        }
        return FlorianMath.Promise.resolve(result);
    }
    var MathJaxHandler = (function (_super) {
        __extends(MathJaxHandler, _super);
        function MathJaxHandler(original, internal) {
            _super.call(this);
            this.original = original;
            this.internal = internal;
        }
        MathJaxHandler.prototype.getMarkup = function (el) {
            return mathjaxMarkup(el, this.original, this.internal);
        };
        MathJaxHandler.prototype.ready = function (el) {
            var _this = this;
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, el], function () {
                el.rendered().resolve();
            });
            el.clonePresentation = function (dest) { return mathjaxClone(el, dest); };
            el.getMarkup = function () { return _this.getMarkup(el); };
        };
        return MathJaxHandler;
    })(FlorianMath.Handler);
    FlorianMath.registerHandler('tex', new MathJaxHandler(['TeX', 'original'], ['MathML', 'MathJax']));
    FlorianMath.registerHandler('mml', new MathJaxHandler(['MathML', 'original'], ['MathML', 'MathJax']));
})(FlorianMath || (FlorianMath = {}));
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    function cloner(src, dst) {
        var img = src.querySelector('img');
        if (img) {
            img = img.cloneNode(true);
            img.removeAttribute('id');
            dst.appendChild(img);
        }
        return FlorianMath.Promise.resolve();
    }
    function markup(el) {
        var result = [];
        var scripts = el.querySelectorAll('script[type="application/mathml+xml"]');
        if (scripts.length === 1) {
            var src = scripts[0].text, doc = FlorianMath._utils.xml.parseXML(src);
            result.push({
                type: 'MathML',
                subtype: 'original',
                markup: src
            });
            if (doc && doc.documentElement && doc.documentElement.nodeName === 'math')
                result.push({
                    type: 'MathML',
                    subtype: 'prettified',
                    markup: FlorianMath._utils.xml.prettifyMathML(doc.documentElement)
                });
        }
        return FlorianMath.Promise.resolve(result);
    }
    var EqnStoreHandler = (function (_super) {
        __extends(EqnStoreHandler, _super);
        function EqnStoreHandler() {
            _super.apply(this, arguments);
        }
        EqnStoreHandler.prototype.ready = function (el) {
            el.clonePresentation = function (dest) { return cloner(el, dest); };
            el.getMarkup = function () { return markup(el); };
            el.rendered().resolve();
        };
        return EqnStoreHandler;
    })(FlorianMath.Handler);
    FlorianMath.registerHandler('eqnstore', new EqnStoreHandler());
})(FlorianMath || (FlorianMath = {}));
