import { topScoresTemplate } from "./displayElements.js";

const space = document.querySelector(".space");
// get space width from css property
let str = window.getComputedStyle(space).width;
str = str.slice(0, str.length - 2);
const spaceWidth = Math.round(parseFloat(str, 10));
// create DOM elements
const weapon = document.createElement("div");
const startButton = document.createElement("button");
const missedDisplay = document.createElement("div");
const destroyedDisplay = document.createElement("div");
const levelDisplay = document.createElement("div");
const gameSummary = document.createElement("div");
const gameTitle = document.createElement("div");
const moveRightIcon = document.createElement("div");
const moveLeftIcon = document.createElement("div");
const fireControlIcon = document.createElement("div");

const weaponParams = {
  xPos: 180,
  yPos: 10,
  width: 40,
  height: 40,
};
const levels = {
  1: {
    step: 2,
    delay: 50,
    width: 30,
    height: 30,
    vertGap: 70,
  },
  2: {
    step: 3,
    delay: 50,
    width: 30,
    height: 30,
    vertGap: 70,
  },
  3: {
    step: 4,
    delay: 50,
    width: 30,
    height: 30,
    vertGap: 70,
  },
  4: {
    step: 4,
    delay: 50,
    width: 30,
    height: 30,
    vertGap: 60,
  },
  5: {
    step: 4,
    delay: 50,
    width: 30,
    height: 30,
    vertGap: 50,
  },
};

const maxLevel = Object.keys(levels).length;
const levelStep = 15; // number of destroyed asteroids to increase level
let level = 1; // initial level
const asteroids = [];
let asteroidParams = { ...levels[level] };

const bullets = [];
const bulletsCountMax = 3;
const bulletParams = {
  step: 3,
  delay: 20,
  width: 15,
  height: 30,
};
const asteroidsInitCount = 5;
let gapSinceLast = 0; // counter - when exceeds vertGap new asteroid is created
let missedCount = 0; // asteroids that passed bottom line
const allowMissedCount = 3; // max number of asteroids missed to end the game
let destroyedCount = 0;
const bottomLine = 10; // y-distance from bottom where asteroids dissapear

const sndUrls = {
  shoot: "./snd/257232__javierzumer__retro-shot-blaster.wav",
  blast: "./snd/322502__liamg-sfx__explosion-15.wav",
  missed: "./snd/49693__ejfortin__energy-gloves.wav",
  levelUp: "./snd/412165__screamstudio__arcade-level.wav",
  gameOver: "./snd/365766__matrixxx__game-over-03.wav",
  gameStart: "./snd/196889__ionicsmusic__race-robot-start.wav",
};
let sounds = {};

let isGameOver = true;
const topScores = [
  "tomas",
  "tomas",
  "tomas",
  "tomas",
  "tomas",
  "tomas",
  "tomas",
  "tomas",
  "tomas",
  "tomas",
];

let isFirstStart = true;
let isWeaponMoving = false;
let moveAsteroidsTimer;
let moveBulletsTimer;
let moveWeaponTimer;

class DisplayElement {
  constructor(cssClass, content = "") {
    this.el = document.createElement("div");
    this.content = content;
    //const vis = this.el;
    this.el.className = cssClass;
    this.el.style.display = "none"; // do not display panel when created
    this.el.innerHTML = this.content;
    space.appendChild(this.el);
  }

  setContent(content) {
    this.content = content;
    this.el.innerHTML = this.content;
  }
  display(onoff = "on") {
    //show or hide element
    if (onoff === "on") {
      this.el.style.display = "";
    } else if (onoff === "off") {
      this.el.style.display = "none";
    }
  }

  destroy() {
    this.el.remove();
  }
}
const topScoresPanel = new DisplayElement("top-scores", topScoresTemplate);

class Asteroid {
  constructor(xPos, yPos) {
    this.yPos = yPos;
    this.xPos = xPos;
    this.visual = document.createElement("div");
    let vis = this.visual;
    vis.style.left = this.xPos + "px";
    vis.style.bottom = this.yPos + "px";
    vis.className = "asteroid";
    space.appendChild(vis);
  }

  destroy() {
    this.visual.remove();
  }
}

class Explosion {
  constructor(xPos, yPos) {
    this.yPos = yPos;
    this.xPos = xPos;
    this.visual = document.createElement("div");
    const vis = this.visual;
    vis.style.left = this.xPos + "px";
    vis.style.bottom = this.yPos + "px";
    vis.className = "explosion";
    space.appendChild(vis);
  }

