class MessageFormatter {
  constructor(messages) {
    this.messages = messages;
  }
  getMessage(id) {
    return { index: id, message: JSON.parse(this.messages) };
  }
  getMessages() {
    const allMessages = this.messages.map((message, index) => ({
      index,
      message: JSON.parse(message),
    }));
    return allMessages;
  }
}
module.exports = {
  MessageFormatter,
};
