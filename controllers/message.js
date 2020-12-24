const { Message } = require("../models");

exports.getMessages = async (req, res) => {
  const userId = req.session.userId;
  const recipientId = req.params.connectionId;
  const all = await Message.find()
    .or([
      { senderId: userId, recipientId: recipientId },
      { senderId: recipientId, recipientId: userId },
    ])
    .limit(50);
  return res.status(200).json({
    success: true,
    messages: all,
  });
};

exports.getMessageById = async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json("Message with this ID does not exist");
  }
  res.json(message);
};

exports.createMessage = async (msg, res) => {
  try {
    const newMessage = await Message.create(msg);
    console.log(newMessage);
    // io.emit("message", newMessage);
    return res.status(200).json({
      success: true,
      newMessage: newMessage,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err,
    });
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const result = await Message.findByIdAndDelete(messageId);
  res.sendStatus("204");
};
