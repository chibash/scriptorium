// Copyright (C) 2019-2021 by Shigeru Chiba.

function copyCode(name) {
  // const code = document.getElementById(name).innerText
  // navigator.clipboard.writeText(code)
  this.execCopy(name)
}

function execCopy(name) {
  target = document.getElementById(name)
  target.select()
  document.execCommand("copy")
}

function copyToEditor(elm) {
  const editor = Scriptorium.editorArea
  editor.getDoc().setValue(elm.value)
  editor.focus()
  // editor.scrollIntoView(false)
  document.getElementById(Scriptorium.bottom_id).scrollIntoView(false)
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
      btn.innerHTML = '選択'
      btn.onclick = () => copyToEditor(elm)
      elm.parentNode.appendChild(btn)
    }
}
