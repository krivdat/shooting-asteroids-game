import { topScoresTemplate, userLoginTemplate } from './displayElements.js';
import levels from './levels.js';

const maintenanceMode = false;
// const API_URL = 'https://krivdat-api.herokuapp.com/asteroids';
const API_URL = 'https://35.234.64.91/asteroids';
// const API_URL = 'http://localhost:3000/asteroids';

const space = document.querySelector('.space');
// get space width from css property
let str = window.getComputedStyle(space).width;
str = str.slice(0, str.length - 2);
const spaceWidth = Math.round(parseFloat(str, 10));
// create DOM elements
const weapon = document.createElement('div');
const startButton = document.createElement('button');
const missedDisplay = document.createElement('div');
const destroyedDisplay = document.createElement('div');
const levelDisplay = document.createElement('div');
const gameSummary = document.createElement('div');
const gameTitle = document.createElement('div');
const moveRightIcon = document.createElement('div');
const moveLeftIcon = document.createElement('div');
const fireControlIcon = document.createElement('div');
const asteroidsMoveInterval = 40; // general move delay in ms

const weaponParams = {
  xPos: 180,
  yPos: 10,
  width: 40,
  height: 40,
};

const maxLevel = Object.keys(levels).length;
const levelStep = 15; // number of destroyed asteroids to increase level
let level = 1; // initial level

const asteroids = [];

const bullets = [];
const bulletsCountMax = 3;
const bulletParams = {
  step: 3,
  delay: 20,
  width: 15,
  height: 30,
};
let missedCount = 0; // asteroids that passed bottom line
const allowMissedCount = 3; // max number of asteroids missed to end the game
let destroyedCount = 0;
const bottomLine = 10; // y-distance from bottom where asteroids dissapear

const sndUrls = {
  shoot: './snd/257232__javierzumer__retro-shot-blaster.wav',
  blast: './snd/322502__liamg-sfx__explosion-15.wav',
  missed: './snd/49693__ejfortin__energy-gloves.wav',
  levelUp: './snd/412165__screamstudio__arcade-level.wav',
  gameOver: './snd/365766__matrixxx__game-over-03.wav',
  gameStart: './snd/196889__ionicsmusic__race-robot-start.wav',
};
let sounds = {};

let isGameOver = true;
let topScores = [];
for (let i = 0; i < 10; i++) {
  topScores.push({ username: '-', score: 0 });
}

let isFirstStart = true;
let isWeaponMoving = false;
let moveAsteroidsTimer;
let genNewAsteroidsTimer;
let moveBulletsTimer;
let moveWeaponTimer;
let isLogged = false;
let loggedUser = JSON.parse(localStorage.getItem('asteroidsLoggedUser'));
if (loggedUser) {
  isLogged = true;
  console.log('Welcome back', loggedUser.username);
}

class DisplayElement {
  constructor(cssClass, content = '') {
    this.el = document.createElement('div');
    this.content = content;
    //const vis = this.el;
    this.el.className = cssClass;
    this.el.style.display = 'none'; // do not display panel when created
    this.el.innerHTML = this.content;
    space.appendChild(this.el);
  }

  setContent(content) {
    this.content = content;
    this.el.innerHTML = this.content;
  }
  display(onoff = 'on') {
    //show or hide element
    if (onoff === 'on') {
      this.el.style.display = '';
    } else if (onoff === 'off') {
      this.el.style.display = 'none';
    }
  }

  destroy() {
    this.el.remove();
  }
}
const topScoresPanel = new DisplayElement(
  'top-scores',
  topScoresTemplate(topScores)
);
const userLoginPanel = new DisplayElement('user-login', userLoginTemplate());
const statusBarEl = new DisplayElement('status-bar');

function setStatus(msg) {
  statusBarEl.setContent(msg);
}

class Asteroid {
  constructor(xPos, yPos, width, height, step) {
    this.yPos = yPos;
    this.xPos = xPos;
    this.width = width;
    this.height = height;
    this.step = step; // px to move with each interval aka speed
    this.visual = document.createElement('div');
    let vis = this.visual;
    vis.style.left = this.xPos + 'px';
    vis.style.bottom = this.yPos + 'px';
    vis.className = 'asteroid';
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
    this.visual = document.createElement('div');
    const vis = this.visual;
    vis.style.left = this.xPos + 'px';
    vis.style.bottom = this.yPos + 'px';
    vis.className = 'explosion';
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
    this.visual = document.createElement('div');

    const visual = this.visual;
    visual.className = 'bullet';
    visual.style.left = this.xPos + 'px';
    visual.style.bottom = this.yPos + 'px';
    space.appendChild(visual);
  }

  destroy() {
    this.visual.remove();
  }
}

