'use client';

import { useSettingsStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


const settingsSchema = z.object({
  rssFeeds: z.array(z.object({
    source: z.string().min(1, "Source name is required."),
    url: z.string().url("Invalid URL format."),
  })),
  competitors: z.array(z.object({
    name: z.string().min(1, "Competitor name is required."),
    domain: z.string().min(1, "Domain is required."),
  })),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsClient() {
  const {
    rssFeeds,
    setRssFeeds,
    competitors,
    setCompetitors,
    clearAllData,
  } = useSettingsStore();

  const { toast } = useToast();

  const methods = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      rssFeeds,
      competitors,
    },
  });

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = methods;

  const { fields: feedFields, append: appendFeed, remove: removeFeed } = useFieldArray({
    control,
    name: 'rssFeeds',
  });

  const { fields: competitorFields, append: appendCompetitor, remove: removeCompetitor } = useFieldArray({
    control,
    name: 'competitors',
  });

  const onSubmit = (data: SettingsFormValues) => {
    setRssFeeds(data.rssFeeds);
    setCompetitors(data.competitors);
    toast({
        title: "Settings Saved",
        description: "Your RSS feeds and competitor list have been updated.",
    })
  };
  
  const handleClearData = () => {
    try {
        clearAllData();
        // This will reload the page and clear any in-memory state from other stores
        window.location.reload(); 
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to clear local data.",
            variant: "destructive"
        })
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Market Intelligence Sources</CardTitle>
            <CardDescription>Manage the RSS feeds used to aggregate market news.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md">
                <div className="grid gap-2 flex-1">
                  <div>
                    <Label htmlFor={`rssFeeds.${index}.source`}>Source Name</Label>
                    <Input
                      id={`rssFeeds.${index}.source`}
                      {...register(`rssFeeds.${index}.source`)}
                      placeholder="e.g., Arabian Business"
                    />
                    {errors.rssFeeds?.[index]?.source && (
                      <p className="text-sm text-destructive mt-1">{errors.rssFeeds[index]?.source?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`rssFeeds.${index}.url`}>Feed URL</Label>
                    <Input
                      id={`rssFeeds.${index}.url`}
                      {...register(`rssFeeds.${index}.url`)}
                      placeholder="https://www.example.com/feed.xml"
                    />
                     {errors.rssFeeds?.[index]?.url && (
                      <p className="text-sm text-destructive mt-1">{errors.rssFeeds[index]?.url?.message}</p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFeed(index)} className="mt-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendFeed({ source: '', url: '' })}>
              Add RSS Feed
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitor List</CardTitle>
            <CardDescription>Manage the list of competitors for monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {competitorFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md">
                 <div className="grid gap-2 flex-1">
                  <div>
                    <Label htmlFor={`competitors.${index}.name`}>Competitor Name</Label>
                    <Input
                      id={`competitors.${index}.name`}
                      {...register(`competitors.${index}.name`)}
                      placeholder="e.g., Driven Properties"
                    />
                     {errors.competitors?.[index]?.name && (
                      <p className="text-sm text-destructive mt-1">{errors.competitors[index]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`competitors.${index}.domain`}>Website Domain</Label>
                    <Input
                      id={`competitors.${index}.domain`}
                      {...register(`competitors.${index}.domain`)}
                      placeholder="e.g., drivenproperties.com"
                    />
                    {errors.competitors?.[index]?.domain && (
                      <p className="text-sm text-destructive mt-1">{errors.competitors[index]?.domain?.message}</p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCompetitor(index)} className="mt-8">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendCompetitor({ name: '', domain: '' })}>
              Add Competitor
            </Button>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button type="submit">Save All Settings</Button>
        </div>

        <Separator />
        
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Clear All Local Data</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all saved editorial plans, content blueprints,
                            and custom settings (RSS feeds, competitors) from your browser. 
                            This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearData}>Yes, clear everything</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground mt-2">
                    This is useful if you want to reset the application to its default state or clear out old test data.
                </p>
            </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
