import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Star, MessageCircle, Coins, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ItemWithUser } from "@shared/schema";

export default function ItemDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [swapMessage, setSwapMessage] = useState("");

  const { data: item, isLoading } = useQuery<ItemWithUser>({
    queryKey: ["/api/items", id],
    queryFn: async () => {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) throw new Error("Failed to fetch item");
      return response.json();
    },
  });

  const requestSwapMutation = useMutation({
    mutationFn: async ({ swapType }: { swapType: "direct" | "points" }) => {
      return await apiRequest("POST", "/api/swaps", {
        itemId: parseInt(id!),
        ownerId: item!.userId,
        swapType,
        message: swapMessage,
      });
    },
    onSuccess: () => {
      toast({
        title: "Swap Requested",
        description: "Your swap request has been sent successfully!",
      });
      setSwapMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/swaps"] });
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
        description: "Failed to request swap. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-slate-300 h-8 w-24 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-300 h-96 rounded-xl"></div>
              <div className="space-y-4">
                <div className="bg-slate-300 h-8 rounded"></div>
                <div className="bg-slate-300 h-4 rounded"></div>
                <div className="bg-slate-300 h-32 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Item Not Found</h1>
            <Button onClick={() => navigate("/browse")}>
              Browse Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canRequestSwap = user && user.id !== item.userId && item.isAvailable;
  const hasEnoughPoints = user && user.points >= item.pointValue;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/browse")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="p-6">
              <div className="mb-4">
                <img 
                  src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=400"}
                  alt={item.title}
                  className="w-full h-80 object-cover rounded-lg"
                />
              </div>
              {item.images && item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.images.slice(1, 5).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${item.title} ${index + 2}`}
                      className="w-full h-16 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-eco-green"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Item Information */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
                <Badge className="bg-eco-green text-white text-lg font-semibold px-3 py-1">
                  {item.pointValue} pts
                </Badge>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <Avatar>
                  <AvatarImage src={item.user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {item.user.firstName?.[0] || item.user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">
                    {item.user.firstName && item.user.lastName 
                      ? `${item.user.firstName} ${item.user.lastName}`
                      : item.user.email
                    }
                  </p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-slate-600 ml-1">4.9 (23 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Size</p>
                    <p className="font-medium text-slate-900">{item.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Condition</p>
                    <p className="font-medium text-slate-900">{item.condition}</p>
                  </div>
                  {item.brand && (
                    <div>
                      <p className="text-sm text-slate-600">Brand</p>
                      <p className="font-medium text-slate-900">{item.brand}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-600">Category</p>
                    <p className="font-medium text-slate-900">{item.category}</p>
                  </div>
                </div>

                {item.description && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Description</p>
                    <p className="text-slate-900">{item.description}</p>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {canRequestSwap && (
                <>
                  <div className="flex space-x-4 mb-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-eco-green hover:bg-eco-green/90">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Request Swap
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Swap</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600">
                            Send a message to the owner about your swap request.
                          </p>
                          <Textarea
                            placeholder="Hi! I'm interested in swapping for this item..."
                            value={swapMessage}
                            onChange={(e) => setSwapMessage(e.target.value)}
                            rows={4}
                          />
                          <Button 
                            onClick={() => requestSwapMutation.mutate({ swapType: "direct" })}
                            disabled={requestSwapMutation.isPending}
                            className="w-full"
                          >
                            Send Swap Request
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      className="flex-1 border-eco-green text-eco-green hover:bg-eco-green hover:text-white"
                      onClick={() => requestSwapMutation.mutate({ swapType: "points" })}
                      disabled={!hasEnoughPoints || requestSwapMutation.isPending}
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      Redeem with Points
                    </Button>
                  </div>

                  {!hasEnoughPoints && (
                    <p className="text-sm text-red-600 text-center">
                      You need {item.pointValue - (user?.points || 0)} more points to redeem this item.
                    </p>
                  )}
                </>
              )}

              {item.isAvailable ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-700 font-medium">
                        Available for swap
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-red-700 font-medium">
                        No longer available
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
