
'use client';

import {
  Suspense,
  useEffect,
  useState,
  useTransition,
} from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  submitEditorialPlan,
  type EditorialPlanFormState,
} from '@/app/editorial-plan/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Info,
  Loader,
  Sparkles,
  Target,
  Users,
  Trash2,
  ListPlus,
  ListX,
  Wand2,
} from 'lucide-react';
import { type EditorialPlanOutput } from '@/ai/flows/generate-editorial-plan';
import { Input } from '../ui/input';
import { useArticleSelectionStore, useSettingsStore } from '@/lib/store';
import Link from 'next/link';

type SavedPlan = {
  id: string;
  name: string;
  date: string;
  plan: EditorialPlanOutput;
};

const initialState: EditorialPlanFormState = {
  status: 'idle',
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Generate & Save Plan
    </Button>
  );
}

function EditorialPlanForm({ state }: { state: EditorialPlanFormState }) {
  const { selectedArticles, excludedArticles, clearSelection, clearExclusion } =
    useArticleSelectionStore();
  const { rssFeeds, competitors } = useSettingsStore();

  const isInclusionMode = selectedArticles.length > 0;
  const isExclusionMode = !isInclusionMode && excludedArticles.length > 0;

  let alertTitle = 'Default Analysis';
  let alertDescription =
    'No articles selected or excluded. The plan will be based on all recent market and competitor articles.';
  let alertVariant: 'default' | 'destructive' = 'default';
  let alertIcon = <Info className="h-4 w-4" />;
  let clearAction = null;

  if (isInclusionMode) {
    alertTitle = `${selectedArticles.length} Articles Selected for Inclusion`;
    alertDescription =
      'The plan will be generated based ONLY on your hand-picked articles.';
    alertVariant = 'default';
    alertIcon = <ListPlus className="h-4 w-4" />;
    clearAction = (
      <Button
        variant="link"
        className="p-0 h-auto mt-2"
        onClick={e => {
          e.preventDefault();
          clearSelection();
        }}
      >
        Clear selection
      </Button>
    );
  } else if (isExclusionMode) {
    alertTitle = `${excludedArticles.length} Articles Excluded`;
    alertDescription =
      "The plan will be generated based on all recent articles, EXCEPT the ones you've omitted.";
    alertVariant = 'destructive';
    alertIcon = <ListX className="h-4 w-4" />;
    clearAction = (
      <Button
        variant="link"
        className="p-0 h-auto mt-2 text-destructive"
        onClick={e => {
          e.preventDefault();
          clearExclusion();
        }}
      >
        Clear exclusions
      </Button>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto w-full">
      <CardHeader>
        <CardTitle>Generate New Editorial Plan</CardTitle>
        <CardDescription>
          Name your plan and let the AI analyze market data. You can optionally
          build a custom brief by including or excluding specific articles from
          the other pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert
          variant={alertVariant}
          className={isInclusionMode ? 'border-primary' : ''}
        >
          {alertIcon}
          <AlertTitle>{alertTitle}</AlertTitle>
          <AlertDescription>{alertDescription}</AlertDescription>
          {clearAction}
        </Alert>
        <div>
          <Label htmlFor="planName">Plan Name</Label>
          <Input
            id="planName"
            name="planName"
            placeholder="e.g., Q3 Content Strategy"
            defaultValue={`Weekly Plan - ${new Date().toLocaleDateString()}`}
            required
          />
        </div>
        <div>
          <Label htmlFor="recentTopics">
            Optional: Topics you've covered recently
          </Label>
          <Textarea
            id="recentTopics"
            name="recentTopics"
            placeholder="e.g., Dubai property prices Q2, Best schools in Arabian Ranches, DAMAC vs Emaar comparison..."
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Provide a comma-separated list to help the AI find better content
            gaps.
          </p>
        </div>
        <input
          type="hidden"
          name="selectedArticles"
          value={JSON.stringify(selectedArticles)}
        />
        <input
          type="hidden"
          name="excludedArticles"
          value={JSON.stringify(excludedArticles)}
        />
        <input 
          type="hidden" 
          name="rssFeeds" 
          value={JSON.stringify(rssFeeds)} 
        />
        <input
          type="hidden"
          name="competitors"
          value={JSON.stringify(competitors)}
        />
      </CardContent>
      <CardFooter>
        <SubmitButton />
      </CardFooter>
      {state.status === 'error' && (
        <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Generating Plan</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}

function EditorialPlanDisplay({
  state,
  activePlan,
  setActivePlan,
  savedPlans,
  setSavedPlans,
  isPending,
}: {
  state: EditorialPlanFormState;
  activePlan: EditorialPlanOutput | null;
  setActivePlan: (plan: EditorialPlanOutput | null) => void;
  savedPlans: SavedPlan[];
  setSavedPlans: React.Dispatch<React.SetStateAction<SavedPlan[]>>;
  isPending: boolean;
}) {
  const deletePlan = (id: string) => {
    setSavedPlans(prevPlans => {
      const updatedPlans = prevPlans.filter(plan => plan.id !== id);
      try {
        localStorage.setItem('editorialPlans', JSON.stringify(updatedPlans));
      } catch (error) {
        console.error('Failed to save plans to localStorage', error);
      }
      if (activePlan && savedPlans.find(p => p.id === id)?.plan === activePlan) {
        setActivePlan(null);
      }
      return updatedPlans;
    });
  };

  const currentPlan = activePlan || state.data;

  return (
    <>
      {(state.status === 'loading' || isPending) && (
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg mt-6">
          <div className="text-center">
            <Loader className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">Generating Plan...</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI is analyzing market signals and competitor content. This may
              take a minute.
            </p>
          </div>
        </div>
      )}

      {currentPlan && state.status !== 'loading' && !isPending && (
        <div className="space-y-6 mt-6">
          <h2 className="text-2xl font-headline font-bold text-center">
            {activePlan ? 'Viewing Saved Plan' : "This Week's Proposed Editorial Plan"}
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-0"
          >
            {currentPlan.plan.map((idea, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-full">
                      {index + 1}
                    </div>
                    {idea.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 mt-1 text-accent" />
                    <div>
                      <h4 className="font-semibold">Strategic Angle</h4>
                      <p className="text-muted-foreground">{idea.angle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-1 text-accent" />
                    <div>
                      <h4 className="font-semibold">Target Audience</h4>
                      <p className="text-muted-foreground">
                        {idea.targetAudience}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 mt-1 text-accent" />
                    <div>
                      <h4 className="font-semibold">Key Talking Points</h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                        {idea.talkingPoints.map((point, pIndex) => (
                          <li key={pIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {idea.supportingArticles && idea.supportingArticles.length > 0 && (
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 mt-1 text-accent" />
                       <div>
                        <h4 className="font-semibold">Supporting Articles</h4>
                         <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                          {idea.supportingArticles.map((article, aIndex) => {
                            // Check if this is a Google News redirect URL
                            const isGoogleNewsUrl = article.link.includes('news.google.com/rss/articles/');
                            const displayTitle = isGoogleNewsUrl 
                              ? `${article.title} (via Google News)` 
                              : article.title;
                            
                            return (
                              <li key={aIndex}>
                                <Link
                                  href={article.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-primary"
                                  title={isGoogleNewsUrl ? "This link will redirect through Google News to the original article" : undefined}
                                >
                                  {displayTitle}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                   <div className="mt-4">
                      <Button asChild size="sm">
                          <Link href={`/content-blueprinting?topic=${encodeURIComponent(idea.title)}&keywords=${encodeURIComponent(idea.talkingPoints.join(', '))}&supportingArticles=${encodeURIComponent(JSON.stringify(idea.supportingArticles))}`}>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Create Blueprint
                          </Link>
                      </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {savedPlans.length > 0 && !isPending && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Saved Editorial Plans</CardTitle>
            <CardDescription>
              Review your previously generated content plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedPlans.map(savedPlan => (
                <div
                  key={savedPlan.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-secondary/50"
                >
                  <div>
                    <p className="font-semibold">{savedPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {savedPlan.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivePlan(savedPlan.plan)}
                    >
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deletePlan(savedPlan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === 'idle' && !currentPlan && !isPending && (
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg mt-6">
          <div className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Ready to Plan Your Content?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Name your plan and click "Generate & Save Plan" to get started.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function EditorialPlanClient() {
  const [state, formAction] = useFormState(submitEditorialPlan, initialState);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activePlan, setActivePlan] = useState<EditorialPlanOutput | null>(
    null
  );
  const { clearSelection, clearExclusion } = useArticleSelectionStore();

  const [isPending, startTransition] = useTransition();

  const handleFormAction = (payload: FormData) => {
    console.log('Form action called with payload:', payload);
    console.log('Form data entries:', Array.from(payload.entries()));
    startTransition(() => {
      // Clear the active plan view before generating a new one
      setActivePlan(null);
      formAction(payload);
    });
  };

  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem('editorialPlans');
      if (storedPlans) {
        setSavedPlans(JSON.parse(storedPlans));
      }
    } catch (error)      {
        console.error('Failed to parse saved plans from localStorage', error);
      }
  }, []);

  useEffect(() => {
    if (state.status === 'success' && state.data) {
      const planName =
        document.querySelector<HTMLInputElement>('#planName')?.value ||
        'Untitled Plan';

      const newPlan: SavedPlan = {
        id: new Date().toISOString() + Math.random(), // Add random number to ensure uniqueness
        name: planName,
        date: new Date().toLocaleString(),
        plan: state.data,
      };

      // Set the newly generated plan as the active one to display
      setActivePlan(state.data);

      // Add the new plan to the saved plans list and update localStorage
      setSavedPlans(prevPlans => {
        const updatedPlans = [...prevPlans, newPlan];
        try {
          localStorage.setItem('editorialPlans', JSON.stringify(updatedPlans));
        } catch (error) {
          console.error('Failed to save plans to localStorage', error);
        }
        return updatedPlans;
      });

      // Reset selections
      clearSelection();
      clearExclusion();
    }
  }, [state, clearSelection, clearExclusion]);

  return (
    <div className="grid gap-6">
      <form action={handleFormAction}>
        <EditorialPlanForm state={state} />
      </form>
      <Suspense fallback={null}>
        <EditorialPlanDisplay
          state={state}
          activePlan={activePlan}
          setActivePlan={setActivePlan}
          savedPlans={savedPlans}
          setSavedPlans={setSavedPlans}
          isPending={isPending}
        />
      </Suspense>
    </div>
  );
}
