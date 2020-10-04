// Copyright (C) 2019 by Shigeru Chiba.

// the following code depends on scriptorium.js

setup = undefined
draw = undefined
mouseClicked = undefined
keyPressed = undefined

Scriptorium.Processing = class {
  constructor(proc_cmd) {
    this.processingCmd = proc_cmd
    this.pen = null
    this.penWithStroke = false
    this.penWithFill = false
    this.frameCount = 0
    this.width = 0
    this.height = 0
    this.mouseX = 0
    this.mouseY = 0
    this.key = 0
  }

  start() {
    if (!this.processingCmd.turtleCmd.running)
      this.processingCmd.turtleCmd.pushStartProcessing()
  }

  stop() {
    this.processingCmd.suspend()
    this.pen = null
  }

  frameRate(rate) {
    const interval = rate <= 0 ? 60000 : rate > 60 ? 60 : 1000 / rate
    this.processingCmd.frameInterval = interval
  }

  background(r, ...args) {
    if (this.pen == null)
      return

      const old_style = this.pen.fillStyle
    if (typeof(r) === 'number') {
      const g = args[0] || r
      const b = args[1] || r
      this.pen.fillStyle = this.color(r, g, b)
    }
    else
      this.pen.fillStyle = r

    this.pen.fillRect(0, 0, this.width, this.height)
    this.pen.fillStyle = old_style
  }

  color(red, ...args) {
    const bit8 = (v) => {
      if (v < 0)
        return 0
      else if (v > 255)
        return 255
      else
        return Math.floor(v)
    }
    const green = args[0] || red
    const blue = args[1] || red
    if (args[2]) {
      const alpha = args[2] < 0 ? 0 : (args[2] > 1 ? 1 : args[2])
      return `rgba(${bit8(red)}, ${bit8(green)}, ${bit8(blue)}, ${alpha})`
    }
    else
      return `rgb(${bit8(red)}, ${bit8(green)}, ${bit8(blue)})`
  }

  textFont(f) {
    if (this.pen != null)
      this.pen.font = f
  }

  noFill() {
    this.penWithFill = false
  }

  fill(style) {
    this.penWithFill = true
    if (this.pen != null)
      this.pen.fillStyle = typeof style == 'number' ? this.color(style) : style
  }

  noStroke() {
    this.penWithStroke = false
  }

  stroke(style) {
    this.penWithStroke = true
    if (this.pen != null)
      this.pen.strokeStyle = typeof style == 'number' ? this.color(style) : style
  }

  text(t, x, y) {
    if (this.pen != null) {
      if (this.penWithFill)
        this.pen.fillText(t, x, y)

      if (this.penWithStroke)
        this.pen.strokeText(t, x, y)
    }
  }

  line(x1, y1, x2, y2) {
    if (this.penWithStroke && this.pen != null) {
      this.pen.beginPath()
      this.pen.moveTo(x1, y1)
      this.pen.lineTo(x2, y2)
      this.pen.stroke()
    }
  }

  rect(x, y, width, height) {
    if (this.pen != null) {
      this.pen.beginPath()
      this.pen.rect(x, y, width, height)
      if (this.penWithFill)
        this.pen.fill()

      if (this.penWithStroke)
        this.pen.stroke()
    }
  }

  arc(x, y, w, h, start, stop) {
    if (this.pen != null) {
      if (this.penWithFill) {
        this.pen.beginPath()
        this.pen.moveTo(x, y)
        this.pen.ellipse(x, y, w, h, 0, start, stop)
        this.pen.lineTo(x, y)
        this.pen.fill()
      }

      if (this.penWithStroke) {
        this.pen.beginPath()
        this.pen.ellipse(x, y, w, h, 0, start, stop)
        this.pen.stroke()
      }
    }
  }

  circle(x, y, r) {
    this.ellipse(x, y, r, r)
  }

  ellipse(x, y, w, h) {
    if (this.pen != null) {
      if (this.penWithFill) {
        this.pen.beginPath()
        this.pen.ellipse(x, y, w, h, 0, 0, Math.PI * 2.0)
        this.pen.fill()
      }

      if (this.penWithStroke) {
        this.pen.beginPath()
        this.pen.ellipse(x, y, w, h, 0, 0, Math.PI * 2.0)
        this.pen.stroke()
      }
    }
  }

  beep(...args) {
    const freq = args[0] || 440
    const length = args[1] || 100 /* msec */
    this.processingCmd.turtleCmd.startBeep(freq, length)
  }
}

