// Copyright (C) 2019-2020 by Shigeru Chiba.

Scriptorium.resizeCanvas = function () {}

Scriptorium.onload = function () {
    const sample = ''

    const keymap = { 'Tab': 'autocomplete' }
    const editor = document.getElementById(this.editor_id)
    this.editorArea = CodeMirror(editor, {
      mode: 'htmlmixed',
      value: sample,
      lineNumbers: true,
      keyMap: 'emacs',
      matchBrackets: true,
      extraKeys: keymap,
      gutters: ["CodeMirror-lint-markers"],
    })

    const zoomInOut = document.getElementById(this.zoom_id);
    zoomInOut.innerHTML = Scriptorium.Msg.zoomOut;
    const filechooser = document.getElementById(this.chooser_id)
    filechooser.onchange = (evt) => { this.readTextFile(evt.target.files[0]) }
    const downloader = document.getElementById(this.downloader_id)
    downloader.onmousedown = () => { this.makeDownloadLink() }

    this.editorArea.setSize('100%', '100%')
    this.editorArea.focus()
  }
