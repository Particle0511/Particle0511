import { Users, Shirt, Leaf } from "lucide-react";

export default function Stats() {
  const stats = [
    {
      icon: Users,
      value: "12,000+",
      label: "Active Community Members",
      color: "text-eco-green bg-eco-green/10"
    },
    {
      icon: Shirt,
      value: "45,000+",
      label: "Items Exchanged",
      color: "text-earth-brown bg-earth-brown/10"
    },
    {
      icon: Leaf,
      value: "2.5M lbs",
      label: "Textile Waste Prevented",
      color: "text-soft-blue bg-soft-blue/10"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`${stat.color} rounded-full p-4 mb-4`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
              <p className="text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
