# top scores feature TODO breakdown

- [x] after game over fetch remote db for top10 top scores
- [x] if current score higher than worst in top10 than:
  - [x] check localstorage if user already provided their nickname
  - [x] if yes then update top10 with new score
  - [x] if no then display input dialog asking for nickname
    - [x] check if nickname isn't already in remote user db (not only in top10), display warning if so and don't allow this nickname
    - [x] save nickname to remote user db
    - [x] update top10 db with current score and nickname
    - [x] save current nickname to localstorage
- [ ] highlight current user's latest entry after getting into top 10