Scriptorium.ProcessingCmd = class {
  constructor(turtle_cmd) {
    this.turtleCmd = turtle_cmd
    this.processing = new Scriptorium.Processing(this)
    this.suspended = true
    this.initFrameRate()
    this.startTime = 0
    this.canvas = null
    this.prevFunctions = {}
  }

  initFrameRate() {
    this.frameInterval = 1000 / 10 // msec.  10 fps.
  }

  suspend() {
    this.initFrameRate()
    this.suspended = true
    this.processing.pen = null
    if (this.canvas) {
      this.canvas.onmousemove = null
      this.canvas.onclick = null
      this.canvas.onkeydown = null
      this.canvas = null
    }
  }

  checkFunctions() {
    const funcs = this.prevFunctions
    if (funcs.setup != setup || funcs.draw != draw
        || funcs.mouseClicked != mouseClicked || funcs.keyPressed != keyPressed) {
      // When some of the functions are newly declared after the last call
      // to pro.start(), the other functions are set to undefined.
      if (funcs.setup == setup)
        setup = undefined
      if (funcs.draw == draw)
        draw = undefined
      if (funcs.mouseClicked == mouseClicked)
        mouseClicked = undefined
      if (funcs.keyPressed == keyPressed)
        keyPressed = undefined

      funcs.setup = setup
      funcs.draw = draw
      funcs.mouseClicked = mouseClicked
      funcs.keyPressed = keyPressed
    }
  }

  callSetup(ctx, timestamp) {
    this.checkFunctions()
    this.suspended = false
    this.startTime = timestamp
    this.canvas = ctx.canvas
    const pr = this.processing
    pr.frameCount = -1

    this.canvas.onmousemove = event => {
      pr.mouseX = event.offsetX
      pr.mouseY = event.offsetY
    }

    this.canvas.onclick = event => {
      pr.mouseX = event.offsetX
      pr.mouseY = event.offsetY
      if (mouseClicked instanceof Function) {
        this.setupProc(this.canvas.getContext('2d'))
        mouseClicked()
      }
    }

    this.canvas.onkeydown = event => {
      this.callKeyPressed(event.key)
    }

    if (keyPressed instanceof Function && Scriptorium.isPC)
      this.canvas.focus();

    if (setup instanceof Function) {
      this.setupProc(ctx)
      this.processing.frameCount += 1
      setup()
    }
  }

  // This returns true only when the processing stops.
  callDraw(ctx, timestamp) {
    if (draw instanceof Function) {
      const t = timestamp - this.startTime
      if (t > this.frameInterval * (this.processing.frameCount + 1)) {
        this.setupProc(ctx)
        this.processing.frameCount = Math.floor(t / this.frameInterval)
        draw()
        return this.suspended
      }
    }
    else
      return !(mouseClicked instanceof Function
               || keyPressed instanceof Function)
  }

  callKeyPressed(key) {
    if (this.canvas && keyPressed instanceof Function) {
      this.processing.key = key
      this.setupProc(this.canvas.getContext('2d'))
      keyPressed()
    }
  }

  // prepare a Processing object for every callback
  setupProc(ctx) {
    const pr = this.processing
    pr.pen = ctx
    pr.fill('#ffffff')
    pr.stroke('#000000')
    pr.textFont('32px sans-serif')
    pr.width = ctx.canvas.width - 1
    pr.height = ctx.canvas.height - 1
  }
}
