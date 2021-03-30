// Copyright (C) 2019-2021 by Shigeru Chiba.

function copyCode(name) {
  target = document.getElementById(name)
  // const code = target.innerText
  // navigator.clipboard.writeText(code)
  this.execCopy(target)
}

function execCopy(target) {
  target.select()
  document.execCommand("copy")
}

function copyToEditor(elm) {
  const editor = Scriptorium.editorArea
  editor.getDoc().setValue(elm.value)
  editor.focus()
  document.getElementById(Scriptorium.bottom_id).scrollIntoView(false)
}

for (const elm of document.getElementsByTagName('textarea')) {
    elm.readOnly = true
    elm.classList.add('codebox', 'codebox-size')
    elm.wrap = 'off'
    const len = elm.value.match(/\n/g).length
    elm.rows = len < 15 ? len + 1 : 15

    elm.parentNode.appendChild(document.createElement('br'))
    for (const cls of ['btn-normal', 'btn-smallscreen']) {
      const btn = document.createElement('button')
      btn.classList.add(cls)
      if (elm.id.startsWith('code16')) {
        btn.innerHTML = 'コピー'
        btn.onclick = () => execCopy(elm)
      } else {
        btn.innerHTML = '選択'
        btn.onclick = () => copyToEditor(elm)
      }
      elm.parentNode.appendChild(btn)
    }
}

window.onload = function () {
  Scriptorium.onload()
  Scriptorium.editorArea.getInputField().blur()
  window.scrollTo(0, 0)
}
