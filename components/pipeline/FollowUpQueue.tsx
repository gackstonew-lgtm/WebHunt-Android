"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Phone, 
  Sparkles,
  X 
} from "lucide-react";
import { 
  fetchUpcomingTasksAction, 
  toggleTaskCompletedAction, 
  createFollowUpTaskAction, 
  deleteTaskAction, 
  TaskItem 
} from "@/app/actions/tasks";
import { calculateNextBusinessDay, getTaskTypeLabel } from "@/lib/tasks/followups";
import { formatDate } from "@/lib/utils";

export default function FollowUpQueue() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("follow_up_email");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  const loadTasks = async () => {
    const res = await fetchUpcomingTasksAction();
    if (res.success && res.data) {
      setTasks(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggle = async (taskId: string, isCompleted: boolean) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await toggleTaskCompletedAction(taskId, isCompleted);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const dueAt = calculateNextBusinessDay(new Date(), 3);
    await createFollowUpTaskAction({
      taskType: newType,
      title: newTitle.trim(),
      dueAt,
      priority: newPriority,
    });
    setNewTitle("");
    setShowAddModal(false);
    loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteTaskAction(taskId);
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[rgba(248,243,240,0.12)] space-y-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#161616] text-[#0048BB]">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-[#F8F3F0]">Follow-Up Reminders</span>
          {tasks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#0048BB] text-white">
              {tasks.length}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-[#161616]/80 text-[#A8A196] hover:text-[#F8F3F0] border border-[rgba(248,243,240,0.12)] text-xs font-medium flex items-center space-x-1 transition"
        >
          <Plus className="w-3 h-3 text-[#0048BB]" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <p className="text-[11px] text-[#A8A196] italic py-2">
          No pending follow-up reminders. Tasks auto-populate when proposals or emails are sent.
        </p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.08)] hover:border-[rgba(248,243,240,0.2)] transition text-xs"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <button
                  onClick={() => handleToggle(task.id, true)}
                  className="text-[#A8A196] hover:text-[#5EBA8C] transition shrink-0"
                  title="Mark as completed"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="font-semibold text-[#F8F3F0] truncate max-w-[260px] sm:max-w-md">
                    {task.title}
                  </div>
                  <div className="text-[10px] text-[#A8A196] flex items-center space-x-2 mt-0.5">
                    <span className="text-[#0048BB] font-medium">{getTaskTypeLabel(task.taskType)}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#A8A196]" />
                      <span>Due: {formatDate(task.dueAt)}</span>
                    </span>
                    {task.leadName && (
                      <>
                        <span>•</span>
                        <span className="truncate text-[#F8F3F0] font-medium">{task.leadName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="text-[#A8A196] hover:text-red-400 p-1 transition shrink-0 ml-2"
                title="Delete reminder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D0D0D] border border-[rgba(248,243,240,0.2)] rounded-3xl p-6 shadow-2xl text-[#F8F3F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(248,243,240,0.12)] pb-3">
              <h4 className="font-bold text-sm">Create Follow-up Reminder</h4>
              <button onClick={() => setShowAddModal(false)} className="text-[#A8A196] hover:text-[#F8F3F0]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#A8A196] mb-1">Reminder Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Follow up on proposal sent to XYZ Cafe"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] focus:outline-none focus:ring-1 focus:ring-[#0048BB] text-xs text-[#F8F3F0]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#A8A196] mb-1">Channel / Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0]"
                  >
                    <option value="follow_up_email">Follow-up Email</option>
                    <option value="follow_up_whatsapp">WhatsApp Message</option>
                    <option value="follow_up_call">Phone Call</option>
                    <option value="interview_prep">Interview Prep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#A8A196] mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-[rgba(248,243,240,0.12)] text-xs text-[#F8F3F0]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(248,243,240,0.12)] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#161616]/80 text-[#F8F3F0] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-semibold shadow-md shadow-[#0048BB]/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
