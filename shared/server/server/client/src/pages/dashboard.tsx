import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Coins, Package, RefreshCw, CheckCircle, Clock, X } from "lucide-react";
import type { Item, SwapWithDetails, PointTransaction } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: userItems, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/users", user?.id, "items"],
    enabled: !!user?.id,
  });

  const { data: swaps, isLoading: swapsLoading } = useQuery<SwapWithDetails[]>({
    queryKey: ["/api/swaps"],
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<PointTransaction[]>({
    queryKey: ["/api/users", user?.id, "transactions"],
    enabled: !!user?.id,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-slate-300 h-8 w-48 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-300 h-96 rounded-xl"></div>
              <div className="lg:col-span-2 bg-slate-300 h-96 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sustainabilityScore = Math.min(85, (userItems?.length || 0) * 10 + (user.points / 10));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Dashboard</h1>
          <p className="text-slate-600">
            Manage your swaps, track your impact, and grow your sustainable wardrobe
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xl">
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email
                    }
                  </h3>
                  <p className="text-slate-600">ReWear Member</p>
                </div>
                
                <div className="space-y-4">
                  <Card className="bg-eco-green/10 border-eco-green/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Coins className="h-5 w-5 text-eco-green" />
                          <span className="font-medium text-slate-900">Points Balance</span>
                        </div>
                        <span className="text-2xl font-bold text-eco-green">
                          {user.points}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">Sustainability Score</span>
                        <span className="text-lg font-semibold text-sage">
                          {sustainabilityScore}%
                        </span>
                      </div>
                      <Progress value={sustainabilityScore} className="h-2" />
                    </CardContent>
                  </Card>
                </div>

                <Button 
                  onClick={() => navigate("/add-item")}
                  className="w-full mt-6 bg-eco-green hover:bg-eco-green/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  List New Item
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Activity Section */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="items">My Items</TabsTrigger>
                <TabsTrigger value="swaps">My Swaps</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Your Listed Items</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/add-item")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {itemsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-slate-300 h-32 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : userItems && userItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userItems.map((item) => (
                      <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <img 
                              src={item.images?.[0] || "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=100&h=100&fit=crop"}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-slate-900">{item.title}</h4>
                                <Badge 
                                  variant={item.status === "approved" ? "default" : 
                                          item.status === "pending" ? "secondary" : "destructive"}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                {item.category} • {item.size} • {item.pointValue} pts
                              </p>
                              <div className="flex items-center">
                                {item.isAvailable ? (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Available
                                  </div>
                                ) : (
                                  <div className="flex items-center text-red-600 text-sm">
                                    <X className="h-4 w-4 mr-1" />
                                    Swapped
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No items listed yet
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Start by listing your first item to begin swapping!
                      </p>
                      <Button 
                        onClick={() => navigate("/add-item")}
                        className="bg-eco-green hover:bg-eco-green/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Item
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="swaps" className="space-y-4">
                <h3 className="text-lg font-semibold">Your Swaps</h3>
                
                {swapsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-slate-300 h-24 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : swaps && swaps.length > 0 ? (
                  <div className="space-y-4">
                    {swaps.map((swap) => (
                      <Card key={swap.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {swap.status === "pending" && <Clock className="h-5 w-5 text-yellow-500" />}
                              {swap.status === "accepted" && <CheckCircle className="h-5 w-5 text-green-500" />}
                              {swap.status === "completed" && <CheckCircle className="h-5 w-5 text-eco-green" />}
                              {swap.status === "rejected" && <X className="h-5 w-5 text-red-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-slate-900">
                                  {swap.item.title}
                                </h4>
                                <Badge variant={swap.swapType === "points" ? "default" : "secondary"}>
                                  {swap.swapType === "points" ? "Points" : "Direct"}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                {swap.swapType === "points" 
                                  ? `${swap.item.pointValue} points`
                                  : `Swap with ${swap.owner.firstName || swap.owner.email}`
                                }
                              </p>
                              <p className="text-sm text-slate-500">
                                {new Date(swap.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No swaps yet
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Browse items and start swapping to see your activity here!
                      </p>
                      <Button 
                        onClick={() => navigate("/browse")}
                        className="bg-eco-green hover:bg-eco-green/90"
                      >
                        Browse Items
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-slate-300 h-16 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                transaction.type === "earned" ? "bg-green-100" :
                                transaction.type === "spent" ? "bg-red-100" : "bg-blue-100"
                              }`}>
                                <Coins className={`h-4 w-4 ${
                                  transaction.type === "earned" ? "text-green-600" :
                                  transaction.type === "spent" ? "text-red-600" : "text-blue-600"
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className={`font-semibold ${
                              transaction.amount > 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {transaction.amount > 0 ? "+" : ""}{transaction.amount} pts
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-slate-400 text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No activity yet
                      </h3>
                      <p className="text-slate-600">
                        Your point transactions and activities will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
