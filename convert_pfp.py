import os
import subprocess
import sys

input_file = "assets/Bear.gif"
output_png = "assets/Bear.png"
output_jpg = "assets/Bear.jpg"
output_webp = "assets/Bear.webp"

print(f"Checking {input_file} (size: {os.path.getsize(input_file)} bytes)...")

# Try ImageMagick
converted = False
try:
    res = subprocess.run(["convert", f"{input_file}[0]", output_png], capture_output=True, text=True)
    if res.returncode == 0:
        subprocess.run(["convert", f"{input_file}[0]", output_jpg], capture_output=True)
        subprocess.run(["convert", f"{input_file}[0]", output_webp], capture_output=True)
        converted = True
        print("Converted successfully using ImageMagick (convert)!")
except Exception:
    pass

# Try ffmpeg
if not converted:
    try:
        res = subprocess.run(["ffmpeg", "-y", "-i", input_file, "-vframes", "1", output_png], capture_output=True, text=True)
        if res.returncode == 0:
            subprocess.run(["ffmpeg", "-y", "-i", input_file, "-vframes", "1", output_jpg], capture_output=True)
            subprocess.run(["ffmpeg", "-y", "-i", input_file, "-vframes", "1", output_webp], capture_output=True)
            converted = True
            print("Converted successfully using ffmpeg!")
    except Exception:
        pass

# Try Python PIL
if not converted:
    try:
        from PIL import Image
        im = Image.open(input_file)
        # First frame
        im.seek(0)
        im.convert("RGBA").save(output_png, "PNG")
        im.convert("RGB").save(output_jpg, "JPEG")
        im.save(output_webp, "WEBP")
        converted = True
        print("Converted successfully using Python Pillow (PIL)!")
    except Exception as e:
        print(f"PIL attempt failed: {e}")

if converted:
    print(f"Generated:")
    if os.path.exists(output_png): print(f" - {output_png} ({os.path.getsize(output_png)} bytes)")
    if os.path.exists(output_jpg): print(f" - {output_jpg} ({os.path.getsize(output_jpg)} bytes)")
    if os.path.exists(output_webp): print(f" - {output_webp} ({os.path.getsize(output_webp)} bytes)")
else:
    print("Could not convert with system tools. Trying raw header inspection...")
    with open(input_file, "rb") as f:
        header = f.read(32)
        print("File header (hex):", header.hex())
        print("File header (ascii):", header)
