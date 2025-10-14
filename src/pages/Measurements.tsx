import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Ruler, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BodyMeasurements {
  height: number; // cm
  weight: number; // kg
  chest: number; // cm
  waist: number; // cm
  hips: number; // cm
  inseam: number; // cm
  shoulder: number; // cm
  sleeve: number; // cm
}

interface MeasurementStep {
  id: string;
  title: string;
  description: string;
  field: keyof BodyMeasurements;
  unit: string;
  required: boolean;
  tips?: string;
}

const measurementSteps: MeasurementStep[] = [
  {
    id: "height",
    title: "Height",
    description: "Stand straight against a wall and measure from floor to top of head",
    field: "height",
    unit: "cm",
    required: true,
    tips: "Remove shoes and stand straight"
  },
  {
    id: "weight",
    title: "Weight",
    description: "Step on a scale and record your current weight",
    field: "weight",
    unit: "kg",
    required: true,
    tips: "Weigh yourself in light clothing"
  },
  {
    id: "chest",
    title: "Chest",
    description: "Measure around the fullest part of your chest",
    field: "chest",
    unit: "cm",
    required: true,
    tips: "Keep the tape measure parallel to the ground"
  },
  {
    id: "waist",
    title: "Waist",
    description: "Measure around your natural waistline (narrowest part)",
    field: "waist",
    unit: "cm",
    required: true,
    tips: "Don't pull the tape too tight"
  },
  {
    id: "hips",
    title: "Hips",
    description: "Measure around the fullest part of your hips",
    field: "hips",
    unit: "cm",
    required: true,
    tips: "Usually 7-9 inches below your waist"
  },
  {
    id: "inseam",
    title: "Inseam",
    description: "Measure from crotch to ankle bone",
    field: "inseam",
    unit: "cm",
    required: true,
    tips: "Have someone help you for accuracy"
  },
  {
    id: "shoulder",
    title: "Shoulder Width",
    description: "Measure from shoulder point to shoulder point",
    field: "shoulder",
    unit: "cm",
    required: false,
    tips: "Ask someone to help measure across your back"
  },
  {
    id: "sleeve",
    title: "Sleeve Length",
    description: "Measure from shoulder point to wrist bone",
    field: "sleeve",
    unit: "cm",
    required: false,
    tips: "Bend your arm slightly for natural fit"
  }
];

export const Measurements = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: 0,
    weight: 0,
    chest: 0,
    waist: 0,
    hips: 0,
    inseam: 0,
    shoulder: 0,
    sleeve: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = measurementSteps[currentStep];
  const progress = ((currentStep + 1) / measurementSteps.length) * 100;

  const handleMeasurementChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setMeasurements(prev => ({
      ...prev,
      [currentStepData.field]: numValue
    }));

    // Mark step as completed if value is valid
    if (numValue > 0) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    } else {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    }
  };

  const canProceed = () => {
    if (currentStepData.required) {
      return measurements[currentStepData.field] > 0;
    }
    return true; // Optional fields can be skipped
  };

  const handleNext = () => {
    if (currentStep < measurementSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Convert measurements to string format for storage
      const measurementsString = Object.values(measurements).join(',');
      
      await updateProfile({
        body_measurements: measurementsString,
        kyc_completed: true
      });

      toast.success('Body measurements saved successfully!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Error saving measurements:', error);
      toast.error('Failed to save measurements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeRecommendation = () => {
    const { height, weight, chest, waist, hips } = measurements;
    
    if (height === 0 || weight === 0) return null;

    // Basic size calculation (simplified)
    const bmi = weight / Math.pow(height / 100, 2);
    
    if (bmi < 18.5) return "XS-S";
    if (bmi < 25) return "S-M";
    if (bmi < 30) return "M-L";
    return "L-XL";
  };

  const sizeRecommendation = getSizeRecommendation();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container-custom py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                AI-Assisted Body Measurements
              </h1>
              <p className="text-xl text-muted-foreground">
                Get accurate measurements for perfect-fitting clothes
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Step {currentStep + 1} of {measurementSteps.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Ruler className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {currentStepData.title}
                        </CardTitle>
                        <CardDescription>
                          {currentStepData.description}
                        </CardDescription>
                      </div>
                    </div>
                    {currentStepData.tips && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> {currentStepData.tips}
                        </p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="measurement" className="text-base">
                        {currentStepData.title} ({currentStepData.unit})
                      </Label>
                      <Input
                        id="measurement"
                        type="number"
                        placeholder="0"
                        value={measurements[currentStepData.field] || ''}
                        onChange={(e) => handleMeasurementChange(e.target.value)}
                        className="text-lg"
                        min="0"
                        step="0.1"
                      />
                      {currentStepData.required && (
                        <p className="text-sm text-muted-foreground">
                          * This measurement is required
                        </p>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      {currentStep < measurementSteps.length - 1 ? (
                        <Button
                          onClick={handleNext}
                          disabled={!canProceed()}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSave}
                          disabled={!canProceed() || isLoading}
                          className="flex items-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Save Measurements
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Size Recommendation */}
                {sizeRecommendation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Size Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {sizeRecommendation}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Based on your measurements
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Measurement Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {measurementSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            completedSteps.has(index)
                              ? 'bg-green-50 border border-green-200'
                              : index === currentStep
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            completedSteps.has(index)
                              ? 'bg-green-600 text-white'
                              : index === currentStep
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-300'
                          }`}>
                            {completedSteps.has(index) ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {step.unit}
                            </p>
                          </div>
                          {completedSteps.has(index) && (
                            <Badge variant="secondary" className="text-xs">
                              Done
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Help */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Need Help?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      For the most accurate measurements:
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Use a flexible measuring tape</li>
                      <li>• Measure over light clothing</li>
                      <li>• Keep the tape parallel to the ground</li>
                      <li>• Don't pull the tape too tight</li>
                      <li>• Ask someone to help when needed</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};
