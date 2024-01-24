const getPagination = (page = 1, limit = 10, total) => {
  const totalPage = Math.ceil(total / limit);
  const pages = Array.from({ length: totalPage }, (_, index) => index + 1);
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  return { totalPage, pages, start, end };
};

module.exports = {
  getPagination,
};
