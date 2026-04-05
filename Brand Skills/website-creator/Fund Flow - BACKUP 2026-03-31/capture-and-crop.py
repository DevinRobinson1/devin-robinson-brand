"""
Crop browser chrome from a PowerShell window capture.
Usage: python capture-and-crop.py <page-name>
Reads from temp dir, crops, saves to screenshots folder.
"""
import sys
import os
from PIL import Image

TEMP_DIR = r'C:\Users\drrob\AppData\Local\Temp\ff_screenshots'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'screenshots')

# Browser chrome offset in physical pixels (tabs + address bar + bookmarks + infobar)
CHROME_TOP_OFFSET = 240

def crop_screenshot(name):
    src = os.path.join(TEMP_DIR, f'{name}.jpg')
    dst = os.path.join(OUTPUT_DIR, f'{name}.jpg')

    if not os.path.exists(src):
        print(f'ERROR: {src} not found')
        return False

    img = Image.open(src)
    # Crop browser chrome from top
    cropped = img.crop((0, CHROME_TOP_OFFSET, img.size[0], img.size[1]))
    cropped.save(dst, 'JPEG', quality=92)

    print(f'Cropped {name}: {img.size} -> {cropped.size} ({os.path.getsize(dst)} bytes)')
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python capture-and-crop.py <page-name>')
        sys.exit(1)

    name = sys.argv[1]
    if not crop_screenshot(name):
        sys.exit(1)
