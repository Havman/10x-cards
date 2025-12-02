# Test Plan for 10x-cards: AI Flashcard Generator

## 1. Introduction and Testing Objectives

### 1.1 Project Overview
10x-cards is an AI-powered flashcard generator that transforms raw text (lecture notes, articles) into digital flashcards for efficient study sessions. The application leverages modern web technologies including Astro 5, React 19, TypeScript, and Supabase for backend services, with AI integration through OpenRouter.ai.

### 1.2 Testing Objectives
The primary objectives of this testing strategy are to:

- **Ensure System Reliability**: Verify that all core features function correctly under normal and edge-case scenarios
- **Validate AI Integration**: Confirm AI-generated flashcards meet quality standards and usage limits are enforced
- **Secure User Data**: Validate authentication, authorization, and Row Level Security (RLS) policies
- **Optimize Performance**: Test spaced repetition algorithm (FSRS) accuracy and application responsiveness
- **Maintain Code Quality**: Ensure TypeScript type safety, ESLint compliance, and proper error handling
- **Guarantee Accessibility**: Verify WCAG 2.1 Level AA compliance across interactive components

### 1.3 Success Criteria
Testing will be considered successful when:
- All critical user flows complete without errors
- 95% code coverage for services and API endpoints
- Zero critical security vulnerabilities
- AI generation respects daily limits and produces valid flashcards
- Page load time < 2 seconds for 95th percentile
- WCAG 2.1 AA accessibility compliance achieved

---

## 2. Scope of Testing

### 2.1 In-Scope Features

#### Authentication & User Management
- User registration with email/password
- Login/logout functionality
- Password reset workflow
- Session management with Supabase Auth
- Protected route access control

#### Deck Management
- Create, read, update, delete (CRUD) decks
- Deck listing with pagination
- Unique deck name validation per user
- Deck statistics (card counts, due dates)

#### Flashcard Management
- Manual flashcard creation
- AI-powered flashcard generation from text
- Draft flashcard review and acceptance
- Flashcard editing and deletion
- Bulk flashcard operations
- Status transitions (draft → new → finalized)

#### AI Integration
- OpenRouter.ai API integration
- Text-to-flashcard generation
- Daily usage limit enforcement (50 cards/day)
- Usage tracking and reporting
- Error handling for AI service failures

#### Study Sessions
- FSRS (Free Spaced Repetition Scheduler) algorithm implementation
- Study session initialization
- Card review with grading (again, hard, good, easy)
- Progress tracking and session statistics
- Performance history logging

#### Database & Security
- PostgreSQL database via Supabase
- Row Level Security (RLS) policies
- Cascade deletions for data integrity
- Database migrations
- Index optimization

### 2.2 Out-of-Scope Features
- Mobile application testing (future enhancement)
- Advanced sharing features
- File import capabilities (PDF, DOCX)
- Third-party integrations (Anki, Quizlet)
- Multi-language support
- Real-time collaboration features

### 2.3 Supported Environments
- **Browsers**: Chrome (latest 2 versions), Firefox (latest 2 versions), Safari (latest 2 versions), Edge (latest 2 versions)
- **Operating Systems**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **Node.js Version**: v22.14.0 (as specified in .nvmrc)
- **Database**: PostgreSQL 14+ via Supabase

---

## 3. Types of Tests to be Conducted

### 3.1 Unit Testing

#### Target Components
- **Services**: 
  - `ai-generation.service.ts` - AI flashcard generation logic
  - `openrouter.client.ts` - External AI API client
  - Validation schemas (Zod)
- **Utilities**: 
  - `utils.ts` - Helper functions
  - Type guards and validators
- **FSRS Algorithm**: 
  - Ease factor calculations
  - Interval computation
  - Next review date scheduling

#### Testing Framework
- **Tool**: Vitest (recommended for Vite/Astro projects)
- **Mocking**: Mock Supabase client, OpenRouter API calls
- **Coverage Target**: 90% for services, 80% for utilities

#### Key Test Cases
1. **AIGenerationService**
   - Daily limit check with various usage scenarios
   - Deck ownership verification
   - Flashcard parsing and validation
   - Error handling for AI service failures
   
2. **Validation Schemas**
   - Input validation for all API request types
   - Boundary value testing (min/max lengths)
   - Type coercion and sanitization

3. **FSRS Algorithm**
   - Grade-based ease factor adjustments
   - Interval calculation for all grade types
   - Edge cases (first review, long intervals)

### 3.2 Integration Testing

#### API Endpoints Testing
Test all API routes with real database interactions:

**Authentication Endpoints**
- `POST /api/auth/login` - Successful login, invalid credentials, rate limiting
- `POST /api/auth/register` - New user registration, duplicate email handling
- `POST /api/auth/logout` - Session termination

**Deck Endpoints**
- `POST /api/decks/create` - Deck creation with validation
- `GET /api/decks/list` - Pagination, sorting, filtering
- `PATCH /api/decks/[id]/update` - Deck name updates
- `DELETE /api/decks/[id]/delete` - Cascade deletion verification

