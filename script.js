const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const pause = document.querySelector('.pause');
const play = document.querySelector('.play');
const restart = document.querySelector('.restart');
const heading = document.querySelector('h2');

const score = document.querySelector('.score');
const highScore = document.querySelector('.highScore');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let currScore = 0;
let newScore = 0;

class Player{
    constructor({position, velocity}) {
        this.position = position; // {x, y}
        this.velocity = velocity;
        this.rotation = 0;
    }

    draw(){
        c.save();
        c.translate(this.position.x, this.position.y);
        c.rotate(this.rotation);
        c.translate(-this.position.x, -this.position.y);
        c.beginPath();
        c.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
        c.fillStyle = 'red';
        c.fill();
        c.closePath();
        // c.fillStyle = 'red';
        // c.fillRect = (this.position.x, this.position.y, 100, 100);
        c.beginPath();
        c.moveTo(this.position.x + 30, this.position.y);
        c.lineTo(this.position.x - 10, this.position.y - 10);
        c.lineTo(this.position.x - 10, this.position.y + 10);
        c.closePath();

        c.strokeStyle = 'white';
        c.stroke();
        c.restore();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    getVertices() {
        const cos = Math.cos(this.rotation)
        const sin = Math.sin(this.rotation)
    
        return [
          {
            x: this.position.x + cos * 30 - sin * 0,
            y: this.position.y + sin * 30 + cos * 0,
          },
          {
            x: this.position.x + cos * -10 - sin * 10,
            y: this.position.y + sin * -10 + cos * 10,
          },
          {
            x: this.position.x + cos * -10 - sin * -10,
            y: this.position.y + sin * -10 + cos * -10,
          },
        ]
      }
}

class Projectile {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 5;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        c.closePath();
        c.fillStyle = 'white';
        c.fill();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Asteroid {
    constructor({position, velocity, radius}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        c.closePath();
        c.strokeStyle = 'white';
        c.stroke();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

let player = new Player({
    position: {x:canvas.width/2, y:canvas.height/2},
    velocity: {x:0, y:0},
});

const keys = {
    w: {
        pressed: false,
    },
    a: {
        pressed: false,
    },
    d: {
        pressed: false,
    },
    s: {
        pressed: false,
    }
}

const SPEED = 3;
const REV_SPEED = -3;
const ROTATIONAL_SPEED = 0.05;
const FRICTION = 0.97;
const PROJECTILE_SPEED = 3;

let projectiles = [];
let asteroids = [];

const asteroidSpawn = function() {
    const index = Math.floor(Math.random() * 4);

    let x, y;
    let vx, vy;
    let radius = 50 * Math.random() + 10;
    switch (index) {
        case 0:
            x = 0 - radius;
            y = Math.random() * canvas.height;
            vx = 1;
            vy = 0;
            break;
        case 1:
            x = Math.random() * canvas.width;
            y = canvas.height + radius;
            vx = 0;
            vy = -1;
            break;
        case 2:
            x = canvas.width + radius;
            y = Math.random() * canvas.height;
            vx = -1;
            vy = 0;
            break;
        case 3:
            x = Math.random() * canvas.width;
            y = canvas.height + radius;
            vx = 0;
            vy = -1;
            break;
    }

    asteroids.push(
        new Asteroid({
            position: {
                x: x,
                y: y,
            },
            velocity: {
                x: vx,
                y: vy,
            },
            radius,
        })
    )
}

function IntervalTimer(callback, interval) {
    var timerId, startTime, remaining = 0;
    var state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed

    this.pause = function () {
        if (state != 1) return;

        remaining = interval - (new Date() - startTime);
        window.clearInterval(timerId);
        state = 2;
    };

    this.resume = function () {
        if (state != 2) return;

        state = 3;
        window.setTimeout(this.timeoutCallback, remaining);
    };

    this.timeoutCallback = function () {
        if (state != 3) return;

        callback();

        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1;
    };

    startTime = new Date();
    timerId = window.setInterval(callback, interval);
    state = 1;
}

var timer = new IntervalTimer(function () {
    asteroidSpawn();
}, 3000);


function circleCollision(circle1, circle2) {
    const xDifference = circle2.position.x - circle1.position.x;
    const yDifference = circle2.position.y - circle1.position.y;

    const distance = Math.sqrt(xDifference * xDifference + yDifference * yDifference);

    if(distance <= circle1.radius + circle2.radius){
        return true;
    }
    
    return false;
}

function circleTriangleCollision(circle, triangle) {
    // Check if the circle is colliding with any of the triangle's edges
    for (let i = 0; i < 3; i++) {
      let start = triangle[i]
      let end = triangle[(i + 1) % 3]
  
      let dx = end.x - start.x
      let dy = end.y - start.y
      let length = Math.sqrt(dx * dx + dy * dy)
  
      let dot =
        ((circle.position.x - start.x) * dx +
          (circle.position.y - start.y) * dy) /
        Math.pow(length, 2)
  
      let closestX = start.x + dot * dx
      let closestY = start.y + dot * dy
  
      if (!isPointOnLineSegment(closestX, closestY, start, end)) {
        closestX = closestX < start.x ? start.x : end.x
        closestY = closestY < start.y ? start.y : end.y
      }
  
      dx = closestX - circle.position.x
      dy = closestY - circle.position.y
  
      let distance = Math.sqrt(dx * dx + dy * dy)
  
      if (distance <= circle.radius) {
        return true
      }
    }
  
    // No collision
    return false
  }
  
  function isPointOnLineSegment(x, y, start, end) {
    return (
      x >= Math.min(start.x, end.x) &&
      x <= Math.max(start.x, end.x) &&
      y >= Math.min(start.y, end.y) &&
      y <= Math.max(start.y, end.y)
    )
  }

function animate(){
    let animationId = window.requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    player.update();

    for (let i = projectiles.length - 1; i>=0; i--) {
        const projectile = projectiles[i];
        projectile.update();

        if (
            projectile.position.x + projectile.radius < 0 ||
            projectile.position.x - projectile.radius > canvas.width ||
            projectile.position.y - projectile.radius > canvas.height ||
            projectile.position.y + projectile.radius < 0
          ) {
            projectiles.splice(i, 1);
          }
    }

    //Asteroids
    for (let i = asteroids.length - 1; i>=0; i--) {
        const asteroid = asteroids[i];
        asteroid.update();

        if (circleTriangleCollision(asteroid, player.getVertices())) {
            heading.textContent = "GAME OVER!";
            window.cancelAnimationFrame(animationId);
            clearInterval(intervalId);
            
        }

        if (
            asteroid.position.x + asteroid.radius < 0 ||
            asteroid.position.x - asteroid.radius > canvas.width ||
            asteroid.position.y - asteroid.radius > canvas.height ||
            asteroid.position.y + asteroid.radius < 0
          ) {
            asteroids.splice(i, 1);
          }

          //Projectiles
        for (let j = projectiles.length - 1; j>=0; j--) {
            const projectile = projectiles[j];

            if(circleCollision(asteroid, projectile)){
                asteroids.splice(i, 1);
                projectiles.splice(j, 1);
                currScore++;
                score.textContent = currScore;
            }
        }

    }

    if(heading.textContent === 'START') {
        window.cancelAnimationFrame(animationId);
    }

    pause.addEventListener('click', function () {
        timer.pause();
        window.cancelAnimationFrame(animationId);
    })

    if(keys.w.pressed) {
        player.velocity.x = Math.cos(player.rotation) * SPEED;
        player.velocity.y = Math.sin(player.rotation) * SPEED;
    } else if (!keys.w.pressed) {
        player.velocity.x *= FRICTION;
        player.velocity.y *= FRICTION;
    }

    if(keys.s.pressed) {
        player.velocity.x = Math.cos(player.rotation) * REV_SPEED;
        player.velocity.y = Math.sin(player.rotation) * REV_SPEED;
    }

    if(keys.d.pressed) player.rotation += ROTATIONAL_SPEED;
    else if(keys.a.pressed) player.rotation -= ROTATIONAL_SPEED;
}

animate();

window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = true;
            break;
        case 'KeyA':
            keys.a.pressed = true;
            break;
        case 'KeyD':
            keys.d.pressed = true;
            break;
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'Space':
            projectiles.push(
                new Projectile({
                    position: {
                        x: player.position.x + Math.cos(player.rotation) * 30,
                        y: player.position.y + Math.sin(player.rotation) * 30,
                    },
                    velocity: {
                        x: Math.cos(player.rotation) * PROJECTILE_SPEED,
                        y: Math.sin(player.rotation) * PROJECTILE_SPEED,
                    },
                })
            )
            break;
    }
}) 

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = false;
            break;
        case 'KeyA':
            keys.a.pressed = false;
            break;
        case 'KeyD':
            keys.d.pressed = false;
            break;
        case 'KeyS':
            keys.s.pressed = false;
            break;
    }
})

play.addEventListener('click', function() {
    timer.resume();
    window.requestAnimationFrame(animate);
})

restart.addEventListener('click', function() {
    //Score
    if(currScore > newScore) {
        newScore = currScore;
        currScore = 0;
        score.textContent = currScore;
        highScore.textContent = newScore;
    } else {
        currScore = 0;
        score.textContent = currScore;
    }

    if (heading.textContent === 'GAME OVER!') {
        window.requestAnimationFrame(animate);
        asteroids = [];
        projectiles = [];
        player = new Player({
            position: {x:canvas.width/2, y:canvas.height/2},
            velocity: {x:0, y:0},
        });
        heading.textContent = 'PLAYING';
    } else if (heading.textContent === 'PLAYING') {
        asteroids = [];
        projectiles = [];
        player = new Player({
            position: {x:canvas.width/2, y:canvas.height/2},
            velocity: {x:0, y:0},
         });
    }
})

heading.addEventListener('click', function() {
    if(heading.textContent === 'START') {
        heading.textContent = 'PLAYING';
        animate();
        document.querySelector('.s').classList.remove('hidden');
        document.querySelector('.icons').classList.remove('hidden');
        heading.classList.remove('hover');
    }
})


