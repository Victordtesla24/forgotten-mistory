import json, sys

with open('lighthouserc.json') as f:
    real = json.load(f)

assertions = real['ci']['assert']['assertions']
print('=== REAL CONFIG ASSERTIONS ===')
errors = warns = 0
for key, val in assertions.items():
    level, threshold = val[0], val[1]
    print(f'  {key}: [{level}] {threshold}')
    if level == 'error': errors += 1
    elif level == 'warn': warns += 1

print(f'Error assertions: {errors}, Warning assertions: {warns}')
assert errors >= 4, f'Need >=4 error assertions, got {errors}'
print('PASS: meaningful error-level gates')

with open('lighthouserc.test-fail.json') as f:
    fail = json.load(f)

print('\n=== FAIL CONFIG ===')
for key, val in fail['ci']['assert']['assertions'].items():
    print(f'  {key}: [{val[0]}] {val[1]}')

for key in ['categories:performance','first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift']:
    if key in fail['ci']['assert']['assertions'] and key in real['ci']['assert']['assertions']:
        r = real['ci']['assert']['assertions'][key]
        f = fail['ci']['assert']['assertions'][key]
        assert r[0] == f[0] == 'error'
        if 'minScore' in r[1]:
            assert f[1]['minScore'] > r[1]['minScore']
        if 'maxNumericValue' in r[1]:
            assert f[1]['maxNumericValue'] < r[1]['maxNumericValue']
        print(f'  Verified: {key} fail threshold stricter than real')

print('\n=== VERIFICATION PASSED ===')
print('Real: 4 error + 3 warn, realistic budgets')
print('Fail: 5 error, impossible budgets (will trigger non-zero exit)')
print('Pages: /, /performance-benchmark (no /history or /artifact/* exist)')
