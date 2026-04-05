"""Quick test to measure browser chrome offset in the capture."""
from PIL import Image
import os

img = Image.open(r'C:\Users\drrob\AppData\Local\Temp\ff_screenshots\dashboard.jpg')
print(f"Full capture size: {img.size}")

# The Chrome tool viewport: 1471x835 logical pixels
# DPI scale = capture_width / viewport_width
dpi_scale = img.size[0] / 1471
print(f"DPI scale: {dpi_scale:.3f}")

# Expected page content height in physical pixels
page_height_px = int(835 * dpi_scale)
print(f"Expected page content height: {page_height_px}px")

# Browser chrome height
chrome_height = img.size[1] - page_height_px
print(f"Browser chrome height: {chrome_height}px from top")

# Crop to just page content
cropped = img.crop((0, chrome_height, img.size[0], img.size[1]))
print(f"Cropped size: {cropped.size}")

# Save test
out_path = r'C:\Users\drrob\AppData\Local\Temp\ff_dashboard_cropped.jpg'
cropped.save(out_path, 'JPEG', quality=92)
print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")
