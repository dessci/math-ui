import json
import fileinput
import re

varpattern = re.compile(r'\s*(@.*)\s*:\s*(\S+);\s*')

vars = {}
config = {
  "vars": vars,
  "css": [
    "type.less",
    "code.less",
    "forms.less",
    "buttons.less",
    "responsive-utilities.less",
    "button-groups.less",
    "input-groups.less",
    "navs.less",
    "list-group.less",
    "panels.less",
    "wells.less",
    "close.less",
    "modals.less"
  ],
  "js": [
    "modal.js"
  ]
}

for line in fileinput.input():
    match = varpattern.match(line)
    if match:
        vars[match.group(1)] = match.group(2)

print(json.dumps(config, indent=2, separators=(',', ': ')))
