import { Request, Response, NextFunction } from "express";
import Notice from "../models/notification";
import User, { IUser } from "../models/user";
import Task, { ITask } from "../models/tske";

// Define interfaces for better type safety
interface CustomRequest extends Request {
    user: {
        userId: string;
        isAdmin: boolean;
        email: string;
    };
}

// declare global {
//     namespace Express {
//         interface Request {
//             user: {
//                 userId: string; // Adjust based on the actual structure of the user
//                 isAdmin: boolean;
//             };
//         }
//     }
// }

export const createTask = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user; // Now TypeScript knows that `req.user` exists
        next();
        const { title, team, stage, date, priority, assets } = req.body;

        let text = "New task has been assigned to you";
        if (team?.length > 1) {
            text += ` and ${team?.length - 1} others.`;
        }

        text += ` The task priority is set at ${priority} priority, so check and act accordingly. The task date is ${new Date(
            date
        ).toDateString()}. Thank you!`;

        const activity = {
            type: "assigned",
            activity: text,
            by: userId,
        };

        const task = await Task.create({
            title,
            team,
            stage: stage.toLowerCase(),
            date,
            priority: priority.toLowerCase(),
            assets,
            activities: [activity],
            // dependencies: dependencies || [],
        });

        await Notice.create({
            team,
            text,
            task: task._id,
        });

        res.status(200).json({ status: true, task, message: "Task created successfully." });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};


export const duplicateTask = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);

        // Check if the task exists, return a response directly if not found
        if (!task) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        // Creating a new task with the same properties but changing the title
        const newTask = await Task.create({
            ...task.toObject(),
            title: `${task.title} - Duplicate`, // Add "- Duplicate" to the title
            _id: undefined, // Clear the _id field to let MongoDB create a new one
            activities: [], // You may want to clear activities, or retain them based on your use case
        });

        // Prepare notification text based on task details
        let text = `New task has been assigned to you`;
        if (task.team.length > 1) {
            text += ` and ${task.team.length - 1} others.`;
        }

        text += ` The task priority is set at ${task.priority} priority, so check and act accordingly. The task date is ${task?.date?.toDateString()}. Thank you!`;

        // Create a notification for the duplicated task
        await Notice.create({
            team: task.team,
            text,
            task: newTask._id,
        });

        // Send a success response back to the client
        res.status(200).json({
            status: true,
            message: "Task duplicated successfully.",
            task: newTask, // Optionally return the duplicated task in the response
        });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const postTaskActivity = async (req: CustomRequest, res: Response) : Promise<any>  => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const { type, activity } = req.body;

        const task = await Task.findById<ITask>(id);

        if (!task) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        const data:any = {
            type,
            activity,
            by: userId,
        };

        task.activities.push(data);

        await task.save();

        res.status(200).json({ status: true, message: "Activity posted successfully." });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const dashboardStatistics = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { userId, isAdmin } = req.user;

        const allTasks = isAdmin
            ? await Task.find<ITask>({ isTrashed: false })
                .populate({ path: "team", select: "name role title email" })
                .sort({ _id: -1 })
            : await Task.find<ITask>({ isTrashed: false, team: { $all: [userId] } })
                .populate({ path: "team", select: "name role title email" })
                .sort({ _id: -1 });

        const users = await User.find<IUser>({ isActive: true })
            .select("name title role isAdmin createdAt")
            .limit(10)
            .sort({ _id: -1 });

        const groupTaskks = allTasks.reduce((result: Record<string, number>, task) => {
            const stage = task.stage;
            result[stage] = (result[stage] || 0) + 1;
            return result;
        }, {});

        const groupData = Object.entries(
            allTasks.reduce((result: Record<string, number>, task) => {
                const { priority } = task;
                result[priority] = (result[priority] || 0) + 1;
                return result;
            }, {})
        ).map(([name, total]) => ({ name, total }));

        const totalTasks = allTasks.length;
        const last10Task = allTasks.slice(0, 10);

        const summary = {
            totalTasks,
            last10Task,
            users: isAdmin ? users : [],
            tasks: groupTaskks,
            graphData: groupData,
        };

        res.status(200).json({ status: true, message: "Successfully", ...summary });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};
export const getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stage, isTrashed } = req.query;

        const query: Record<string, any> = {
            isTrashed: isTrashed === "true" ? true : false,
        };

        if (stage) {
            query.stage = stage;
        }

        const tasks = await Task.find<ITask>(query)
            .populate({
                path: "team",
                select: "name title email",
            })
            .sort({ _id: -1 });

        res.status(200).json({ status: true, tasks });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const getTask = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const { id } = req.params;

        const task = await Task.findById<ITask>(id)
            .populate({
                path: "team",
                select: "name title role email",
            })
            .populate({
                path: "activities.by",
                select: "name",
            });

        if (!task) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        res.status(200).json({ status: true, task });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const createSubTask = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const { title, tag, date } = req.body;
        const { id } = req.params;

        const newSubTask = { title, date, tag };

        const task = await Task.findById<ITask>(id);

        if (!task) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        task.subTasks.push(newSubTask);
        await task.save();

        res.status(200).json({ status: true, message: "SubTask added successfully." });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const updateTask = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const { id } = req.params;
        const { title, date, team, stage, priority, assets } = req.body;

        const task = await Task.findById<ITask>(id);

        if (!task) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        task.title = title || task.title;
        task.date = date || task.date;
        task.team = team || task.team;
        task.stage = stage?.toLowerCase() || task.stage;
        task.priority = priority?.toLowerCase() || task.priority;
        task.assets = assets || task.assets;

        await task.save();

        res.status(200).json({ status: true, message: "Task updated successfully." });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const trashTask = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const { id } = req.params;

        const task = await Task.findById<ITask>(id);

        if (!task) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        task.isTrashed = true;
        await task.save();

        res.status(200).json({ status: true, message: "Task trashed successfully." });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const deleteRestoreTask = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const { id } = req.params;
        const { actionType } = req.query;

        switch (actionType) {
            case "delete":
                await Task.findByIdAndDelete(id);
                break;
            case "deleteAll":
                await Task.deleteMany({ isTrashed: true });
                break;
            case "restore":
                const task = await Task.findById<ITask>(id);
                if (!task) {
                    return res.status(404).json({ status: false, message: "Task not found." });
                }
                task.isTrashed = false;
                await task.save();
                break;
            case "restoreAll":
                await Task.updateMany({ isTrashed: true }, { $set: { isTrashed: false } });
                break;
            default:
                return res.status(400).json({ status: false, message: "Invalid action type." });
        }

        res.status(200).json({ status: true, message: "Operation performed successfully." });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ status: false, message: error.message });
    }
};

export const manageDependencies = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const { id } = req.params;
        const { dependencies } = req.body;

        if (!Array.isArray(dependencies)) {
            return res.status(400).json({
                status: false,
                message: "Dependencies must be an array of task IDs.",
            });
        }

        const validTasks = await Task.find({ _id: { $in: dependencies } });
        if (validTasks.length !== dependencies.length) {
            return res.status(400).json({
                status: false,
                message: "Some dependencies are invalid or do not exist.",
            });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { $set: { dependencies } },
            { new: true }
        ).populate("dependencies");

        if (!updatedTask) {
            return res.status(404).json({ status: false, message: "Task not found." });
        }

        res.status(200).json({
            status: true,
            task: updatedTask,
            message: "Dependencies updated successfully.",
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ status: false, message: "Internal server error." });
    }
};