**Flashcard Endpoints**
- `POST /api/flashcards/create` - Manual and bulk creation
- `GET /api/flashcards/list` - Status filtering, pagination
- `PATCH /api/flashcards/[id]/update` - Content updates
- `POST /api/flashcards/[id]/accept` - Draft acceptance

**AI Generation Endpoints**
- `POST /api/ai/generate` - Text processing, limit enforcement
- `GET /api/ai/usage` - Current usage reporting

**Study Session Endpoints**
- `POST /api/study/start` - Session initialization
- `POST /api/study/review` - Card grading and FSRS updates
- `POST /api/study/end` - Session completion statistics

#### Database Integration
- Row Level Security (RLS) policy enforcement
- Transaction integrity (atomic operations)
- Cascade deletions (decks → flashcards → performance records)
- Index performance verification
- Migration rollback testing

#### Testing Framework
- **Tool**: Playwright for E2E testing with API route validation
- **Database**: Supabase local instance with test data
- **Strategy**: Setup/teardown for each test suite

### 3.3 End-to-End (E2E) Testing

#### Critical User Flows

**Flow 1: New User Onboarding**
1. Navigate to registration page
2. Register with valid credentials
3. Verify email confirmation (if applicable)
4. Login with new credentials
5. Redirect to dashboard
6. Create first deck
7. Generate AI flashcards
8. Start study session

**Flow 2: AI Flashcard Generation**
1. Login as existing user
2. Navigate to deck generation page
3. Paste text (minimum 1000 characters)
4. Set max cards parameter
5. Submit generation request
6. Review draft flashcards
7. Accept/edit drafts
8. Verify flashcards appear in deck

**Flow 3: Study Session**
1. Login as user with due cards
2. Select deck with cards due
3. Start study session
4. Review first card (front side only)
5. Reveal answer (back side)
6. Grade card (again/hard/good/easy)
7. Verify next card appears
8. Complete session
9. View session statistics

**Flow 4: Deck Management**
1. Login as user
2. Create new deck
3. Add manual flashcards
4. Edit flashcard content
5. Rename deck
6. Delete specific flashcards
7. Delete entire deck
8. Verify cascade deletion

#### Testing Framework
- **Tool**: Playwright
- **Browser Coverage**: Chromium, Firefox, WebKit
- **Viewport Testing**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Network Conditions**: Fast 3G, Slow 3G, Offline

### 3.4 Performance Testing

#### Load Testing Scenarios
- **Concurrent Users**: Test with 10, 50, 100 simultaneous users
- **AI Generation Load**: Multiple simultaneous generation requests
- **Database Query Performance**: Queries with large datasets (1000+ flashcards)

#### Metrics to Monitor
- **Response Time**: 
  - API endpoints < 500ms (95th percentile)
  - Page load < 2 seconds
  - AI generation < 30 seconds
- **Throughput**: Requests per second
- **Resource Utilization**: CPU, memory, database connections

#### Testing Tools
- **Load Testing**: k6 or Artillery
- **Profiling**: Chrome DevTools, Lighthouse
- **Database**: PostgreSQL EXPLAIN ANALYZE

### 3.5 Security Testing

#### Authentication & Authorization
- JWT token validation and expiration
- Session hijacking prevention
- Password strength enforcement
- CSRF protection for forms
- XSS prevention in user-generated content

#### Database Security
- Row Level Security (RLS) policy verification
- SQL injection prevention (parameterized queries)
- User isolation (no cross-user data access)
- Sensitive data encryption at rest

#### API Security
- Rate limiting enforcement
- Input validation and sanitization
- CORS policy verification
- API key protection (OpenRouter)
- Environment variable security

#### Testing Approach
- **Tools**: OWASP ZAP, Burp Suite Community
- **Manual Testing**: Authorization bypass attempts
- **Automated Scanning**: Dependency vulnerability scanning (npm audit)

### 3.6 Accessibility Testing

#### WCAG 2.1 Level AA Compliance
- **Keyboard Navigation**: All interactive elements accessible via Tab/Shift+Tab
- **Screen Reader Support**: ARIA labels, landmarks, live regions
- **Focus Management**: Visible focus indicators, logical tab order
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Form Accessibility**: Labels, error messages, required field indicators

#### Components to Test
- Login/registration forms
- Flashcard creation forms
- AI generation form with validation feedback
- Study session interface (card flip, grading buttons)
- Navigation menus and deck lists

#### Testing Tools
- **Automated**: axe DevTools, Lighthouse Accessibility Audit
- **Manual**: NVDA, JAWS, VoiceOver screen readers
- **Keyboard Only**: Complete user flows without mouse

### 3.7 Compatibility Testing

#### Browser Testing
| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome | Latest 2 | High |
| Firefox | Latest 2 | High |
| Safari | Latest 2 | High |
| Edge | Latest 2 | Medium |

