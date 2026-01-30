# Contributing to SaansSync

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Development Workflow

1.  **Fork the repo** and create your branch from `main`.
2.  **Clone the project** to your local machine.
3.  **Install dependencies**:
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```
4.  **Set up environment variables**:
    *   Backend: Copy `.env.example` to `.env` (or create one based on README).
    *   Frontend: Copy `.env.local.example` to `.env.local`.

## Running Locally

We support **Docker** for a consistent environment:

```bash
docker-compose up --build
```

Or run manually:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Testing

We use **Vitest** for the backend.

```bash
cd backend
npm test
```

Please ensure all tests pass before submitting a PR.

## Code Style

*   **Frontend:** We use ESLint and standard Next.js conventions.
*   **Backend:** We use TypeScript.
*   **Commits:** Please use semantic commit messages (e.g., `feat: add new API`, `fix: resolve login bug`).

## Pull Requests

1.  Push to your fork.
2.  Open a Pull Request.
3.  Describe your changes clearly.
4.  Ensure CI passes.

Thank you for contributing!
