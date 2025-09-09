#!/usr/bin/env python3
from PIL import Image
import os

# Create test assets directory
os.makedirs('tests/test-assets', exist_ok=True)

# Create a blue test image
img1 = Image.new('RGB', (100, 100), color='blue')
img1.save('tests/test-assets/test-image.jpg')

# Create a green profile photo
img2 = Image.new('RGB', (100, 100), color='green')
img2.save('tests/test-assets/profile-photo.jpg')

print("Test images created successfully!")