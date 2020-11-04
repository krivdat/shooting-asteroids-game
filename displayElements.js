// HTML templates for display panels

const topScoresTemplate = function (topScores = []) {
  const content = `
  <h3>Top Scores</h3>
  <div>
    <ol>
      <li>${topScores[1]}</li>
      <li>${topScores[2]}</li>
      <li>${topScores[3]}</li>
      <li>${topScores[4]}</li>
      <li>${topScores[5]}</li>
    </ol>
  </div>
  <div>
    <ol>
      <li>${topScores[5]}</li>
      <li>${topScores[6]}</li>
      <li>${topScores[7]}</li>
      <li>${topScores[8]}</li>
      <li>${topScores[9]}</li>
    </ol>
  </div>`;
  return content;
};

export { topScoresTemplate };
