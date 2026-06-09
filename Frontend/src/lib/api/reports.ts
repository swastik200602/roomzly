import { apiRequest } from "@/lib/api/client";

export type ReportType = "FAKE_LISTING" | "SCAM" | "HARASSMENT" | "SPAM" | "FAKE_BROKER";
export type ReportTargetType = "PROPERTY" | "USER" | "MESSAGE_THREAD";

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  type: ReportType;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED";
  description: string;
  createdAt: string;
};

export const reportsApi = {
  create(payload: { targetType: ReportTargetType; targetId: string; type: ReportType; description: string }) {
    return apiRequest<Report>("/reports", {
      method: "POST",
      body: payload,
    });
  },
};