function createWeapon() {
  weapon.className = 'weapon';
  weapon.style.left = weaponParams.xPos + 'px';
  weapon.style.bottom = weaponParams.yPos + 'px';
  space.appendChild(weapon);
  // console.log("created weapon");
}

function getRandBetween(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function createCounterDisplays() {
  missedDisplay.className = 'counter missed';
  missedDisplay.textContent = missedCount;
  levelDisplay.className = 'level';
  levelDisplay.textContent = 'LEVEL ' + level;
  destroyedDisplay.className = 'counter destroyed';
  destroyedDisplay.textContent = destroyedCount;
  space.appendChild(missedDisplay);
  space.appendChild(destroyedDisplay);
  space.appendChild(levelDisplay);
}

function createGameSummary() {
  gameSummary.className = 'game-summary';
  space.appendChild(gameSummary);
}

function createGameTitle() {
  let text = `
    <h1>Shooting Asteroids</h1>`;
  gameTitle.innerHTML = text;
  gameTitle.className = 'game-title';
  space.appendChild(gameTitle);
  // console.log("created Game Title");
  // console.log(gameTitle);
}

function createTouchControls() {
  moveLeftIcon.className = 'move-control left';
  moveRightIcon.className = 'move-control right';
  fireControlIcon.className = 'fire-control';
  moveLeftIcon.setAttribute('id', 'move-left');
  moveRightIcon.setAttribute('id', 'move-right');
  space.appendChild(moveLeftIcon);
  space.appendChild(moveRightIcon);
  space.appendChild(fireControlIcon);
  // add event listeners
  moveLeftIcon.addEventListener('touchstart', control);
  moveLeftIcon.addEventListener('mousedown', control);
  moveLeftIcon.addEventListener('touchend', controlStop);
  moveLeftIcon.addEventListener('mouseup', controlStop);
  moveRightIcon.addEventListener('touchstart', control);
  moveRightIcon.addEventListener('mousedown', control);
  moveRightIcon.addEventListener('touchend', controlStop);
  moveRightIcon.addEventListener('mouseup', controlStop);
  fireControlIcon.addEventListener('touchstart', fire);
}

function gameSummaryDisplay(onoff) {
  if (onoff === 'on' || !onoff) {
    //console.log("displaying game summary");
    let text = `
      Game Over!<br />
      You have destroyed<br />
      <strong>${destroyedCount}</strong><br />
      asteroids and reached<br />
      level ${level}`;
    if (destroyedCount < 2) {
      //console.log("less than two destroyed");
      text = text.replace('asteroids', 'asteroid'); //if only one asteroid destroyed
    }
    if (destroyedCount === 0) {
      //console.log("no asteroids destroyed");
      text = `Game Over!<br />
      You have destroyed<br />
      <strong>nothing</strong>`;
    }
    gameSummary.innerHTML = text;
    gameSummary.style.display = '';
  } else if (onoff === 'off') {
    gameSummary.style.display = 'none';
  }
}

function gameTitleDisplay(onoff) {
  if (onoff === 'on' || onoff === '') {
    //console.log("displaying game title");
    gameTitle.style.display = '';
    // console.log("game title switched on");
  } else {
    gameTitle.style.display = 'none';
    // console.log("game title switched off");
  }
}

function updateCounterDisplays() {
  missedDisplay.textContent = missedCount;
  destroyedDisplay.textContent = destroyedCount;
  levelDisplay.textContent = 'LEVEL ' + level;
}

function generateNewAsteroid() {
  //create new asteroid on top
  const width = levels[level].width;
  const height = levels[level].height;
  const xPos = getRandBetween(20, spaceWidth - 20 - width);
  const yPos = 600 - 10 - height;
  const step = getRandBetween(levels[level].stepMin, levels[level].stepMax);
  const newAsteroid = new Asteroid(xPos, yPos, width, height, step);
  asteroids.push(newAsteroid);
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
  generateNewAsteroid(); // generate first one only
}

function createUI() {
  startButton.className = 'start-button';
  startButton.innerHTML = `
    <h2>PRESS ENTER OR CLICK HERE TO START</h2>
    <p>controls: <br />&#8592; &#8594; to move weapon, spacebar to shoot</p>`;
  space.appendChild(startButton);
  startButton.addEventListener('click', start);
  document.addEventListener('keydown', control);
  document.addEventListener('keyup', controlStop);
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
      asteroids[i].xPos + asteroids[i].width > weaponParams.xPos &&
      asteroids[i].xPos < weaponParams.xPos + weaponParams.width &&
      asteroids[i].yPos + asteroids[i].height > weaponParams.yPos &&
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
      asteroids[i].yPos -= asteroids[i].step;
      asteroids[i].visual.style.bottom = asteroids[i].yPos + 'px';
    }
  }
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
      bullet.visual.style.bottom = bullet.yPos + 'px';
      //check if bullet hit any asteroid, if yes remove bullet and asteroid
      let indexOfAsteroid = asteroids.length - 1;
      while (indexOfAsteroid >= 0) {
        let asteroid = asteroids[indexOfAsteroid];
        if (
          bullet.xPos + bulletParams.width > asteroid.xPos &&
          bullet.xPos < asteroid.xPos + asteroid.width &&
          bullet.yPos + bulletParams.height > asteroid.yPos &&
          bullet.yPos < asteroid.yPos + asteroid.height
        ) {
          // console.log("bullet hit the asteroid");
          sounds.blast.cloneNode().play();
          destroyedCount++;
          //check if we want to increase level
          if (destroyedCount % levelStep === 0 && level < maxLevel) {
            level++;
            clearInterval(genNewAsteroidsTimer);
            genNewAsteroidsTimer = setInterval(
              generateNewAsteroid,
              levels[level].genNewAsteroidInt
            );
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
      (direction === 'left' && weaponParams.xPos <= 5) ||
      (direction === 'right' &&
        weaponParams.xPos >= spaceWidth - weaponParams.width - 5)
    ) {
      isWeaponMoving = false;
      clearInterval(moveWeaponTimer);
      return;
    }
    weaponParams.xPos += step[direction];
    weapon.style.left = weaponParams.xPos + 'px';
  }, 20);
}

