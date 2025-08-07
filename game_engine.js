//@ts-check

let objects = [];

class BaseObject {
  constructor() {
    this.id = objects.length;
    objects.push(this);
  }

  die() {
    objects.splice(this.id, 1);
  }

  updateDimensions() {
    throw new Error("updateDimensions() must be implemented by subclass");
  }

  draw() {
    throw new Error("draw() must be implemented by subclass");
  }
}

class GameCanvas {
  constructor(canvas) {
    this.canvas = canvas;

    // Setup DPI scaling:
    this.dpr = window.devicePixelRatio || 1;
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = this.width + "px";
    canvas.style.height = this.height + "px";

    this.ctx = canvas.getContext("2d");
    this.ctx.scale(this.dpr, this.dpr);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  updateFrame() {
    for (const object of objects) {
      if (typeof object.updateDimensions === "function") object.updateDimensions();
      if (typeof object.draw === "function") object.draw();
    }
  }

  rectCollision(a, b) {
    if (a.bottomEdge < b.topEdge) {
      return false;
    } else if (a.topEdge > b.bottomEdge) {
      return false;
    } else if (a.leftEdge > b.rightEdge) {
      return false;
    } else if (a.rightEdge < b.leftEdge) {
      return false;
    }
    return true;
  }
}

class Line extends BaseObject {
  // Note: changed param from canvas to ctx!
  constructor(ctx, x1 = 0, y1 = 0, x2 = 0, y2 = 0, lineColor = "black", lineWidth = 1) {
    super();
    this.ctx = ctx;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.lineColor = lineColor;
    this.lineWidth = lineWidth;
  }

  draw() {
    this.ctx.strokeStyle = this.lineColor;
    this.ctx.lineWidth = this.lineWidth;

    this.ctx.beginPath();
    // Pixel-align for crisp 1px lines:
    this.ctx.moveTo(this.x1 + 0.5, this.y1 + 0.5);
    this.ctx.lineTo(this.x2 + 0.5, this.y2 + 0.5);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  updateDimensions() {
    // pass
  }
}

const isKeyDown = {};

document.addEventListener("keydown", function (event) {
  isKeyDown[event.key] = true;
  console.log("detected key down", event.key);
});

document.addEventListener("keyup", function (event) {
  isKeyDown[event.key] = false;
  console.log("detected key up", event.key);
});

class Circle extends BaseObject {
  // changed param canvas -> ctx
  constructor(ctx, centerX, centerY, radius, color = "red") {
    super();
    this.ctx = ctx;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;

    this.lineWidth = 2;
    this.color = color;
    this.fill = true;
    this.border = false;
    this.borderColor = "black";

    this.vy = 0;
    this.vx = 0;
  }

  draw() {
    if (this.border) {
      this.ctx.beginPath();

      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = this.lineWidth;

      this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.closePath();

      console.log("Drew");
    }

    if (this.fill) {
      this.ctx.beginPath();

      this.ctx.fillStyle = this.color;
      this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.closePath();
    }
  }

  updateDimensions() {
    this.centerX += this.vx;
    this.centerY += this.vy;
  }
}

class Rect extends BaseObject {
  // changed param canvas -> ctx
  constructor(ctx, x, y, width, height, color = "red", lineWidth = 2) {
    super();
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.lineWidth = lineWidth;
    this.color = color;
    this.borderColor = "black";
    this.fill = true;
    this.border = false;

    this.topEdge = y;
    this.bottomEdge = y + height;
    this.leftEdge = x;
    this.rightEdge = x + width;

    this.vy = 0;
    this.vx = 0;
  }

  draw() {
    if (this.border) {
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    if (this.fill) {
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  updateDimensions() {
    this.x += this.vx;
    this.y += this.vy;

    this.topEdge = this.y;
    this.bottomEdge = this.y + this.height;
    this.leftEdge = this.x;
    this.rightEdge = this.x + this.width;
  }
}

export { GameCanvas, Line, Circle, Rect, isKeyDown };