#### Responsive Design Testing
- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024 (portrait/landscape)
- Mobile: 375x667, 414x896

#### Cross-Platform Testing
- Windows 10/11
- macOS 12+ (Monterey, Ventura, Sonoma)
- Ubuntu 20.04/22.04

---

## 4. Test Scenarios for Key Functionalities

### 4.1 User Authentication

#### Test Scenario 4.1.1: Successful User Registration
**Preconditions**: User is on `/auth/register` page  
**Steps**:
1. Enter valid email: `test@example.com`
2. Enter valid password: `SecurePass123!`
3. Confirm password: `SecurePass123!`
4. Click "Register" button

**Expected Results**:
- User account created in Supabase Auth
- User redirected to `/dashboard`
- Success message displayed
- Session cookie set

**Priority**: Critical

#### Test Scenario 4.1.2: Login with Invalid Credentials
**Preconditions**: User is on `/auth/login` page  
**Steps**:
1. Enter email: `user@example.com`
2. Enter incorrect password: `WrongPassword`
3. Click "Log In" button

**Expected Results**:
- Login fails with error message
- Error: "Invalid login credentials"
- User remains on login page
- Password field cleared

**Priority**: High

#### Test Scenario 4.1.3: Protected Route Access
**Preconditions**: User is not authenticated  
**Steps**:
1. Attempt to navigate to `/dashboard`

**Expected Results**:
- User redirected to `/auth/login?redirect=/dashboard`
- After successful login, user redirected back to `/dashboard`

**Priority**: Critical

### 4.2 AI Flashcard Generation

#### Test Scenario 4.2.1: Successful AI Generation
**Preconditions**: User logged in, on `/decks/[deck_id]/generate`  
**Steps**:
1. Paste text with 1500 characters
2. Set max cards to 10
3. Click "Generate Flashcards"
4. Wait for AI processing

**Expected Results**:
- AI service called with text
- 1-10 flashcards generated with status "draft"
- Flashcards displayed in grid below form
- Generation logged in `ai_generation_logs`
- Success message with count shown

**Priority**: Critical

#### Test Scenario 4.2.2: Daily Limit Enforcement
**Preconditions**: User has generated 50 cards today  
**Steps**:
1. Attempt to generate 5 more cards
2. Submit generation request

**Expected Results**:
- Request rejected with HTTP 403
- Error message: "Daily generation limit of 50 cards exceeded"
- Reset time displayed
- No cards generated
- No charge to daily limit

**Priority**: Critical

#### Test Scenario 4.2.3: Invalid Input Validation
**Preconditions**: User on generation form  
**Test Cases**:
1. Text too short (< 1000 characters)
2. Text too long (> 10,000 characters)
3. Max cards below minimum (< 1)
4. Max cards above maximum (> 50)

**Expected Results**:
- Form validation errors displayed inline
- Submit button disabled
- Character count displayed with visual feedback
- Helpful error messages guide user

**Priority**: High

### 4.3 Study Sessions with FSRS

#### Test Scenario 4.3.1: Complete Study Session
**Preconditions**: User has 5 cards due today in a deck  
**Steps**:
1. Navigate to deck
2. Click "Start Study Session"
3. View first card front
4. Click "Show Answer"
5. Grade card as "good"
6. Repeat for all 5 cards
7. View session completion summary

**Expected Results**:
- Session created with `started_at` timestamp
- Each card review updates:
  - `ease_factor` based on grade
  - `interval` (days until next review)
  - `next_review_date`
  - `status` → "finalized"
- Performance record created for each card
- Session completed with statistics:
  - Total cards reviewed: 5
  - Accuracy rate calculated
  - Session duration

**Priority**: Critical

#### Test Scenario 4.3.2: FSRS Algorithm Verification
**Preconditions**: New card with default values  
**Initial State**:
- `ease_factor`: 2.5
- `interval`: 0
- `status`: "new"

**Test Cases**:

| Grade | Expected Ease Factor | Expected Interval | Next Review |
|-------|---------------------|-------------------|-------------|
| Again | 2.0-2.3 | 0-1 days | Tomorrow or same day |
| Hard | 2.3-2.4 | 1 day | Tomorrow |
| Good | 2.5 | 1-3 days | 1-3 days from now |
| Easy | 2.6-2.7 | 4-7 days | 4-7 days from now |

**Priority**: Critical

#### Test Scenario 4.3.3: No Cards Due
**Preconditions**: Deck has no cards with `next_review_date` <= today  
**Steps**:
1. Navigate to deck
2. Attempt to start study session

**Expected Results**:
- Error message: "No cards due for review"
- Study button disabled or hidden
- Next review date displayed
- Suggestion to study other decks

**Priority**: Medium

### 4.4 Deck and Flashcard Management

#### Test Scenario 4.4.1: Cascade Deletion
**Preconditions**: Deck with 10 flashcards, 2 study sessions, 20 performance records  
**Steps**:
1. Navigate to deck settings
2. Click "Delete Deck"
3. Confirm deletion

