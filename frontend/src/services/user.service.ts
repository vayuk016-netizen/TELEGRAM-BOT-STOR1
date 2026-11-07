import { apiClient } from "@/lib/api-client";
import { CustomerUser } from "@/types/order.types";

export interface BroadcastSchedule {
  id: number;
  title?: string;
  message_text: string;
  image_path?: string;
  scheduled_at: string;
  interval_delay: number;
  status: "pending" | "sending" | "completed" | "failed";
  target_type?: "users" | "group" | "both";
  group_chat_id?: string;
  total_targets: number;
  sent_successfully: number;
  failed_or_blocked: number;
  sent_at?: string;
  created_at: string;
}

export interface BroadcastPayload {
  title?: string;
  message_text: string;
  interval_delay: number;
  image_path?: string;
  target_type?: "users" | "group" | "both";
  group_chat_id?: string;
}

export interface BroadcastSchedulePayload extends BroadcastPayload {
  scheduled_at: string;
}

export const userService = {
  async getUsers(skip: number = 0, limit: number = 50): Promise<CustomerUser[]> {
    const res = await apiClient.get<CustomerUser[]>("/users", { params: { skip, limit } });
    return res.data;
  },

  async adjustBalance(userId: number, amount: number, reason?: string): Promise<CustomerUser> {
    const res = await apiClient.patch<CustomerUser>(`/users/${userId}/balance`, { amount, reason });
    return res.data;
  },

  // Legacy compatibility method
  async sendBroadcast(messageText: string): Promise<{ total_targets: number; sent_successfully: number; failed_or_blocked: number; message: string }> {
    const res = await apiClient.post("/broadcast", { message_text: messageText });
    return res.data;
  },

  async uploadBroadcastImage(file: File): Promise<{ image_path: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<{ image_path: string }>("/broadcast/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  async sendImmediateBroadcast(payload: BroadcastPayload): Promise<{ message: string; schedule_id: number }> {
    const res = await apiClient.post("/broadcast", payload);
    return res.data;
  },

  async scheduleBroadcast(payload: BroadcastSchedulePayload): Promise<BroadcastSchedule> {
    const res = await apiClient.post<BroadcastSchedule>("/broadcast/schedule", payload);
    return res.data;
  },

  async getBroadcastSchedules(): Promise<BroadcastSchedule[]> {
    const res = await apiClient.get<BroadcastSchedule[]>("/broadcast/schedules");
    return res.data;
  },

  async deleteBroadcastSchedule(scheduleId: number): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/broadcast/schedules/${scheduleId}`);
    return res.data;
  },
};
