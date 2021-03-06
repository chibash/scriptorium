// Copyright (C) 2019-2021 by Shigeru Chiba.

// the following code depends on scriptorium.js and processing.js

Scriptorium.stdConsoleLog = console.log
console.log = function(...args) {
  Scriptorium.stdConsoleLog.apply(console, args)
  if (Scriptorium.turtleCmd.isProcessing)
    Scriptorium.print(args)  // immediately print it.
  else
    Scriptorium.turtleCmd.push(new Scriptorium.Print(args))
}

Scriptorium.Turtle = class {
  constructor(cmd) {
    this.turtleCmd = cmd
    this.initialize()
    cmd.addTurtle(this)
  }

  initialize() {
    this.image_char = '\u{1f422}'
    this.x = this.y = 100
    this.direction = 0
    this.velocity = 1
    this.x_velocity = this.velocity
    this.y_velocity = 0.0
    this.penDown = true
    this.penColor = '#000000'  // black
    this.penWidth = 1
    this.bgImage = null
  }

  down() {
    this.turtleCmd.push(new Scriptorium.PenDown(this, true))
  }

  up() {
    this.turtleCmd.push(new Scriptorium.PenDown(this, false))
  }

  color(c) {
    this.turtleCmd.push(new Scriptorium.Color(this, c))
  }

  width(w) {
    this.turtleCmd.push(new Scriptorium.PenWidth(this, w))
  }

  image(c) {
    this.turtleCmd.push(new Scriptorium.Image(this, c))
  }

  speed(s) {
    this.turtleCmd.assertNumber('speed()', s)
    this.turtleCmd.push(new Scriptorium.Speed(this, s))
  }

  move(x, y) {
    this.turtleCmd.assertNumber('move(x,_)', x)
    this.turtleCmd.assertNumber('move(_,y)', y)
    this.turtleCmd.push(new Scriptorium.Move(this, x, y))
  }

  forward(d) {
    this.turtleCmd.assertNumber('forward()', d)
    this.turtleCmd.push(new Scriptorium.Forward(this, d))
  }

  left(d) {
    this.turtleCmd.assertNumber('left()', d)
    this.turtleCmd.push(new Scriptorium.Left(this, d))
  }

  right(d) {
    this.turtleCmd.assertNumber('right()', d)
    this.turtleCmd.push(new Scriptorium.Right(this, d))
  }
}

Scriptorium.PenDown = class {
  constructor(turtle, down) {
    this.turtle = turtle
    this.down = down
  }

  run(cmd, ctx, t) {
    this.turtle.penDown = this.down
    return true
  }
}

Scriptorium.Color = class {
  constructor(turtle, color) {
    this.turtle = turtle
    this.color = color
  }

  run(cmd, ctx, t) {
    this.turtle.penColor = this.color
    return true
  }
}

Scriptorium.PenWidth = class {
  constructor(turtle, width) {
    this.turtle = turtle
    this.penWidth = width
  }

  run(cmd, ctx, t) {
    this.turtle.penWidth = this.penWidth
    return true
  }
}

Scriptorium.Image = class {
  constructor(turtle, character) {
    this.turtle = turtle
    // since character might not be a string
    const str = String(character)
    const arr = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || ['@']
    this.character = arr[0]
  }

  run(cmd, ctx, t) {
    this.turtle.image_char = this.character
    return true
  }
}

Scriptorium.Speed = class {
  constructor(turtle, speed) {
    this.turtle = turtle
    this.speed = Math.max(speed, 0.1)
  }

  run(cmd, ctx, t) {
    this.turtle.velocity = this.speed
    cmd.updateVelocity(this.turtle)
    return true
  }
}

Scriptorium.Move = class {
  constructor(turtle, x, y) {
    this.turtle = turtle
    this.x = x
    this.y = y
  }

  run(cmd, ctx, t) {
    const turtle = this.turtle
    const xlen = this.x - turtle.x
    const ylen = this.y - turtle.y
    const sum = xlen * xlen + ylen * ylen
    if (turtle.velocity * turtle.velocity >= sum) {
      cmd.drawLine(this.turtle, ctx, this.x, this.y)
      return true
    }

    const speed = turtle.velocity / Math.sqrt(sum)
    const x2 = turtle.x + xlen * speed
    const y2 = turtle.y + ylen * speed
    cmd.drawLine(this.turtle, ctx, x2, y2)
    return false
  }
}

