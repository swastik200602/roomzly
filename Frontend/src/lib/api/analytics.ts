import { apiRequest } from "@/lib/api/client";

export type AnalyticsOverview = {
  totalRevenue: number;
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
};

export type RevenuePoint = {
  month: string;
  total: number;
};

export type TopProperty = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  price: string | number;
};

export type TrafficSource = {
  source: string;
  percentage: number;
};

export const analyticsApi = {
  overview() {
    return apiRequest<AnalyticsOverview>("/analytics/overview");
  },

  revenue() {
    return apiRequest<RevenuePoint[]>("/analytics/revenue");
  },

  topProperties() {
    return apiRequest<TopProperty[]>("/analytics/top-properties");
  },

  traffic() {
    return apiRequest<TrafficSource[]>("/analytics/traffic");
  },
};
