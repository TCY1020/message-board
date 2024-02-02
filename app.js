const { Pagination } = require('./app/service/utils/pagination');
const { MessageFormatter } = require('./app/service/utils/messageFormatter');

module.exports = app => {
  app.context.utils = {
    MessageFormatter,
    Pagination,
  };
};
