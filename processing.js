// Copyright (C) 2019 by Shigeru Chiba.

// the following code depends on scriptorium.js

setup = undefined
draw = undefined

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
        return v
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
      this.pen.rect(x, y, width, height)
      if (this.penWithFill)
        this.pen.fill()

        if (this.penWithStroke)
        this.pen.stroke()
    }
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
  }

  initFrameRate() {
    this.frameInterval = 1000 / 10 // msec.  10 fps.
  }

  suspend() {
    this.initFrameRate()
    this.suspended = true
    if (this.canvas) {
      this.canvas.onmousemove = null
      this.canvas = null
    }
  }

  callSetup(ctx, timestamp) {
    this.suspended = false
    this.startTime = timestamp
    this.canvas = ctx.canvas
    const pr = this.processing
    pr.frameCount = -1
    this.canvas.onmousemove = event => {
      const rect = this.canvas.getBoundingClientRect()
      pr.mouseX = event.pageX - rect.left - window.pageXOffset
      pr.mouseY = event.pageY - rect.top - window.pageYOffset
    }
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
      return true
  }

  // prepare a Processing object for every callback
  setupProc(ctx) {
    const pr = this.processing
    pr.pen = ctx
    pr.fill('#ffffff')
    pr.stroke('#000000')
    pr.width = ctx.canvas.width - 1
    pr.height = ctx.canvas.height - 1
  }
}
