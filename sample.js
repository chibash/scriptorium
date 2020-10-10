// Copyright (C) 2019 by Shigeru Chiba.

function copyCode(name) {
  // const code = document.getElementById(name).innerText
  // navigator.clipboard.writeText(code)
  this.execCopy(name)
}

function execCopy(name) {
  target = document.getElementById(name)
  target.select()
  document.execCommand("copy");
}

for (const elm of document.getElementsByTagName('textarea')) {
    elm.readOnly = true
    elm.classList.add('codebox')
    elm.wrap = 'off'
    const len = elm.value.match(/\n/g).length
    elm.rows = len < 30 ? len + 1 : 30
}
