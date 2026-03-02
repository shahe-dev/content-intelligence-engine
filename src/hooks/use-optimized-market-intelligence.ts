/**
 * @fileOverview Optimized Market Intelligence Hook
 * 
 * This hook provides:
 * - Smart caching and incremental updates
 * - Real-time refresh capabilities  
 * - Background refresh without blocking UI
 * - Cache status and statistics
 * - Manual refresh controls
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type RssFeed } from '@/lib/store';
import { 
  aggregateMarketIntelligenceOptimized, 
  getCacheStats, 
  refreshSpecificFeeds,
  clearCache 
} from '@/ai/flows/market-intelligence-simple-optimized';

interface UseOptimizedMarketIntelligenceOptions {
  refreshIntervalMinutes?: number; // Auto-refresh interval
  enableBackgroundRefresh?: boolean; // Enable automatic background updates
  maxRetries?: number; // Max retry attempts on failure
}

interface CacheStats {
  totalArticles: number;
  cacheAge: string;
  feedFetchTimes: Record<string, string>;
}

interface UseOptimizedMarketIntelligenceReturn {
  articles: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  cacheStats: CacheStats | null;
  isBackgroundRefreshPaused: boolean;
  
  // Actions
  refresh: (forceRefresh?: boolean) => Promise<void>;
  refreshSpecific: (feedUrls: string[]) => Promise<void>;
  clearAllCache: () => void;
  
  // Background refresh control
  pauseBackgroundRefresh: () => void;
  resumeBackgroundRefresh: () => void;
}

export function useOptimizedMarketIntelligence(
  feeds: RssFeed[],
  options: UseOptimizedMarketIntelligenceOptions = {}
): UseOptimizedMarketIntelligenceReturn {
  const {
    refreshIntervalMinutes = 15,
    enableBackgroundRefresh = true,
    maxRetries = 3
  } = options;

  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [backgroundRefreshPaused, setBackgroundRefreshPaused] = useState(false);

  const retryCountRef = useRef(0);
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch articles with error handling and retry logic
   */
  const fetchArticles = useCallback(async (forceRefresh = false, isBackground = false) => {
    try {
      if (!isBackground) {
        setIsRefreshing(true);
      }
      
      const newArticles = await aggregateMarketIntelligenceOptimized(feeds, forceRefresh);
      const stats = await getCacheStats();
      
      setArticles(newArticles);
      setCacheStats(stats);
      setLastUpdated(new Date());
      setError(null);
      retryCountRef.current = 0;

      if (!isBackground) {
        setLoading(false);
      }

      console.log(`Articles updated: ${newArticles.length} total (background: ${isBackground})`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch articles';
      console.error('Market intelligence fetch failed:', err);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`Retrying... attempt ${retryCountRef.current}/${maxRetries}`);
        setTimeout(() => fetchArticles(forceRefresh, isBackground), 2000 * retryCountRef.current);
        return;
      }
      
      setError(errorMessage);
      setLoading(false);
    } finally {
      if (!isBackground) {
        setIsRefreshing(false);
      }
    }
  }, [feeds, maxRetries]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async (forceRefresh = false) => {
    await fetchArticles(forceRefresh, false);
  }, [fetchArticles]);

  /**
   * Refresh specific feeds only
   */
  const refreshSpecific = useCallback(async (feedUrls: string[]) => {
    try {
      setIsRefreshing(true);
      const newArticles = await refreshSpecificFeeds(feeds, feedUrls);
      const stats = await getCacheStats();
      
      setArticles(newArticles);
      setCacheStats(stats);
      setLastUpdated(new Date());
      setError(null);
      
      console.log(`Specific feeds refreshed: ${feedUrls.length} feeds`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh specific feeds';
      setError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [feeds]);

  /**
   * Clear all cache
   */
  const clearAllCache = useCallback(async () => {
    await clearCache();
    setArticles([]);
    setCacheStats(null);
    setLastUpdated(null);
    console.log('All cache cleared');
  }, []);

  /**
   * Background refresh control
   */
  const pauseBackgroundRefresh = useCallback(() => {
    setBackgroundRefreshPaused(true);
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
      backgroundIntervalRef.current = null;
    }
    console.log('Background refresh paused');
  }, []);

  const resumeBackgroundRefresh = useCallback(() => {
    setBackgroundRefreshPaused(false);
    console.log('Background refresh resumed');
  }, []);

  /**
   * Set up background refresh
   */
  useEffect(() => {
    if (!enableBackgroundRefresh || backgroundRefreshPaused) return;

    const intervalMs = refreshIntervalMinutes * 60 * 1000;
    
    backgroundIntervalRef.current = setInterval(() => {
      console.log('Background refresh triggered');
      fetchArticles(false, true); // Background refresh, not forced
    }, intervalMs);

    return () => {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
      }
    };
  }, [enableBackgroundRefresh, backgroundRefreshPaused, refreshIntervalMinutes, fetchArticles]);

  /**
   * Initial fetch when feeds change
   */
  useEffect(() => {
    if (feeds.length > 0) {
      setLoading(true);
      fetchArticles(false, false);
    }
  }, [feeds, fetchArticles]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
      }
    };
  }, []);

  return {
    articles,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    cacheStats,
    isBackgroundRefreshPaused: backgroundRefreshPaused,
    refresh,
    refreshSpecific,
    clearAllCache,
    pauseBackgroundRefresh,
    resumeBackgroundRefresh,
  };
}