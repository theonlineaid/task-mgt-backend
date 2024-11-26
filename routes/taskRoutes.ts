import express, { Router } from "express";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  manageDependencies,
  postTaskActivity,
  trashTask,
  updateTask,
} from "../controllers/taskController";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewares";

const taskRoutes: Router = express.Router();

taskRoutes.post("/create", protectRoute, isAdminRoute, createTask);
taskRoutes.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
taskRoutes.post("/activity/:id", protectRoute, postTaskActivity);

taskRoutes.get("/dashboard", protectRoute, dashboardStatistics);
taskRoutes.get("/", protectRoute, getTasks);
taskRoutes.get("/:id", protectRoute, getTask);

taskRoutes.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
taskRoutes.put("/update/:id", protectRoute, isAdminRoute, updateTask);
taskRoutes.put("/:id", protectRoute, isAdminRoute, trashTask);
taskRoutes.put("/dependencies/:id", protectRoute, isAdminRoute, manageDependencies); // New route


taskRoutes.delete(
  "/delete-restore/:id?",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);

export default taskRoutes;