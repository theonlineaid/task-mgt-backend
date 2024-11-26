import mongoose, { Schema, Document, Model } from "mongoose";

// Define the interface for a single notice document
export interface INotice extends Document {
  team: mongoose.Types.ObjectId[]; // Array of User ObjectId references
  text: string; // Notice text
  task: mongoose.Types.ObjectId | null; // Reference to a Task
  notiType: "alert" | "message"; // Notification type
  isRead: mongoose.Types.ObjectId[]; // Array of User ObjectId references
  createdAt?: Date; // Automatically added by timestamps
  updatedAt?: Date; // Automatically added by timestamps
}

// Define the schema
const noticeSchema: Schema<INotice> = new Schema(
  {
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    text: { type: String, required: true }, // Added `required` for stronger validation
    task: { type: Schema.Types.ObjectId, ref: "Task", default: null }, // Default to `null` if no task is associated
    notiType: { type: String, default: "alert", enum: ["alert", "message"] },
    isRead: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Define the model
const Notice: Model<INotice> = mongoose.model<INotice>("Notice", noticeSchema);

export default Notice;