function control(e) {
  e.preventDefault();
  if (isGameOver) {
    if (e.key === 'Enter') {
      start();
      return;
    }
  } else {
    if (
      (e.key === 'ArrowLeft' || e.currentTarget.id === 'move-left') &&
      !isWeaponMoving
    ) {
      // console.log("want to move left");
      moveWeapon('left');
    } else if (
      (e.key === 'ArrowRight' || e.currentTarget.id === 'move-right') &&
      !isWeaponMoving
    ) {
      // console.log("want to move right");
      moveWeapon('right');
    }
    if (e.key === ' ') {
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
  if (e.key === ' ') {
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
    shoot: new Audio(sndUrls['shoot']),
    blast: new Audio(sndUrls['blast']),
    missed: new Audio(sndUrls['missed']),
    levelUp: new Audio(sndUrls['levelUp']),
    gameOver: new Audio(sndUrls['gameOver']),
    gameStart: new Audio(sndUrls['gameStart']),
  };
  Object.keys(sounds).forEach((type) => {
    sounds[type].load();
    // console.log(`sound "${type}" loaded`);
  });
}

function gameOver() {
  isGameOver = true;
  clearInterval(moveAsteroidsTimer);
  clearInterval(genNewAsteroidsTimer);
  clearInterval(moveBulletsTimer);
  clearInterval(moveWeaponTimer);
  isWeaponMoving = false;
  setStatus('game over');
  sounds.gameOver.play();
  weapon.remove();
  missedDisplay.remove();
  destroyedDisplay.remove();
  levelDisplay.remove();
  moveLeftIcon.remove();
  moveRightIcon.remove();
  fireControlIcon.remove();
  asteroids.forEach((asteroid) => {
    asteroid.destroy(); //destroy all asteroid objects
  });
  asteroids.length = 0; //empty asteroids array, just in case
  bullets.forEach((bullet) => {
    bullet.destroy(); //destroy all bullets
  });
  bullets.length = 0; //empty bullets array, just in case
  gameSummaryDisplay();

  if (!maintenanceMode) {
    console.log('starting update of top scores');
    updateTopScores().then(() => {
      console.log(
        'topscores variable before topscores.setcontent call',
        topScores
      );
      topScoresPanel.setContent(topScoresTemplate(topScores));
      topScoresPanel.display();
      missedCount = 0;
      destroyedCount = 0;
      startButton.style.display = '';
    });
  } else {
    console.log('In maintenance mode - skipping update of top scores.');
    topScoresPanel.setContent(topScoresTemplate(topScores));
    topScoresPanel.display();
    missedCount = 0;
    destroyedCount = 0;
    startButton.style.display = '';
  }
}

function start() {
  if (!isGameOver) {
    return; //already playing
  }
  setStatus(`Go, ${isLogged ? loggedUser.username : 'human'}, go!`);
  startButton.style.display = 'none';
  sounds.gameStart.play();
  isGameOver = false;
  level = 1;
  createWeapon();
  createCounterDisplays();
  gameSummaryDisplay('off');
  topScoresPanel.display('off');
  if (isFirstStart) {
    gameTitleDisplay('off');
    isFirstStart = false;
  }
  createTouchControls();
  initAsteroids();
  moveAsteroidsTimer = setInterval(moveAsteroids, asteroidsMoveInterval);
  genNewAsteroidsTimer = setInterval(
    generateNewAsteroid,
    levels[level].genNewAsteroidInt
  );
}

async function initGetTopScores() {
  // get current top scores from remote db
  const resp = await fetch(API_URL + '/top-scores');
  const data = await resp.json();
  console.log(data);
  if (data.topScores.length > 0) {
    topScores = data.topScores;
  }
  console.log('current fetched topscores:', topScores);
  topScoresPanel.setContent(topScoresTemplate(topScores));
  topScoresPanel.display();
}

async function updateTopScores() {
  // get current top scores from remote db
  const resp = await fetch(API_URL + '/top-scores');
  const data = await resp.json();
  console.log(data);
  if (data.topScores.length > 0) {
    topScores = data.topScores;
  }
  console.log('current fetched topscores:', topScores);
  if (data.status !== 'success') {
    return false;
  }
  const minScore = Math.min(topScores.map((item) => item.score));
  if (topScores.length >= 10 && minScore > destroyedCount) {
    console.log('Score not high enough for top 10');
    return false;
  }
  if (!isLogged) {
    // user not logged in
    console.log('user is not logged in, calling register function');
    gameSummaryDisplay('off');
    const loginSuccess = await registerNewUser();
    if (!loginSuccess) {
      console.log('could not register new user');
      setStatus(`registering process failed:(`);
      gameSummaryDisplay();
      return false;
    }
    gameSummaryDisplay();
    setStatus('wait, updating TOP 10 scores...');
    const dbUpdateSuccess = await updateTopScoresDb();
    setStatus('');
    if (!dbUpdateSuccess) {
      console.log('could not update remote topScore database');
      setStatus(`could not update TOP 10 scores:(`);
      return false;
    }
    console.log('remote user database updated successfully');
    setStatus(`TOP 10 scores updated successfully`);
    return;
  } else {
    // if user is already logged in
    setStatus('wait, updating TOP 10 scores...');
    const dbUpdateSuccess = await updateTopScoresDb();
    if (!dbUpdateSuccess) {
      console.log('could not update remote topScore database');
      setStatus(`could not update TOP 10 scores:(`);
      return false;
    }
    setStatus(`TOP 10 scores updated successfully`);
    console.log('remote user database updated successfully');
    return;
  }
}

function updateTopScoresDb() {
  return new Promise(async (resolve, reject) => {
    const postResp = await fetch(API_URL + '/top-scores', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loggedUser.username,
        secret: loggedUser.secret,
        score: destroyedCount,
      }),
    });
    const postData = await postResp.json();
    if (postData.status !== 'success') {
      console.error('cannot update top scores database', postData.message);
      reject();
    }
    console.log('top scores updated successfully');
    topScores = postData.topScores;
    resolve('done');
  });
}

