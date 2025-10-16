import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Download,
  Shield,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface KYCUser {
  id: string;
  phasion_name: string;
  email: string;
  full_name: string;
  kyc_status: string;
  kyc_completed: boolean;
  kyc_notes: string;
  id_front_image: string;
  id_back_image: string;
  selfie_image: string;
  id_type: string;
  id_number: string;
  date_of_birth: string;
  address: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export const AdminKYCReview = () => {
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    fetchKYCUsers();
  }, []);

  const fetchKYCUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .not('kyc_status', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching KYC users:', error);
      toast.error('Failed to fetch KYC users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKYCReview = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: status,
          kyc_verified_at: status === 'approved' ? new Date().toISOString() : null,
          admin_notes: reviewNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`KYC ${status} successfully`);
      setSelectedUser(null);
      setReviewNotes("");
      fetchKYCUsers();
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast.error('Failed to update KYC status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return user.kyc_status === 'pending';
    if (activeTab === 'approved') return user.kyc_status === 'approved';
    if (activeTab === 'rejected') return user.kyc_status === 'rejected';
    return true;
  });

  const downloadImage = (base64String: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64String;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container-custom">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">KYC Document Review</h1>
          <p className="text-muted-foreground">
            Review and verify user identity documents
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({users.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({users.filter(u => u.kyc_status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({users.filter(u => u.kyc_status === 'approved').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({users.filter(u => u.kyc_status === 'rejected').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedUser(user)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">{user.phasion_name}</CardTitle>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(user.kyc_status)} flex-shrink-0 whitespace-nowrap`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(user.kyc_status)}
                            <span className="truncate">{user.kyc_status || 'Not Started'}</span>
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Full Name:</strong> {user.full_name || 'Not provided'}</p>
                        <p><strong>ID Type:</strong> {user.id_type || 'Not provided'}</p>
                        <p><strong>Submitted:</strong> {new Date(user.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {user.kyc_status !== 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                        {user.kyc_status === 'approved' && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Approved</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* KYC Document Review Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">KYC Review - {selectedUser.phasion_name}</h2>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedUser(null)}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong>Full Name:</strong> {selectedUser.full_name || 'Not provided'}
                      </div>
                      <div>
                        <strong>Date of Birth:</strong> {selectedUser.date_of_birth || 'Not provided'}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedUser.phone_number || 'Not provided'}
                      </div>
                      <div>
                        <strong>Address:</strong> {selectedUser.address || 'Not provided'}
                      </div>
                      <div>
                        <strong>ID Type:</strong> {selectedUser.id_type || 'Not provided'}
                      </div>
                      <div>
                        <strong>ID Number:</strong> {selectedUser.id_number || 'Not provided'}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Images */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Identity Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* ID Front Image */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">ID Front Image</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadImage(selectedUser.id_front_image, 'id_front.jpg')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        {selectedUser.id_front_image ? (
                          <img 
                            src={selectedUser.id_front_image} 
                            alt="ID Front" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted rounded border flex items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>

                      {/* ID Back Image */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">ID Back Image</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadImage(selectedUser.id_back_image, 'id_back.jpg')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        {selectedUser.id_back_image ? (
                          <img 
                            src={selectedUser.id_back_image} 
                            alt="ID Back" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted rounded border flex items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Selfie Image */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Selfie Image</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadImage(selectedUser.selfie_image, 'selfie.jpg')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        {selectedUser.selfie_image ? (
                          <img 
                            src={selectedUser.selfie_image} 
                            alt="Selfie" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted rounded border flex items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Review Actions */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-3">Review Decision</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Review Notes</label>
                      <textarea
                        className="w-full mt-1 p-2 border rounded-md"
                        rows={3}
                        placeholder="Add notes about this KYC review..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleKYCReview(selectedUser.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve KYC
                      </Button>
                      <Button
                        onClick={() => handleKYCReview(selectedUser.id, 'rejected')}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject KYC
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedUser(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
