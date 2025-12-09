# GitHub Actions CI/CD Documentation

## Overview

This document describes the Pull Request CI workflow implemented for the 10x-cards project. The workflow ensures code quality through automated linting, unit testing, and end-to-end testing before merging pull requests.

## Workflow File

**Location**: `.github/workflows/pull-request.yml`

## Trigger Events

The workflow runs on:
- Pull requests targeting `main` or `master` branches
- Automatically cancels in-progress runs for the same PR when new commits are pushed

```yaml
on:
  pull_request:
    branches:
      - main
      - master

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

## Jobs

### 1. Lint Job

**Purpose**: Validates code style and catches syntax errors

**Steps**:
1. Checkout code
2. Setup Node.js (version from `.nvmrc`)
3. Install dependencies with `npm ci`
4. Run ESLint with `npm run lint`

**Configuration**:
- Runs on: `ubuntu-latest`
- No dependencies on other jobs

**Key Features**:
- Uses NPM cache to speed up dependency installation
- Fails fast if linting errors are found

### 2. Unit Test Job

**Purpose**: Runs unit tests with coverage reporting

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run tests with coverage (`npm run test:coverage`)
5. Upload coverage artifact (retained for 7 days)

**Configuration**:
- Runs on: `ubuntu-latest`
- Depends on: `lint` job (only runs if lint passes)

**Artifacts**:
- Coverage reports uploaded to `unit-test-coverage`
- Retention: 7 days

### 3. E2E Test Job

**Purpose**: Runs end-to-end tests using Playwright

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Install Playwright Firefox browser with system dependencies
5. Create `.env` file with test credentials
6. Start dev server in background
7. Wait for dev server (60s timeout)
8. Run smoke tests only
9. Upload test results and screenshots on failure

**Configuration**:
- Runs on: `ubuntu-latest`
- Depends on: `lint` job
- Environment: `integration` (for secrets)

**Environment Variables**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_PUBLIC_KEY`: Supabase anonymous key
- `E2E_USERNAME_ID`: Test user ID
- `E2E_USERNAME`: Test user email
- `E2E_PASSWORD`: Test user password
- `CI=true`: Enables CI mode for dev server

**Test Scope**:
Currently runs only smoke tests (`e2e/smoke.spec.ts`) which includes:
- Homepage loading
- Valid document structure
- Login page accessibility

