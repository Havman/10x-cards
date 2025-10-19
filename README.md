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
  - Astro 5
  - React 19 for interactive components
  - TypeScript 5 for static typing
  - Tailwind CSS 4 for styling
  - Shadcn/ui for accessible UI components
- **Backend:**
  - Supabase for PostgreSQL database and user authentication
- **AI Integration:**
  - Openrouter.ai service to interact with multiple AI models
- **Other Tools:**
  - Node.js (v22.14.0 as specified in .nvmrc)
  - Various npm packages for linting, formatting, and development

## Getting Started Locally

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd 10x-cards
   ```
2. **Set Node Version:**
   Use [nvm](https://github.com/nvm-sh/nvm) to select the correct Node version:
   ```bash
   nvm use
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
5. **Build and Preview:**
   - To build the project: `npm run build`
   - To preview the production build: `npm run preview`

## Available Scripts

- **dev:** Starts the Astro development server.
- **build:** Builds the project for production.
- **preview:** Previews the production build.
- **lint:** Runs ESLint to check for code quality issues.
- **lint:fix:** Fixes linting errors automatically.
- **format:** Formats the project files using Prettier.

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