**Expected Results**:
- Deck deleted from `decks` table
- All 10 flashcards deleted from `flashcards` table
- All 2 study sessions deleted from `study_sessions` table
- All 20 performance records deleted from `flashcard_performance` table
- User redirected to dashboard
- Success message displayed

**Priority**: High

#### Test Scenario 4.4.2: Bulk Flashcard Creation
**Preconditions**: User on deck page  
**Steps**:
1. Click "Bulk Add Flashcards"
2. Enter 25 flashcard pairs
3. Submit bulk creation

**Expected Results**:
- All 25 flashcards created with status "new"
- Validation failures reported individually
- Partial success supported (18/25 created)
- Summary shown: "18 created, 7 failed"
- Failed items listed with reasons

**Priority**: Medium

#### Test Scenario 4.4.3: Draft Flashcard Review
**Preconditions**: 5 AI-generated draft flashcards  
**Steps**:
1. View draft flashcards
2. Edit front/back of 2 flashcards
3. Accept 4 flashcards
4. Delete 1 flashcard

**Expected Results**:
- Edited flashcards retain "draft" status until accepted
- Accepted flashcards status changes to "new"
- Accepted flashcards get default FSRS values
- Deleted flashcard removed from database
- Remaining drafts stay in "draft" status

**Priority**: High

---

## 5. Test Environment

### 5.1 Development Environment
- **Purpose**: Developer testing during feature implementation
- **Database**: Supabase local instance (Docker)
- **Configuration**:
  - `SUPABASE_URL`: http://localhost:54321
  - `SUPABASE_ANON_KEY`: Local development key
  - `OPENROUTER_API_KEY`: Test API key with low rate limits
- **Test Data**: Seeded with sample users, decks, flashcards

### 5.2 Testing/Staging Environment
- **Purpose**: Pre-production integration and E2E testing
- **Database**: Supabase staging project
- **Configuration**:
  - `SUPABASE_URL`: Staging project URL
  - `SUPABASE_ANON_KEY`: Staging anon key
  - `OPENROUTER_API_KEY`: Production API key with limits
- **Test Data**: Realistic data volumes (100 users, 500 decks, 5000 flashcards)
- **Deployment**: Continuous deployment from `develop` branch

### 5.3 Production Environment
- **Purpose**: Production monitoring and smoke testing
- **Database**: Supabase production project
- **Configuration**: Production secrets from GitHub Secrets
- **Monitoring**: Error tracking, performance monitoring
- **Testing**: Smoke tests only, no load testing

### 5.4 Local Test Environment Setup

#### Prerequisites
```bash
# Node.js version
node -v  # v22.14.0

# Install dependencies
npm install

# Start Supabase locally
npx supabase start

# Run database migrations
npx supabase db push
```

#### Environment Variables
```env
# .env.local
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=<local_anon_key>
OPENROUTER_API_KEY=<test_api_key>
NODE_ENV=test
```

#### Test Database Reset
```bash
# Reset database to clean state
npx supabase db reset

# Seed test data
npm run seed:test
```

---

## 6. Testing Tools

### 6.1 Unit Testing
| Tool | Purpose | Version |
|------|---------|---------|
| Vitest | Unit test runner | Latest |
| @testing-library/react | React component testing | Latest |
| MSW (Mock Service Worker) | API mocking | Latest |

### 6.2 Integration Testing
| Tool | Purpose | Version |
|------|---------|---------|
| Playwright | E2E and API testing | Latest |
| Vitest | API endpoint testing | Latest |
| @supabase/supabase-js | Database client | 2.75.1+ |

### 6.3 E2E Testing
| Tool | Purpose | Version |
|------|---------|---------|
| Playwright | Browser automation | Latest |
| Playwright Test | Test runner | Latest |

### 6.4 Performance Testing
| Tool | Purpose | Version |
|------|---------|---------|
| k6 | Load testing | Latest |
| Lighthouse CI | Performance auditing | Latest |
| Chrome DevTools | Performance profiling | - |

### 6.5 Security Testing
| Tool | Purpose | Version |
|------|---------|---------|
| npm audit | Dependency vulnerability scanning | Built-in |
| OWASP ZAP | Security scanning | Latest |
| ESLint Security Plugin | Code security linting | Latest |

### 6.6 Accessibility Testing
| Tool | Purpose | Version |
|------|---------|---------|
| axe DevTools | Automated accessibility testing | Latest |
| Lighthouse | Accessibility audit | Latest |
| NVDA/JAWS | Screen reader testing | Latest |

### 6.7 Code Quality
| Tool | Purpose | Version |
|------|---------|---------|
| ESLint | Code linting | 9.23.0 |
| TypeScript | Static type checking | 5.x |
| Prettier | Code formatting | Latest |
| Husky + lint-staged | Pre-commit hooks | Latest |

---

## 7. Testing Schedule

### 7.1 Sprint-Based Testing (2-week sprints)

