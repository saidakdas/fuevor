import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export type Priority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
    id: number;
    milestone_id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: Priority;
    is_completed: boolean;
    completed_at: string | null;
    position: number;
    milestone?: Milestone;
}

export interface Milestone {
    id: number;
    goal_id: number;
    title: string;
    description: string | null;
    target_date: string | null;
    position: number;
    status: MilestoneStatus;
    progress: number;
    tasks?: Task[];
}

export interface Goal {
    id: number;
    title: string;
    description: string | null;
    start_date: string;
    target_date: string;
    status: GoalStatus;
    priority: Priority;
    motivation: string | null;
    reward: string | null;
    progress: number;
    completed_at: string | null;
    milestones_count?: number;
    milestones?: Milestone[];
}

export interface DashboardSummary {
    active_goals: number;
    completed_goals: number;
    average_progress: number;
    upcoming_tasks: Task[];
}
