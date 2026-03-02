'use client';

import { Ban, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArticleSelectionStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ArticleOmissionButtonProps {
    articleLink: string;
}

export function ArticleOmissionButton({ articleLink }: ArticleOmissionButtonProps) {
    const {
        addExcludedArticle,
        removeExcludedArticle,
        isArticleExcluded,
        selectedArticles
    } = useArticleSelectionStore();

    const [isExcluded, setIsExcluded] = useState(false);
    const isExclusionModeActive = selectedArticles.length === 0;

    // Subscribe to the store to handle re-hydration issues with zustand/persist
    const isStoreExcluded = isArticleExcluded(articleLink);

    useEffect(() => {
        setIsExcluded(isStoreExcluded);
    }, [isStoreExcluded]);

    const handleToggle = () => {
        if (isExcluded) {
            removeExcludedArticle(articleLink);
        } else {
            addExcludedArticle(articleLink);
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
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={isExcluded ? 'Re-include article in analysis' : 'Omit article from analysis'}
                        disabled={!isExclusionModeActive}
                    >
                        {isExcluded ? (
                            <RotateCcw className="h-4 w-4 text-primary" />
                        ) : (
                            <Ban className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isExcluded ? 'Re-include in analysis' : 'Omit from analysis'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
