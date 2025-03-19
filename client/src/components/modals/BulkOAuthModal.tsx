
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";

const bulkOAuthSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  redirectUri: z.string().url("Must be a valid URL"),
  count: z.number().min(1).max(50)
});

interface BulkOAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkOAuthModal({ open, onOpenChange }: BulkOAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof bulkOAuthSchema>>({
    resolver: zodResolver(bulkOAuthSchema),
    defaultValues: {
      projectId: "",
      clientName: "",
      redirectUri: "",
      count: 1
    }
  });

  const onSubmit = async (values: z.infer<typeof bulkOAuthSchema>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/oauth/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: values.projectId,
          clientName: values.clientName,
          redirectUris: [values.redirectUri],
          count: values.count
        })
      });

      if (!response.ok) throw new Error('Failed to create credentials');
      
      const data = await response.json();
      toast({
        title: "Success",
        description: `Created ${data.credentials.length} OAuth credentials`
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Bulk OAuth Credentials</DialogTitle>
          <DialogDescription>
            Create multiple OAuth client IDs for your Google Cloud project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project ID</FormLabel>
                  <FormControl>
                    <Input placeholder="your-project-id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name Prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="gmail-manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="redirectUri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redirect URI</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-app.com/oauth/callback" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Credentials</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={50} 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Credentials"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
