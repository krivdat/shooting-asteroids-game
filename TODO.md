# top scores feature TODO breakdown

- [ ] after game over fetch remote db for top10 top scores
- [ ] if current score higher than worst in top10 than:
  - [ ] check localstorage if user already provided their nickname
  - [ ] if yes then update top10 with new score
  - [ ] if no then display input dialog asking for nickname
    - [ ] check if nickname isn't already in remote user db (not only in top10), display warning if so and don't allow this nickname
    - [ ] save nickname to remote user db
    - [ ] update top10 db with current score and nickname
    - [ ] save current nickname to localstorage
- [ ] display top10 scores and highlight current user's entries if any
