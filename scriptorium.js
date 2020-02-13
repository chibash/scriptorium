// Copyright (C) 2019 by Shigeru Chiba.

'use strict';

function* range(from, to=null) {
  if (to == null) {
    to = from
    from = 0
  }
  while (from < to)
    yield from++
}

const Scriptorium = new class {
  constructor() {
    // HTML elements' ID
    this.cells_id = 'cells'
    this.editor_id = 'editor'
    this.output_id = 'output'
    this.canvas_id = 'canvas'
    this.bottom_id = 'bottom'
    this.run_btn1_id = 'run_btn1'
    this.run_btn2_id = 'run_btn2'

    this.editorArea = null;
    this.consoleText = '';
    this.class_name = 'scriptorium';

    this.isPC = !('ontouchend' in document)
    this.isSafari = new Error().line
    this.running_src = null

    this.ErrorLine = class {
      constructor(line, e) {
        this.line = line
        this.error = e
      }
    }
  }

  onload() {
    const sample = '';

    const editor = document.getElementById(this.editor_id);
    this.editorArea = CodeMirror(editor, {
      mode: 'javascript',
      value: sample,
      lineNumbers: true,
      keyMap: 'emacs',
      matchBrackets: true,
      extraKeys: { 'Shift-Enter': function(cm){ Scriptorium.run(); },
                   'Tab': 'autocomplete' },
      gutters: ["CodeMirror-lint-markers"],
      lint: { asi: true,
              esversion: 10 },
    });

    this.resizeCanvas();
    this.editorArea.setSize('100%', '400px');
    this.editorArea.focus();
  }

  resizeCanvas() {
    const editor = document.getElementById(this.editor_id);
    let w = document.body.clientWidth - editor.clientWidth - 50;
    let h = document.body.clientHeight - 100;
    if (h < w)
      w = h;

    if (w < 400)
      w = 690;

    const c = document.getElementById(this.canvas_id);
    const ctx = c.getContext('2d');
    const img = ctx.getImageData(0, 0, w, w);
    c.width = w;
    c.height = w;
    ctx.putImageData(img, 0, 0);
  }

  run() {
    const src = this.editorArea.getDoc().getValue();
    if (src === '')
      return;

    if (this.isSafari)
      this.eval_src(src)
    else
      this.run_src(src)
  }

  eval_src(src) {
    let success = true
    let result = null
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
      const line = e.line    // e.line is available only on Safari
      result = new this.ErrorLine(line, e)
      Scriptorium.turtleCmd.pushAlert(Scriptorium.Msg.alert(line ? line : '?', e));
    }

    this.post_run(src, success, result)
  }

  run_src(src) {
    window.onerror = (msg, src, line, col, err) => {
      const result = err === null ? msg : err
      Scriptorium.turtleCmd.pushAlert(Scriptorium.Msg.alert(line, result))
      Scriptorium.post_run(Scriptorium.running_src, false, new this.ErrorLine(line, result))
      return false;   // call the default error handler
    }

    Scriptorium.running_src = src
    const s = document.createElement('script');
    s.innerHTML = src + '\n ;\nScriptorium.post_run(Scriptorium.running_src, true, undefined);\n'
    document.body.appendChild(s);
  }

  post_run(src, success, result) {
    Scriptorium.turtleCmd.pushEnd(src, success, result)
    this.consoleText = ''

    const btn1 = document.getElementById(this.run_btn1_id)
    const btn2 = document.getElementById(this.run_btn2_id)
    btn1.value = btn2.innerHTML = Scriptorium.Msg.stop
    btn1.onclick = btn2.onclick = (ev) => { Scriptorium.stop_running() }

    const canvas = document.getElementById(this.canvas_id)
    const ctx = canvas.getContext('2d');
    Scriptorium.turtleCmd.runTurtle(canvas, ctx)
    window.onerror = null
    if (this.isPC)
      this.editorArea.focus();
  }

  // callback from turtle.js
  print(values) {
    let value = ''
    if (values instanceof Array)
      for (const v of values)
        value += v + ' '
    else
      value = values

    const value2 = this.escapeHTML(value) + '<br/>';
    this.consoleText += value2;
    const out = document.getElementById(this.output_id);
    out.innerText += value + '\n';
  }

  // callback from turtle.js
  end_running(src, success, result) {
    const cells = document.getElementById(this.cells_id);
    cells.innerHTML += '<pre class="codebox">' + this.escapeHTML(src) + '</pre><p>';
    cells.innerHTML += this.consoleText;
    if (result !== undefined)
      cells.innerHTML += this.escapeHTML(this.get_result_message(result))

    cells.innerHTML += '</p>'
    if (success) {
      const editor = this.editorArea
      if (editor.getDoc().getValue() == src)
        CodeMirror.emacs.kill(editor, { line: 0, ch: 0 }, {line: editor.lineCount(), ch: 0 }, true);
    }

    this.change_stop_button()
    const out = document.getElementById(this.output_id);
    out.innerText = ''
    if (this.isPC) {
      this.editorArea.focus();
      document.getElementById(this.bottom_id).scrollIntoView(false);
    }
  }

  get_result_message(result) {
    if (result instanceof this.ErrorLine)
      return `${result.error} (line: ${result.line})`
    else
      return result
  }

  stop_running() {
    const canvas = document.getElementById(this.canvas_id)
    const ctx = canvas.getContext('2d');
    Scriptorium.turtleCmd.stopTurtle(ctx)
    this.change_stop_button()
    if (this.isPC)
      this.editorArea.focus();
  }

  change_stop_button() {
    const btn1 = document.getElementById(this.run_btn1_id)
    const btn2 = document.getElementById(this.run_btn2_id)
    btn1.value = btn2.innerHTML = Scriptorium.Msg.run
    btn1.onclick = btn2.onclick = (ev) => { Scriptorium.run() }
  }

  reset() {
    const canvas = document.getElementById(this.canvas_id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const out = document.getElementById(this.output_id);
    out.innerText = ''
    Scriptorium.turtleCmd.reset();
    this.editorArea.focus();
  }

  save() {
    const program = this.editorArea.getDoc().getValue();
    if (program != null
        && confirm(Scriptorium.Msg.save)) {
      localStorage.setItem(this.class_name, JSON.stringify(program));
      this.editorArea.focus();
    }
  }

  load() {
    const program = localStorage.getItem(this.class_name);
    if (program != null
        && confirm(Scriptorium.Msg.load)) {
      this.editorArea.getDoc().setValue(JSON.parse(program));
      this.editorArea.focus();
    }
  }

  escapeHTML(str) {
    let out = '';
    for (const c of str + '') {
      if(c === '<')
        out += '&lt;';
      else if(c === '>')
        out += '&gt;';
      else if(c === "'")
        out += '&#39;';
      else if(c === '"')
        out += '&quot;';
      else if(c === '&')
        out += '&amp;';
      else
        out += c;
    }
    return out;
  }
}

window.onload = function () { Scriptorium.onload(); }
