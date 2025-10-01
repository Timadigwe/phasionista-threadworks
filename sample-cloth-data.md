# Sample Cloth Data for Testing

Here are sample cloth items you can use to test the creation flow. Each item includes realistic data and image URLs.

## Sample Cloth Items

### 1. Evening Wear - Elegant Black Dress
- **Name**: "Midnight Elegance Gown"
- **Description**: "A stunning floor-length black evening gown with intricate beadwork and a flattering silhouette. Perfect for formal events, galas, and special occasions. Features a sweetheart neckline and flowing chiffon skirt."
- **Price**: 450.00
- **Category**: Evening Wear
- **Size**: M
- **Color**: Black
- **Material**: Chiffon, Beaded
- **Measurements**: "Bust: 36", Waist: 28", Hips: 38", Length: 58""
- **Image URL**: https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=center

### 2. Business - Professional Blazer
- **Name**: "Executive Power Blazer"
- **Description**: "A tailored navy blue blazer perfect for business meetings and professional settings. Features a classic cut, premium wool blend fabric, and subtle pinstripes. Includes functional pockets and a structured fit."
- **Price**: 280.00
- **Category**: Business
- **Size**: L
- **Color**: Navy Blue
- **Material**: Wool Blend
- **Measurements**: "Chest: 42", Waist: 38", Length: 30", Sleeve: 25""
- **Image URL**: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=center

### 3. Casual - Denim Jacket
- **Name**: "Vintage Denim Classic"
- **Description**: "A timeless denim jacket with a vintage wash and modern fit. Features classic button closure, chest pockets, and a comfortable relaxed fit. Perfect for casual outings and layering."
- **Price**: 85.00
- **Category**: Casual
- **Size**: L
- **Color**: Blue
- **Material**: 100% Cotton Denim
- **Measurements**: "Chest: 44", Waist: 42", Length: 26", Sleeve: 24""
- **Image URL**: https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop&crop=center

### 4. Streetwear - Hoodie
- **Name**: "Urban Street Hoodie"
- **Description**: "A comfortable oversized hoodie with a modern streetwear aesthetic. Features a drawstring hood, kangaroo pocket, and ribbed cuffs. Made from soft cotton blend for all-day comfort."
- **Price**: 65.00
- **Category**: Streetwear
- **Size**: XL
- **Color**: Gray
- **Material**: Cotton Blend
- **Measurements**: "Chest: 48", Length: 28", Sleeve: 26""
- **Image URL**: https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop&crop=center

### 5. Bridal - Wedding Dress
- **Name**: "Romantic Lace Wedding Gown"
- **Description**: "A breathtaking wedding dress featuring delicate lace details and a flowing train. Perfect for your special day with intricate beadwork and a flattering A-line silhouette. Includes matching veil."
- **Price**: 1200.00
- **Category**: Bridal
- **Size**: S
- **Color**: White
- **Material**: Lace, Silk, Beaded
- **Measurements**: "Bust: 34", Waist: 26", Hips: 36", Length: 60" (with train)"
- **Image URL**: https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=500&fit=crop&crop=center

### 6. Sports - Athletic Top
- **Name**: "Performance Running Tank"
- **Description**: "A high-performance athletic tank top designed for running and workouts. Features moisture-wicking fabric, breathable mesh panels, and a comfortable fit that moves with you."
- **Price**: 45.00
- **Category**: Sports
- **Size**: M
- **Color**: Black
- **Material**: Polyester, Spandex
- **Measurements**: "Chest: 38", Length: 26""
- **Image URL**: https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop&crop=center

### 7. Vintage - Retro Blouse
- **Name**: "Vintage Floral Blouse"
- **Description**: "A charming vintage-inspired blouse with delicate floral print and puffed sleeves. Perfect for creating a romantic, feminine look. Features a button-down front and flattering fit."
- **Price**: 75.00
- **Category**: Vintage
- **Size**: S
- **Color**: Pink
- **Material**: Cotton
- **Measurements**: "Bust: 36", Waist: 32", Length: 24", Sleeve: 22""
- **Image URL**: https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=center

## Testing Instructions

1. **Sign up as a designer** with role "designer"
2. **Navigate to /create** page
3. **Fill out the form** using any of the sample data above
4. **Use the provided image URLs** in the "Image URL" field
5. **Submit the form** and check console logs
6. **Navigate to /clothes** to see your created items
7. **Verify designer information** is displayed correctly

## Image URLs for Testing

All image URLs are from Unsplash and are optimized for the application:
- High quality, professional photos
- Proper aspect ratios (400x500)
- Fashion/clothing focused
- Free to use

## Additional Test Scenarios

### Test with Multiple Images
You can also test the image upload functionality by:
1. Using the "Upload Images" section
2. Selecting local image files
3. Verifying the base64 conversion works

### Test Different Categories
Try creating items in different categories to test the filtering functionality in the clothes gallery.

### Test Price Ranges
Create items with different price points to test the price filtering in the gallery.
