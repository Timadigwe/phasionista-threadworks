import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabaseApi } from '@/services/supabaseApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const EditCloth = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    'Evening Wear',
    'Casual',
    'Business',
    'Streetwear',
    'Bridal',
    'Outerwear',
    'Accessories'
  ];

  const sizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '28', '30', '32', '34', '36', '38', '40', '42', '44',
    '6', '8', '10', '12', '14', '16', '18', '20'
  ];

  // Load existing cloth data
  useEffect(() => {
    const loadClothData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const cloth = await supabaseApi.getClothById(id);
        
        if (cloth) {
          console.log('Loading cloth data:', cloth);
          setFormData({
            name: cloth.name || '',
            description: cloth.description || '',
            price: cloth.price?.toString() || '',
            category: cloth.category || '',
            size: cloth.size || '',
            color: cloth.color || '',
            measurements: cloth.measurements || '',
            imageUrl: cloth.images?.[0] || ''
          });
          // Only set uploadedImages if there are actual uploaded images (base64 data)
          // Otherwise, keep it empty so the imageUrl input is used
          const hasUploadedImages = cloth.images?.some((img: string) => img.startsWith('data:'));
          setUploadedImages(hasUploadedImages ? cloth.images || [] : []);
        }
      } catch (error: any) {
        console.error('Error loading cloth data:', error);
        toast.error('Failed to load cloth data');
      } finally {
        setIsLoading(false);
      }
    };

    loadClothData();
  }, [id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const newImages: string[] = [];

    Array.from(files).forEach((file, index) => {
      if (index < 4) { // Limit to 4 images
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newImages.push(result);
          
          if (newImages.length === Math.min(files.length, 4)) {
            setUploadedImages(prev => [...prev, ...newImages].slice(0, 4));
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const input = document.getElementById('file-upload') as HTMLInputElement;
      if (input) {
        input.files = files;
        handleFileUpload({ target: { files } } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!id) return;

    try {
      setIsLoading(true);
      
      // Use uploaded image if available, otherwise use imageUrl
      const imageUrl = uploadedImages.length > 0 ? uploadedImages[0] : formData.imageUrl || '/api/placeholder/400/500';
      
      console.log('Image URL being sent:', imageUrl);
      console.log('Uploaded images:', uploadedImages);
      console.log('Form data imageUrl:', formData.imageUrl);
      
      const clothData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        size: formData.size,
        color: formData.color,
        measurements: formData.measurements,
        imageUrl: imageUrl
      };

      console.log('Updating cloth with data:', clothData);
      const result = await supabaseApi.updateCloth(id, clothData);
      console.log('Update result:', result);
      
      toast.success('Cloth updated successfully!');
      navigate('/my-clothes');
    } catch (error: any) {
      console.error('Error updating cloth:', error);
      toast.error(`Failed to update cloth: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to delete this cloth item? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await supabaseApi.deleteCloth(id);
      toast.success('Cloth deleted successfully!');
      navigate('/my-clothes');
    } catch (error: any) {
      console.error('Error deleting cloth:', error);
      toast.error(`Failed to delete cloth: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading cloth data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="hover:bg-muted/50 mb-4">
            <Link to="/my-clothes" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to My Clothes
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Cloth Item</h1>
          <p className="text-muted-foreground">Update your clothing item details</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the basic details of your clothing item</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Elegant Evening Dress"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="99.99"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required
                      />
                    </div>

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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      <Input
                        id="color"
                        placeholder="e.g., Black, Navy Blue"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="measurements">Measurements</Label>
                    <Input
                      id="measurements"
                      placeholder="e.g., Bust: 36 inches, Waist: 28 inches, Hips: 38 inches"
                      value={formData.measurements}
                      onChange={(e) => handleInputChange('measurements', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>Upload images of your clothing item</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image URL input */}
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

                  {/* Drag and drop / Choose Files area */}
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
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Item'}
            </Button>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link to="/my-clothes">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? 'Updating...' : 'Update Item'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
