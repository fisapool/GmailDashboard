import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Form schema
const accountSchema = z.object({
  email: z.string().email("Please enter a valid Gmail address"),
  name: z.string().optional(),
  authType: z.enum(["oauth", "password"]),
  credentials: z.string().optional(),
});

export default function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const { addAccount, getOAuthUrl } = useAccounts();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: "",
      name: "",
      authType: "oauth",
      credentials: "",
    },
  });
  
  // Watch authType to show/hide password field
  const authType = form.watch("authType");
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    try {
      setIsLoading(true);
      
      if (values.authType === "oauth") {
        // For OAuth, redirect to Google OAuth
        const url = await getOAuthUrl();
        if (url) {
          window.location.href = url;
        }
      } else {
        // For password auth, add account directly
        if (!values.credentials) {
          form.setError("credentials", {
            type: "required",
            message: "App Password is required",
          });
          return;
        }
        
        await addAccount.mutateAsync({
          email: values.email,
          name: values.name,
          authType: values.authType,
          credentials: values.credentials,
        });
        
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error adding account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Gmail Account</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gmail Address</FormLabel>
                  <FormControl>
                    <Input placeholder="user@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Personal, Work, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="authType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="oauth" id="oauth" />
                        <Label htmlFor="oauth">Google OAuth (Recommended)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="password" id="password" />
                        <Label htmlFor="password">App Password</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Google OAuth is more secure and doesn't require storing your password
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {authType === "password" && (
              <>
                <Alert variant="warning" className="my-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You'll need to generate an App Password in your Google Account settings.
                    <a 
                      href="https://support.google.com/accounts/answer/185833" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline mt-1"
                    >
                      How to generate an App Password
                    </a>
                  </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="credentials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your App Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : 
                 authType === "oauth" ? "Authorize with Google" : "Add Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
