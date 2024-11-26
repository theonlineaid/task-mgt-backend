import bcrypt from "bcryptjs";
import mongoose, { Document, Model, Schema } from "mongoose";

// Define a TypeScript interface for the User schema
export interface IUser extends Document {
  name: string;
  title: string;
  role: string;
  email: string;
  password: string;
  isAdmin: boolean;
  tasks: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

// Define the schema with TypeScript typing
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// Pre-save middleware to hash the password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

// Create a Mongoose model with the typed schema
const User: Model<IUser> = mongoose.model<IUser>("TaskUser", userSchema);

export default User;
