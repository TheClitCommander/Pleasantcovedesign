import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, Plus, Edit2, Trash2, Copy, Eye, FileText, 
  Loader2, Building2, Search
} from "lucide-react";
import type { Template, InsertTemplate } from "@shared/schema";

export default function Templates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateForm, setTemplateForm] = useState<InsertTemplate>({
    name: "",
    businessType: "general",
    description: "",
    previewUrl: null,
    features: null,
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: api.getTemplates,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (template: InsertTemplate) =>
      fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "Template created",
        description: "Your template has been saved successfully",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Template> }) =>
      fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "Template updated",
        description: "Changes saved successfully",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/templates/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template deleted",
        description: "Template removed successfully",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setTemplateForm({
      name: "",
      businessType: "general",
      description: "",
      previewUrl: null,
      features: null,
    });
    setEditingTemplate(null);
  };

  // Handle create/update
  const handleSave = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id!,
        updates: templateForm,
      });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  // Start editing
  const startEdit = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      businessType: template.businessType,
      description: template.description,
      previewUrl: template.previewUrl,
      features: template.features,
    });
    setShowCreateModal(true);
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Duplicate template
  const duplicateTemplate = (template: Template) => {
    setTemplateForm({
      name: `${template.name} (Copy)`,
      businessType: template.businessType,
      description: template.description,
      previewUrl: template.previewUrl,
      features: template.features,
    });
    setShowCreateModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-gray-900">LocalBiz Pro</span>
            </a>
            <div className="hidden md:flex space-x-6 ml-8">
              <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/prospects" className="text-gray-600 hover:text-gray-900">Prospects</a>
              <a href="/inbox" className="text-gray-600 hover:text-gray-900">Inbox</a>
              <a href="/scheduling" className="text-gray-600 hover:text-gray-900">Scheduling</a>
              <a href="/clients" className="text-gray-600 hover:text-gray-900">Clients</a>
              <a href="/templates" className="text-primary border-b-2 border-primary pb-2 font-medium">Templates</a>
              <a href="/analytics" className="text-gray-600 hover:text-gray-900">Analytics</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
              <p className="text-gray-600 mt-1">
                Create and manage SMS and email templates for client communication
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? "No templates found" : "No templates yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? "Try adjusting your search" 
                      : "Create your first template to get started"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredTemplates.map(template => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">
                        {template.businessType === 'email' ? 'Email' : 'SMS'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {template.description}
                    </div>

                    {/* Usage count */}
                    <div className="text-xs text-gray-500">
                      Used {template.usageCount} times
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this template?")) {
                              deleteTemplateMutation.mutate(template.id!);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Website Launch Update"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={templateForm.businessType}
                onValueChange={(value) => setTemplateForm({ ...templateForm, businessType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">SMS Template</SelectItem>
                  <SelectItem value="email">Email Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Message Content</Label>
              <Textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Hi {{name}}, your website is ready for review..."
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {"{{name}}"}, {"{{business}}"}, {"{{date}}"}
              </p>
            </div>

            {/* Preview */}
            {templateForm.description && (
              <div>
                <Label>Preview</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {templateForm.description
                      .replace('{{name}}', 'John Doe')
                      .replace('{{business}}', 'Sample Business')
                      .replace('{{date}}', new Date().toLocaleDateString())
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!templateForm.name || !templateForm.description || 
                       createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              }
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 