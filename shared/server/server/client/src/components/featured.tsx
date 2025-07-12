import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ItemCard from "./item-card";
import type { ItemWithUser } from "@shared/schema";

export default function FeaturedItems() {
  const { data: items, isLoading } = useQuery<ItemWithUser[]>({
    queryKey: ["/api/items/featured"],
  });

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Featured Items
          </h2>
          <p className="text-lg text-slate-600">
            Discover amazing pieces from our community
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-300 h-48 rounded-xl mb-4"></div>
                <div className="bg-slate-300 h-4 rounded mb-2"></div>
                <div className="bg-slate-300 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.slice(0, 4).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button asChild className="bg-eco-green hover:bg-eco-green/90">
                <Link href="/browse">View All Items</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No items available yet
            </h3>
            <p className="text-slate-600">
              Be the first to list an item in our community!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
