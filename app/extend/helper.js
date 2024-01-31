
class Pagination {
  constructor(page, limit, total = 0) {
    this.page = page;
    this.limit = limit;
    this.total = total;
  }
  getOffset() {
    const offset = (this.page - 1) * this.limit;

    return offset;
  }
  getPagination() {
    const totalPage = Math.ceil(this.total / this.limit);
    const pages = Array.from({ length: totalPage }, (_, index) => index + 1);
    const start = (this.page - 1) * this.limit;
    const end = start + this.limit - 1;

    return { totalPage, pages, start, end };
  }
}


module.exports = {
  Pagination,
};
