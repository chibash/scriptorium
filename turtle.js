// Copyright (C) 2019 by Shigeru Chiba <chiba@acm.org>.

function print(value) {
  DraftScript.turtleCmd.push(new DraftScript.Print(value))
}

function* range(from, to=null) {
  if (to == null) {
    to = from
    from = 0
  }
  while (from < to)
    yield from++
}

// the following code depends on draftscript.js

DraftScript.Turtle = class {
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
    this.bgImage = null
  }

  down() {
    this.turtleCmd.push(new DraftScript.PenDown(this, true))
  }

  up() {
    this.turtleCmd.push(new DraftScript.PenDown(this, false))
  }

  color(c) {
    this.turtleCmd.push(new DraftScript.Color(this, c))
  }

  image(c) {
    this.turtleCmd.push(new DraftScript.Image(this, c))
  }

  speed(s) {
    this.turtleCmd.assertNumber('speed()', s)
    this.turtleCmd.push(new DraftScript.Speed(this, s))
  }

  move(x, y) {
    this.turtleCmd.assertNumber('move(x)', x)
    this.turtleCmd.assertNumber('move(y)', y)
    this.turtleCmd.push(new DraftScript.Move(this, x, y))
  }

  forward(d) {
    this.turtleCmd.assertNumber('forward()', d)
    this.turtleCmd.push(new DraftScript.Forward(this, d))
  }

  left(d) {
    this.turtleCmd.assertNumber('left()', d)
    this.turtleCmd.push(new DraftScript.Left(this, d))
  }

  right(d) {
    this.turtleCmd.assertNumber('right()', d)
    this.turtleCmd.push(new DraftScript.Right(this, d))
  }
}

DraftScript.PenDown = class {
  constructor(turtle, down) {
    this.turtle = turtle
    this.down = down
  }

  run(cmd, ctx) {
    this.turtle.penDown = this.down
    return true
  }
}

DraftScript.Color = class {
  constructor(turtle, color) {
    this.turtle = turtle
    this.color = color
  }

  run(cmd, ctx) {
    this.turtle.penColor = this.color
    return true
  }
}

DraftScript.Image = class {
  constructor(turtle, character) {
    this.turtle = turtle
    // since character might not be a string
    const str = character + ' '
    this.character = str.substring(0, str.length - 1)
  }

  run(cmd, ctx) {
    this.turtle.image_char = this.character
    return true
  }
}

DraftScript.Speed = class {
  constructor(turtle, speed) {
    this.turtle = turtle
    this.speed = Math.max(speed, 0.1)
  }

  run(cmd, ctx) {
    this.turtle.velocity = this.speed
    cmd.updateVelocity(this.turtle)
    return true
  }
}

DraftScript.Move = class {
  constructor(turtle, x, y) {
    this.turtle = turtle
    this.x = x
    this.y = y
  }

  run(cmd, ctx) {
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

DraftScript.Forward = class {
  constructor(turtle, distance) {
    this.turtle = turtle
    this.distance = distance
  }

  run(cmd, ctx) {
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

DraftScript.Left = class {
  constructor(turtle, degree) {
    this.turtle = turtle
    this.direction = degree
  }
  run(cmd, ctx) {
    this.turtle.direction += this.direction
    cmd.updateVelocity(this.turtle)
    return true
  }
}

DraftScript.Right = class {
  constructor(turtle, degree) {
    this.turtle = turtle
    this.degree = degree
  }

  run(cmd, ctx) {
    this.turtle.direction -= this.degree
    cmd.updateVelocity(this.turtle)
    return true
  }
}

DraftScript.Print = class {
  constructor(value) {
    this.message = value
  }

  run(cmd, ctx) {
    DraftScript.print(this.message)
    return true
  }
}

DraftScript.Alert = class {
  constructor(msg) {
    this.message = msg
  }

  run(cmd, ctx) {
    alert(this.message)
    return true
  }
}

DraftScript.End = class {
  constructor(src, success, result) {
    this.source = src
    this.success = success
    this.result = result
  }

  run(cmd, ctx) {
    DraftScript.end_running(this.source, this.success, this.result)
    return true
  }
}

DraftScript.TurtleCmd = class {
  constructor() {
    this.commands = []
    this.turtles = []
    this.useTurtle = false
    this.running = false
  }

  addTurtle(turtle) {
    this.turtles.push(turtle)
  }

  push(cmd) {
    if (cmd instanceof DraftScript.Alert
        || cmd instanceof DraftScript.End
        || cmd instanceof DraftScript.Print)
      ; // do nothing
    else
      this.useTurtle = true

    this.commands.push(cmd)
  }

  assertNumber(msg, x) {
    if (typeof x != 'number')
      throw 'the argument to ' + msg + ' is not a number.'
  }

  pushAlert(msg) {
    this.push(new DraftScript.Alert(msg))
  }

  pushEnd(src, success, result) {
    this.push(new DraftScript.End(src, success, result))
  }

  updateVelocity(turtle) {
    turtle.x_velocity = Math.cos(turtle.direction * Math.PI / 180) * turtle.velocity
    turtle.y_velocity = -Math.sin(turtle.direction * Math.PI / 180) * turtle.velocity
  }

  drawLine(turtle, ctx, x, y) {
    this.clearTurtle(turtle, ctx)
    if (turtle.penDown) {
      ctx.strokeStyle = turtle.penColor
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

  runTurtle(ctx) {
    if (this.commands.length < 1)
      return
    if (this.running) {
      this.commands = []
      return
    }

    if (this.useTurtle)
      for (const t of this.turtles)
        if (turtle.bgImage == null)
          this.drawTurtle(t, ctx)

    let index = 0
    let cmd = this.commands[index++]
    var callback = () => {
      if (cmd.run(this, ctx) || this.commands.length < 1) {
        if (index < this.commands.length) {
          cmd = this.commands[index++]
          window.requestAnimationFrame(callback)
        }
        else {
          // finish the execution
          this.commands = []
          this.running = false
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

  reset() {
    for (const t of this.turtles)
      t.initialize()
  }
}

DraftScript.turtleCmd = new DraftScript.TurtleCmd()
const turtle = new DraftScript.Turtle(DraftScript.turtleCmd)
const red = '#ff0000'
const green = '#00cc00'
const blue = '#0066ff'
const white = '#ffffff'
const black = '#000000'
