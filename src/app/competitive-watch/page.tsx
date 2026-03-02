'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { competitorWatch } from '@/ai/flows/competitor-watch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExportButton } from '@/components/ExportButton';
import { aggregateMarketIntelligence, type MarketIntelligenceOutput } from '@/ai/flows/market-intelligence-aggregator';
import { ArticleSelectionButton } from '@/components/ArticleSelectionButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader } from 'lucide-react';
import { ArticleOmissionButton } from '@/components/ArticleOmissionButton';
import { useSettingsStore } from '@/lib/store';
import { type CompetitorArticle } from '@/ai/flows/schemas';

export default function CompetitiveWatchPage() {
  const [allArticles, setAllArticles] = useState<MarketIntelligenceOutput>([]);
  const [competitorArticles, setCompetitorArticles] = useState<CompetitorArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const { rssFeeds, competitors } = useSettingsStore();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const marketIntel = await aggregateMarketIntelligence(rssFeeds);
      setAllArticles(marketIntel);
      
      const compArticles = await competitorWatch(marketIntel, competitors);
      setCompetitorArticles(compArticles);
      setLoading(false);
    }
    fetchData();
  }, [rssFeeds, competitors]);


  const exportData = competitorArticles.map(article => ({
    title: article.title,
    link: article.link,
    competitor: article.competitor,
    source: article.source,
    pubDate: article.pubDate,
  }));

  return (
    <>
      <PageHeader
        title="Competitive Watch"
        description="A full list of articles mentioning competitors from the last 30 days."
      >
        <ExportButton data={exportData} filename="competitive-watch.csv" />
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
          <CardTitle>All Competitor Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            {loading ? (
               <div className="flex items-center justify-center h-full">
                  <Loader className="h-6 w-6 animate-spin" />
               </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitorArticles.length > 0 ? (
                  competitorArticles.map((article, index) => (
                    <TableRow key={index}>
                       <TableCell>
                         <div className="flex justify-center">
                            <ArticleSelectionButton article={article} />
                            <ArticleOmissionButton articleLink={article.link} />
                         </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                           {article.isNew && <Badge>NEW</Badge>}
                          <Link href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            <span dangerouslySetInnerHTML={{ __html: article.title }} />
                          </Link>
                        </div>
                      </TableCell>
                       <TableCell>
                        <Badge variant="outline">{article.competitor}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{article.source}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No competitor articles found in the last 30 days.
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
