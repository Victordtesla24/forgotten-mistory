#!/usr/bin/env python3
"""Update page.tsx: add 3 new effect imports and gallery entries."""

with open('/Users/vic/claude/forgotten-mistory/app/page.tsx', 'r') as f:
    content = f.read()

# Add 3 new imports after JarvisRepairLoop import
new_imports = """import ImageEnhancer from '@/components/fx/ImageEnhancer';
import KeySigningPulse from '@/components/fx/KeySigningPulse';
import EventSeatShimmer from '@/components/fx/EventSeatShimmer';"""

content = content.replace(
    "import JarvisRepairLoop from '@/components/fx/JarvisRepairLoop';",
    "import JarvisRepairLoop from '@/components/fx/JarvisRepairLoop';\n" + new_imports
)

# Remove duplicate CardDepth import
lines = content.split('\n')
new_lines = []
seen_card_depth = False
for line in lines:
    if "import CardDepth from '@/components/site/CardDepth'" in line:
        if not seen_card_depth:
            seen_card_depth = True
            new_lines.append(line)
    else:
        new_lines.append(line)
content = '\n'.join(new_lines)

# Add 3 new effects to vfx-gallery
old_gallery_end = '                <ClearanceStepper />\n              </div>'
new_gallery_end = '''                <ClearanceStepper />
                <ImageEnhancer project="image-enhancer" />
                <KeySigningPulse project="public-key-server" />
                <EventSeatShimmer project="abentertainment" />
              </div>'''
content = content.replace(old_gallery_end, new_gallery_end)

with open('/Users/vic/claude/forgotten-mistory/app/page.tsx', 'w') as f:
    f.write(content)

print('Updated page.tsx successfully')
