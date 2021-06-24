// Copyright (C) 2019-2021 by Shigeru Chiba.

'use strict'

Scriptorium.Blockly = new class {
  constructor() {
    this.toolbox_id = 'toolbox'
    this.workspace = null
    this.invalidXmlMsg = 'ファイルをうまく読み取れませんでした'
  }

  setWorkspace(w) { this.workspace = w }

  getProgram() {
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null
    return Blockly.JavaScript.workspaceToCode(this.workspace)
  }

  // make an object pretending as a CodeMirror object.
  getEditorArea() {
    return new class { focus() {} }
  }

  getXml() {
    const num = this.workspace.getAllBlocks().length
    if (num === 0)
      return ''
    else {
      const xmlDom = Blockly.Xml.workspaceToDom(this.workspace)
      const xmlText = Blockly.Xml.domToPrettyText(xmlDom)
      return xmlText
    }
  }

  setXml(xmlSource) {
    if (xmlSource === null || xmlSource === '')
      return

    try {
      const xmlDom = Blockly.Xml.textToDom(xmlSource);
      if (xmlDom) {
        this.workspace.clear();
        Blockly.Xml.domToWorkspace(xmlDom, this.workspace);
      }
    } catch (e) {
      alert(this.invalidXmlMsg)
    }
  }

  clearEditor() {
    this.workspace.clear()
  }
}

Scriptorium.onload = function () {
  this.editorArea = this.Blockly.getEditorArea()
  this.initializeAudio()
  const workspace = Blockly.inject(this.editor_id,
    { toolbox: document.getElementById(this.Blockly.toolbox_id),
      renderer: 'thrasos' })

  this.Blockly.setWorkspace(workspace)

  this.Blockly.setXml(this.restoreAutoSaved())
  workspace.addChangeListener(this.makeAutoSaver())

  const filechooser = document.getElementById(this.chooser_id)
  filechooser.onchange = (evt) => { this.readTextFile(evt.target.files[0]) }
  const downloader = document.getElementById(this.downloader_id)
  downloader.onmousedown = () => { this.makeDownloadLink() }
  this.resizeCanvas()
}

// this may return ''.
Scriptorium.getSourceFromEditor = function () {
  return this.Blockly.getXml()
}

Scriptorium.getProgramFromEditor = function () {
  return this.Blockly.getProgram()
}

Scriptorium.writeSourceToEditor = function (source) {
  if (source === null || source === '')
    this.Blockly.clearEditor()
  else
    this.Blockly.setXml(source)
}

Scriptorium.writeProgramToEditor = function () {
  this.Blockly.clearEditor()
}
