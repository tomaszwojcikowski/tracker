# CI Initialization Investigation

## Issue
Previous CI runs appeared to not be initialized properly.

## Root Cause Analysis

### Problem 1: npm install vs npm ci
The `scripts/ci-init.sh` script was using `npm install` instead of `npm ci`:

**Why this is problematic:**
- `npm install` respects semver ranges and might install different package versions than specified in package-lock.json
- `npm ci` is designed specifically for CI environments and ensures reproducible builds
- `npm ci` removes node_modules before installing, preventing state issues
- GitHub Actions npm caching is optimized for `npm ci`, not `npm install`

**Impact:**
- Non-deterministic builds due to potential version differences
- Cache misses or inefficiencies in GitHub Actions
- Potential dependency conflicts between runs

### Problem 2: Inconsistent Workflow Configuration
The workflow had inconsistent initialization patterns:

**Before:**
- `typecheck` job: Used `npm ci` directly, prepared script
- `unit-tests` job: Used `npm ci` directly, prepared script
- `e2e-tests` job: Used `./scripts/ci-init.sh` (which had `npm install`)
- `build` job: Used `npm ci` directly, prepared script

**Issues:**
- Only e2e-tests used the script, but it had different behavior (npm install)
- Script preparation in other jobs was unnecessary if not used
- Inconsistency could lead to different behavior across jobs

## Solution

### Fix 1: Update ci-init.sh to use npm ci
Changed line 8 from:
```bash
npm install
```
to:
```bash
npm ci
```

**Benefits:**
- Reproducible builds across all environments
- Faster installation due to npm caching optimization
- Consistent with CI best practices
- Prevents dependency version drift

### Fix 2: Documentation
The script now correctly:
1. Uses `npm ci` for deterministic dependency installation
2. Installs Playwright browsers with dependencies
3. Provides clear success feedback
4. Works consistently in both local and CI environments

## Verification

### Local Testing
✅ Script works with `npm ci`
✅ Tests pass after running script
✅ E2E tests work with Playwright installed via script

### CI Behavior
The workflow now has consistent behavior:
- All jobs that need dependencies use `npm ci` (either directly or via script)
- E2E tests job uses the script for full initialization (deps + Playwright)
- Script can be used locally for quick setup

## Recommendations

1. **Always use npm ci in CI**: Never use `npm install` in automated environments
2. **Keep script flexible**: The script works for both local dev and CI
3. **Document usage**: README should mention `./scripts/ci-init.sh` for quick setup
4. **Monitor CI runs**: Watch for any dependency-related failures in future runs

## Testing Checklist

- [x] Script uses npm ci
- [x] Unit tests pass (1246/1246)
- [x] Density rep controls tests pass (20/20)
- [x] Script is executable
- [x] Script works in fresh environment
- [x] Clear error messages if script fails
