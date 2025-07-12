import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import type { ItemWithUser } from "@shared/schema";

interface ItemCardProps {
  item: ItemWithUser;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`}>
      <Card className="hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer">
        <div className="aspect-square overflow-hidden">
          <img 
            src={item.images?.[0] || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
            alt={item.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-900 line-clamp-2">{item.title}</h3>
            <Badge className="bg-eco-green text-white text-xs px-2 py-1 ml-2 flex-shrink-0">
              {item.pointValue} pts
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mb-2">Size: {item.size}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={item.user.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {item.user.firstName?.[0] || item.user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-600 truncate">
                {item.user.firstName && item.user.lastName 
                  ? `${item.user.firstName} ${item.user.lastName.charAt(0)}.`
                  : item.user.email?.split('@')[0]
                }
              </span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-slate-600 ml-1">4.9</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
