'use client';

import { PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArticleSelectionStore } from '@/lib/store';
import { type MarketIntelligenceOutput } from '@/ai/flows/market-intelligence-aggregator';
import { type CompetitorArticle } from '@/ai/flows/schemas';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type Article = MarketIntelligenceOutput[0] | CompetitorArticle;

interface ArticleSelectionButtonProps {
    article: Article;
}

export function ArticleSelectionButton({ article }: ArticleSelectionButtonProps) {
    const { addArticle, removeArticle, isArticleSelected } = useArticleSelectionStore();
    const [isSelected, setIsSelected] = useState(false);

    // Subscribe to the store to handle re-hydration issues with zustand/persist
    const isStoreSelected = isArticleSelected(article.link);

    useEffect(() => {
        setIsSelected(isStoreSelected);
    }, [isStoreSelected]);

    const handleToggle = () => {
        if (isSelected) {
            removeArticle(article.link);
        } else {
            addArticle(article);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggle}
                        className="h-8 w-8"
                        aria-label={isSelected ? 'Remove article from selection' : 'Add article to selection'}
                    >
                        {isSelected ? (
                            <MinusCircle className="h-4 w-4 text-destructive" />
                        ) : (
                            <PlusCircle className="h-4 w-4 text-primary" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isSelected ? 'Remove from brief' : 'Add to brief'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