  destroy() {
    this.visual.remove();
  }
}

class Bullet {
  constructor(xPos, yPos) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.visual = document.createElement("div");

    const visual = this.visual;
    visual.className = "bullet";
    visual.style.left = this.xPos + "px";
    visual.style.bottom = this.yPos + "px";
    space.appendChild(visual);
  }

  destroy() {
    this.visual.remove();
  }
}

function createWeapon() {
  weapon.className = "weapon";
  weapon.style.left = weaponParams.xPos + "px";
  weapon.style.bottom = weaponParams.yPos + "px";
  space.appendChild(weapon);
  // console.log("created weapon");
}

function createCounterDisplays() {
  missedDisplay.className = "counter missed";
  missedDisplay.textContent = missedCount;
  levelDisplay.className = "level";
  levelDisplay.textContent = "LEVEL " + level;
  destroyedDisplay.className = "counter destroyed";
  destroyedDisplay.textContent = destroyedCount;
  space.appendChild(missedDisplay);
  space.appendChild(destroyedDisplay);
  space.appendChild(levelDisplay);
}

function createGameSummary() {
  gameSummary.className = "game-summary";
  space.appendChild(gameSummary);
}

function createGameTitle() {
  let text = `
    <h1>Shooting Asteroids</h1>`;
  gameTitle.innerHTML = text;
  gameTitle.className = "game-title";
  space.appendChild(gameTitle);
  // console.log("created Game Title");
  // console.log(gameTitle);
}

function createTouchControls() {
  moveLeftIcon.className = "move-control left";
  moveRightIcon.className = "move-control right";
  fireControlIcon.className = "fire-control";
  moveLeftIcon.setAttribute("id", "move-left");
  moveRightIcon.setAttribute("id", "move-right");
  space.appendChild(moveLeftIcon);
  space.appendChild(moveRightIcon);
  space.appendChild(fireControlIcon);
  // add event listeners
  moveLeftIcon.addEventListener("touchstart", control);
  moveLeftIcon.addEventListener("mousedown", control);
  moveLeftIcon.addEventListener("touchend", controlStop);
  moveLeftIcon.addEventListener("mouseup", controlStop);
  moveRightIcon.addEventListener("touchstart", control);
  moveRightIcon.addEventListener("mousedown", control);
  moveRightIcon.addEventListener("touchend", controlStop);
  moveRightIcon.addEventListener("mouseup", controlStop);
  fireControlIcon.addEventListener("touchstart", fire);
}

function gameSummaryDisplay(onoff) {
  if (onoff === "on") {
    //console.log("displaying game summary");
    let text = `
      Game Over!<br />
      You have destroyed<br />
      <strong>${destroyedCount}</strong><br />
      asteroids and reached<br />
      level ${level}`;
    if (destroyedCount < 2) {
      //console.log("less than two destroyed");
      text = text.replace("asteroids", "asteroid"); //if only one asteroid destroyed
    }
    if (destroyedCount === 0) {
      //console.log("no asteroids destroyed");
      text = `Game Over!<br />
      You have destroyed<br />
      <strong>nothing</strong>`;
    }
    gameSummary.innerHTML = text;
    gameSummary.style.display = "";
  } else if (onoff === "off") {
    gameSummary.style.display = "none";
  }
}

function gameTitleDisplay(onoff) {
  if (onoff === "on" || onoff === "") {
    //console.log("displaying game title");
    gameTitle.style.display = "";
    // console.log("game title switched on");
  } else {
    gameTitle.style.display = "none";
    // console.log("game title switched off");
  }
}

function updateCounterDisplays() {
  missedDisplay.textContent = missedCount;
  destroyedDisplay.textContent = destroyedCount;
  levelDisplay.textContent = "LEVEL " + level;
}

function generateNewAsteroid(xPos, yPos) {
  const newAsteroid = new Asteroid(xPos, yPos);
  asteroids.push(newAsteroid);
  //console.log(asteroids);
}

function generateNewBullet(xPos, yPos) {
  if (bullets.length >= bulletsCountMax) {
    // console.log("shot not fired - max number of bullets reached");
    return false;
  }
  const newBullet = new Bullet(xPos, yPos);
  bullets.push(newBullet);
  // console.log(bullets);
}