#### Week 1: Development & Unit Testing
- **Days 1-3**: Feature development
  - Developers write unit tests alongside code
  - Minimum 80% coverage for new code
- **Days 4-5**: Integration testing
  - API endpoint testing
  - Database integration verification
  - Component integration tests

#### Week 2: System Testing & Quality Assurance
- **Days 6-7**: E2E testing
  - Critical user flows
  - Cross-browser testing
- **Day 8**: Performance testing
  - Load testing
  - Lighthouse audits
  - Database query optimization
- **Day 9**: Security & Accessibility testing
  - Security scan
  - Accessibility audit
  - Dependency updates
- **Day 10**: Bug fixing & regression testing
  - Fix identified issues
  - Re-run failed tests
  - Smoke test entire application

### 7.2 Continuous Integration

#### On Every Push
- Lint checks (ESLint)
- Type checks (TypeScript)
- Unit tests
- Build verification

#### On Pull Request
- All CI checks
- Integration tests
- Code coverage report
- Lighthouse performance audit

#### On Merge to Main
- Full E2E test suite
- Deployment to staging
- Smoke tests on staging
- Security scan

### 7.3 Release Testing

#### Pre-Release (1-2 days before)
- Complete regression testing
- Performance testing under load
- Security audit
- Accessibility verification
- Database migration testing

#### Release Day
- Smoke tests in production
- Monitor error rates
- Performance monitoring
- User acceptance testing with stakeholders

#### Post-Release (1 week after)
- Monitor production metrics
- User feedback collection
- Bug triage and prioritization

---

## 8. Test Acceptance Criteria

### 8.1 Unit Tests
- ✅ Minimum 90% code coverage for services
- ✅ Minimum 80% code coverage for utilities
- ✅ All edge cases documented and tested
- ✅ No flaky tests (tests pass consistently)
- ✅ Test execution time < 10 seconds

### 8.2 Integration Tests
- ✅ All API endpoints return correct status codes
- ✅ Request/response schemas validated with Zod
- ✅ Database constraints enforced (RLS, foreign keys)
- ✅ Error handling verified for all endpoints
- ✅ Transaction rollback on failures

### 8.3 E2E Tests
- ✅ All critical user flows complete successfully
- ✅ Cross-browser compatibility verified (Chrome, Firefox, Safari)
- ✅ Responsive design works on mobile, tablet, desktop
- ✅ No console errors on any page
- ✅ Navigation and routing work correctly

### 8.4 Performance
- ✅ Page load time < 2 seconds (95th percentile)
- ✅ API response time < 500ms (95th percentile)
- ✅ AI generation completes < 30 seconds
- ✅ Lighthouse Performance score ≥ 90
- ✅ Database queries optimized (< 100ms for simple queries)

### 8.5 Security
- ✅ Zero critical vulnerabilities in dependencies
- ✅ No high-severity vulnerabilities in code
- ✅ RLS policies prevent unauthorized data access
- ✅ Input validation prevents injection attacks
- ✅ Authentication tokens expire appropriately
- ✅ API keys stored securely (not in code)

### 8.6 Accessibility
- ✅ WCAG 2.1 Level AA compliance
- ✅ Lighthouse Accessibility score ≥ 90
- ✅ All interactive elements keyboard accessible
- ✅ Screen reader announces all content correctly
- ✅ Color contrast ratios meet standards
- ✅ Forms have proper labels and error messages

### 8.7 Code Quality
- ✅ No ESLint errors
- ✅ No TypeScript errors
- ✅ Code formatted with Prettier
- ✅ No unused imports or variables
- ✅ All functions have TSDoc comments

---

## 9. Roles and Responsibilities

### 9.1 Development Team

#### Frontend Developer
**Responsibilities**:
- Write unit tests for React components
- Implement accessibility features
- Fix UI/UX bugs
- Ensure responsive design works across viewports
- Write component documentation

**Testing Activities**:
- Component unit testing
- Manual cross-browser testing
- Accessibility testing with screen readers

#### Backend Developer
**Responsibilities**:
- Write unit tests for services and utilities
- Implement API endpoints with validation
- Optimize database queries
- Handle error cases properly
- Write API documentation

**Testing Activities**:
- Service unit testing
- API integration testing
- Database migration testing
- Performance profiling

#### Full-Stack Developer
**Responsibilities**:
- Implement end-to-end features
- Write E2E tests for user flows
- Integrate frontend and backend
- Fix integration bugs
- Maintain test infrastructure

**Testing Activities**:
- E2E test development
- Integration testing
- Manual feature testing
- Bug reproduction and fixing

### 9.2 QA Engineer

**Responsibilities**:
- Develop test plans and test cases
- Execute manual test cases
- Automate E2E tests with Playwright
- Report bugs with reproduction steps
- Verify bug fixes
- Maintain test documentation
- Coordinate testing activities

**Testing Activities**:
- Exploratory testing
- Regression testing
- Test automation
- Performance testing coordination
- Accessibility testing

