import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import ItemCard from "@/components/item-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import type { ItemWithUser } from "@shared/schema";

export default function BrowseItems() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: items, isLoading } = useQuery<ItemWithUser[]>({
    queryKey: ["/api/items", { category, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  const categories = [
    "Tops",
    "Bottoms", 
    "Outerwear",
    "Dresses",
    "Shoes",
    "Accessories"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Browse Items
          </h1>
          <p className="text-lg text-slate-600">
            Discover amazing pieces from our community
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-300 h-48 rounded-xl mb-4"></div>
                <div className="bg-slate-300 h-4 rounded mb-2"></div>
                <div className="bg-slate-300 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No items found
            </h3>
            <p className="text-slate-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
