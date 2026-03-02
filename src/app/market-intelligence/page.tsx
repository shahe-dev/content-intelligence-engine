'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { aggregateMarketIntelligence, type MarketIntelligenceOutput } from '@/ai/flows/market-intelligence-aggregator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExportButton } from '@/components/ExportButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArticleSelectionButton } from '@/components/ArticleSelectionButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader } from 'lucide-react';
import { ArticleOmissionButton } from '@/components/ArticleOmissionButton';
import { useSettingsStore } from '@/lib/store';

export default function MarketIntelligencePage() {
  const [feedItems, setFeedItems] = useState<MarketIntelligenceOutput>([]);
  const [loading, setLoading] = useState(true);
  const { rssFeeds } = useSettingsStore();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const items = await aggregateMarketIntelligence(rssFeeds);
      setFeedItems(items);
      setLoading(false);
    }
    fetchData();
  }, [rssFeeds]);

  // Prepare data for export, ensuring all desired fields are present
  const exportData = feedItems.map(item => ({
    title: item.title,
    link: item.link,
    mainTopic: item.mainTopic,
    subTopic: item.subTopic,
    source: item.source,
    pubDate: item.pubDate,
  }));

  return (
    <>
      <PageHeader
        title="Market Intelligence"
        description="Aggregate of real estate news, categorized by AI."
      >
        <ExportButton data={exportData} filename="market-intelligence.csv" />
      </PageHeader>
       <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Build Your Plan</AlertTitle>
          <AlertDescription>
           Use the controls next to each article. Click `+` to add an article to a custom brief. Click `-` to omit an irrelevant article from the default analysis.
          </AlertDescription>
        </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Latest News & Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            ) : (
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
                  {feedItems.length > 0 ? (
                    feedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex justify-center">
                            <ArticleSelectionButton article={item} />
                            <ArticleOmissionButton articleLink={item.link} />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium align-top">
                          <Link href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
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
                        <TableCell className="text-right text-muted-foreground align-top">{item.relativeDate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No news items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
