// Copyright (C) 2019 by Shigeru Chiba <chiba@acm.org>.

function print(value) {
  DraftScript.turtleCmd.push(new DraftScript.Print(value))
}

function* range(from, to) {
  while (from <= to)
    yield from++
}

DraftScript.Turtle = class {
  constructor(cmd) {
    this.turtleCmd = cmd
    this.initialize()
    cmd.addTurtle(this)
  }

  initialize() {
    this.x = this.y = 100
    this.direction = 0
    this.velocity = 1
    this.x_velocity = this.velocity
    this.y_velocity = 0.0
    this.penDown = true
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

  speed(s) {
    this.turtleCmd.push(new DraftScript.Speed(this, s))
  }

  move(x, y) {
    this.turtleCmd.push(new DraftScript.Move(this, x, y))
  }

  forward(d) {
    this.turtleCmd.push(new DraftScript.Forward(this, d))
  }

  left(d) {
    this.turtleCmd.push(new DraftScript.Left(this, d))
  }

  right(d) {
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
    ctx.strokeStyle = this.color
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
    cmd.drawLine(this.turtle, ctx, this.x, this.y)
    return true
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

DraftScript.TurtleCmd = class {
  constructor() {
    this.commands = []
    this.turtles = []
    this.running = false
  }

  addTurtle(turtle) {
    this.turtles.push(turtle)
  }

  push(cmd) {
    this.commands.push(cmd)
  }

  pushAlert(msg) {
      this.push(new DraftScript.Alert(msg))
  }

  updateVelocity(turtle) {
    turtle.x_velocity = Math.cos(turtle.direction * Math.PI / 180) * turtle.velocity
    turtle.y_velocity = -Math.sin(turtle.direction * Math.PI / 180) * turtle.velocity
  }

  drawLine(turtle, ctx, x, y) {
    this.clearTurtle(turtle, ctx)
    if (turtle.penDown) {
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
    const x = turtle.x
    const y = turtle.y
    turtle.bgImage = ctx.getImageData(x - 15, y - 35, 45, 40)
    ctx.font = "30px Arial"
    ctx.fillText('\u{1f422}', x - 10, y - 3)
  }

  clearTurtle(turtle, ctx) {
    if (turtle.bgImage != null) {
      ctx.putImageData(turtle.bgImage, turtle.x - 15, turtle.y - 35)
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

    ctx.strokeStyle = '#000000'  // black
    for (const t of this.turtles)
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
          for (const t of this.turtles) {
            this.clearTurtle(t, ctx)
            t.initialize()
          }

          this.commands = []
          this.running = false
        }
      }
      else
        window.requestAnimationFrame(callback)
    }
    window.requestAnimationFrame(callback)
    this.running = true
  }
}

DraftScript.turtleCmd = new DraftScript.TurtleCmd()
const turtle = new DraftScript.Turtle(DraftScript.turtleCmd)
const red = '#ff0000'
const green = '#00cc00'
const blue = '#0066ff'
const white = '#ffffff'
const black = '#000000'
