const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    senderId: String,
    recipientId: String,
    content: String,
    data: Array,
    tags: Array,
    sent: Boolean,
    seen: Boolean,
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
