import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { customerSchema } from "@/lib/validation";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { qk } from "@/lib/queryKeys";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { CollapseGroupControls } from "@/components/ui/CollapseGroupControls";

type CustomerFormValues = z.infer<typeof customerSchema> & { notes?: string };

const DEFAULTS: CustomerFormValues = { name: "", email: "", phone: "", address: "", notes: "" };

export function Customers() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: DEFAULTS,
    mode: "onBlur",
  });

  const { data: customers } = useQuery({
    queryKey: qk.customers,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCustomer(null);
    form.reset(DEFAULTS);
  };

  const addMutation = useSafeMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const { error } = await supabase.from("customers").insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.customers });
      closeDialog();
    },
    successMessage: "কাস্টমার যোগ হয়েছে!",
    errorPrefix: "কাস্টমার যোগ ব্যর্থ",
  });

  const updateMutation = useSafeMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerFormValues }) => {
      const { error } = await supabase.from("customers").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.customers });
      closeDialog();
    },
    successMessage: "কাস্টমার আপডেট হয়েছে!",
    errorPrefix: "আপডেট ব্যর্থ",
  });

  const deleteMutation = useSafeMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.customers }),
    successMessage: "কাস্টমার মুছে ফেলা হয়েছে",
    errorPrefix: "ডিলিট ব্যর্থ",
  });

  const onSubmit = (values: CustomerFormValues) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: values });
    } else {
      addMutation.mutate(values);
    }
  };

  const startEdit = (customer: any) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
  };

  const errors = form.formState.errors;
  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer database</p>
          </div>
          <Dialog open={isAddDialogOpen || !!editingCustomer} onOpenChange={(open) => { if (!open) closeDialog(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-primary to-accent">
                ➕ Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <Input {...form.register("name")} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input type="email" {...form.register("email")} aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input {...form.register("phone")} aria-invalid={!!errors.phone} />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input {...form.register("address")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Input {...form.register("notes")} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-primary to-accent">
                    {isSaving ? "সংরক্ষণ হচ্ছে..." : editingCustomer ? "Update" : "Add"} Customer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {customers?.map((customer) => (
            <Card key={customer.id} className="p-6 card-hover">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{customer.name}</h3>
                    {customer.email && <p className="text-sm text-muted-foreground mt-1">📧 {customer.email}</p>}
                    {customer.phone && <p className="text-sm text-muted-foreground">📞 {customer.phone}</p>}
                  </div>
                  <div className="text-3xl">👤</div>
                </div>
                {customer.address && <p className="text-sm text-muted-foreground">📍 {customer.address}</p>}
                {customer.notes && <p className="text-sm text-muted-foreground italic">"{customer.notes}"</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(customer)} className="flex-1">
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this customer?")) {
                        deleteMutation.mutate(customer.id);
                      }
                    }}
                    className="flex-1"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {(!customers || customers.length === 0) && (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No customers yet</h3>
              <p className="text-muted-foreground">Add your first customer to get started!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