Scriptorium.Forward = class {
  constructor(turtle, distance) {
    this.turtle = turtle
    this.distance = distance
  }

  run(cmd, ctx, t) {
    const turtle = this.turtle
    if (this.distance > turtle.velocity) {
      this.distance -= turtle.velocity
      cmd.drawLine(turtle, ctx, turtle.x + turtle.x_velocity,
                   turtle.y + turtle.y_velocity)
      return false
    }
    else {
      const vx = turtle.x_velocity * this.distance / turtle.velocity
      const vy = turtle.y_velocity * this.distance / turtle.velocity
      cmd.drawLine(turtle, ctx, turtle.x + vx, turtle.y + vy)
      return true
    }
  }
}

Scriptorium.Left = class {
  constructor(turtle, degree) {
    this.turtle = turtle
    this.direction = degree
  }
  run(cmd, ctx, t) {
    this.turtle.direction += this.direction
    cmd.updateVelocity(this.turtle)
    return true
  }
}

Scriptorium.Right = class {
  constructor(turtle, degree) {
    this.turtle = turtle
    this.degree = degree
  }

  run(cmd, ctx, t) {
    this.turtle.direction -= this.degree
    cmd.updateVelocity(this.turtle)
    return true
  }
}

Scriptorium.Print = class {
  constructor(values) {
    this.message = values
  }

  run(cmd, ctx, t) {
    Scriptorium.print(this.message)
    return true
  }
}

Scriptorium.Alert = class {
  constructor(msg) {
    this.message = msg
  }

  run(cmd, ctx, t) {
    alert(this.message)
    return true
  }
}

Scriptorium.StartProcessing = class {
  constructor() {}

  run(cmd, ctx, timestamp) {
    window.onerror = (msg, src, line, col, err) => {
      let result
      if (err === null) {
        err = msg
        result = msg
      }
      else
        result = Scriptorium.toErrorLine(err)

      alert(Scriptorium.Msg.alert(line, err))
      cmd.stopTurtle(false, result)
      window.onerror = null
      return false   // call the default error handler
    }

    if (Scriptorium.isSafari)
      try {
        return this.runSetupOrDraw(cmd, ctx, timestamp)
      } catch (e) {
        const result = Scriptorium.toErrorLine(e)
        alert(Scriptorium.Msg.alert(result.line, e))
        cmd.stopTurtle(false, result)
        return true
      }
    else
      return this.runSetupOrDraw(cmd, ctx, timestamp)
  }

  runSetupOrDraw(cmd, ctx, timestamp) {
    if (cmd.isProcessing) {
      const result = cmd.processingCmd.callDraw(ctx, timestamp)
      window.onerror = null
      return result
    }
    else {
      cmd.isProcessing = true
      cmd.processingCmd.callSetup(ctx, timestamp)
      window.onerror = null
      return false
    }
  }
}

Scriptorium.End = class {
  constructor(src, success, result) {
    this.source = src
    this.success = success
    this.result = result
  }

  run(cmd, ctx, t) {
    Scriptorium.endRunning(this.source, this.success, this.result)
    return true
  }
}

Scriptorium.Beeper = class {
  constructor () {
    this.oscillator = null
    this.beepStopTime = -1
    this.beepOn = null
  }

  startBeep(freqency, duration) {   // Hz, msec.
    this.beepOn = [freqency, duration]
  }

  stopBeep() {
    if (this.oscillator)
      this.oscillator.stop()

    this.oscillator = null
    this.beepStopTime = -1
    this.beepOn = null
  }

  checkBeep(timestamp) {
    if (this.oscillator && timestamp > this.beepStopTime)
      this.stopBeep()

    if (this.beepOn) {
      this.startOscillator(this.beepOn[0], 0.5, timestamp + this.beepOn[1])
      this.beepOn = null
    }
  }

  enableBeep() {
    // Safari does not allow to play a sound until a click event handler
    // directly play a sound.  So we play a very short beep sound.
    this.startOscillator(440, 0.0, -1)
    this.stopBeep()
  }

  startOscillator(freq, gain, stopTime) {
    const ctx = Scriptorium.audioContext
    if (!this.oscillator && ctx) {
      const gainNode = ctx.createGain()
      gainNode.gain.value = gain   // audio gain
      const oscillator = ctx.createOscillator()
      oscillator.type = "sine"     // square, sawtooth, triangle
      oscillator.frequency.value = freq
      oscillator.connect(gainNode).connect(ctx.destination)
      oscillator.start()
      this.oscillator = oscillator
      this.beepStopTime = stopTime
    }
  }
}

