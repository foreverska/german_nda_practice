# DeutschDive

An intelligent, interactive German learning application built with Next.js (App Router), Zustand, and Tailwind CSS. The app features two robust practice loops: an **AI-powered Grammar Sentences Mode** and a **Gamified Nouns Spaced Repetition Game**. It runs entirely in the browser, providing a highly responsive, offline-first learning experience.

## Practice Modes

### 1. Gamified Nouns Mode (Spaced Repetition)
A lightning-fast, keyboard-accessible flashcard game designed to teach the Goethe Institute A1 Noun Wordlist through pure visual association, completely bypassing the "English translation" crutch.
- **Pure Visual Association**: Words are mapped to highly specific, disambiguated emojis (e.g., *der Sohn* is 👨‍👦⬅️, *der Großvater* is 👴🕰️).
- **3-Phase Mastery**:
  - *Phase 1 (Introduction)*: 4-square multiple choice based on the emoji.
  - *Phase 2 (Gender)*: Select the correct article (*der/die/das*).
  - *Phase 3 (Recall)*: Pure typing recall.
- **The Demotion Cascade**: An aggressive Spaced Repetition review engine. The game randomly tests previously mastered nouns. Failing a review completely wipes its mastery score, zero-outs 2 random nouns in its original tier, and demotes 1 noun from every tier in between.
- **Speedrunning Tools**: Fully keyboard accessible (`1,2,3,4` / `Q,W,E,R` mapping), `Enter` to advance, and an integrated session stopwatch with a streak tracker.
- **Typing Forgiveness**: Built-in German normalization (accepts `ae`, `oe`, `ue`, `ss` or missing umlauts gracefully).

### 2. Grammar Sentences Mode
A contextual grammar engine testing declension, gender, verb conjugation, and prepositions with smart AI-generated hints and distractors.
- **Fill-in-the-Blanks**: Learn grammar within the context of full sentences. 
- **Client-Side Semantic Judge**: Uses `@xenova/transformers` (Transformers.js) running in an isolated Web Worker to download a 22MB `Xenova/all-MiniLM-L6-v2` embedding model directly into the browser cache. Validates free-form English translations by computing Cosine Similarity (threshold > 0.85) against the target meaning, naturally supporting synonyms and phrasing flourishes without any API calls or server costs.
- **Deep Dives**: AI-generated conceptual multiple-choice questions focusing on the "Why" behind the grammar rules (e.g. why a two-way preposition triggers the dative case here).
- **Adaptive Engine**: Tracks correct/missed grammatical concepts and dynamically fetches new sentences targeting the user's weakest concepts.

## Tech Stack & Architecture

- **Framework**: Next.js 14+ (App Router, Turbopack)
- **State Management**: Zustand (Persistent local storage)
- **Styling**: Tailwind CSS v4, `lucide-react` icons, accessible Dark/Light mode via `next-themes`.
- **Machine Learning**: `Transformers.js` (In-browser Semantic Embeddings)

## Running Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Deployment

This app is fully serverless and runs 100% in the browser (no backend API keys required). 
To deploy:
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. **No environment variables are required** for the production deployment.
4. Click **Deploy**.

## Data Generation Scripts

The `scripts/` directory contains tools for scraping and filtering the raw German Tatoeba dataset, evaluating vocabulary complexity, and generating the JSON database via the OpenAI API.
- You will need an `OPENAI_API_KEY` inside `.env.local` *only* if you wish to run `npm run process-tatoeba` locally to generate new AI-annotated sentences.
