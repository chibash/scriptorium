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
    elm.rows = len < 30 ? len + 2 : 30

    elm.parentNode.appendChild(document.createElement('br'))
    for (const cls of ['btn-normal', 'btn-smallscreen']) {
      const btn = document.createElement('button')
      btn.classList.add(cls)
      btn.innerHTML = 'コピー'
      btn.onclick = () => copyCode(elm.id)
      elm.parentNode.appendChild(btn)
      const btn2 = document.createElement('button')
      btn2.classList.add(cls)
      btn2.innerHTML = '戻る'
      btn2.onclick = () => { document.location.href = 'index.html' }
      elm.parentNode.appendChild(btn2)
    }
}
