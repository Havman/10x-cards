# Login Testing Guide

## Quick Start

### 1. Ensure Environment Variables Are Set

Check your `.env` file has:
```bash
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### 2. Start Development Server

```bash
npm run dev
```

Server should start at `http://localhost:3000`

### 3. Create Test User in Supabase

**Option A: Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Click "Create user"

**Option B: Use Registration API (when implemented)**
- Will be available after US-001 (User Registration) is complete

### 4. Test Login Flow

#### Test 1: Protected Route Redirect
1. Navigate to `http://localhost:3000/dashboard`
2. ✅ **Expected**: Redirected to `/auth/login?redirect=/dashboard`

#### Test 2: Login Page Access
1. Navigate to `http://localhost:3000/auth/login`
2. ✅ **Expected**: Login form is displayed

#### Test 3: Invalid Credentials
1. Enter incorrect email/password
2. Click "Log In"
3. ✅ **Expected**: Error message "Invalid email or password" appears

#### Test 4: Successful Login
1. Enter valid test user credentials
2. Click "Log In"
3. ✅ **Expected**: 
   - Redirected to `/dashboard`
   - Welcome message shows user email
   - URL is `http://localhost:3000/dashboard`

#### Test 5: Session Persistence
1. After successful login, refresh the page
2. ✅ **Expected**: Still logged in, dashboard displays

#### Test 6: Already Logged In Redirect
1. While logged in, navigate to `/auth/login`
2. ✅ **Expected**: Immediately redirected to `/dashboard`

#### Test 7: Cookie Verification
1. After login, open DevTools (F12)
2. Go to Application → Cookies → `http://localhost:3000`
3. ✅ **Expected**: See Supabase auth cookies (e.g., `sb-*-auth-token`)

## API Testing with cURL

### Test Login Endpoint

```bash
# Replace with your test user credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com"
  }
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password"
  }
}
```

### Test Missing Fields

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Email and password are required"
  }
}
```

## Browser DevTools Debugging

### Check Network Requests

1. Open DevTools (F12) → Network tab
2. Submit login form
3. Find the `login` request
4. ✅ **Check**:
   - Request URL: `http://localhost:3000/api/auth/login`
   - Method: `POST`
   - Status: `200` (success) or `401` (invalid credentials)
   - Response Type: `application/json`

### Check Cookies

1. DevTools → Application → Cookies
2. Look for Supabase auth cookies
3. ✅ **Verify**:
   - Cookie name starts with `sb-`
   - HttpOnly flag is set
   - Secure flag is set (in production)
   - SameSite is `Lax`

### Check Console for Errors

1. DevTools → Console
2. ✅ **Should see**: No JavaScript errors
3. ❌ **Should NOT see**: CORS errors, 500 errors, or authentication failures

## Common Issues & Solutions

### Issue: "Failed to fetch" error

**Cause**: Dev server not running or CORS issue

**Solution**:
```bash
# Restart dev server
npm run dev
```

### Issue: "Invalid email or password" for valid credentials

**Possible Causes**:
1. User doesn't exist in Supabase
2. Email confirmation required
3. Wrong Supabase project credentials

**Solution**:
1. Check Supabase Dashboard → Authentication → Users
2. Verify user exists and is confirmed
3. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`

### Issue: Redirect loop on login

**Cause**: Middleware configuration issue

**Solution**:
1. Check `src/middleware/index.ts`
2. Verify `PUBLIC_PATHS` includes `/auth/login`
3. Restart dev server

### Issue: Session doesn't persist after refresh

**Cause**: Cookies not being set properly

**Solution**:
1. Check browser allows cookies for `localhost`
2. Verify cookies in DevTools → Application
3. Check `createSupabaseServerInstance()` implementation in `src/db/supabase.client.ts`

### Issue: TypeScript errors about `Astro.locals.user`

**Cause**: TypeScript server not updated

**Solution**:
1. In VS Code: Cmd/Ctrl + Shift + P
2. Type "TypeScript: Restart TS Server"
3. Press Enter

## Environment-Specific Testing

### Development (localhost:3000)
- Cookies work with `secure: false` (HTTP)
- Use Supabase development project
- Test users can be created/deleted freely

### Production (HTTPS)
- Cookies require `secure: true`
- Use Supabase production project
- Test in staging environment first

## Next Steps After Testing

Once login is verified:

1. ✅ **Implement Logout** (US-003)
2. ✅ **Implement Registration** (US-001)
3. ✅ **Implement Password Reset** (US-004)
4. ✅ **Add Navigation with User Menu**
5. ✅ **Replace DEFAULT_USER_ID in existing features**
6. ✅ **Enable RLS policies in Supabase**

## Test User Credentials Template

For team testing, create test users:

```
Email: test1@example.com
Password: TestPassword123!

Email: test2@example.com
Password: TestPassword123!
```

**Security Note**: Use strong, unique passwords in production!

## Automated Testing (Future)

Consider adding:
- E2E tests with Playwright
- Integration tests for API endpoints
- Unit tests for React components
- Session management tests

Example Playwright test:
```typescript
test('login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/.*login/);
  
  await page.fill('[type="email"]', 'test@example.com');
  await page.fill('[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Welcome back');
});
```

---

**Ready to test!** 🚀

Start the dev server and work through the test cases above to verify the login implementation.
