import { motion } from "framer-motion";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Eye,
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orders = [
  {
    id: "ORD-001",
    item: "Elegant Evening Dress",
    designer: "Sarah Johnson",
    status: "Delivered",
    date: "2024-01-15",
    amount: "$450",
    image: "/api/placeholder/80/80",
    tracking: "TRK123456789",
    progress: 100
  },
  {
    id: "ORD-002",
    item: "Custom Suit",
    designer: "Michael Chen",
    status: "In Progress",
    date: "2024-01-20",
    amount: "$680",
    image: "/api/placeholder/80/80",
    tracking: "TRK987654321",
    progress: 60
  },
  {
    id: "ORD-003",
    item: "Summer Blouse",
    designer: "Emma Rodriguez",
    status: "Shipped",
    date: "2024-01-22",
    amount: "$120",
    image: "/api/placeholder/80/80",
    tracking: "TRK456789123",
    progress: 80
  },
  {
    id: "ORD-004",
    item: "Business Shirt",
    designer: "David Kim",
    status: "Processing",
    date: "2024-01-25",
    amount: "$95",
    image: "/api/placeholder/80/80",
    tracking: null,
    progress: 30
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Delivered":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "Shipped":
      return <Truck className="h-5 w-5 text-blue-600" />;
    case "In Progress":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "Processing":
      return <Package className="h-5 w-5 text-orange-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "Shipped":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800";
    case "Processing":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const Orders = () => {
  const allOrders = orders;
  const activeOrders = orders.filter(order => 
    order.status === "Processing" || order.status === "In Progress" || order.status === "Shipped"
  );
  const completedOrders = orders.filter(order => order.status === "Delivered");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50">
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              My Orders
            </h1>
            <p className="text-xl text-muted-foreground">
              Track and manage your fashion orders
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Orders ({allOrders.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {allOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img 
                        src={order.image} 
                        alt={order.item}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{order.item}</h3>
                        <p className="text-muted-foreground">by {order.designer}</p>
                        <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{order.amount}</p>
                      <p className="text-sm text-muted-foreground">{order.date}</p>
                    </div>
                  </div>

                  {order.tracking && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Tracking Number</p>
                          <p className="font-mono text-sm">{order.tracking}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Track Package
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Designer
                    </Button>
                    {order.status === "Delivered" && (
                      <Button variant="outline" size="sm">
                        Leave Review
                      </Button>
                    )}
                  </div>
                </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {activeOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={order.image} 
                          alt={order.item}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-lg">{order.item}</h3>
                          <p className="text-muted-foreground">by {order.designer}</p>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold">{order.amount}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{order.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Designer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={order.image} 
                          alt={order.item}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-lg">{order.item}</h3>
                          <p className="text-muted-foreground">by {order.designer}</p>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold">{order.amount}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Leave Review
                      </Button>
                      <Button variant="outline" size="sm">
                        Reorder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
