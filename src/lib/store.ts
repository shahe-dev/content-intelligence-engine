'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type MarketIntelligenceOutput } from '@/ai/flows/market-intelligence-aggregator';
import { type CompetitorArticle } from '@/ai/flows/schemas';

type Article = MarketIntelligenceOutput[0] | CompetitorArticle;

interface ArticleSelectionState {
  selectedArticles: Article[];
  excludedArticles: string[]; // Store only links for exclusion
  addArticle: (article: Article) => void;
  removeArticle: (articleLink: string) => void;
  isArticleSelected: (articleLink: string) => boolean;
  addExcludedArticle: (articleLink: string) => void;
  removeExcludedArticle: (articleLink: string) => void;
  isArticleExcluded: (articleLink: string) => boolean;
  clearSelection: () => void;
  clearExclusion: () => void;
}

export const useArticleSelectionStore = create<ArticleSelectionState>()(
  persist(
    (set, get) => ({
      selectedArticles: [],
      excludedArticles: [],
      addArticle: (article) =>
        set((state) => ({
          selectedArticles: [...state.selectedArticles, article],
          excludedArticles: [], // Clear exclusions when an inclusion is made
        })),
      removeArticle: (articleLink) =>
        set((state) => ({
          selectedArticles: state.selectedArticles.filter(
            (a) => a.link !== articleLink
          ),
        })),
      isArticleSelected: (articleLink) =>
        get().selectedArticles.some((a) => a.link === articleLink),
      addExcludedArticle: (articleLink) =>
        set((state) => {
          if (state.selectedArticles.length > 0) return state; // Don't allow exclusion if inclusion is active
          return {
            excludedArticles: [...state.excludedArticles, articleLink],
          };
        }),
      removeExcludedArticle: (articleLink) =>
        set((state) => ({
          excludedArticles: state.excludedArticles.filter(
            (link) => link !== articleLink
          ),
        })),
      isArticleExcluded: (articleLink) =>
        get().excludedArticles.includes(articleLink),
      clearSelection: () => set({ selectedArticles: [] }),
      clearExclusion: () => set({ excludedArticles: [] }),
    }),
    {
      name: 'article-selection-storage',
    }
  )
);

// Settings Store
export interface RssFeed {
    source: string;
    url: string;
}

export interface Competitor {
    name: string;
    domain: string;
}

const DEFAULT_FEEDS: RssFeed[] = [
    {
      source: 'Google Alert',
      url: 'https://www.google.com/alerts/feeds/YOUR-ACCOUNT-ID/YOUR-FEED-ID',
    },
    {
      source: 'Google News',
      url: 'https://news.google.com/rss/search?q=(Dubai+OR+"Abu+Dhabi"+OR+Sharjah+OR+Ajman+OR+"Ras+Al+Khaimah"+OR+UAE+OR+Riyadh+OR+Jeddah+OR+"Saudi+Arabia"+OR+Muscat+OR+Oman)+AND+("real+estate"+OR+"real+estate+developer"+OR+property+OR+properties+OR+realty+OR+project+OR+projects+OR+"off+plan"+OR+"off-plan"+OR+villa+OR+apartment+OR+residential+OR+commercial+OR+investment+OR+development+OR+developer+OR+Emaar+OR+Damac+OR+Nakheel+OR+Aldar+OR+Meraas+OR+"Dubai+Properties"+OR+Sobha+OR+Azizi+OR+Deyaar+OR+Danube+OR+Ellington+OR+"Select+Group"+OR+Omniyat+OR+Reportage+OR+Wasl+OR+IMKAN+OR+Arada+OR+launch+OR+handover+OR+broker+OR+brokerage+OR+listing+OR+construction+OR+freehold)&hl=en-AE&gl=AE&ceid=AE:en',
    },
    {
      source: 'Arabian Business',
      url: 'https://www.arabianbusiness.com/gcc/uae/feed',
    },
];

const DEFAULT_COMPETITORS: Competitor[] = [
    { name: 'Driven Properties', domain: 'drivenproperties.com' },
    { name: 'Allsopp & Allsopp', domain: 'allsoppandallsopp.com' },
    { name: 'haus & haus', domain: 'hausandhaus.com' },
    { name: 'Knight Frank', domain: 'knightfrank.ae' },
    { name: 'Dxb Interact', domain: 'dxbinteract.com' },
    { name: 'Sotheby\'s Realty', domain: 'sothebysrealty.ae' },
    { name: 'Engel & Völkers', domain: 'engelvoelkers.com' },
    { name: 'AX CAPITAL', domain: 'axcapital.ae' },
    { name: 'Provident Estate', domain: 'providentestate.com' },
    { name: 'Dubai Properties', domain: 'dxbproperties.ae' },
    { name: 'Property Finder', domain: 'propertyfinder.ae' },
    { name: 'White & Co', domain: 'whiteandcogroup.com' },
    { name: 'Bayut', domain: 'bayut.com' },
    { name: 'LUXHABITAT', domain: 'luxhabitat.ae' },
    { name: 'fam Properties', domain: 'famproperties.com' },
];


interface SettingsState {
  rssFeeds: RssFeed[];
  competitors: Competitor[];
  setRssFeeds: (feeds: RssFeed[]) => void;
  setCompetitors: (competitors: Competitor[]) => void;
  clearAllData: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rssFeeds: DEFAULT_FEEDS,
      competitors: DEFAULT_COMPETITORS,
      setRssFeeds: (feeds) => set({ rssFeeds: feeds }),
      setCompetitors: (competitors) => set({ competitors }),
      clearAllData: () => {
        // This clears all persisted zustand stores.
        // It's a bit of a blunt instrument but effective for a "reset" feature.
        Object.keys(localStorage).forEach(key => {
            if (key.includes('-storage')) {
                localStorage.removeItem(key);
            }
        });
      },
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
