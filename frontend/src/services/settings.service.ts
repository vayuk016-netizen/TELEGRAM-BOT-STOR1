import { apiClient } from "@/lib/api-client";

export interface SettingsData {
  bot_token: string;
  bakong_api_token?: string;
  bakong_account_id?: string;
  khqr_merchant_name?: string;
  khqr_merchant_city?: string;
  khqr_account_number?: string;
  aba_account_name?: string;
  aba_account_number?: string;
  aba_qr_link?: string;
}

export const settingsService = {
  async getSettings(): Promise<SettingsData> {
    const res = await apiClient.get<SettingsData>("/settings");
    return res.data;
  },

  async updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
    const res = await apiClient.post<SettingsData>("/settings", data);
    return res.data;
  },

  async uploadQrCode(file: File): Promise<{ qr_link: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<{ qr_link: string }>("/settings/upload-qr", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