function initAsteroids() {
  for (let i = 0; i < asteroidsInitCount; i++) {
    const xPos = Math.round(
      Math.random() * (spaceWidth - 20 * 2 - asteroidParams.width) + 20
    );
    const yPos =
      600 -
      asteroidsInitCount * asteroidParams.vertGap -
      40 +
      i * asteroidParams.vertGap;
    //10px empty space on top
    generateNewAsteroid(xPos, yPos);
  }
}

function createUI() {
  startButton.className = "start-button";
  startButton.innerHTML = `
    <h2>PRESS ENTER OR CLICK HERE TO START</h2>
    <p>controls: <br />&#8592; &#8594; to move weapon, spacebar to shoot</p>`;
  space.appendChild(startButton);
  startButton.addEventListener("click", start);
  document.addEventListener("keydown", control);
  document.addEventListener("keyup", controlStop);
}

function moveAsteroids() {
  for (let i = 0; i < asteroids.length; i++) {
    if (asteroids[i].yPos <= bottomLine) {
      //asteroid missed bottom line
      missedCount += 1;
      sounds.missed.cloneNode().play();
      updateCounterDisplays();
      asteroids[i].destroy();
      asteroids.splice(i, 1);
      // console.log("missed asteroids: ", missedCount);
      if (missedCount >= allowMissedCount) {
        gameOver();
      }
    } else if (
      asteroids[i].xPos + asteroidParams.width > weaponParams.xPos &&
      asteroids[i].xPos < weaponParams.xPos + weaponParams.width &&
      asteroids[i].yPos + asteroidParams.height > weaponParams.yPos &&
      asteroids[i].yPos < weaponParams.yPos + weaponParams.height
    ) {
      //asteroid crashed to weapon
      // console.log("asteroid destroyed weapon");
      sounds.blast.cloneNode().play();
      missedCount += 1;
      updateCounterDisplays();
      gameOver();
    } else {
      //move asteroids
      asteroids[i].yPos -= asteroidParams.step;
      asteroids[i].visual.style.bottom = asteroids[i].yPos + "px";

      if (gapSinceLast >= asteroidParams.vertGap) {
        //create new asteroid on top
        const xPos = Math.round(
          Math.random() * (spaceWidth - 20 * 2 - asteroidParams.width) + 20
        );
        const yPos = 600 - 10 - asteroidParams.height;
        generateNewAsteroid(xPos, yPos);
        gapSinceLast = 0;
      }
    }
  }
  gapSinceLast += asteroidParams.step;
}

function moveBullets() {
  let indexOfBullet = bullets.length - 1;
  while (indexOfBullet >= 0) {
    let bullet = bullets[indexOfBullet];
    bullet.yPos += bulletParams.step;
    if (bullet.yPos >= 600 - bulletParams.height) {
      //reached top of space
      // console.log("bullet reached top of space");
      bullet.destroy();
      bullets.splice(indexOfBullet, 1);
      if (bullets.length === 0) {
        // if removed bullet was the last
        // console.log("no more bullets to move");
        clearInterval(moveBulletsTimer);
        return;
      }
    } else {
      bullet.visual.style.bottom = bullet.yPos + "px";
      //check if bullet hit any asteroid, if yes remove bullet and asteroid
      let indexOfAsteroid = asteroids.length - 1;
      while (indexOfAsteroid >= 0) {
        let asteroid = asteroids[indexOfAsteroid];
        if (
          bullet.xPos + bulletParams.width > asteroid.xPos &&
          bullet.xPos < asteroid.xPos + asteroidParams.width &&
          bullet.yPos + bulletParams.height > asteroid.yPos &&
          bullet.yPos < asteroid.yPos + asteroidParams.height
        ) {
          // console.log("bullet hit the asteroid");
          sounds.blast.cloneNode().play();
          destroyedCount++;
          //check if we want to increase level
          if (destroyedCount % levelStep === 0 && level < maxLevel) {
            level++;
            asteroidParams = { ...levels[level] };
            sounds.levelUp.cloneNode().play();
            // console.log("increased level to ", level);
          }
          updateCounterDisplays();
          const explosion = new Explosion(asteroid.xPos, asteroid.yPos);
          setTimeout(() => explosion.destroy(), 250);
          bullet.destroy();
          asteroid.destroy();
          bullets.splice(indexOfBullet, 1);
          asteroids.splice(indexOfAsteroid, 1);
          if (bullets.length === 0) {
            //if removed bullet was the last exit function
            // console.log("no more bullets to move");
            clearInterval(moveBulletsTimer);
            return;
          }
        }
        indexOfAsteroid -= 1;
      }
    }
    indexOfBullet -= 1;
  }
}

