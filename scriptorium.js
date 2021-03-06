// Copyright (C) 2019-2021 by Shigeru Chiba.

'use strict'

function* range(from, to=null) {
  if (to === null) {
    to = from
    from = 0
  }
  while (from < to)
    yield from++
}

const Scriptorium = new class {
  constructor() {
    // HTML elements' ID
    this.filename_id = 'filename'
    this.zoom_id = 'zoom-inout'
    this.chooser_id = 'filechooser'
    this.downloader_id = 'downloader'
    this.cells_id = 'cells'
    this.editor_id = 'editor'
    this.output_id = 'output'
    this.canvas_id = 'canvas'
    this.bottom_id = 'bottom'
    this.run_btn1_id = 'run-btn1'
    this.run_btn2_id = 'run-btn2'
    this.run_and_new_id = 'run-and-new'

    this.editorArea = null
    this.consoleText = ''
    this.storageKeyName = location.pathname + '/program'
    this.backupFileName = location.pathname + '/backup'

    this.isPC = !('ontouchend' in document)
    this.isSafari = new Error().line
    this.isFirefox = new Error().lineNumber
    this.running_src = ''

    this.audioContext = null

    this.ErrorLine = class {
      constructor(line, e) {
        this.line = line ? line : '?'
        this.error = e
      }
    }
  }

  onload() {
    this.initializeAudio()
    const keymap = { 'Tab': 'autocomplete' }
    if (this.isPC)
      keymap['Shift-Enter'] = function(cm){ Scriptorium.run() }

    const editor = document.getElementById(this.editor_id)
    this.editorArea = CodeMirror(editor, {
      mode: 'javascript',
      value: this.restoreAutoSaved(),
      lineNumbers: true,
      keyMap: 'emacs',
      matchBrackets: true,
      extraKeys: keymap,
      gutters: ["CodeMirror-lint-markers"],
      lint: { asi: true,
              esversion: 10 },
    })

    this.editorArea.on('change', this.makeAutoSaver())

    const zoomInOut = document.getElementById(this.zoom_id)
    zoomInOut.innerHTML = Scriptorium.Msg.zoomOut
    const filechooser = document.getElementById(this.chooser_id)
    filechooser.onchange = (evt) => { this.readTextFile(evt.target.files[0]) }
    const downloader = document.getElementById(this.downloader_id)
    downloader.onmousedown = () => { this.makeDownloadLink() }

    this.resizeCanvas()
    this.editorArea.setSize('100%', '400px')
    this.editorArea.focus()
  }

  initializeAudio() {
    this.audioContext = function(win) {
      const AudioContext = win.AudioContext || win.webkitAudioContext
      return AudioContext ? new AudioContext() : null
    }(window)
  }

  resizeCanvas() {
    const editor = document.getElementById(this.editor_id)
    const editorWidthWithMargin = editor.clientWidth + 30
    let w = document.body.clientWidth - editorWidthWithMargin
    let h = document.body.parentNode.clientHeight - 100
    if (h < w)
      w = h

    if (w < 360 || (w < 400 && w < screen.availWidth - editorWidthWithMargin))
      w = 690

    const c = document.getElementById(this.canvas_id)
    const ctx = c.getContext('2d')
    const img = ctx.getImageData(0, 0, w, w)
    c.width = w
    c.height = w
    ctx.putImageData(img, 0, 0)
  }

  // get the editor's content in a format writable into a file.
  // this may return '' but does not return null.
  getSourceFromEditor() {
    return this.getProgramFromEditor()
  }

  // get a JavaScript program from the editor.
  // this returns a non-null string object.
  getProgramFromEditor() {
    return this.editorArea.getDoc().getValue()
  }

  // source may be null or ''.
  writeSourceToEditor(source) {
    if (source === null)
      source = ''

    this.writeProgramToEditor(source)
  }

  // program must be a non-null string object.
  writeProgramToEditor(program) {
    this.editorArea.getDoc().setValue(program)
  }

  // this may return '' when no backup is found.
  restoreAutoSaved() {
    const text = localStorage.getItem(this.backupFileName)
    if (text === null)
      return ''
    else
      return String(text)
  }

  makeAutoSaver() {
    const timeout = 3000 /* msec. */
    const autosaver = () => {
      const text = this.getSourceFromEditor()
      if (text === '' || text === null)
        localStorage.removeItem(this.backupFileName)
      else
        localStorage.setItem(this.backupFileName, text)
    }

    const debounce = (f, timeout) => {
      let timer
      return () => {
        if (timer)
          clearTimeout(timer)

        timer = setTimeout(() => f(), timeout)
      }
    }

    return debounce(autosaver, timeout)
  }

  /*
    Control flow:
    run() -> evalSrc() -> postRun()             -> T.runTurtle()
          -> runSrc()  ~> postRun()             -> T.runTurtle()
                       ~> onerror -> postRun()  -> T.runTurtle()

    -> T.runTurtle() -> T.endTurtle()
                     ~> timer -> run()     ~> timer
                              -> End.run() -> endRunning() -> T.endTurtle()
                              -> StartProcessing.run() -> T.stopTurtle()
                     ~> stopRunning() -> T.stopTurtle()

    -> T.stopTurtle() -> endRunning() -> T.endTurtle()

    ~> : callback
    -> : function call
    T. : TurtleCmd
  */

  run() {
    this.turtleCmd.beeper.enableBeep()    // for Safari
    const src = this.getProgramFromEditor()
    if (src === '')
      return

    if (this.isSafari)
      this.evalSrc(src)
    else
      this.runSrc(src)
  }

  evalSrc(src) {
    let success = true
    let result = null
    Scriptorium.running_src = src
    const geval = eval
    try {
      // MDN web docs:
      // If you use the eval function indirectly,
      // by invoking it via a reference other than eval,
      // it works in the global scope rather than the local scope.
      // If it works in the local scope, the declared functions there
      // are not globally visible.
      result = geval(src)
    }
    catch (e) {
      success = false
      result = this.toErrorLine(e)
      Scriptorium.turtleCmd.pushAlert(Scriptorium.Msg.alert(result.line, e))
    }

    this.postRun(src, success, result)
  }

  toErrorLine(e) {
    // e.line is available only on Safari
    // e.lineNumber is available only on Firefox
    let line = e.line ? e.line : e.lineNumber
    // Safari does not report a correct line number when the error is a syntax error.
    if (e instanceof SyntaxError)
      line = false

    return new this.ErrorLine(line, e)
  }

  runSrc(src) {
    window.onerror = (msg, src, line, col, err) => {
      const result = err === null ? msg : err
      if (typeof err === 'string')
        line = '?'    // thrown by Scriptorium.TurtleCmd.assertNumber()

      Scriptorium.turtleCmd.pushAlert(Scriptorium.Msg.alert(line, result))
      Scriptorium.postRun(Scriptorium.running_src, false, new this.ErrorLine(line, result))
      return false   // call the default error handler
    }

    Scriptorium.running_src = src
    const s = document.createElement('script')
    if (this.isFirefox)
      s.innerHTML = 'try{ ' + src + '\n ;\n}catch(e){throw e}\nScriptorium.postRun(Scriptorium.running_src, true, undefined);\n'
    else
      s.innerHTML = '{ ' + src + '\n ;\n}\nScriptorium.postRun(Scriptorium.running_src, true, undefined);\n'

    document.body.appendChild(s)
  }

  postRun(src, success, result) {
    Scriptorium.turtleCmd.pushEnd(src, success, result)
    this.consoleText = ''

    const btn1 = document.getElementById(this.run_btn1_id)
    const btn2 = document.getElementById(this.run_btn2_id)
    btn1.innerHTML = btn2.innerHTML = Scriptorium.Msg.stop
    btn1.onclick = btn2.onclick = (ev) => { Scriptorium.stopRunning() }

    const canvas = document.getElementById(this.canvas_id)
    const ctx = canvas.getContext('2d')
    Scriptorium.turtleCmd.runTurtle(canvas, ctx)
    window.onerror = null
    if (this.isPC)
      this.editorArea.focus()
  }

  // callback from turtle.js
  print(values) {
    let value = ''
    if (values instanceof Array)
      for (const v of values)
        value += v + ' '
    else
      value = values

    const value2 = this.escapeHTML(value) + '<br/>'
    this.consoleText += value2
    const out = document.getElementById(this.output_id)
    out.innerText += value + '\n'
  }

  // callback from turtle.js
  endRunning(src, success, result) {
    const run_and_new = document.getElementById(this.run_and_new_id).checked
    const cells = document.getElementById(this.cells_id)
    if (run_and_new)
      cells.innerHTML += '<pre class="codebox">' + this.escapeHTML(src) + '</pre>'

    cells.innerHTML += '<p>'
    cells.innerHTML += this.consoleText
    if (result !== undefined)
      cells.innerHTML += this.escapeHTML(this.getResultingMessage(result))

    cells.innerHTML += '</p>'
    cells.onclick = (ev) => { ev.target.focus() }
    if (success && run_and_new) {
      if (this.getProgramFromEditor() == src) {
        const editor = this.editorArea
        CodeMirror.emacs.kill(editor, { line: 0, ch: 0 }, {line: editor.lineCount(), ch: 0 }, true)
      }
    }

    this.changeStopButton()
    const out = document.getElementById(this.output_id)
    out.innerText = ''
    if (this.isPC) {
      this.editorArea.focus()
      document.getElementById(this.bottom_id).scrollIntoView(false)
    }
  }

  getResultingMessage(result) {
    if (result instanceof this.ErrorLine)
      return `${result.error} (line: ${result.line})`
    else
      return result
  }

  // event handler for the "Stop" button
  stopRunning() {
    Scriptorium.turtleCmd.stopTurtle(true, undefined)
    this.changeStopButton()
    if (this.isPC)
      this.editorArea.focus()
  }

  changeStopButton() {
    const btn1 = document.getElementById(this.run_btn1_id)
    const btn2 = document.getElementById(this.run_btn2_id)
    btn1.innerHTML = btn2.innerHTML = Scriptorium.Msg.run
    btn1.onclick = btn2.onclick = (ev) => { Scriptorium.run() }
  }

  buttonClicked(key) {
    this.turtleCmd.processingCmd.callKeyPressed(key)
  }

  reset() {
    const canvas = document.getElementById(this.canvas_id)
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const out = document.getElementById(this.output_id)
    out.innerText = ''
    Scriptorium.turtleCmd.reset()
    if (this.isPC)
      this.editorArea.focus()
  }

  save() {
    const program = this.getSourceFromEditor()
    if (program !== null
        && confirm(Scriptorium.Msg.save)) {
      localStorage.setItem(this.storageKeyName, JSON.stringify(program))
      this.editorArea.focus()
    }
  }

  load() {
    const program = localStorage.getItem(this.storageKeyName)
    if (program != null
        && confirm(Scriptorium.Msg.load)) {
      this.writeSourceToEditor(JSON.parse(program))
      this.editorArea.focus()
    }
  }

  yank() {
    this.writeProgramToEditor(Scriptorium.running_src)
    if (this.isPC)
      this.editorArea.focus()
  }

  clearSource() {
    this.writeSourceToEditor(null)
    if (this.isPC)
      this.editorArea.focus()
  }

  toggleMenu() {
    document.getElementById('nav').classList.toggle('in')
    document.getElementById('hmenu').classList.toggle('in')
  }

  closeMenu() {
    document.getElementById('nav').classList.remove('in')
    document.getElementById('hmenu').classList.remove('in')
  }

  changeFontSize() {
    const menuItem = document.getElementById(Scriptorium.zoom_id)
    if (document.body.className == 'small-font') {
      document.body.classList.remove('small-font')
      menuItem.innerHTML = Scriptorium.Msg.zoomOut
    }
    else {
      document.body.classList.add('small-font')
      menuItem.innerHTML = Scriptorium.Msg.zoomIn
    }
  
    this.toggleMenu()
  }

  readTextFile(f) {
    const reader = new FileReader()
    reader.onload = (event) => {
      this.writeSourceToEditor(event.target.result)
      this.editorArea.focus()
    }
    reader.readAsText(f)
    this.toggleMenu()
  }

  makeDownloadLink() {
    const filename = document.getElementById(Scriptorium.filename_id).value
    let mimeType = 'text/plain'
    if (filename.endsWith('.js'))
      mimeType = 'text/javascript'
    else if (filename.endsWith('.html') || filename.endsWith('.htm'))
      mimeType = 'text/html'
    else if (filename.endsWith('.xml'))
      mimeType = 'application/xml'

    const program = this.getSourceFromEditor()
    const blob = new Blob([program], { 'type' : mimeType })
    const downloader = document.getElementById(this.downloader_id)
    window.URL.revokeObjectURL(downloader.href)
    downloader.href = window.URL.createObjectURL(blob)
    downloader.download = filename
    this.toggleMenu()
  }

  escapeHTML(str) {
    let out = ''
    for (const c of str + '') {
      if(c === '<')
        out += '&lt;'
      else if(c === '>')
        out += '&gt;'
      else if(c === "'")
        out += '&#39;'
      else if(c === '"')
        out += '&quot;'
      else if(c === '&')
        out += '&amp;'
      else
        out += c
    }
    return out
  }
}

window.onload = function () { Scriptorium.onload() }
