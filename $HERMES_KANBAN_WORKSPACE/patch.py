import re

def replace_in_file(path, old, new):
    with open(path, 'r') as f:
        content = f.read()
    count = content.count(old)
    if count == 0:
        print(f"WARNING: pattern not found in {path}")
        print(f"  Looking for: {repr(old[:80])}...")
        return
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print(f"OK: {path} ({count} replacement(s))")

PROJ = '/Users/vic/claude/forgotten-mistory'

# 1. page.tsx
replace_in_file(f'{PROJ}/app/page.tsx',
    '                <AstroChartSphere project="jyotish-shastra" />',
    '                <ErrorBoundary>\n                  <AstroChartSphere project="jyotish-shastra" />\n                </ErrorBoundary>')

# 2. CelestialSphere
replace_in_file(f'{PROJ}/components/fx/CelestialSphere.tsx',
    '  const handleCanvasError = useCallback(() => setWebglError(true), []);',
    '  const handleCanvasError = useCallback((err?: unknown) => {\n    console.error(\'[CelestialSphere] WebGL error:\', err);\n    setWebglError(true);\n  }, []);')

# 3. OrchestrationGraph
replace_in_file(f'{PROJ}/components/fx/OrchestrationGraph.tsx',
    '  const handleCanvasError = useCallback(() => setWebglError(true), []);',
    '  const handleCanvasError = useCallback((err?: unknown) => {\n    console.error(\'[OrchestrationGraph] WebGL error:\', err);\n    setWebglError(true);\n  }, []);')

# 4. PacketFlowGraph
replace_in_file(f'{PROJ}/components/fx/PacketFlowGraph.tsx',
    '  const handleCanvasError = useCallback(() => setWebglError(true), []);',
    '  const handleCanvasError = useCallback((err?: unknown) => {\n    console.error(\'[PacketFlowGraph] WebGL error:\', err);\n    setWebglError(true);\n  }, []);')

# 5. TelemetryPanel
tp_path = f'{PROJ}/components/site/TelemetryPanel.tsx'
with open(tp_path, 'r') as f:
    content = f.read()
content = content.replace(
    "import SparklineGL from '@/components/fx/SparklineGL';",
    "import SparklineGL from '@/components/fx/SparklineGL';\nimport ErrorBoundary from '@/components/ErrorBoundary';")
content = content.replace(
    '{!prefersReducedMotion && <PanelDepthScene />}',
    '{!prefersReducedMotion && (\n        <ErrorBoundary>\n          <PanelDepthScene />\n        </ErrorBoundary>\n      )}')
content = content.replace(
    '                <SparklineGL values={glSparkValues} />',
    '                <ErrorBoundary>\n                  <SparklineGL values={glSparkValues} />\n                </ErrorBoundary>')
with open(tp_path, 'w') as f:
    f.write(content)
print(f"OK: {tp_path}")

print("All done.")
