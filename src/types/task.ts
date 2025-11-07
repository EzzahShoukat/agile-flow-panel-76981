export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User | null;
  dueDate: Date | null;
  tags: string[];
  comments: Comment[];
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  taskCount: number;
}
