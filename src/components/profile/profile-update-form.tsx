// src/components/profile/profile-update-form.tsx
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateProfile, type User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { auth } from '@/lib/firebase'; 

const profileUpdateSchema = z.object({
  displayName: z.string()
    .min(1, "Display name cannot be empty.")
    .max(50, "Display name cannot exceed 50 characters.")
    .refine(value => value.trim().length > 0, { message: "Display name cannot be only spaces." }),
  // photoURL: z.string().url("Please enter a valid URL for your photo.").optional().or(z.literal('')), // Allow empty string to clear
});

type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

interface ProfileUpdateFormProps {
  currentUser: User;
}

export function ProfileUpdateForm({ currentUser }: ProfileUpdateFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: currentUser.displayName || '',
      // photoURL: currentUser.photoURL || '',
    },
  });

  React.useEffect(() => {
    // Reset form if currentUser displayName changes (e.g., after successful update and re-fetch)
    form.reset({
        displayName: currentUser.displayName || '',
        // photoURL: currentUser.photoURL || '',
    });
  }, [currentUser.displayName, currentUser.photoURL, form]);

  async function onSubmit(data: ProfileUpdateFormValues) {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "No user is currently signed in." });
      return;
    }

    // Ensure auth.currentUser is the same as the prop, just for safety, though it should be.
    if (auth.currentUser.uid !== currentUser.uid) {
        toast({ variant: "destructive", title: "Authentication Mismatch", description: "Current user does not match authenticated user." });
        return;
    }
    
    setIsLoading(true);
    try {
      const updates: { displayName?: string | null; photoURL?: string | null } = {};
      const newDisplayName = data.displayName.trim();

      if (newDisplayName !== (currentUser.displayName || '')) {
        updates.displayName = newDisplayName;
      }

      // Handle photoURL if input is added
      // const newPhotoURL = data.photoURL?.trim();
      // if (newPhotoURL !== (currentUser.photoURL || '')) {
      //   updates.photoURL = newPhotoURL || null; // Send null to remove photoURL
      // }


      if (Object.keys(updates).length === 0) {
        toast({ title: "No Changes", description: "Your profile information is already up to date." });
        setIsLoading(false);
        return;
      }

      await updateProfile(auth.currentUser, updates);
      
      // The onAuthStateChanged listener in AuthContext will handle updating
      // the local currentUser state (in AuthContext) and also syncing the
      // new displayName/photoURL to the userPublicProfiles Firestore collection.

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your desired display name" 
                  {...field} 
                  value={field.value || ''} // Ensure value is not null for input
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 
        <FormField
          control={form.control}
          name="photoURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo URL (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/your-image.png" 
                  {...field} 
                  value={field.value || ''} // Ensure value is not null
                />
              </FormControl>
              <FormDescription>
                Enter a URL for your profile picture. Leave blank to remove.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        */}
        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading && <Icons.Logo className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
