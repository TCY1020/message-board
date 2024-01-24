/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.board.index);
  router.post('/login', controller.board.login);
  // router.post('/login', app.passport.authenticate('local', { successRedirect: '/message', failureRedirect: '/' }));
  router.get('/message', controller.board.getMessages);
  router.post('/message/create', controller.board.postMessage);
  router.get('/message/:id/edit', controller.board.editMessage);
  router.put('/message/:id/edit', controller.board.putMessage);
  router.delete('/message/:id/delete', controller.board.deleteMessage);
};
