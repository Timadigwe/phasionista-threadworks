import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Heart, 
  Eye, 
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
  {
    title: "Total Orders",
    value: "24",
    change: "+12%",
    icon: ShoppingBag,
    color: "text-blue-600"
  },
  {
    title: "Favorites",
    value: "18",
    change: "+5%",
    icon: Heart,
    color: "text-red-600"
  },
  {
    title: "Profile Views",
    value: "1.2K",
    change: "+23%",
    icon: Eye,
    color: "text-green-600"
  },
  {
    title: "Total Spent",
    value: "$2,450",
    change: "+8%",
    icon: DollarSign,
    color: "text-purple-600"
  }
];

const recentOrders = [
  {
    id: "ORD-001",
    item: "Elegant Evening Dress",
    designer: "Sarah Johnson",
    status: "Delivered",
    date: "2024-01-15",
    amount: "$450"
  },
  {
    id: "ORD-002",
    item: "Custom Suit",
    designer: "Michael Chen",
    status: "In Progress",
    date: "2024-01-20",
    amount: "$680"
  },
  {
    id: "ORD-003",
    item: "Summer Blouse",
    designer: "Emma Rodriguez",
    status: "Shipped",
    date: "2024-01-22",
    amount: "$120"
  }
];

const quickActions = [
  {
    title: "Browse New Items",
    description: "Discover the latest fashion trends",
    icon: Package,
    href: "/clothes"
  },
  {
    title: "Find Designers",
    description: "Connect with talented designers",
    icon: TrendingUp,
    href: "/designers"
  },
  {
    title: "Track Orders",
    description: "Monitor your current orders",
    icon: Clock,
    href: "/orders"
  }
];

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {user?.user_metadata?.phasion_name || user?.email?.split('@')[0] || "User"}!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your account
              </p>
            </div>
            <Button className="btn-hero">
              Browse New Items
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-green-600">{stat.change}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-muted`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{order.item}</h4>
                            <Badge 
                              variant={
                                order.status === "Delivered" ? "default" :
                                order.status === "In Progress" ? "secondary" : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            by {order.designer} • {order.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{order.amount}</p>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4"
                      asChild
                    >
                      <a href={action.href}>
                        <div className="flex items-center gap-3">
                          <action.icon className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-medium">{action.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Wallet Connected</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Profile Completion
                    </p>
                    <Progress value={85} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      85% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
