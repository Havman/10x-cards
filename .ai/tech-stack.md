Frontend - Astro with React for interactive components:

- Astro 5.13+ allows creating fast, efficient websites and applications with minimal JavaScript
- React 19 provides interactivity where needed
- TypeScript 5 offers static typing and improved IDE support
- Tailwind CSS 4.1+ enables easy styling of applications
- Shadcn/ui supplies a library of accessible React components as the foundation for our UI
- Zod 3.25+ for schema validation and type safety

Backend - Supabase as a comprehensive backend solution:

- Provides a PostgreSQL database
- Offers SDKs in multiple languages, serving as a Backend-as-a-Service
- It is an open source solution that can be hosted locally or on your own server
- Comes with built-in user authentication

AI - Communication with models via Openrouter.ai service:

- Grants access to a wide range of models (OpenAI, Anthropic, Google, and many others) that help us achieve high efficiency and low costs
- Allows setting financial limits on API keys
- Daily usage limit: 50 AI-generated flashcards per user

CI/CD and Hosting:

- Github Actions for creating CI/CD pipelines
- DigitalOcean for hosting applications using a Docker image

Testing:

- **Unit Testing:**
  - Vitest as the test runner optimized for Vite/Astro projects
  - @testing-library/react for React component testing
  - MSW (Mock Service Worker) for API mocking
  - Coverage targets: 90% for services, 80% for utilities
  
- **End-to-End Testing:**
  - Playwright for browser automation and E2E testing
  - Cross-browser testing (Chromium, Firefox, WebKit)
  - Responsive design testing across desktop, tablet, and mobile viewports
  - Network condition testing (Fast 3G, Slow 3G, Offline)
  
- **Integration Testing:**
  - Playwright for E2E testing with API route validation
  - Vitest for unit testing API endpoints
  - Supabase local instance (Docker) for database integration tests
  - Transaction integrity and Row Level Security (RLS) verification
  
- **Performance Testing:**
  - k6 for load testing and concurrent user scenarios
  - Lighthouse CI for performance auditing and monitoring
  - Chrome DevTools for performance profiling
  
- **Security Testing:**
  - npm audit for dependency vulnerability scanning
  - OWASP ZAP for automated security scanning
  - Manual authorization testing for Row Level Security policies
  
- **Accessibility Testing:**
  - axe DevTools for automated accessibility testing
  - NVDA/JAWS screen readers for manual testing
  - WCAG 2.1 Level AA compliance verification