function moveWeapon(direction) {
  const step = {
    left: -5,
    right: 5,
  };
  isWeaponMoving = true;
  // console.log("moved");

  moveWeaponTimer = setInterval(() => {
    if (
      (direction === "left" && weaponParams.xPos <= 5) ||
      (direction === "right" &&
        weaponParams.xPos >= spaceWidth - weaponParams.width - 5)
    ) {
      isWeaponMoving = false;
      clearInterval(moveWeaponTimer);
      return;
    }
    weaponParams.xPos += step[direction];
    weapon.style.left = weaponParams.xPos + "px";
  }, 20);
}

function control(e) {
  e.preventDefault();
  if (isGameOver) {
    if (e.key === "Enter") {
      start();
      return;
    }
  } else {
    if (
      (e.key === "ArrowLeft" || e.currentTarget.id === "move-left") &&
      !isWeaponMoving
    ) {
      // console.log("want to move left");
      moveWeapon("left");
    } else if (
      (e.key === "ArrowRight" || e.currentTarget.id === "move-right") &&
      !isWeaponMoving
    ) {
      // console.log("want to move right");
      moveWeapon("right");
    }
    if (e.key === " ") {
      fire();
    }
    //console.log({ isWeaponMoving });
  }
  // console.log(`key pressed: "${e.key}"`);
  // console.log(e.currentTarget);
  // console.log({ isGameOver });
}

function fire() {
  if (bullets.length >= bulletsCountMax) {
    // console.log("max number of bullets used");
    return;
  }
  // console.log("shot fired");
  sounds.shoot.cloneNode().play();
  generateNewBullet(
    weaponParams.xPos + 20 - bulletParams.width / 2,
    weaponParams.yPos + 40
  );
  if (bullets.length === 1) {
    //if first bullet then start move timer
    moveBulletsTimer = setInterval(moveBullets, bulletParams.delay);
  }
}

function controlStop(e) {
  if (e.key === " ") {
    return;
  }
  if (!isGameOver && isWeaponMoving) {
    clearInterval(moveWeaponTimer);
    isWeaponMoving = false;
    // console.log("weapon stopped");
  }
}

function initSounds() {
  sounds = {
    shoot: new Audio(sndUrls["shoot"]),
    blast: new Audio(sndUrls["blast"]),
    missed: new Audio(sndUrls["missed"]),
    levelUp: new Audio(sndUrls["levelUp"]),
    gameOver: new Audio(sndUrls["gameOver"]),
    gameStart: new Audio(sndUrls["gameStart"]),
  };
  Object.keys(sounds).forEach((type) => {
    sounds[type].load();
    // console.log(`sound "${type}" loaded`);
  });
}

function gameOver() {
  // console.log("Game over!");
  isGameOver = true;
  sounds.gameOver.play();
  clearInterval(moveAsteroidsTimer);
  clearInterval(moveBulletsTimer);
  clearInterval(moveWeaponTimer);
  isWeaponMoving = false;
  weapon.remove();
  missedDisplay.remove();
  destroyedDisplay.remove();
  levelDisplay.remove();
  moveLeftIcon.remove();
  moveRightIcon.remove();
  fireControlIcon.remove();
  gameSummaryDisplay("on");
  topScoresPanel.display();
  asteroids.forEach((asteroid) => {
    asteroid.destroy(); //destroy all asteroid objects
  });
  asteroids.length = 0; //empty asteroids array, just in case
  bullets.forEach((bullet) => {
    bullet.destroy(); //destroy all bullets
  });
  bullets.length = 0; //empty bullets array, just in case
  missedCount = 0;
  destroyedCount = 0;
  gapSinceLast = 0;
  startButton.style.display = "";
}

function start() {
  if (!isGameOver) {
    return; //already playing
  }
  startButton.style.display = "none";
  sounds.gameStart.play();
  isGameOver = false;
  level = 1;
  asteroidParams = { ...levels[level] };
  createWeapon();
  createCounterDisplays();
  gameSummaryDisplay("off");
  topScoresPanel.display("off");
  if (isFirstStart) {
    gameTitleDisplay("off");
    isFirstStart = false;
  }
  createTouchControls();
  initAsteroids();
  moveAsteroidsTimer = setInterval(moveAsteroids, asteroidParams.delay);
}

createUI();
initSounds();
createGameSummary();
gameSummaryDisplay("off");
createGameTitle();
