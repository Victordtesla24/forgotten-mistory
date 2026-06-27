# Secrets Inventory

## GEMINI_API_KEY
- **Purpose**: Authentication for Gemini API services
- **Used in**:
  - `test` job (Playwright tests)
  - `test-gpu` job (GPU-accelerated tests)
  - `lighthouse` job (performance budgets)
  - `axe` job (accessibility tests)
  - `build` job (static site generation)
- **Rotation**: Manual rotation required (no automated rotation)
- **Ownership**: DevOps team
- **Last rotated**: [DATE NEEDED]

## FIREBASE_SERVICE_ACCOUNT
- **Purpose**: Authentication for Firebase Hosting deployments
- **Used in**:
  - `preview` job (PR preview channels)
  - `deploy` job (production deployments)
- **Rotation**: Manual rotation required (no automated rotation)
- **Ownership**: DevOps team
- **Last rotated**: [DATE NEEDED]

## Security Controls
- All secrets are stored in GitHub repository secrets
- Secrets are never logged or exposed in artifacts
- Pre-commit hooks prevent accidental commits of secrets
- Masking applied to any derived tokens

## Rotation Procedure
1. Generate new secret in source system
2. Update GitHub repository secret
3. Update any dependent systems
4. Verify all CI/CD jobs pass with new secret
5. Document rotation date in this file