Scriptorium.TurtleCmd = class {
  constructor() {
    this.commands = []
    this.turtles = []
    this.useTurtle = false
    this.running = false
    this.isProcessing = false
    this.processingCmd = new Scriptorium.ProcessingCmd(this)
    this.beeper = new Scriptorium.Beeper()
  }

  getProcessing() { return this.processingCmd.processing }

  addTurtle(turtle) {
    this.turtles.push(turtle)
  }

  push(cmd) {
    if (cmd instanceof Scriptorium.Alert
        || cmd instanceof Scriptorium.End
        || cmd instanceof Scriptorium.StartProcessing
        || cmd instanceof Scriptorium.Print)
      ; // do nothing
    else
      this.useTurtle = true

    this.commands.push(cmd)
  }

  assertNumber(msg, x) {
    if (x === undefined)
      throw Scriptorium.Msg.assertVal(msg)

    if (typeof x != 'number')
      throw Scriptorium.Msg.assertNum(msg)
  }

  // callback from processing.js
  pushStartProcessing() {
    this.push(new Scriptorium.StartProcessing())
  }

  // callback from processing.js
  startBeep(freqency, duration) {
    this.beeper.startBeep(freqency, duration)
  }

  pushAlert(msg) {
    this.push(new Scriptorium.Alert(msg))
  }

  pushEnd(src, success, result) {
    this.push(new Scriptorium.End(src, success, result))
  }

  updateVelocity(turtle) {
    turtle.x_velocity = Math.cos(turtle.direction * Math.PI / 180) * turtle.velocity
    turtle.y_velocity = -Math.sin(turtle.direction * Math.PI / 180) * turtle.velocity
  }

  drawLine(turtle, ctx, x, y) {
    this.clearTurtle(turtle, ctx)
    if (turtle.penDown) {
      ctx.strokeStyle = turtle.penColor
      ctx.lineWidth = turtle.penWidth
      ctx.beginPath()
      ctx.moveTo(turtle.x, turtle.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    turtle.x = x
    turtle.y = y
    this.drawTurtle(turtle, ctx)
  }

  drawTurtle(turtle, ctx) {
    const x = Math.round(turtle.x)
    const y = Math.round(turtle.y)
    turtle.bgImage = ctx.getImageData(x - 15, y - 35, 50, 40)
    ctx.font = '30px Arial'
    ctx.fillText(turtle.image_char, x - 10, y - 3)
  }

  clearTurtle(turtle, ctx) {
    if (turtle.bgImage != null) {
      ctx.putImageData(turtle.bgImage, Math.round(turtle.x) - 15, Math.round(turtle.y) - 35)
      turtle.bgImage = null
    }
  }

  runTurtle(canvas, ctx) {
    if (this.commands.length < 1)
      return
    if (this.running) {
      this.endTurtle()
      return
    }

    if (this.useTurtle)
      for (const t of this.turtles) {
        this.clearTurtle(t, ctx)
        /* if the turtle is out of the pane, move it back. */
        if (t.x < 0)
          t.x = canvas.width - 10
        else if (canvas.width < t.x)
          t.x = 10

        if (t.y < 0)
          t.y = canvas.height - 10
        else if (canvas.height < t.y)
          t.y = 10

        this.drawTurtle(t, ctx)
      }

    let index = 0
    let cmd = this.commands[index++]
    let callback = (timestamp) => {
      this.beeper.checkBeep(timestamp)
      if (this.running)
        if (cmd.run(this, ctx, timestamp) || this.commands.length < 1) {
          if (index < this.commands.length) {
            cmd = this.commands[index++]
            window.requestAnimationFrame(callback)
          }
          else {
            this.endTurtle()    // finish the execution
            // for (const t of this.turtles)
            //  this.clearTurtle(t, ctx)
          }
        }
        else
          window.requestAnimationFrame(callback)
    }
    window.requestAnimationFrame(callback)
    this.running = true
  }

  // private method
  // updates the states before stopping the turtle
  endTurtle() {
    this.commands = []
    this.isProcessing = false
    this.running = false
    this.beeper.stopBeep()
    this.processingCmd.suspend()
  }

  // abruptly stops turtle graphics.
  // it is called by Scriptorium.stopRunning().
  stopTurtle(isSuccess, result) {
    for (const cmd of this.commands)
      if (cmd instanceof Scriptorium.End) {
        Scriptorium.endRunning(cmd.source, isSuccess, result)
        break
      }

    this.endTurtle()
  }

  reset() {
    this.endTurtle()
    for (const t of this.turtles)
      t.initialize()

    this.useTurtle = false
  }
}

// Scriptorium.TurtleCmd is a singleton.
Scriptorium.turtleCmd = new Scriptorium.TurtleCmd()

// declare read-only global propoerties i.e. global constants.
for (const prop of
     [['turtle', new Scriptorium.Turtle(Scriptorium.turtleCmd)],
      ['pro', Scriptorium.turtleCmd.getProcessing()],
      ['red', '#ff0000'],
      ['green', '#00cc00'],
      ['blue', '#0066ff'],
      ['white', '#ffffff'],
      ['black', '#000000'] ]) {
    Object.defineProperty(this, prop[0], {
        value: prop[1],
        writable: false })
}
