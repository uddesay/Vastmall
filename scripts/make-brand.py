"""Generates every Vastmall brand asset: header logos, app icon, favicon, PWA
icons and the Android launcher icons + splash (if web/android exists).
Placeholder artwork until the client supplies a final logo.
Run: python scripts/make-brand.py"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLUE, YELLOW, WHITE = (40, 116, 240), (255, 214, 10), (255, 255, 255)
FONTS = 'C:/Windows/Fonts'
SS = 4  # supersampling


def mark(size, shape='rounded'):
    """Blue badge, white shopping bag, yellow 'V' on the bag. shape: rounded | square | circle | none."""
    s = size * SS
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if shape == 'rounded':
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.24), fill=BLUE)
    elif shape == 'circle':
        d.ellipse([0, 0, s - 1, s - 1], fill=BLUE)
    elif shape == 'square':
        d.rectangle([0, 0, s, s], fill=BLUE)
    x0, x1, y0, y1 = s * 0.25, s * 0.75, s * 0.38, s * 0.80
    d.rounded_rectangle([x0, y0, x1, y1], radius=int(s * 0.05), fill=WHITE)
    w = max(2, int(s * 0.045))
    d.arc([s * 0.34, s * 0.18, s * 0.66, s * 0.58], 180, 360, fill=WHITE, width=w)
    vw = max(2, int(s * 0.07))
    d.line([(s * 0.36, s * 0.49), (s * 0.5, s * 0.69), (s * 0.64, s * 0.49)], fill=YELLOW, width=vw, joint='curve')
    return im.resize((size, size), Image.LANCZOS)


def wordmark(height, color):
    font = ImageFont.truetype(f'{FONTS}/seguibli.ttf', height * SS)
    probe = Image.new('RGBA', (10, 10))
    box = ImageDraw.Draw(probe).textbbox((0, 0), 'Vastmall', font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    im = Image.new('RGBA', (w + 8 * SS, h + 8 * SS), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 * SS - box[0], 4 * SS - box[1]), 'Vastmall', font=font, fill=color)
    return im.resize((im.width // SS, im.height // SS), Image.LANCZOS)


def logo(text_color, tag_color):
    H = 120
    m = mark(H)
    word = wordmark(70, text_color)
    tag = ImageFont.truetype(f'{FONTS}/seguisb.ttf', 22)
    gap = 16
    W = H + gap + max(word.width, 330)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    im.alpha_composite(m, (0, 0))
    im.alpha_composite(word, (H + gap, 8))
    ImageDraw.Draw(im).text((H + gap + 4, 88), 'Explore  ·  Shop  ·  Delight', font=tag, fill=tag_color)
    return im


def splash(w, h):
    im = Image.new('RGBA', (w, h), BLUE + (255,))
    side = min(w, h)
    m = mark(round(side * 0.30), 'rounded')
    im.alpha_composite(m, ((w - m.width) // 2, h // 2 - m.height))
    word = wordmark(round(side * 0.09), WHITE)
    im.alpha_composite(word, ((w - word.width) // 2, h // 2 + round(side * 0.04)))
    return im.convert('RGB')


def main():
    pub = os.path.join(ROOT, 'web', 'public')
    os.makedirs(os.path.join(pub, 'brand'), exist_ok=True)
    os.makedirs(os.path.join(pub, 'icons'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets', 'brand'), exist_ok=True)
    logo((16, 42, 110), (90, 100, 125)).save(os.path.join(pub, 'brand', 'logo.png'))
    logo(WHITE, (214, 228, 255)).save(os.path.join(pub, 'brand', 'logo-white.png'))
    mark(256).save(os.path.join(pub, 'brand', 'icon.png'))
    mark(64).save(os.path.join(pub, 'favicon.png'))
    mark(192).save(os.path.join(pub, 'icons', 'icon-192.png'))
    mark(512).save(os.path.join(pub, 'icons', 'icon-512.png'))
    mark(512, 'square').save(os.path.join(pub, 'icons', 'maskable-512.png'))
    mark(1024, 'square').convert('RGB').save(os.path.join(ROOT, 'assets', 'brand', 'vastmall-icon-1024.png'))
    count = 0
    res = os.path.join(ROOT, 'web', 'android', 'app', 'src', 'main', 'res')
    if os.path.isdir(res):
        for d in os.listdir(res):
            folder = os.path.join(res, d)
            for f in os.listdir(folder):
                path = os.path.join(folder, f)
                if f in ('ic_launcher.png', 'ic_launcher_round.png'):
                    mark(Image.open(path).size[0], 'circle' if f.endswith('round.png') else 'rounded').save(path); count += 1
                elif f == 'ic_launcher_foreground.png':
                    size = Image.open(path).size[0]
                    fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
                    inner = round(size * 0.62)
                    fg.alpha_composite(mark(inner, 'none'), ((size - inner) // 2, (size - inner) // 2))
                    fg.save(path); count += 1
                elif f == 'splash.png':
                    splash(*Image.open(path).size).save(path); count += 1
        bg = os.path.join(res, 'values', 'ic_launcher_background.xml')
        if os.path.exists(bg):
            with open(bg, 'w', encoding='utf-8') as fh:
                fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
                         '    <color name="ic_launcher_background">#2874F0</color>\n</resources>\n')
    print(f'brand assets written ({count} Android assets)')


if __name__ == '__main__':
    main()
