'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Building, Newspaper, SearchCheck, TrendingUp, ArrowRight, Loader } from 'lucide-react';
import { aggregateMarketIntelligenceOptimized } from '@/ai/flows/market-intelligence-simple-optimized';

type MarketIntelligenceOutput = Array<{
  id: string;
  source: string;
  title: string;
  link: string;
  pubDate: string;
  relativeDate: string;
  snippet: string;
  mainTopic: string;
  subTopic: string;
  fetchedAt: string;
}>;
import { competitorWatch } from '@/ai/flows/competitor-watch';
import { generateEditorialPlan, type EditorialPlanOutput } from '@/ai/flows/generate-editorial-plan';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/store';
import { type CompetitorArticle } from '@/ai/flows/schemas';
import { Skeleton } from '@/components/ui/skeleton';


export default function Dashboard() {
  const [marketPulse, setMarketPulse] = useState<MarketIntelligenceOutput>([]);
  const [competitorArticles, setCompetitorArticles] = useState<CompetitorArticle[]>([]);
  const [editorialPlan, setEditorialPlan] = useState<EditorialPlanOutput | null>(null);
  const [loading, setLoading] = useState({
    marketPulse: true,
    competitors: true,
    editorialPlan: true
  });

  const { rssFeeds, competitors } = useSettingsStore();

  useEffect(() => {
    async function fetchMarketIntelligence() {
      try {
        const marketIntel = await aggregateMarketIntelligenceOptimized(rssFeeds);
        setMarketPulse(marketIntel);
        setLoading(prev => ({ ...prev, marketPulse: false }));

        // Load competitors after market data is ready
        fetchCompetitors(marketIntel);
      } catch (error) {
        console.error('Failed to fetch market intelligence:', error);
        setLoading(prev => ({ ...prev, marketPulse: false }));
      }
    }

    async function fetchCompetitors(marketIntel: MarketIntelligenceOutput) {
      try {
        const compArticles = await competitorWatch(marketIntel, competitors);
        setCompetitorArticles(compArticles);
        setLoading(prev => ({ ...prev, competitors: false }));

        // Generate editorial plan last as it's least critical for initial load
        fetchEditorialPlan(marketIntel, compArticles);
      } catch (error) {
        console.error('Failed to fetch competitor data:', error);
        setLoading(prev => ({ ...prev, competitors: false }));
      }
    }

    async function fetchEditorialPlan(marketIntel: MarketIntelligenceOutput, compArticles: CompetitorArticle[]) {
      try {
        const editorialPlanResult = await generateEditorialPlan({
          marketPulse: marketIntel,
          competitorArticles: compArticles,
          recentTopics: "Dubai real estate trends, off-plan investments, luxury market analysis"
        });
        setEditorialPlan(editorialPlanResult);
        setLoading(prev => ({ ...prev, editorialPlan: false }));
      } catch (error) {
        console.error('Failed to generate editorial plan:', error);
        setLoading(prev => ({ ...prev, editorialPlan: false }));
      }
    }

    // Start with market intelligence first
    fetchMarketIntelligence();
  }, [rssFeeds, competitors]);


  const stats = [
    { title: 'Keyword Opportunities', value: 'Coming Soon', icon: SearchCheck, change: 'Feature in development', changeType: 'neutral', href: '#' },
    { title: 'Trending Topics', value: 'Coming Soon', icon: TrendingUp, change: 'Feature in development', changeType: 'neutral', href: '#' },
    { title: 'Competitor Articles', value: competitorArticles.length, icon: Newspaper, change: 'in last 30 days', changeType: 'neutral', href: '/competitive-watch' },
  ];

  const getCategoryForSource = (source: string) => {
    switch (source) {
      case 'Google Alert':
        return 'Alert';
      case 'Google News':
        return 'Market News';
      case 'Arabian Business':
        return 'Publication';
      default:
        return 'News';
    }
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Weekly intelligence cycle overview and market pulse summary."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.title} className="hover:opacity-90 transition-opacity">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(stat.title === 'Competitor Articles' && loading.competitors) ? (
                    <Skeleton className="h-7 w-1/2" />
                ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className={`text-xs ${
                    stat.changeType === 'increase' ? 'text-green-600' :
                    stat.changeType === 'decrease' ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Market Pulse
            </CardTitle>
          </CardHeader>
          <CardContent>
             {loading.marketPulse ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
             ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketPulse.slice(0, 4).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.source}</TableCell>
                    <TableCell>
                       <Link href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <span dangerouslySetInnerHTML={{ __html: item.title }} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryForSource(item.source)}</Badge>
                    </TableCell>
                    <TableCell>{item.relativeDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             )}
          </CardContent>
        </Card>
        <Card>
           <CardHeader>
             <CardTitle>Editorial Plan Engine</CardTitle>
           </CardHeader>
           <CardContent>
              {loading.editorialPlan ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : editorialPlan && editorialPlan.plan.length > 0 ? (
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="text-lg font-headline">Top Priority: {editorialPlan.plan[0].title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Angle:</strong> {editorialPlan.plan[0].angle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Target:</strong> {editorialPlan.plan[0].targetAudience}
                    </p>
                  </div>
                  {editorialPlan.plan.length > 1 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Additional Ideas:</h4>
                      <ul className="space-y-1">
                        {editorialPlan.plan.slice(1, 3).map((idea, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {idea.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Generating editorial ideas from market intelligence...</p>
                </div>
              )}
           </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" /> Competitive Watch
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/competitive-watch">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading.competitors ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            ) : competitorArticles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitorArticles.slice(0, 5).map((article, index) => (
                    <TableRow key={index}>
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
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-48 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">No competitor articles found in the last 30 days.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
