/// <reference path="jquery.d.ts" />
/// <reference path="../bower_components/math-item/math-item.d.ts" />

module FlorianMath {
    'use strict';

    var requireLibsResolve: (jq: JQueryStatic) => void;

    export var requireLibs: () => IPromise<JQueryStatic> = (function () {
        var promise = new Promise<JQueryStatic>((resolve: (jq: JQueryStatic) => void) => {
            requireLibsResolve = resolve;
        });
        return () => promise;
    })();

    function jQueryPresent() {
        return 'jQuery' in window && jQuery.fn.on;
    }

    function fail() {
        //console.log('Unable to load jQuery');
    }

    domReady().then(() => {
        if (!jQueryPresent()) {
            var IEpre9 = navigator.userAgent.match(/MSIE [6-8]/i),
                version = IEpre9 ? '1.11.2' : '2.1.3',
                script = document.createElement('script'),
                head = document.querySelector('head'),
                done = false;
            script.src = 'https://code.jquery.com/jquery-' + version + '.min.js';
            script.async = true;
            script.onload = script.onreadystatechange = () => {
                if (!done && (!script.readyState || script.readyState === "loaded" || script.readyState === "complete")) {
                    done = true;
                    //jQueryPresent() ? requireLibsResolve(<JQueryStatic> jQuery.noConflict(true)) : fail();
                    if (jQueryPresent()) {
                        //console.log('jQuery loaded');
                        requireLibsResolve(<JQueryStatic> jQuery.noConflict(true));
                    } else
                        fail();
                }
            };
            script.onerror = () => {
                if (!done) {
                    done = true;
                    fail();
                }
            };
            head.appendChild(script);
        } else
            requireLibsResolve(jQuery);
    });

}
