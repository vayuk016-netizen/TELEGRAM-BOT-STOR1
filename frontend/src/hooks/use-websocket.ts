import { useState, useEffect } from "react";
import { orderService } from "@/services/order.service";
import { AnalyticsOverview } from "@/types/order.types";

export function useLiveAnalytics(intervalMs: number = 5000) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async (skipLoader: boolean = false) => {
      try {
        const overview = await orderService.getAnalytics(skipLoader);
        if (isMounted) {
          setData(overview);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics(false);
    const interval = setInterval(() => fetchAnalytics(true), intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { data, loading };
}
