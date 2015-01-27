var fs = require('fs'),
    css = require('css'),
    filename = process.argv[2],
    src = fs.readFileSync(filename, 'utf8'),
    obj = css.parse(src, { source: filename }),
    tags = {}, tagList = [];
    
function check(container) {
    container.rules.forEach(function (rule) {
        if (rule.type === 'rule') {
            rule.selectors.forEach(function (selector) {
                var items = selector.split(/[ >+~]+/);
                items.forEach(function (item) {
                    item = item.replace(/\.[\w.-]+/g, '');
                    item = item.replace(/\[[^\]]*\]/g, '');
                    item = item.replace(/:+[\w()-]+/g, '');
                    if (item && item.charAt(0) !== '@' && item !== '*' && !(item in tags)) {
                        tags[item] = true;
                        tagList.push(item);
                    }
                });
            });
        } else if (rule.type === 'media') {
            check(rule);
        }
    });
}

check(obj.stylesheet);    
    
console.log("['" + tagList.sort().join("', '") + "']");
