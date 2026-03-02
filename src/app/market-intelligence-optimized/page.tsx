/**
 * @fileOverview Optimized Market Intelligence Page
 * 
 * This demonstrates the optimized market intelligence with:
 * - Incremental RSS feed updates
 * - Real-time cache statistics
 * - Manual refresh controls
 * - Background refresh management
 */

'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Loader, 
  Info, 
  Clock, 
  Database, 
  Pause, 
  Play, 
  Trash2,
  Zap,
  Activity 
} from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/store';
import { useOptimizedMarketIntelligence } from '@/hooks/use-optimized-market-intelligence';
import { ExportButton } from '@/components/ExportButton';
import { ArticleSelectionButton } from '@/components/ArticleSelectionButton';
import { ArticleOmissionButton } from '@/components/ArticleOmissionButton';

export default function OptimizedMarketIntelligencePage() {
  const { rssFeeds } = useSettingsStore();
  
  const {
    articles,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    cacheStats,
    isBackgroundRefreshPaused,
    refresh,
    refreshSpecific,
    clearAllCache,
    pauseBackgroundRefresh,
    resumeBackgroundRefresh,
  } = useOptimizedMarketIntelligence(rssFeeds, {
    refreshIntervalMinutes: 15,
    enableBackgroundRefresh: true,
    maxRetries: 3,
  });

  const exportData = articles.map(item => ({
    title: item.title,
    link: item.link,
    mainTopic: item.mainTopic,
    subTopic: item.subTopic,
    source: item.source,
    pubDate: item.pubDate,
  }));

  const handleRefreshSpecificFeed = (feedUrl: string) => {
    refreshSpecific([feedUrl]);
  };

  const uniqueSources = Array.from(new Set(articles.map(article => article.source)));

  return (
    <>
      <PageHeader
        title="Market Intelligence (Optimized)"
        description="Real-time RSS feed aggregation with intelligent caching and incremental updates."
      >
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => refresh(false)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Smart Refresh
          </Button>
          
          <Button
            onClick={() => refresh(true)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Force Refresh
          </Button>
          
          <ExportButton data={exportData} filename="market-intelligence-optimized.csv" />
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Cache Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articles.length}</div>
              <p className="text-xs text-muted-foreground">
                {cacheStats ? `Cached: ${cacheStats.totalArticles}` : 'No cache data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {cacheStats ? `Cache: ${cacheStats.cacheAge}` : 'No cache data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sources</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueSources.length}</div>
              <p className="text-xs text-muted-foreground">
                RSS feeds active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} text-muted-foreground`} />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {loading ? 'Loading...' : isRefreshing ? 'Updating...' : 'Ready'}
              </div>
              <p className="text-xs text-muted-foreground">
                Background refresh: {isBackgroundRefreshPaused ? 'Paused' : 'Active'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feed Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={pauseBackgroundRefresh} 
                variant={isBackgroundRefreshPaused ? "default" : "outline"} 
                size="sm"
                disabled={isBackgroundRefreshPaused}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Auto-Refresh
              </Button>
              
              <Button 
                onClick={resumeBackgroundRefresh} 
                variant={!isBackgroundRefreshPaused ? "default" : "outline"} 
                size="sm"
                disabled={!isBackgroundRefreshPaused}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Auto-Refresh
              </Button>
              
              <Button 
                onClick={() => clearAllCache()} 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>

            {cacheStats && (
              <div className="text-sm space-y-2">
                <h4 className="font-medium">Per-Feed Status:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(cacheStats.feedFetchTimes).map(([url, time]) => {
                    const feedName = rssFeeds.find(f => f.url === url)?.source || url;
                    return (
                      <div key={url} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{feedName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{time}</span>
                          <Button
                            onClick={() => handleRefreshSpecificFeed(url)}
                            variant="ghost"
                            size="sm"
                            disabled={isRefreshing}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Loading Articles</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Performance Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Smart Optimization Active</AlertTitle>
          <AlertDescription>
            ✅ Rule-based categorization (70% fewer AI calls) • ✅ Smart caching (15min intervals) • 
            ✅ AI limits (max 10 calls/refresh) • ✅ Displays up to 150 recent articles (30-day range)
          </AlertDescription>
        </Alert>

        {/* Articles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Articles ({articles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="h-8 w-8 animate-spin mr-2" />
                <span>Loading articles...</span>
              </div>
            ) : (
              <ScrollArea className="h-[70vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center">Actions</TableHead>
                      <TableHead className="w-2/5">Article</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Main Topic</TableHead>
                      <TableHead>Subtopic</TableHead>
                      <TableHead className="text-right">Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((item) => (
                      <TableRow key={item.id || item.link}>
                        <TableCell>
                          <div className="flex justify-center">
                            <ArticleSelectionButton article={item} />
                            <ArticleOmissionButton articleLink={item.link} />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium align-top">
                          <Link 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            <span dangerouslySetInnerHTML={{ __html: item.title }} />
                          </Link>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline">{item.source}</Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="secondary">{item.mainTopic}</Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="default">{item.subTopic}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground align-top">
                          {item.relativeDate}
                        </TableCell>
                      </TableRow>
                    ))}
                    {articles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No news items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}