function registerNewUser() {
  return new Promise((resolve, reject) => {
    gameSummaryDisplay('off');
    document.removeEventListener('keydown', control);
    document.removeEventListener('keyup', controlStop);
    userLoginPanel.display();
    const formEl = document.querySelector('#user-login');
    const input = document.querySelector('#username');
    const statusMsg = document.querySelector('#status-msg');

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log(input.value);
      const response = await fetch(API_URL + '/users');
      const users = await response.json();
      console.log(users);
      const isRegistered = users.filter(
        (item) => item.username === input.value
      );
      if (isRegistered.length > 0) {
        let msg =
          'User with this nickname is already registered! Try different one';
        console.log(msg);
        statusMsg.textContent = msg;
      } else {
        setStatus('moment please...');
        const postResp = await fetch(API_URL + '/users', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: input.value }),
        });
        const postData = await postResp.json();
        console.log(postData);
        if (postData.status !== 'success') {
          console.log(postdata.message);
          statusMsg.textContent = 'something went wrong, try again...';
          setStatus('');
        } else {
          console.log('user was successfully registered');
          statusMsg.textContent = `Thank you ${postData.username}, you are now registered!`;
          isLogged = true;
          loggedUser = {
            username: postData.username,
            secret: postData.secret,
          };
          setStatus(`Hi ${loggedUser.username}, you are now registered.`);
          localStorage.setItem(
            'asteroidsLoggedUser',
            JSON.stringify(loggedUser)
          );
          input.value = '';
          document.addEventListener('keydown', control);
          document.addEventListener('keyup', controlStop);
          userLoginPanel.display('off');
          gameSummaryDisplay('on');
          resolve(loggedUser);
        }
      }
    });
  });
}

createUI();
initGetTopScores();
statusBarEl.display();
if (isLogged) {
  setStatus(`Welcome back, <strong>${loggedUser.username}</strong>!`);
} else {
  setStatus('Welcome, human!');
}
initSounds();
createGameSummary();
gameSummaryDisplay('off');
createGameTitle();
