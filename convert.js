var fs = require('fs'),
    css = require('css'),
    filename = process.argv[2],
    src = fs.readFileSync(filename, 'utf8'),
    obj = css.parse(src, { source: filename }),
    allTags = ['a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote', 'body', 'button', 'canvas', 'caption', 'code', 'col', 'colgroup', 'dd', 'details', 'dfn', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'kbd', 'label', 'legend', 'li', 'main', 'mark', 'menu', 'nav', 'object', 'ol', 'optgroup', 'output', 'p', 'pre', 'progress', 'samp', 'section', 'select', 'small', 'strong', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'tr', 'ul', 'video'],
    baseTags = ['html', 'body'],
    keepTags = ['a', 'button', 'div', 'h4', 'h5', 'h6', 'input', 'label', 'li', 'span', 'textarea', 'ul'],
    ignoreTags = allTags.filter(function(tag) {return keepTags.indexOf(tag) < 0 && baseTags.indexOf(tag) < 0;}),
    baseTagRegEx = new RegExp('^(' + baseTags.join('|') + ')\\b(.*)', 'i');
    ignoreTagRegEx = new RegExp('(^| )(' + ignoreTags.join('|') + ')\\b', 'i'),
    wildCardRegEx = /^\*(:\w+)?/;
var match, extra, post;

function convertRules(container) {
    container.rules.forEach(function (rule) {
        if (rule.type === 'rule') {
            extra = [];
            rule.selectors = rule.selectors.filter(function (selector) {
                match = wildCardRegEx.exec(selector);
                if (match) {
                    post = match[1] ? match[1] : '';
                    if (selector.match(/ ~>+/))
                        throw new Error('Not supported: ' + selector);
                    keepTags.forEach(function (tag) {
                        extra.push('.math-ui ' + tag + post);
                    });
                    return false;
                }
                return !ignoreTagRegEx.exec(selector);
            }).map(function (selector) {
                match = baseTagRegEx.exec(selector);
                if (match)
                    return '.math-ui' + match[2];
                return '.math-ui ' + selector;
            });
            rule.selectors = rule.selectors.concat(extra);
        } else if (rule.type === 'media') {
            convertRules(rule);
        }
    });
    container.rules = container.rules.filter(function (rule) {
        return rule.type !== 'rule' || rule.selectors.length;
    });
}

convertRules(obj.stylesheet);
    
console.log(css.stringify(obj));
