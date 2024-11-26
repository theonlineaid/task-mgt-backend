import express, { Router } from "express";
import {
  activateUserProfile,
  changeUserPassword,
  deleteUserProfile,
  getNotificationsList,
  getTeamList,
  loginUser,
  logoutUser,
  markNotificationRead,
  registerUser,
  updateUserProfile,
} from "../controllers/userController";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewares";

const userRoutes:Router = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/logout", logoutUser);

userRoutes.get("/get-team", protectRoute, isAdminRoute, getTeamList);
userRoutes.get("/notifications", protectRoute, getNotificationsList);

userRoutes.put("/profile", protectRoute, updateUserProfile);
userRoutes.put("/read-noti", protectRoute, markNotificationRead);
userRoutes.put("/change-password", protectRoute, changeUserPassword);

// //   FOR ADMIN ONLY - ADMIN ROUTES
userRoutes
  .route("/:id")
  .put(protectRoute, isAdminRoute, activateUserProfile)
  .delete(protectRoute, isAdminRoute, deleteUserProfile);

export default userRoutes;