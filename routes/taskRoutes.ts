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
taskRoutes.get("/", protectRoute, getTasks); // use ?isTrashed=true
taskRoutes.get("/:id", protectRoute, getTask);

taskRoutes.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
taskRoutes.put("/update/:id", protectRoute, isAdminRoute, updateTask);
taskRoutes.put("/trash/:id", protectRoute, isAdminRoute, trashTask);
taskRoutes.put("/dependencies/:id", protectRoute, isAdminRoute, manageDependencies); // New route

// 1. Path Parameter (:id):
// Used to identify the specific task for actions like restore or delete.
// 2. Query Parameter (actionType):
// Controls the action (restore, restoreAll, delete, deleteAll).
taskRoutes.delete(
  "/delete-restore/:id?",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);
// DELETE /api/tasks/delete-restore/6746dcd80133f3d61e5ec219?actionType=restore
// DELETE /api/tasks/delete-restore?actionType=restoreAll
// DELETE /api/tasks/delete-restore/6746dcd80133f3d61e5ec219?actionType=delete
// DELETE /api/tasks/delete-restore?actionType=deleteAll

export default taskRoutes;
