# ZK Prover UI E2E Testing - Root Cause Analysis

**Date:** 2025-11-04
**Session:** Continued from SvelteKit fix
**Status:** ⚠️ Partial Fix - Tests still fail with crashes

---

## Quick Summary

**Root Cause Found:** E2E tests were navigating to `/` (homepage) but the `ZKMLProver` component is only rendered on `/debug` page.

**Fix Applied:** Updated all E2E test files to navigate to `/debug` instead of `/`.

**Current Status:** Tests now reach the correct page but still experience crashes, suggesting an underlying issue with component initialization in the Playwright test environment.

---

## Investigation Timeline

### 1. Initial Problem
All E2E tests failing with:
```
Error: locator.textContent: Page crashed
Error: page.click: Page crashed
```

Tests were trying to find `[data-testid="device-capability"]` element but page crashed before element could be accessed.

### 2. Component Analysis

Examined `src/lib/components/ZKMLProver.svelte`:
- Lines 29-32: Reactive statement calls `deviceCapability.detect()` on component load
- Line 153: The `device-capability` testid element is conditionally rendered based on `capabilityMessage`
- Component imports `hybridProver` which creates Web Workers for proof generation

### 3. Route Discovery

**Key Finding:** ZKMLProver component is ONLY used on specific routes:

| Route | Has ZKMLProver | Purpose |
|-------|----------------|---------|
| `/` (homepage) | ❌ No | Main landing page with wallet connect |
| `/debug` | ✅ YES | Debug page with ZKMLProver, stores, and metrics |
| `/debug/proof` | ❌ No | Telemetry dashboard for proof performance |
| `/claim` | ❌ No | Claim airdrop page |

**Tests were navigating to** `/` **but should navigate to** `/debug`

### 4. Fix Applied

Updated all test files to use correct route:

**Files Modified:**
1. `tests/e2e/prover.local.test.ts` (2 occurrences)
2. `tests/e2e/prover.fallback.test.ts` (3 occurrences)

**Changes:**
```diff
- await page.goto("/", { waitUntil: "domcontentloaded" });
+ await page.goto("/debug", { waitUntil: "domcontentloaded" });
```

### 5. Test Results After Fix

**Status:** Tests still fail, but with different error patterns:

```
✘ 5 failed (all tests)
- Page crashed (1 test)
- Target crashed (2 tests)
- Test timeout (2 tests)
```

**Sample Errors:**
```
Error: page.click: Target crashed
Error: locator.textContent: Page crashed
Error: locator.textContent: Test timeout of 60000ms exceeded
```

---

## Current Analysis

### Why Tests Still Fail

Even with correct routing to `/debug`, tests crash when trying to:
1. Access device-capability element (crashes or times out)
2. Click generate-proof-button (target crashes)

**Possible Causes:**

#### 1. **Web Worker Initialization**
- `src/lib/zkml/hybrid-prover.ts:146` creates Worker during proof generation
- Worker loads `src/lib/workers/proofWorker.ts`
- Worker initialization may fail in Playwright environment
- File: `src/lib/workers/proofWorker.ts:74` calls `loadEzkl()`

#### 2. **WASM Module Loading**
- Circuit manager tries to load WASM files
- IndexedDB access for circuit caching
- File: `src/lib/zkml/circuit-manager.ts`
- May fail due to:
  - Missing circuit files in test build
  - IndexedDB permissions in Playwright
  - WASM instantiation errors

#### 3. **Store Initialization**
- Multiple stores imported: `wallet`, `zkproof`, `attestations`, `score`
- Stores may have side effects during initialization
- Sentry integration in error handlers

#### 4. **Browser API Access**
- `navigator.deviceMemory` (experimental API)
- `SharedArrayBuffer` (may be disabled in test environment)
- WebGL or other APIs accessed by visualization components

---

## Component Dependency Chain

```
/debug page
└── ZKMLProver.svelte
    ├── deviceCapability.detect() [RUNS ON MOUNT]
    │   ├── navigator.deviceMemory (may be undefined)
    │   └── navigator.userAgent
    ├── hybridProver
    │   └── Web Worker creation [ON PROOF GENERATION]
    │       ├── loadEzkl() [WASM loading]
    │       └── circuitManager [IndexedDB]
    ├── Stores
    │   ├── zkProofStore
    │   ├── wallet
    │   └── attestations
    └── Other components on /debug
        ├── MetricsChart
        └── TrustNetworkVisualization
```

---

## Recommended Next Steps

### Immediate (1-2 hours)

1. **Add Conditional Rendering for Tests**
   ```svelte
   {#if !import.meta.env.TEST}
     <ZKMLProver />
   {/if}
   ```

