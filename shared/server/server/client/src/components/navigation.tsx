import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Recycle, Menu, Coins, Settings, LogOut, User, Shield } from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/browse", label: "Browse Items", auth: true },
    { href: "/", label: "How It Works", auth: false },
    { href: "/", label: "Community", auth: false },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center space-x-8">
        {navItems.map((item) => (
          (!item.auth || isAuthenticated) && (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-700 hover:text-eco-green transition-colors"
            >
              {item.label}
            </Link>
          )
        ))}
      </div>
      
      {isAuthenticated ? (
        <Button asChild className="bg-eco-green hover:bg-eco-green/90">
          <Link href="/add-item">List an Item</Link>
        </Button>
      ) : (
        <Button asChild className="bg-eco-green hover:bg-eco-green/90">
          <a href="/api/login">Get Started</a>
        </Button>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Recycle className="h-8 w-8 text-eco-green" />
            <span className="text-xl font-bold text-slate-900">ReWear</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavContent />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <>
                {/* Points Balance */}
                <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-full">
                  <Coins className="h-4 w-4 text-earth-brown" />
                  <span className="text-sm font-medium text-slate-700">
                    {user.points}
                  </span>
                  <span className="text-xs text-slate-500">pts</span>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-6 mt-8">
                    {navItems.map((item) => (
                      (!item.auth || isAuthenticated) && (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="text-slate-700 hover:text-eco-green transition-colors text-lg"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )
                    ))}
                    
                    {isAuthenticated ? (
                      <>
                        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-full">
                          <Coins className="h-4 w-4 text-earth-brown" />
                          <span className="text-sm font-medium text-slate-700">
                            {user?.points || 0}
                          </span>
                          <span className="text-xs text-slate-500">pts</span>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <Link 
                            href="/dashboard"
                            className="flex items-center space-x-2 text-slate-700 hover:text-eco-green transition-colors text-lg"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5" />
                            <span>Dashboard</span>
                          </Link>
                        </div>
                        
                        {user?.isAdmin && (
                          <Link 
                            href="/admin"
                            className="flex items-center space-x-2 text-slate-700 hover:text-eco-green transition-colors text-lg"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="h-5 w-5" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        
                        <Button asChild className="bg-eco-green hover:bg-eco-green/90">
                          <Link href="/add-item" onClick={() => setMobileMenuOpen(false)}>
                            List an Item
                          </Link>
                        </Button>
                        
                        <Button variant="outline" asChild>
                          <a href="/api/logout">
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                          </a>
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="bg-eco-green hover:bg-eco-green/90">
                        <a href="/api/login">Get Started</a>
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
