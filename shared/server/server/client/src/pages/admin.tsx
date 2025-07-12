import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Check, X, Eye, Users, Package, RefreshCw, Clock } from "lucide-react";
import type { ItemWithUser } from "@shared/schema";

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: pendingItems, isLoading: pendingLoading } = useQuery<ItemWithUser[]>({
    queryKey: ["/api/admin/items/pending"],
    enabled: !!user?.isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalItems: number;
    totalSwaps: number;
    pendingItems: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/admin/items/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/items/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Item Updated",
        description: "Item status has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update item status. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-slate-300 h-8 w-48 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-300 h-32 rounded-xl"></div>
              <div className="bg-slate-300 h-32 rounded-xl"></div>
              <div className="bg-slate-300 h-32 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-600">
            Moderate and manage the community platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.totalUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Items</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.totalItems || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Swaps</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.totalSwaps || 0}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.pendingItems || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Items Review */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pending Item Reviews</CardTitle>
              {stats?.pendingItems && stats.pendingItems > 0 && (
                <Badge variant="secondary">
                  {stats.pendingItems} Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-slate-300 h-24 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : pendingItems && pendingItems.length > 0 ? (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <Card key={item.id} className="border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <img 
                          src={item.images?.[0] || "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=100&h=100&fit=crop"}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-slate-900">{item.title}</h4>
                              <p className="text-sm text-slate-600">
                                by {item.user.firstName && item.user.lastName 
                                  ? `${item.user.firstName} ${item.user.lastName}`
                                  : item.user.email
                                } • {item.size} • {item.pointValue} points
                              </p>
                            </div>
                            <Badge variant="secondary">
                              Pending Review
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-3">
                            {item.description}
                          </p>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              className="bg-eco-green hover:bg-eco-green/90"
                              onClick={() => updateItemStatusMutation.mutate({ 
                                id: item.id, 
                                status: "approved" 
                              })}
                              disabled={updateItemStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => updateItemStatusMutation.mutate({ 
                                id: item.id, 
                                status: "rejected" 
                              })}
                              disabled={updateItemStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/items/${item.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-slate-600">
                  No pending items to review at the moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