2. **Create Test-Safe Component Wrapper**
   - Wrap ZKMLProver in error boundary
   - Add feature flag to disable WASM in test mode
   - Mock device capability detection

3. **Debug with Headed Browser**
   ```bash
   npx playwright test tests/e2e/prover.local.test.ts:11 --headed --debug
   ```
   - Watch actual browser window
   - Check console for JavaScript errors
   - Inspect network requests

### Short Term (3-5 hours)

4. **Mock Heavy Dependencies**
   - Create test fixtures for hybridProver
   - Mock Web Worker creation
   - Stub circuitManager with fake data

5. **Simplify Test Scope**
   - Test only UI rendering, not actual proof generation
   - Skip tests that require WASM
   - Focus on user interaction flows

6. **Add Test-Specific Route**
   - Create `/test-prover` route with minimal dependencies
   - Use simplified version of ZKMLProver
   - No WASM, no Workers, mock everything

### Long Term (1-2 days)

7. **Refactor for Testability**
   - Dependency injection for hybridProver
   - Separate UI logic from proof generation logic
   - Use composition over tight coupling

8. **Unit Tests Instead of E2E**
   - Use @testing-library/svelte for component tests
   - Test ZKMLProver in isolation with mocks
   - Reserve E2E for happy path only

---

## Files Modified This Session

### Test Files (Route Fixes)
1. **tests/e2e/prover.local.test.ts**
   - Line 13: Changed `/` to `/debug`
   - Line 92: Changed `/` to `/debug`

2. **tests/e2e/prover.fallback.test.ts**
   - Line 12: Changed `/` to `/debug`
   - Line 62: Changed `/` to `/debug`
   - Line 87: Changed `/` to `/debug`

### Build Configuration (Previous Session)
3. **package.json**
   - @sveltejs/kit: 2.43.5 → 2.10.0

4. **src/hooks.client.js**
   - Added `handleError` export function

---

## Test Failure Breakdown

| Test | Error Type | Crash Point |
|------|-----------|-------------|
| Worker crash fallback | Target crashed | Click generate button |
| Timeout fallback | Target crashed | Click generate button |
| Device restriction | Page crashed | Access device-capability |
| 16-op local proof | Timeout | Access device-capability |
| Cancellation support | Timeout | Access device-capability |

**Pattern:** Tests that access `device-capability` first (without clicking) timeout. Tests that click buttons first crash the target.

---

## Debug Commands

### Run Single Test with Debug
```bash
npx playwright test tests/e2e/prover.local.test.ts:11 --headed --debug
```

### Check /debug Page Manually
```bash
# Start preview server
npm run build && npm run preview

# Open in browser
open http://localhost:4173/debug

# Check for console errors in browser DevTools
```

### Inspect Component in Browser
```bash
# Navigate to /debug
# Open DevTools Console
# Check for errors related to:
# - Worker creation
# - WASM loading
# - IndexedDB access
# - Missing dependencies
```

---

## Conclusion

### ✅ What Was Fixed
1. **SvelteKit Build Issues** (Previous Session)
   - Fixed "untrack" export errors
   - Added handleError to hooks
   - Downgraded SvelteKit to 2.10.0

2. **Test Route Configuration** (This Session)
   - Identified wrong route in tests
   - Updated all tests to use `/debug`
   - Tests now load correct page

### ⚠️ What Still Needs Work
1. **Component Initialization Crashes**
   - Page/target crashes in Playwright
   - Related to Worker/WASM/IndexedDB
   - Needs debugging or mocking

2. **Test Environment Compatibility**
   - Playwright may not support all browser APIs
   - WASM/Workers may need special configuration
   - IndexedDB permissions unclear

### 📊 Progress
- Build: 100% ✅
- Route Configuration: 100% ✅
- Component Initialization: 0% ⚠️
- E2E Tests Passing: 0% ❌

**Overall: 50% Complete**

---

## Estimated Time to Resolution

**Option A: Quick Fix (Mock Everything)** - 2-3 hours
- Add test mode flag
- Mock all heavy dependencies
- Skip actual proof generation in tests

**Option B: Debug & Fix Root Cause** - 5-8 hours
- Debug browser crashes
- Fix Worker/WASM initialization
- Make tests work with real components

**Option C: Refactor for Testability** - 1-2 days
- Restructure component architecture
- Implement dependency injection
- Create proper test fixtures

**Recommendation:** Start with Option A (mocking) to get tests passing, then gradually move toward Option C for long-term maintainability.

---

**Report Generated:** 2025-11-04 09:40 UTC
**By:** Claude (AI Assistant)
**Branch:** `claude/identify-next-steps-011CUkvaedPA7QhrXGbbj54g`
