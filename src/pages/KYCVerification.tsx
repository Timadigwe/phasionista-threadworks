import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  User,
  CreditCard,
  Shield,
  CameraIcon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface KYCData {
  full_name: string;
  date_of_birth: string;
  address: string;
  phone_number: string;
  id_type: string;
  id_number: string;
  id_front_image: string;
  id_back_image: string;
  selfie_image: string;
  additional_documents: string[];
  notes: string;
}

export const KYCVerification = () => {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [kycData, setKycData] = useState<KYCData>({
    full_name: '',
    date_of_birth: '',
    address: '',
    phone_number: '',
    id_type: '',
    id_number: '',
    id_front_image: '',
    id_back_image: '',
    selfie_image: '',
    additional_documents: [],
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const steps = [
    { id: 1, title: "Personal Information", description: "Basic details" },
    { id: 2, title: "Identity Verification", description: "ID documents" },
    { id: 3, title: "Selfie Verification", description: "Photo verification" },
    { id: 4, title: "Review & Submit", description: "Final review" }
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (user && !profile) {
        await fetchProfile();
      }
      setProfileLoading(false);
    };

    loadProfile();
  }, [user, profile, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setKycData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        address: profile.location || '',
        phone_number: profile.phone_number || ''
      }));
    }
  }, [profile]);

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setKycData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (field: string, file: File) => {
    if (!user) return;

    try {
      setUploadingImage(field);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        setKycData(prev => ({
          ...prev,
          [field]: base64String
        }));

        setPreviewImages(prev => ({
          ...prev,
          [field]: base64String
        }));

        toast.success('Image processed successfully');
        setUploadingImage(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setUploadingImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: kycData.full_name,
          date_of_birth: kycData.date_of_birth,
          address: kycData.address,
          phone_number: kycData.phone_number,
          id_type: kycData.id_type,
          id_number: kycData.id_number,
          id_front_image: kycData.id_front_image,
          id_back_image: kycData.id_back_image,
          selfie_image: kycData.selfie_image,
          additional_documents: kycData.additional_documents,
          kyc_notes: kycData.notes,
          kyc_status: 'pending',
          kyc_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('KYC verification submitted successfully! Redirecting to dashboard...');
      await fetchProfile(); // Refresh profile data
      
      setIsRedirecting(true);
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast.error('Failed to submit KYC verification');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!profile?.kyc_status) return null;
    
    switch (profile.kyc_status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✓ Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">✗ Rejected</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">🔍 Under Review</Badge>;
      default:
        return null;
    }
  };

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Loading KYC Status...</h2>
              <p className="text-muted-foreground">Please wait while we check your verification status.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show different UI based on KYC status
  if (profile?.kyc_status === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">KYC Verification Complete</h2>
              <p className="text-muted-foreground mb-6">
                Your identity has been verified successfully. You can now access all platform features.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/profile">View Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show submitted status for pending/under_review/rejected (unless resubmitting)
  if (profile?.kyc_completed && profile?.kyc_status && (profile.kyc_status === 'pending' || profile.kyc_status === 'under_review' || profile.kyc_status === 'rejected') && !isResubmitting) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                {profile.kyc_status === 'pending' && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="rounded-full h-12 w-12 bg-yellow-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                )}
                {profile.kyc_status === 'under_review' && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="rounded-full h-12 w-12 bg-blue-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                )}
                {profile.kyc_status === 'rejected' && (
                  <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {profile.kyc_status === 'pending' && 'KYC Under Review'}
                {profile.kyc_status === 'under_review' && 'KYC Being Reviewed'}
                {profile.kyc_status === 'rejected' && 'KYC Verification Rejected'}
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {profile.kyc_status === 'pending' && 'Your KYC documents have been submitted and are being reviewed by our team.'}
                {profile.kyc_status === 'under_review' && 'Your KYC documents are currently being reviewed by our verification team.'}
                {profile.kyc_status === 'rejected' && 'Your KYC verification was rejected. Please review the feedback and resubmit if needed.'}
              </p>

              {getStatusBadge()}

              {profile.kyc_notes && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Admin Notes:</h3>
                  <p className="text-sm text-muted-foreground">{profile.kyc_notes}</p>
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                {profile.kyc_status === 'rejected' && (
                  <Button variant="outline" onClick={() => {
                    setIsResubmitting(true);
                    // Reset the form to allow resubmission
                    setKycData({
                      full_name: profile.full_name || '',
                      date_of_birth: '',
                      address: profile.location || '',
                      phone_number: profile.phone_number || '',
                      id_type: '',
                      id_number: '',
                      id_front_image: '',
                      id_back_image: '',
                      selfie_image: '',
                      additional_documents: [],
                      notes: ''
                    });
                    setCurrentStep(1);
                    setPreviewImages({});
                    // Scroll to top
                    window.scrollTo(0, 0);
                  }}>
                    Resubmit KYC
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {isResubmitting ? 'Resubmit KYC Verification' : 'KYC Verification'}
              </h1>
              <p className="text-xl text-muted-foreground">
                {isResubmitting 
                  ? 'Please update your information and resubmit your documents'
                  : 'Complete your identity verification to access all features'
                }
              </p>
              {!isResubmitting && getStatusBadge()}
              {isResubmitting && (
                <div className="mt-4">
                  <Badge className="bg-orange-100 text-orange-800">🔄 Resubmitting</Badge>
                </div>
              )}
            </div>
            <Shield className="h-12 w-12 text-primary" />
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.id}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-px bg-muted mx-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={kycData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={kycData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={kycData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={kycData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id_type">ID Type *</Label>
                    <select
                      id="id_type"
                      value={kycData.id_type}
                      onChange={(e) => handleInputChange('id_type', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select ID Type</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="national_id">National ID</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="id_number">ID Number *</Label>
                    <Input
                      id="id_number"
                      value={kycData.id_number}
                      onChange={(e) => handleInputChange('id_number', e.target.value)}
                      placeholder="Enter your ID number"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>ID Front Image *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {previewImages.id_front_image ? (
                        <img 
                          src={previewImages.id_front_image} 
                          alt="ID Front" 
                          className="max-w-full max-h-48 mx-auto rounded"
                        />
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload ID Front</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('id_front_image', file);
                        }}
                        className="mt-2"
                        disabled={uploadingImage === 'id_front_image'}
                      />
                      {uploadingImage === 'id_front_image' && (
                        <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>ID Back Image *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {previewImages.id_back_image ? (
                        <img 
                          src={previewImages.id_back_image} 
                          alt="ID Back" 
                          className="max-w-full max-h-48 mx-auto rounded"
                        />
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload ID Back</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('id_back_image', file);
                        }}
                        className="mt-2"
                        disabled={uploadingImage === 'id_back_image'}
                      />
                      {uploadingImage === 'id_back_image' && (
                        <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CameraIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Selfie Verification</h3>
                  <p className="text-muted-foreground mb-6">
                    Take a clear selfie holding your ID next to your face
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {previewImages.selfie_image ? (
                      <img 
                        src={previewImages.selfie_image} 
                        alt="Selfie" 
                        className="max-w-full max-h-64 mx-auto rounded"
                      />
                    ) : (
                      <div>
                        <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload Selfie</p>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('selfie_image', file);
                      }}
                      className="mt-2"
                      disabled={uploadingImage === 'selfie_image'}
                    />
                    {uploadingImage === 'selfie_image' && (
                      <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                {isRedirecting ? (
                  <div className="text-center mb-6">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600 animate-pulse" />
                    <h3 className="text-lg font-semibold mb-2 text-green-600">KYC Submitted Successfully!</h3>
                    <p className="text-muted-foreground">
                      Your verification is being processed. Redirecting to dashboard...
                    </p>
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold mb-2">Review Your Information</h3>
                    <p className="text-muted-foreground">
                      Please review all information before submitting
                    </p>
                  </div>
                )}
                
                {!isRedirecting && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {kycData.full_name}</p>
                      <p><strong>DOB:</strong> {kycData.date_of_birth}</p>
                      <p><strong>Phone:</strong> {kycData.phone_number}</p>
                      <p><strong>Address:</strong> {kycData.address}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Identity Documents</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>ID Type:</strong> {kycData.id_type}</p>
                      <p><strong>ID Number:</strong> {kycData.id_number}</p>
                      <p><strong>Front Image:</strong> {kycData.id_front_image ? '✓ Uploaded' : '✗ Missing'}</p>
                      <p><strong>Back Image:</strong> {kycData.id_back_image ? '✓ Uploaded' : '✗ Missing'}</p>
                      <p><strong>Selfie:</strong> {kycData.selfie_image ? '✓ Uploaded' : '✗ Missing'}</p>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {!isRedirecting && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && (!kycData.full_name || !kycData.date_of_birth || !kycData.address || !kycData.phone_number)) ||
                    (currentStep === 2 && (!kycData.id_type || !kycData.id_number || !kycData.id_front_image || !kycData.id_back_image)) ||
                    (currentStep === 3 && !kycData.selfie_image)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || isRedirecting || !kycData.full_name || !kycData.id_front_image || !kycData.selfie_image}
                >
                  {isLoading ? 'Submitting...' : isRedirecting ? 'Redirecting...' : 'Submit KYC'}
                </Button>
              )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