### 9.3 DevOps Engineer

**Responsibilities**:
- Set up CI/CD pipelines
- Configure test environments
- Monitor production metrics
- Automate deployment processes
- Manage infrastructure

**Testing Activities**:
- CI/CD pipeline testing
- Infrastructure testing
- Load testing coordination
- Performance monitoring

### 9.4 Product Owner

**Responsibilities**:
- Define acceptance criteria
- Prioritize bugs and features
- Conduct user acceptance testing
- Approve releases
- Gather user feedback

**Testing Activities**:
- UAT execution
- Acceptance criteria verification
- Stakeholder demo testing

### 9.5 RACI Matrix

| Activity | Frontend Dev | Backend Dev | Full-Stack Dev | QA Engineer | DevOps | Product Owner |
|----------|-------------|-------------|----------------|-------------|--------|---------------|
| Unit Tests | R | R | R | C | I | I |
| Integration Tests | C | R | R | A | C | I |
| E2E Tests | C | C | R | A | I | C |
| Performance Tests | I | C | C | R | A | I |
| Security Tests | I | C | C | R | A | I |
| Accessibility Tests | R | I | C | A | I | C |
| Bug Reporting | I | I | I | R | I | A |
| Test Plan | C | C | C | R | C | A |
| UAT | I | I | I | C | I | R |

**Legend**: R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 10. Bug Reporting Procedures

### 10.1 Bug Severity Levels

#### Critical (P0)
- **Definition**: Complete system failure, data loss, security breach
- **Examples**:
  - Application crashes on load
  - User data exposed to unauthorized users
  - Payment processing fails
  - Database corruption
- **Response Time**: Immediate (within 1 hour)
- **Resolution Time**: Same day

#### High (P1)
- **Definition**: Major feature broken, significant user impact
- **Examples**:
  - AI generation fails completely
  - Unable to create/edit flashcards
  - Study sessions don't save progress
  - Authentication fails intermittently
- **Response Time**: Within 4 hours
- **Resolution Time**: Within 2 business days

#### Medium (P2)
- **Definition**: Feature partially broken, workaround exists
- **Examples**:
  - Pagination doesn't work
  - Sorting incorrect
  - UI elements misaligned
  - Error messages unclear
- **Response Time**: Within 1 business day
- **Resolution Time**: Within 1 week

#### Low (P3)
- **Definition**: Minor issue, cosmetic problem, enhancement
- **Examples**:
  - Typos in text
  - Button styling inconsistent
  - Tooltip positioning off
  - Console warnings
- **Response Time**: Within 3 business days
- **Resolution Time**: Next sprint or as time permits

### 10.2 Bug Report Template

```markdown
## Bug Report

### Summary
[One-line description of the issue]

### Environment
- **Browser**: [Chrome 120, Firefox 122, etc.]
- **OS**: [Windows 11, macOS 14, Ubuntu 22.04]
- **Device**: [Desktop, Mobile, Tablet]
- **Screen Resolution**: [1920x1080, etc.]
- **User Role**: [Authenticated User, Guest, etc.]

### Severity
[Critical / High / Medium / Low]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]
...

### Expected Result
[What should happen]

### Actual Result
[What actually happens]

### Screenshots/Videos
[Attach visual evidence]

### Console Errors
```
[Paste any console errors or network errors]
```

### Additional Context
- **Reproducibility**: [Always / Sometimes / Once]
- **Workaround**: [If any workaround exists]
- **Related Issues**: [Link to similar issues]

### Affected User Stories
[Link to user stories or features affected]
```

### 10.3 Bug Workflow

```
Bug Discovered → Create Bug Report → Severity Assessment
                                          ↓
                            ┌─────────────┴──────────────┐
                            ↓                             ↓
                    P0 Critical                       P1-P3
                            ↓                             ↓
                  Immediate Notification            Add to Backlog
                            ↓                             ↓
                            └─────────────┬──────────────┘
                                          ↓
                            Assign to Developer → Investigate
                                          ↓
                            Can Reproduce? → Yes → Develop Fix
                                ↓ No
                         Request More Info
                                ↓
                         Create Pull Request → Code Review
                                          ↓
                            Approved? → Yes → Merge → QA Verification
                                ↓ No
                         Back to Development
                                          ↓
                            Bug Fixed? → Yes → Close Bug → Update Documentation
                                ↓ No
                         Back to Development
```

### 10.4 Bug Tracking Tool

**Recommended**: GitHub Issues

**Workflow**:
1. **Open**: Bug reported and triaged
2. **In Progress**: Developer assigned and working on fix
3. **PR Open**: Pull request created
4. **In Review**: Code review in progress
5. **Testing**: QA verifying fix in staging
6. **Closed**: Bug verified as fixed

**Labels**:
- `bug` - Bug issue type
- `critical`, `high`, `medium`, `low` - Severity
- `frontend`, `backend`, `database`, `ai` - Component
- `accessibility`, `performance`, `security` - Special categories
- `needs-reproduction` - Unable to reproduce
- `wontfix` - Not fixing (with justification)