**Known Issues**:
- Basic tests failing due to React hydration issues in CI
- Body elements showing as "hidden"
- Forms not rendering properly
- **Status**: E2E tests are currently optional (won't block PR)

**Artifacts**:
- Playwright HTML report (always uploaded)
- Screenshots and videos (uploaded on failure)
- Retention: 7 days

### 4. Status Comment Job

**Purpose**: Posts a summary comment on the PR with test results

**Configuration**:
- Runs on: `ubuntu-latest`
- Depends on: All jobs (`lint`, `unit-test`, `e2e-test`)
- Runs: `always()` (even if previous jobs fail)
- Permissions: `pull-requests: write`

**Output**:
Posts a formatted comment showing:
- Overall status (✅ success or ❌ failure)
- Individual job statuses in a table
- Link to detailed results
- Emoji indicators for visual clarity

**Success Criteria**:
- ✅ Lint passes
- ✅ Unit tests pass
- ⚠️ E2E tests (optional - won't block merge)

## Workflow Diagram

```
Pull Request Created/Updated
         |
         v
    [Lint Job]
         |
         +-- Success --> [Unit Test Job]
         |                     |
         +-- Success --------> [E2E Test Job] (Optional)
         |                     |
         v                     v
    [Status Comment Job]
    (Posts results to PR)
```

## Configuration Files

### ESLint Configuration

**File**: `eslint.config.js`

**Key Features**:
- TypeScript support with type-aware linting
- React plugin for JSX validation
- Astro plugin for `.astro` file support
- Prettier integration (disabled for `.astro` files)

**Fix Applied** (Dec 2024):
- Reordered plugin configurations to prevent Prettier conflicts
- Explicitly disabled Prettier for `.astro` files
- Resolved parsing errors in `Layout.astro`

### Playwright Configuration

**File**: `playwright.config.ts`

**Key Settings**:
- Base URL: `http://localhost:3000`
- Browser: Firefox only
- Workers: 1 (sequential execution)
- Retries: 2 on CI, 0 locally
- Test match: `smoke.spec.ts` (currently)

## Required Secrets

Must be configured in GitHub repository settings under **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Environment |
|------------|-------------|-------------|
| `SUPABASE_URL` | Supabase project URL | integration |
| `SUPABASE_PUBLIC_KEY` | Supabase anonymous/public key | integration |
| `E2E_USERNAME_ID` | Test user UUID | integration |
| `E2E_USERNAME` | Test user email | integration |
| `E2E_PASSWORD` | Test user password | integration |

## Local Development

### Running Tests Locally

```bash
# Lint
npm run lint

# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (smoke only)
npx playwright test e2e/smoke.spec.ts

# E2E tests (all)
npm run test:e2e

# E2E with UI
npm run test:e2e -- --ui
```

### Environment Setup

For E2E tests, create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLIC_KEY=your_public_key
E2E_USERNAME_ID=test_user_id
E2E_USERNAME=test@example.com
E2E_PASSWORD=test_password
```

## Troubleshooting

### Lint Failures

**Issue**: `Parsing error: Unexpected token prettier/prettier` in `.astro` files

**Solution**: Already fixed in `eslint.config.js` by:
1. Applying Prettier plugin only to JS/TS files
2. Explicitly disabling Prettier for `.astro` files

### E2E Test Failures

**Common Issues**:

1. **Dev server not ready**
   - Increase timeout in "Wait for dev server" step
   - Check if port 3000 is available

2. **React components not hydrating**
   - Verify environment variables are set
   - Check browser console for hydration errors
   - Review Astro client directives (`client:load`, etc.)

3. **Body elements showing as "hidden"**
   - CSS issue or JavaScript not loading
   - Check if Vite/Astro build is complete
   - Verify no CSS rules hiding content

**Current Workaround**: E2E tests are optional and won't block PRs

### Coverage Upload Failures

**Issue**: Coverage artifact not found

**Solution**: Ensure `npm run test:coverage` generates `coverage/` directory

## Best Practices

### When to Update Workflow

Update the workflow when:
- Adding new test suites or tools
- Changing Node.js version
- Modifying required environment variables
- Adding new deployment targets

### Writing Tests for CI

1. **Unit Tests**:
   - Keep tests fast and isolated
   - Mock external dependencies
   - Use meaningful test descriptions

2. **E2E Tests**:
   - Start with smoke tests (critical paths)
   - Add explicit waits for dynamic content
   - Use data-testid attributes for reliability
   - Group related tests in describes

3. **CI-Specific Considerations**:
   - Tests should be deterministic
   - Avoid hardcoded timeouts
   - Clean up test data/state
   - Handle flaky tests with retries

## Performance Optimization

Current optimizations:
- NPM cache enabled for faster dependency installation
- Concurrency cancellation prevents duplicate runs
- Artifact retention limited to 7 days
- Only Firefox browser installed (not Chromium/WebKit)

**Average Run Time**:
- Lint: ~30-60 seconds
- Unit Tests: ~1-2 minutes
- E2E Tests: ~3-5 minutes (currently skipped)
- Total: ~5-8 minutes per PR

## Future Improvements

### Short Term
1. Fix React hydration issues in E2E tests
2. Re-enable basic.spec.ts tests
3. Add visual regression testing
4. Implement test result caching

### Long Term
1. Add deployment preview environments
2. Implement performance budgets
3. Add security scanning (Dependabot, CodeQL)
4. Create nightly full E2E test runs
5. Add accessibility (a11y) testing
6. Implement parallel test execution

## Maintenance

### Regular Tasks

**Weekly**:
- Review failed test patterns
- Update dependencies if needed

**Monthly**:
- Review and clean up old artifacts
- Update Node.js version if needed
- Review and optimize test execution time

**Quarterly**:
- Review and update GitHub Actions versions
- Audit secrets and permissions
- Review coverage thresholds

## Related Documentation

- [Test Plan](./test_plan.md) - Overall testing strategy
- [Login Testing Guide](./login-testing-guide.md) - Authentication testing
- [Tech Stack](./tech-stack.md) - Technology choices

## Change Log

### December 9, 2024
- Fixed ESLint configuration for Astro files
- Reduced E2E tests to smoke tests only
- Made E2E tests optional (won't block PRs)
- Added status comment with detailed results
- Documented known React hydration issues

### Initial Setup
- Created pull-request.yml workflow
- Configured lint, unit-test, and e2e-test jobs
- Set up Supabase integration secrets
- Configured Playwright for Firefox