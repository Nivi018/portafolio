import { Priority, Status } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<Status, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  WAITING_CUSTOMER:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  CLOSED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const STATUS_LABELS: Record<Status, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_CUSTOMER: "Waiting",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
