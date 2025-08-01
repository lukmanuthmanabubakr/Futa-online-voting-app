const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    role: { type: String, default: "student" },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

module.exports = mongoose.model("User", userSchema);