### 10.5 Bug Metrics

**Key Metrics to Track**:
1. **Bug Discovery Rate**: Bugs found per week
2. **Bug Resolution Rate**: Bugs fixed per week
3. **Mean Time to Resolution (MTTR)**: Average time to fix bugs
4. **Bug Reopening Rate**: % of bugs reopened after initial fix
5. **Bug Escape Rate**: Bugs found in production vs staging
6. **Bug Backlog**: Total open bugs

**Targets**:
- MTTR for Critical bugs: < 24 hours
- MTTR for High bugs: < 48 hours
- Bug reopening rate: < 10%
- Bug escape rate: < 5%

---

## 11. Test Data Management

### 11.1 Test Data Requirements

#### User Accounts
- **Admin User**: Full permissions for system administration
- **Standard User**: Regular user with typical usage patterns
- **Power User**: User with maximum allowed data (50+ decks, 1000+ flashcards)
- **New User**: Fresh account with no data
- **Suspended User**: Account with restrictions

#### Decks
- **Empty Deck**: Deck with 0 flashcards
- **Small Deck**: 5-10 flashcards
- **Medium Deck**: 50-100 flashcards
- **Large Deck**: 500+ flashcards
- **Mixed Status Deck**: Contains draft, new, and finalized flashcards

#### Flashcards
- **Various Statuses**: draft, new, finalized
- **Various Sources**: manual, ai
- **Edge Cases**: 
  - Maximum length front/back
  - Special characters (Unicode, emoji)
  - HTML/script injection attempts
- **FSRS States**:
  - Brand new (interval = 0, ease_factor = 2.5)
  - In learning (interval = 1-7 days)
  - Mature (interval > 21 days)
  - Lapsed (overdue by > 7 days)

#### AI Generation
- **Sample Texts**: Various domains (science, history, literature)
- **Edge Cases**:
  - Minimum length text (exactly 1000 characters)
  - Maximum length text (exactly 10,000 characters)
  - Text with special formatting
  - Non-English text (for future i18n testing)

### 11.2 Test Data Seeding

#### Seed Script Structure
```typescript
// seed-test-data.ts
async function seedTestData() {
  // 1. Create test users
  const users = await createTestUsers();
  
  // 2. Create decks for each user
  const decks = await createTestDecks(users);
  
  // 3. Create flashcards in various states
  const flashcards = await createTestFlashcards(decks);
  
  // 4. Create historical study sessions
  await createTestStudySessions(users, decks, flashcards);
  
  // 5. Create AI generation logs
  await createTestAILogs(users);
}
```

#### Database Snapshot
- Create clean database snapshot after seeding
- Reset to snapshot before each test suite
- Provides consistent starting state

### 11.3 Data Privacy & Compliance

- **No Production Data in Testing**: Never use real user data in test environments
- **Data Anonymization**: If copying production patterns, anonymize all PII
- **GDPR Compliance**: Test data deletion and export features
- **Data Retention**: Automatically delete test data after 30 days in staging

---

## 12. Risk Assessment and Mitigation

### 12.1 High-Risk Areas

#### Risk 1: AI Service Dependency
**Description**: OpenRouter.ai service unavailability or rate limiting  
**Impact**: Users cannot generate flashcards, core feature blocked  
**Likelihood**: Medium  
**Mitigation Strategies**:
- Implement circuit breaker pattern
- Queue failed requests for retry
- Display clear error messages with alternatives
- Test with mock AI service in CI/CD
- Monitor API health and response times
- Implement fallback to cached/sample responses in development

**Testing Approach**:
- Simulate API timeouts and failures
- Test rate limit handling
- Verify error recovery mechanisms

#### Risk 2: Database Row Level Security (RLS) Bypass
**Description**: Misconfigured RLS policies allow cross-user data access  
**Impact**: Critical security breach, data privacy violation  
**Likelihood**: Low (but high impact)  
**Mitigation Strategies**:
- Comprehensive RLS policy testing
- Automated security scans
- Code review for all database queries
- Penetration testing before production release

**Testing Approach**:
- Attempt to access other users' data via API
- Test RLS policies with multiple user sessions
- Verify cascade deletions respect ownership
- SQL injection testing on all inputs

#### Risk 3: FSRS Algorithm Errors
**Description**: Incorrect spaced repetition calculations  
**Impact**: Poor learning outcomes, user frustration  
**Likelihood**: Medium  
**Mitigation Strategies**:
- Extensive unit testing of FSRS logic
- Verification against reference implementation
- Gradual rollout with monitoring
- User feedback collection

**Testing Approach**:
- Unit tests for all grade scenarios
- Property-based testing for algorithm invariants
- Compare results with Anki/SuperMemo algorithms
- Long-term testing with real usage patterns

