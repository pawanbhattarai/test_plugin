import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";
import BulkOperations from "@/components/bulk-operations";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  branchId: z.number(),
  sortOrder: z.number().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function RestaurantCategories() {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isBulkCategoryDialogOpen, setIsBulkCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/restaurant/categories'],
  });

  const { data: branches } = useQuery({
    queryKey: ['/api/branches'],
  });

  const { user } = useAuth();

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch('/api/restaurant/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/categories'] });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Category created successfully" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => {
      const response = await fetch(`/api/restaurant/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/categories'] });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Category updated successfully" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/restaurant/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/categories'] });
      toast({ title: "Category deleted successfully" });
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      branchId: user?.role !== "superadmin" ? user?.branchId : undefined,
      sortOrder: 0,
    },
  });

  const resetCategoryForm = () => {
    categoryForm.reset({
      name: "",
      branchId: user?.role !== "superadmin" ? user?.branchId : undefined,
      sortOrder: 0,
    });
    setEditingCategory(null);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      branchId: category.branchId,
      sortOrder: category.sortOrder,
    });
    setIsCategoryDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isMobileMenuOpen={isMobileSidebarOpen}
        setIsMobileMenuOpen={setIsMobileSidebarOpen}
      />
      <div className="main-content">
        <Header
          title="Menu Categories"
          subtitle="Manage your restaurant menu categories"
          onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="p-6">
          {/* Add Button Section for Categories */}
          <div className="mb-6">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetCategoryForm}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Appetizers" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {user?.role === "superadmin" && (
                      <FormField
                        control={categoryForm.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value?.toString()} 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                  {branches?.map((branch: any) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                      {branch.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={categoryForm.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      {!editingCategory && (
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={() => {
                            setIsCategoryDialogOpen(false);
                            setIsBulkCategoryDialogOpen(true);
                          }}
                        >
                          Add Bulk
                        </Button>
                      )}
                      <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                        {editingCategory ? 'Update' : 'Create'} Category
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Menu Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.length ? (
                      categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.sortOrder}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this category?')) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          No categories found. Create your first category to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bulk Category Dialog */}
          <Dialog open={isBulkCategoryDialogOpen} onOpenChange={setIsBulkCategoryDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Categories in Bulk</DialogTitle>
              </DialogHeader>
              <BulkOperations 
                type="categories" 
                branches={Array.isArray(branches) ? branches : []} 
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/restaurant/categories'] });
                  setIsBulkCategoryDialogOpen(false);
                  toast({ title: "Categories created successfully" });
                }} 
                isDirectForm={true}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}