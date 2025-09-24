import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Plus, Save, Eye, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabaseApi } from "@/services/supabaseApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = [
  "Evening Wear",
  "Business",
  "Casual", 
  "Streetwear",
  "Bridal",
  "Sports",
  "Vintage"
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Brown", "Gray"];

export const Create = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    size: '',
    color: '',
    measurements: '',
    imageUrl: ''
  });

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // For now, we'll convert files to data URLs (base64)
      // In production, you'd upload to a cloud storage service
      const newImages: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, 4); i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              newImages.push(result);
              if (newImages.length === Math.min(files.length, 4)) {
                setUploadedImages(prev => [...prev, ...newImages].slice(0, 4));
                setIsUploading(false);
              }
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.files = files;
      handleFileUpload({ target: input } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create items');
      return;
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'size', 'color'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use uploaded images if available, otherwise use imageUrl
      const imageUrl = uploadedImages.length > 0 ? uploadedImages[0] : formData.imageUrl || '/api/placeholder/400/500';

      const clothData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        size: formData.size,
        color: formData.color,
        measurements: formData.measurements,
        ownerName: user.user_metadata?.phasion_name || user.email?.split('@')[0] || 'Designer',
        imageUrl: imageUrl
      };

      console.log('Creating cloth with data:', clothData);
      
      const response = await supabaseApi.createCloth(clothData);
      
      toast.success('Item created successfully!');
      console.log('Cloth created:', response);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        size: '',
        color: '',
        measurements: '',
        imageUrl: ''
      });
      setUploadedImages([]);
      
      // Navigate to clothes gallery
      navigate('/clothes');
      
    } catch (error: any) {
      console.error('Error creating cloth:', error);
      toast.error(`Failed to create item: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
              Create New Item
            </h1>
            <p className="text-xl text-muted-foreground">
              Share your fashion creations with the world
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Item Name *</Label>
                      <Input 
                        id="name" 
                        placeholder="Enter item name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe your item in detail..."
                      className="min-h-[120px]"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="size">Size *</Label>
                      <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="color">Color *</Label>
                      <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map((color) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input 
                        id="imageUrl" 
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter a URL to an image of your item
                      </p>
                    </div>
                    
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Upload Images</p>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop your images here, or click to browse
                      </p>
                      <Button variant="outline" type="button" disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Choose Files'}
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Image Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden">
                              <img 
                                src={image} 
                                alt={`Uploaded image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {/* Empty slots */}
                        {Array.from({ length: 4 - uploadedImages.length }).map((_, index) => (
                          <div key={`empty-${index}`} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">Empty</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show placeholder when no images */}
                    {uploadedImages.length === 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Measurements */}
              <Card>
                <CardHeader>
                  <CardTitle>Measurements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="chest">Chest (inches)</Label>
                      <Input 
                        id="chest" 
                        type="number" 
                        placeholder="0"
                        value={formData.measurements.split(',')[0] || ''}
                        onChange={(e) => {
                          const measurements = formData.measurements.split(',');
                          measurements[0] = e.target.value;
                          handleInputChange('measurements', measurements.join(','));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="waist">Waist (inches)</Label>
                      <Input 
                        id="waist" 
                        type="number" 
                        placeholder="0"
                        value={formData.measurements.split(',')[1] || ''}
                        onChange={(e) => {
                          const measurements = formData.measurements.split(',');
                          measurements[1] = e.target.value;
                          handleInputChange('measurements', measurements.join(','));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hips">Hips (inches)</Label>
                      <Input 
                        id="hips" 
                        type="number" 
                        placeholder="0"
                        value={formData.measurements.split(',')[2] || ''}
                        onChange={(e) => {
                          const measurements = formData.measurements.split(',');
                          measurements[2] = e.target.value;
                          handleInputChange('measurements', measurements.join(','));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Length (inches)</Label>
                      <Input 
                        id="length" 
                        type="number" 
                        placeholder="0"
                        value={formData.measurements.split(',')[3] || ''}
                        onChange={(e) => {
                          const measurements = formData.measurements.split(',');
                          measurements[3] = e.target.value;
                          handleInputChange('measurements', measurements.join(','));
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full btn-hero"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Item
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Reset form
                      setFormData({
                        name: '',
                        description: '',
                        price: '',
                        category: '',
                        size: '',
                        color: '',
                        measurements: '',
                        imageUrl: ''
                      });
                      setUploadedImages([]);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Form
                  </Button>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Success</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <p>• Use high-quality images with good lighting</p>
                    <p>• Write detailed descriptions</p>
                    <p>• Set competitive prices</p>
                    <p>• Include accurate measurements</p>
                    <p>• Use relevant tags and categories</p>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Item Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Draft</Badge>
                    <span className="text-sm text-muted-foreground">
                      Not published yet
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
};