#### Risk 4: Performance Degradation
**Description**: Slow queries with large datasets, memory leaks  
**Impact**: Poor user experience, potential service outages  
**Likelihood**: Medium  
**Mitigation Strategies**:
- Database query optimization with indexes
- Pagination for all list endpoints
- Performance monitoring in production
- Load testing before major releases

**Testing Approach**:
- Load testing with 1000+ concurrent users
- Database query profiling with EXPLAIN
- Frontend performance audits with Lighthouse
- Memory leak detection with Chrome DevTools

### 12.2 Medium-Risk Areas

#### Risk 5: Browser Compatibility Issues
**Description**: Features break in older browsers or specific configurations  
**Impact**: Users unable to access application  
**Likelihood**: Medium  
**Testing Approach**:
- Cross-browser E2E testing with Playwright
- Manual testing on Safari (known edge cases)
- Polyfill verification for modern JavaScript features

#### Risk 6: Authentication Session Management
**Description**: Sessions expire unexpectedly, tokens not refreshed  
**Impact**: User logged out mid-session, data loss  
**Likelihood**: Medium  
**Testing Approach**:
- Test token refresh logic
- Verify session persistence across page reloads
- Test concurrent session handling

### 12.3 Low-Risk Areas

#### Risk 7: UI/UX Inconsistencies
**Description**: Visual bugs, layout issues on specific viewports  
**Impact**: Poor user experience, accessibility issues  
**Likelihood**: High (but low severity)  
**Testing Approach**:
- Visual regression testing
- Responsive design testing
- Accessibility audits

---

## 13. Continuous Improvement

### 13.1 Test Metrics Dashboard

**Key Metrics**:
- Test coverage percentage
- Test execution time
- Test pass/fail rate
- Bug detection rate
- Flaky test count
- Performance regression alerts

**Tools**: GitHub Actions dashboard, Codecov, custom dashboards

### 13.2 Test Retrospectives

**Frequency**: After each sprint and major release  
**Participants**: Development team, QA, Product Owner  
**Discussion Points**:
- Tests that caught critical bugs
- Tests that were flaky or slow
- Gaps in test coverage
- Process improvements

### 13.3 Test Automation Roadmap

**Phase 1 (Current Sprint)**: 
- Unit tests for all services
- API integration tests

**Phase 2 (Next 2 Sprints)**:
- E2E tests for critical flows
- CI/CD pipeline integration

**Phase 3 (Q1 2026)**:
- Visual regression testing
- Performance testing automation
- Security scanning automation

**Phase 4 (Q2 2026)**:
- AI-powered test generation
- Chaos engineering experiments
- Production monitoring and alerting

---

## 14. Appendices

### Appendix A: Test Case Repository Structure
```
/tests
  /unit
    /services
      ai-generation.service.test.ts
      openrouter.client.test.ts
    /lib
      utils.test.ts
  /integration
    /api
      auth.test.ts
      decks.test.ts
      flashcards.test.ts
      ai-generation.test.ts
      study-sessions.test.ts
  /e2e
    /flows
      user-onboarding.spec.ts
      ai-generation.spec.ts
      study-session.spec.ts
      deck-management.spec.ts
    /pages
      login.spec.ts
      dashboard.spec.ts
  /performance
    load-tests/
      k6-scenarios.js
  /accessibility
    a11y-audit.spec.ts
```

### Appendix B: Required Test Environment Variables
```env
# Database
PUBLIC_SUPABASE_URL=<supabase_url>
PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>

# AI Service
OPENROUTER_API_KEY=<openrouter_api_key>

# Test Configuration
NODE_ENV=test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# CI/CD
CI=true
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

### Appendix C: Test Glossary

- **Unit Test**: Tests individual functions or methods in isolation
- **Integration Test**: Tests interaction between components or services
- **E2E Test**: Tests complete user flows from start to finish
- **Smoke Test**: Basic tests to verify critical functionality after deployment
- **Regression Test**: Re-running tests to ensure new changes haven't broken existing features
- **Flaky Test**: Test that sometimes passes and sometimes fails without code changes
- **Mock**: Simulated object that mimics real object behavior for testing
- **Stub**: Simplified implementation of a component used in testing
- **Test Coverage**: Percentage of code executed by tests
- **FSRS**: Free Spaced Repetition Scheduler - algorithm for optimal review timing
- **RLS**: Row Level Security - database security feature in PostgreSQL/Supabase

### Appendix D: References and Resources

1. **Testing Best Practices**:
   - [Playwright Documentation](https://playwright.dev/)
   - [Vitest Guide](https://vitest.dev/)
   - [Testing Library](https://testing-library.com/)

2. **Accessibility Standards**:
   - [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
   - [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

3. **Security Testing**:
   - [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
   - [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

4. **Performance Testing**:
   - [Web Vitals](https://web.dev/vitals/)
   - [k6 Documentation](https://k6.io/docs/)

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | QA Team | Initial test plan created |

---

**Document Status**: Draft - Pending Approval  
**Last Updated**: November 25, 2025
