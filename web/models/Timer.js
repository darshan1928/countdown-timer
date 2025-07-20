import mongoose from "mongoose";

const timerSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  productId: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  description: { type: String },
  displayOptions: {
    color: String,
    size: String,
    position: String,
  },
  urgencySettings: {
    thresholdMins: { type: Number, default: 5 },
    type: { type: String, enum: ["pulse", "banner"], default: "pulse" },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Timer || mongoose.model("Timer", timerSchema);
