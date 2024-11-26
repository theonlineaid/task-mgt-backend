import express, { Router } from "express";
import userRoutes from "./userRoutes";
import taskRoutes from "./taskRoutes";

const RootRouter: Router = express.Router();

RootRouter.use("/user", userRoutes);
RootRouter.use("/task", taskRoutes);

export default RootRouter;