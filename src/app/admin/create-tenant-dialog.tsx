
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createNewTenant } from './actions';
import { Loader2 } from 'lucide-react';

const createTenantSchema = z.object({
  tenantName: z.string().min(3, { message: "Farm/Tenant name must be at least 3 characters." }),
  adminFullName: z.string().min(2, { message: "Admin's full name is required." }),
  adminEmail: z.string().email({ message: "A valid email is required for the admin." }),
});

type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

interface CreateTenantDialogProps {
  children: React.ReactNode;
}

export function CreateTenantDialog({ children }: CreateTenantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { tenantName: '', adminFullName: '', adminEmail: '' },
  });

  const onSubmit: SubmitHandler<CreateTenantFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await createNewTenant(data);
      if (result.success) {
        toast({
          title: "Tenant Created Successfully!",
          description: `An invitation has been sent to ${data.adminEmail}.`,
        });
        setIsOpen(false);
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error Creating Tenant",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Tenant</DialogTitle>
          <DialogDescription>
            Onboard a new farm, co-operative, or business. An invitation will be sent to the designated admin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-tenant-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="tenantName" render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant / Farm Name</FormLabel>
                <FormControl><Input placeholder="e.g., Green Acres Cooperative" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="adminFullName" render={({ field }) => (
              <FormItem>
                <FormLabel>First Admin's Full Name</FormLabel>
                <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="adminEmail" render={({ field }) => (
              <FormItem>
                <FormLabel>First Admin's Email</FormLabel>
                <FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
          <Button type="submit" form="create-tenant-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Tenant & Invite Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
