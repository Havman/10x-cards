# 10x-cards

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x-cards is an AI Flashcard Generator that transforms raw text—such as lecture notes and articles—into digital flashcards. Leveraging AI technology, the application significantly reduces the manual effort needed to create flashcards, enabling efficient study sessions based on spaced repetition. Users can create and manage decks, generate flashcards using AI, and study with the integrated FSRS algorithm.

## Tech Stack

- **Frontend:**
  - Astro 5.13+
  - React 19 for interactive components
  - TypeScript 5 for static typing
  - Tailwind CSS 4.1+ for styling
  - Shadcn/ui for accessible UI components
- **Backend:**
  - Supabase for PostgreSQL database and user authentication
- **AI Integration:**
  - Openrouter.ai service to interact with multiple AI models
  - Daily limit: 50 AI-generated flashcards per user
- **Other Tools:**
  - Node.js (v22.14.0 as specified in .nvmrc)
  - Various npm packages for linting, formatting, and development

## Getting Started Locally

### Prerequisites
- Node.js v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- Docker and Docker Compose (for local Supabase instance)
- npm or yarn package manager

### Environment Setup
1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd 10x-cards
   ```
2. **Set Node Version:**
   ```bash
   nvm use
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and keys
   - Add your Openrouter.ai API key
   
5. **Start Local Supabase (Docker):**
   ```bash
   npx supabase start
   ```
   This will start a local Supabase instance with PostgreSQL database.

6. **Run Database Migrations:**
   ```bash
   npx supabase db reset
   ```

7. **Run the Development Server:**
   ```bash
   npm run dev
   ```

8. **Build and Preview:**
   - To build the project: `npm run build`
   - To preview the production build: `npm run preview`

## Available Scripts

- **dev:** Starts the Astro development server.
- **build:** Builds the project for production.
- **preview:** Previews the production build.
- **lint:** Runs ESLint to check for code quality issues.
- **lint:fix:** Fixes linting errors automatically.
- **format:** Formats the project files using Prettier.

### Testing Scripts
- **test:** Run all tests (unit + E2E)
- **test:unit:** Run unit tests with Vitest
- **test:unit:ui:** Run unit tests with Vitest UI
- **test:e2e:** Run E2E tests (smoke + basic tests only)
- **test:e2e:all:** Run all E2E tests including AI generation tests
- **test:e2e:ai:** Run AI generation E2E tests only
- **test:coverage:** Generate unit test coverage reports

## Testing

The project includes comprehensive testing to ensure reliability, security, and performance. For detailed setup and execution instructions, see [TESTING_SETUP.md](./TESTING_SETUP.md).

### Unit Testing ✅ Implemented
- **Framework:** Vitest with @testing-library/react for React components
- **Status:** 2/2 tests passing
- **Coverage:** AI generation service, validation schemas
- **Mocking:** Mock Service Worker (MSW) for API calls and Supabase client mocking
- **Run:** `npm run test:unit`

### End-to-End (E2E) Testing ✅ Implemented
- **Framework:** Playwright
- **Status:** 17/17 tests passing (smoke + basic tests)
- **Browser:** Firefox (WSL2 compatible)
- **Pattern:** Page Object Model (POM) for maintainability
- **Test Suites:**
  - **Smoke Tests** (3 tests): Core application functionality
  - **Basic Tests** (14 tests): Public pages, forms, navigation, responsive design
  - **AI Generation Tests** (ready): Requires authentication setup
- **Run:** `npm run test:e2e` (smoke + basic only) or `npm run test:e2e:all`

### Test Infrastructure
- **Data Test IDs:** Comprehensive `data-test-id` attributes across components
- **Page Objects:** Reusable page object classes for form interactions
- **Environment:** WSL2 compatible with Firefox browser
- **CI/CD Ready:** Optimized for automated testing pipelines

### Planned Testing
- **Integration Tests:** API endpoints with real database interactions
- **Performance Tests:** Load testing with k6, Lighthouse CI audits
- **Security Tests:** OWASP ZAP scanning, npm audit, dependency vulnerability checks
- **Accessibility Tests:** WCAG 2.1 Level AA compliance with axe DevTools and screen readers

## Project Scope

The project is designed as an MVP for an AI Flashcard Generator with the following features:

- **User Authentication:** Account creation, login, and password reset.
- **Deck Management:** Create, view, rename, and delete decks.
- **Flashcard Management:**
  - Manually create and edit flashcards.
  - Generate flashcards from pasted raw text through AI, with a review and draft management process.
- **Studying:** Initiate study sessions using the FSRS spaced repetition algorithm.
- **System & Database:** Uses a PostgreSQL database via Supabase with Docker support for data persistence.

## Project Status

This project is in its MVP stage. Future enhancements may include:

- Enhanced spaced repetition algorithms.
- Advanced import capabilities and file format support.
- Mobile application support and extended sharing features.

## License

This project is licensed under the [MIT License](LICENSE).
