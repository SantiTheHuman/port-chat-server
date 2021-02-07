const { Message } = require("../models");

exports.getMessages = async (userId, contactId) => {
  const messages = await Message.find()
    .or([
      { senderId: userId, recipientId: contactId },
      { senderId: contactId, recipientId: userId },
    ])
    .sort({ createdAt: -1 })
    .limit(20);
  return messages;
};

exports.getMessageById = async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json("Message with this ID does not exist");
  }
  res.json(message);
};

exports.createMessage = async (msg) => {
  try {
    const newMessage = await Message.create(msg);
    console.log(newMessage);
    return newMessage;
  } catch (err) {
    console.log(err);
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const result = await Message.findByIdAndDelete(messageId);
  res.sendStatus("204");
};
