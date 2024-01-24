const getPagination = (page = 1, limit = 10, total) => {
  const totalPage = Math.ceil(total / limit);
  const pages = Array.from({ length: totalPage }, (_, index) => index + 1);
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  return { totalPage, pages, start, end };
};
const organizer = (emptyArray, redisData) => {
  for (let i = 0; i < redisData.length; i += 2) {
    const messageString = redisData[i];
    const timestampString = redisData[i + 1];
    const message = JSON.parse(messageString);
    const timestamp = parseInt(timestampString);
    emptyArray.push({
      index: i / 2,
      message: { ...message, timestamp },
    });
  }
};

module.exports = {
  getPagination,
  organizer,
};
