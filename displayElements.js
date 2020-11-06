// HTML templates for display panels

const topScoresTemplate = function (topScores) {
  console.log(
    'Inside function topScoresTemplate, topscores is equal to:',
    topScores
  );
  const contentTop = `
  <h3>Top Scores</h3>
  <ol>`;
  let contentListItems = '';
  for (let i = 0; i < topScores.length; i++) {
    contentListItems += `
      <li><span class="topscores-username">${topScores[i].username}</span>
      <span class="topscores-score">${topScores[i].score}</span></li>`;
  }
  const contentBottom = `</ol>`;

  return contentTop + contentListItems + contentBottom;
};

const userLoginTemplate = function (msg = '') {
  const content = `
    <h3>Enter your nickname to be listed in TOP 10 scores:</h3>
    <form id="user-login" class="user-login-form">
      <label for="username">max 10 characters</label>
      <input id="username" type="text" placeholder="mycoolnick" maxlength="10" autofocus />
      <button id="user-submit" type="submit">Submit</button>
    </form>
    <p id="status-msg">${msg}</p>
  `;
  return content;
};

export { topScoresTemplate, userLoginTemplate };
