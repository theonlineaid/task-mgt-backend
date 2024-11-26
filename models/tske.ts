import mongoose, { Document, Model, Schema } from "mongoose";

// Define a TypeScript interface for Activity
export interface IActivity {
  type: "assigned" | "started" | "in progress" | "bug" | "completed" | "commented";
  activity?: string;
  date?: Date;
  by?: mongoose.Types.ObjectId;
}

// Define a TypeScript interface for SubTask
export interface ISubTask {
  title?: string;
  date?: Date;
  tag?: string;
}

// Define a TypeScript interface for the Task schema
export interface ITask extends Document {
  title: string;
  date?: Date;
  priority: "high" | "medium" | "normal" | "low";
  stage: "todo" | "in progress" | "completed";
  activities: IActivity[];
  subTasks: ISubTask[];
  assets: string[];
  team: mongoose.Types.ObjectId[]; // References to User IDs
  isTrashed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema with TypeScript typing
const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    date: { type: Date, default: new Date() },
    priority: {
      type: String,
      default: "normal",
      enum: ["high", "medium", "normal", "low"],
    },
    stage: {
      type: String,
      default: "todo",
      enum: ["todo", "in progress", "completed"],
    },
    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: [
            "assigned",
            "started",
            "in progress",
            "bug",
            "completed",
            "commented",
          ],
        },
        activity: { type: String },
        date: { type: Date, default: new Date() },
        by: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    subTasks: [
      {
        title: { type: String },
        date: { type: Date },
        tag: { type: String },
      },
    ],
    assets: [String],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isTrashed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create a Mongoose model with the typed schema
const Task: Model<ITask> = mongoose.model<ITask>("Task", taskSchema);

export default Task;
