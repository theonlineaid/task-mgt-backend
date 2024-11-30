import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/user";

interface DecodedToken extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
      interface Request {
          user: {
              userId: string; // Adjust based on the actual structure of the user
              isAdmin: boolean;
              email: string;
          };
      }
  }
}

// Protect route middleware
export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (token) {
      // Verifying the JWT token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

      // Fetching user details from DB
      const user = await User.findById(decodedToken.userId).select("isAdmin email");

      if (!user) {
        res.status(401).json({
          status: false,
          message: "Not authorized. User not found.",
        });
        return;
      }

      // Attaching user to request object
      req.user = {
        email: user.email,
        isAdmin: user.isAdmin,
        userId: decodedToken.userId,
      };

      next();
    } else {
      res.status(401).json({
        status: false,
        message: "Not authorized. Try login again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({
      status: false,
      message: "Not authorized. Try login again.",
    });
  }
};

// Admin check middleware
export const isAdminRoute = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({
      status: false,
      message: "Not authorized as admin. Try login as admin.",
    });
  }
};
