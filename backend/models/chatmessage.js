import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    source: {
      type: String,
      default: "jikan"
    },
    ui: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        type: "none",
        data: {}
      }
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("ChatMessage", chatMessageSchema);