import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Response } from "express";

// interface JwtPayload {
//   userId: string;
// }

export const dbConnection = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connection established");
  } catch (error) {
    console.error("DB Error: ", error);
    throw error;
  }
};

export const createJWT = (res: Response, userId: string): void => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  const token = jwt.sign({ userId } as JwtPayload, process.env.JWT_SECRET, {
    expiresIn: "1d", // Token expiration time
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use HTTPS in production
    sameSite: "strict", // Prevent CSRF attacks
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  });
};
