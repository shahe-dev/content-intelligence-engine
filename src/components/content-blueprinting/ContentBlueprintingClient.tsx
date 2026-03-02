
'use client';

import { Suspense, useEffect, useState, useTransition, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitContentBlueprint, type BlueprintingFormState } from '@/app/content-blueprinting/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader, Wand2, Trash2, Copy } from 'lucide-react';
import { useEffect as useIsomorphicLayoutEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type AIAssistedContentBlueprintingOutput } from '@/ai/flows/ai-assisted-content-blueprinting';
import { useSearchParams } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';


const initialState: BlueprintingFormState = {
  status: 'idle',
  message: '',
  data: null,
};

type SavedBlueprint = {
    id: string;
    name: string;
    date: string;
    blueprint: AIAssistedContentBlueprintingOutput;
    supportingArticles?: Array<{
        title: string;
        link: string;
        source?: string;
    }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Generate Blueprint
    </Button>
  );
}

function BlueprintingForm({
  state,
  formAction
}: {
  state: BlueprintingFormState;
  formAction: (payload: FormData) => void;
}) {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  const keywords = searchParams.get('keywords');
  const supportingArticlesParam = searchParams.get('supportingArticles');
  const [topicValue, setTopicValue] = useState(topic || '');

  // Parse supporting articles from URL params
  const supportingArticles = useMemo(() => {
    if (supportingArticlesParam) {
      try {
        return JSON.parse(decodeURIComponent(supportingArticlesParam));
      } catch {
        return [];
      }
    }
    return [];
  }, [supportingArticlesParam]);

  // Effect to update form when URL params change
  useEffect(() => {
    setTopicValue(topic || '');
  }, [topic]);

  const getErrorMessage = (fieldName: keyof NonNullable<BlueprintingFormState['errors']>) => {
    return state.errors?.[fieldName]?.[0] && (
      <p className="text-sm text-destructive mt-1">{state.errors[fieldName]?.[0]}</p>
    );
  };

  return (
    <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>New Content Blueprint</CardTitle>
            <CardDescription>Provide details to generate a comprehensive content plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="e.g., Guide to buying off-plan properties"
                value={topicValue}
                onChange={(e) => setTopicValue(e.target.value)}
              />
              {getErrorMessage('topic')}
            </div>
            <div>
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input id="keywords" name="keywords" placeholder="e.g., off-plan dubai, new projects, property investment" defaultValue={keywords || ''} />
              {getErrorMessage('keywords')}
            </div>
            <div>
              <Label htmlFor="toneGuide">Tone Guide</Label>
              <Textarea id="toneGuide" name="toneGuide" rows={3} defaultValue={"Authoritative & data-driven (like Knight Frank) yet trustworthy & approachable (like Betterhomes)."}/>
              {getErrorMessage('toneGuide')}
            </div>
            <div>
              <Label htmlFor="serpData">SERP Data (Optional)</Label>
              <Textarea id="serpData" name="serpData" placeholder="Paste top-ranking titles and descriptions here." rows={3} />
            </div>
            <div>
              <Label htmlFor="competitorOutlines">Competitor Outlines (Optional)</Label>
              <Textarea id="competitorOutlines" name="competitorOutlines" placeholder="Paste competitor H2s/H3s here." rows={3} />
            </div>
            
            {/* Supporting Articles from Editorial Plan */}
            {supportingArticles.length > 0 && (
              <div>
                <Label>Supporting Articles from Editorial Plan</Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">
                    These articles will be referenced to provide current market context:
                  </p>
                  <ul className="space-y-2">
                    {supportingArticles.map((article: any, index: number) => (
                      <li key={index} className="text-sm">
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {article.title}
                        </a>
                        {article.source && (
                          <span className="text-muted-foreground ml-2">({article.source})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Hidden input for supporting articles */}
            <input 
              type="hidden" 
              name="supportingArticles" 
              value={supportingArticles.length > 0 ? JSON.stringify(supportingArticles) : ''} 
            />
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
    </form>
  );
}

function GeneratedBlueprintDisplay({
    blueprint,
    title = "Generated Blueprint",
    isNew = false,
    supportingArticles = [],
}: {
    blueprint: AIAssistedContentBlueprintingOutput;
    title?: string;
    isNew?: boolean;
    supportingArticles?: Array<{
        title: string;
        link: string;
        source?: string;
    }>;
}) {
    const { toast } = useToast();

    const handleCopy = (text: string, section: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: 'Copied to Clipboard',
                description: `${section} has been copied.`,
            });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast({
                title: 'Error',
                description: `Failed to copy ${section}.`,
                variant: 'destructive',
            });
        });
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {isNew && <CardDescription>This blueprint has been saved automatically.</CardDescription>}
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="outline">
                    <TabsList className={`grid w-full ${supportingArticles.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        <TabsTrigger value="outline">Outline</TabsTrigger>
                        <TabsTrigger value="seoBrief">SEO Brief</TabsTrigger>
                        <TabsTrigger value="draftIntro">Draft Intro</TabsTrigger>
                        {supportingArticles.length > 0 && (
                            <TabsTrigger value="sources">Sources</TabsTrigger>
                        )}
                    </TabsList>
                    <TabsContent value="outline" className="mt-4 p-4 bg-secondary rounded-md max-h-[60vh] overflow-y-auto relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => handleCopy(blueprint.outline, 'Outline')}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm whitespace-pre-wrap font-body">{blueprint.outline}</pre>
                    </TabsContent>
                    <TabsContent value="seoBrief" className="mt-4 p-4 bg-secondary rounded-md max-h-[60vh] overflow-y-auto relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => handleCopy(blueprint.seoBrief, 'SEO Brief')}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm whitespace-pre-wrap font-body">{blueprint.seoBrief}</pre>
                    </TabsContent>
                    <TabsContent value="draftIntro" className="mt-4 p-4 bg-secondary rounded-md max-h-[60vh] overflow-y-auto relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => handleCopy(blueprint.draftIntro, 'Draft Intro')}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm whitespace-pre-wrap font-body">{blueprint.draftIntro}</pre>
                    </TabsContent>
                    {supportingArticles.length > 0 && (
                        <TabsContent value="sources" className="mt-4 p-4 bg-secondary rounded-md max-h-[60vh] overflow-y-auto">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm mb-3">Supporting Articles Used in This Blueprint</h4>
                                {supportingArticles.map((article, index) => (
                                    <div key={index} className="p-3 bg-background rounded border">
                                        <h5 className="font-medium text-sm mb-1">{article.title}</h5>
                                        {article.source && (
                                            <p className="text-xs text-muted-foreground mb-2">Source: {article.source}</p>
                                        )}
                                        <a 
                                            href={article.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            View Article →
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}

function BlueprintingContent({ 
  state, 
  isPending, 
  activeBlueprint, 
  currentSupportingArticles, 
  savedBlueprints,
  activeBlueprintId
}: { 
  state: BlueprintingFormState, 
  isPending: boolean, 
  activeBlueprint: AIAssistedContentBlueprintingOutput | null,
  currentSupportingArticles: Array<{title: string, link: string, source?: string}>,
  savedBlueprints: SavedBlueprint[],
  activeBlueprintId: string | null
}) {
  const currentBlueprint = activeBlueprint || state.data;

  if (state.status === 'loading' || isPending) {
    return (
      <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
          <h3 className="mt-4 text-lg font-semibold">Generating...</h3>
          <p className="mt-1 text-sm text-muted-foreground">The AI is creating your content blueprint.</p>
        </div>
      </div>
    );
  }

  if (currentBlueprint) {
      const activeSavedBlueprint = activeBlueprintId ? savedBlueprints.find(saved => saved.id === activeBlueprintId) : null;
      
      return <GeneratedBlueprintDisplay 
        blueprint={currentBlueprint} 
        isNew={state.status === 'success'} 
        title={activeSavedBlueprint ? "Viewing Saved Blueprint" : "Generated Blueprint"}
        supportingArticles={state.status === 'success' ? currentSupportingArticles : (activeSavedBlueprint?.supportingArticles || [])}
      />;
  }

  return (
    <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Awaiting Input</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your generated blueprint will appear here.</p>
      </div>
    </div>
  );
}


export function ContentBlueprintingClient() {
  const [state, formAction] = useFormState(submitContentBlueprint, initialState);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprint[]>([]);
  const [activeBlueprint, setActiveBlueprint] = useState<AIAssistedContentBlueprintingOutput | null>(null);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);

  // Get supporting articles from URL params for saving with blueprint
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const supportingArticlesParam = searchParams?.get('supportingArticles');
  const currentSupportingArticles = useMemo(() => {
    if (supportingArticlesParam) {
      try {
        return JSON.parse(decodeURIComponent(supportingArticlesParam));
      } catch {
        return [];
      }
    }
    return [];
  }, [supportingArticlesParam]);


  useIsomorphicLayoutEffect(() => {
     try {
      const storedBlueprints = localStorage.getItem('contentBlueprints');
      if (storedBlueprints) {
        const parsedBlueprints = JSON.parse(storedBlueprints);
        setSavedBlueprints(parsedBlueprints);
      }
    } catch (error) {
      console.error('Failed to parse saved blueprints from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (state.status === 'success' && state.data) {
        const topicInput = document.querySelector<HTMLInputElement>('#topic');
        const newBlueprint: SavedBlueprint = {
            id: new Date().toISOString(),
            name: topicInput?.value || 'Untitled Blueprint',
            date: new Date().toLocaleString(),
            blueprint: state.data,
            supportingArticles: currentSupportingArticles.length > 0 ? currentSupportingArticles : undefined,
        };

        setActiveBlueprint(state.data);
        setActiveBlueprintId(null); // Clear saved blueprint ID for new blueprint
        
        setSavedBlueprints(prev => {
            const updatedBlueprints = [newBlueprint, ...prev];
             try {
                localStorage.setItem('contentBlueprints', JSON.stringify(updatedBlueprints));
            } catch (error) {
                console.error('Failed to save blueprints to localStorage', error);
            }
            return updatedBlueprints;
        });

    } else if (state.status === 'error') {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, currentSupportingArticles]);

  const handleFormAction = (payload: FormData) => {
    startTransition(() => {
      setActiveBlueprint(null);
      setActiveBlueprintId(null);
      formAction(payload);
    });
  };

  const deleteBlueprint = (id: string) => {
    setSavedBlueprints(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('contentBlueprints', JSON.stringify(updated));
        if (activeBlueprintId === id) {
            setActiveBlueprint(null);
            setActiveBlueprintId(null);
        }
        return updated;
    });
  };

  return (
     <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Using Suspense to wrap the component that uses searchParams */}
            <Suspense fallback={<BlueprintingForm state={state} formAction={handleFormAction} />}>
                <BlueprintingFormWithSearchParams state={state} formAction={handleFormAction} />
            </Suspense>
            <BlueprintingContent 
                state={state} 
                isPending={isPending} 
                activeBlueprint={activeBlueprint} 
                currentSupportingArticles={currentSupportingArticles}
                savedBlueprints={savedBlueprints}
                activeBlueprintId={activeBlueprintId}
            />
        </div>

        {savedBlueprints.length > 0 && (
             <Card>
                <CardHeader>
                    <CardTitle>Saved Blueprints</CardTitle>
                    <CardDescription>Review your previously generated blueprints.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {savedBlueprints.map(saved => (
                            <AccordionItem value={saved.id} key={saved.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <div className="text-left">
                                            <p className="font-semibold">{saved.name}</p>
                                            <p className="text-sm text-muted-foreground">Generated on {saved.date}</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button variant="outline" size="sm" onClick={() => {
                                            setActiveBlueprint(saved.blueprint);
                                            setActiveBlueprintId(saved.id);
                                        }}>
                                            View Details
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => deleteBlueprint(saved.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <GeneratedBlueprintDisplay 
                                        blueprint={saved.blueprint} 
                                        title="Saved Blueprint Details" 
                                        supportingArticles={saved.supportingArticles || []} 
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        )}
    </div>
  );
}


// A new wrapper component to ensure useSearchParams is used within a Suspense boundary
function BlueprintingFormWithSearchParams({ state, formAction }: { state: BlueprintingFormState, formAction: (payload: FormData) => void }) {
    return <BlueprintingForm state={state} formAction={formAction} />;
}
