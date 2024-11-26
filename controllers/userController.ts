import { Request, Response } from "express";
import Notice, { INotice } from "../models/notification";
import User, { IUser } from "../models/user";
import { createJWT } from "../utils";

// Extend Request to include user property
interface CustomRequest extends Request {
  user: {
      userId: string;
      isAdmin: boolean;
      email: string;
  };
}

// Utility function to safely exclude the password field
const excludePasswordField = (user: IUser): Partial<IUser> => {
  const userObject = user.toObject();
  delete userObject.password; // Remove password field from the user object
  return userObject;
}

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, isAdmin, role, title } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      res.status(400).json({
        status: false,
        message: "User already exists",
      });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
    });

    if (user) {
      if (isAdmin) createJWT(res, user._id as string);

      // Safely remove the password from the response
      const userWithoutPassword = excludePasswordField(user);

      // Respond with the user object without password
      res.status(201).json(userWithoutPassword);
    } else {
      res.status(400).json({ status: false, message: "Invalid user data" });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({ status: false, message: "Invalid email or password." });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator",
      });
      return;
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      createJWT(res, user._id as string);

      // Safely remove the password from the response
      const userWithoutPassword = excludePasswordField(user);

      // Respond with the user object without password
      res.status(201).json(userWithoutPassword);
    } else {
      res.status(401).json({ status: false, message: "Invalid email or password" });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const getTeamList = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("name title role email isActive");

    res.status(200).json(users);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const getNotificationsList = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const notices = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title");

    res.status(201).json(notices);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const updateUserProfile = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { userId, isAdmin } = req.user!;
    const { _id } = req.body;

    const id = isAdmin && _id ? _id : userId;

    const user = await User.findById(id);

    if (user) {
      user.name = req.body.name || user.name;
      user.title = req.body.title || user.title;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();

      // Safely exclude the password field from the response
      const userWithoutPassword = excludePasswordField(updatedUser);

      res.status(201).json({
        status: true,
        message: "Profile Updated Successfully.",
        user: userWithoutPassword,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const markNotificationRead = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } }
      );
    } else if (id) {
      await Notice.findOneAndUpdate(
        { _id: id as string, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } }
      );
    }

    res.status(201).json({ status: true, message: "Done" });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const changeUserPassword = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.user!;

    const user = await User.findById(userId);

    if (user) {
      user.password = req.body.password;

      const updatePass = await user.save();

      // user.password = undefined;
      excludePasswordField(updatePass);

      res.status(201).json({
        status: true,
        message: "Password changed successfully.",
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const activateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (user) {
      user.isActive = req.body.isActive;

      await user.save();

      res.status(201).json({
        status: true,
        message: `User account has been ${user.isActive ? "activated" : "disabled"
          }`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res.status(200).json({ status: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};
