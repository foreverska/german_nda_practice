# DeutschDive (Next.js)

An intelligent, interactive German grammar flashcard application built with Next.js (App Router), Zustand, and Tailwind CSS. The app uses a multi-phase learning loop and a 100% client-side Semantic Embedding Judge to intelligently evaluate English translations, providing a robust offline-first learning experience.

## Features

- **Multi-Phase Learning Loop:**
  - **Phase 1 (Blanks):** Contextual grammar blanks testing declension, gender, verb conjugation, and preposition rules with smart AI-generated hints and distractors.
  - **Phase 1.5 (Semantic Translation):** Requires the user to demonstrate complete understanding of the sentence meaning either via a drag-and-drop Word Bank or free-form English typing.
  - **Phase 2 (Deep Dives):** AI-generated conceptual multiple-choice questions focusing on the "Why" behind the grammar rules (e.g. why a two-way preposition triggers the dative case here).

- **Client-Side Semantic Judge:**
  - Uses `@xenova/transformers` (Transformers.js) running in an isolated Web Worker.
  - Downloads a 22MB `Xenova/all-MiniLM-L6-v2` embedding model directly into the browser cache.
  - Validates free-form English translations by computing Cosine Similarity (threshold > 0.85) against the target meaning, naturally supporting synonyms and phrasing flourishes without any API calls or server costs.

- **Adaptive Engine:**
  - Built with Zustand for global state management.
  - Tracks correct/missed grammatical concepts and dynamically fetches new sentences targeting the user's weakest concepts.

- **Offline Dataset Generation:**
  - Processes open-source Tatoeba sentence pairs (`scripts/processTatoeba.ts`) via the OpenAI API locally to build the `data/tatoeba_sentences.json` database.

- **Theming:**
  - Fully responsive and accessible Dark/Light mode leveraging `next-themes` and Tailwind v4.

## Running Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (uses Turbopack by default):
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Deployment

This app is fully serverless and runs 100% in the browser (no backend API keys required). 
To deploy:
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. No environment variables are required for the production deployment.
4. Click **Deploy**.

## Data Generation Scripts

The `scripts/` directory contains tools for scraping and filtering the raw German Tatoeba dataset, evaluating vocabulary complexity, and generating the JSON database. 
- You will need an `OPENAI_API_KEY` inside `.env.local` *only* if you wish to run `npm run process-tatoeba` locally to generate new AI-annotated sentences.
