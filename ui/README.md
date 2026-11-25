# ⚡ AMPEL UI

**AMPEL UI** is the frontend for the AMPEL system, built with [Remix](https://remix.run/), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [Tailwind CSS](https://tailwindcss.com/). It combines modern SSR capabilities with a modular and performant UI architecture, optimized for developer productivity and fast rendering.

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Add .env

create a .env File with the required EnvVars:

- BASE_API_URL=http://backend

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

You can start editing the pages found in `app/**`. The pages auto-updates as you edit the files.

### 🔁 Routing

Routing is handled by React Router v7.

The central route configuration lives in:
app/routes.ts

For Vite-specific configuration such as module aliasing or SSR behavior, see:

vite.config.js

### 🗂️ Project Structure (excerpt)

```bash
ampel-ui/
├── app/
│   ├── pages/                    # For pages structured in subfolders, like the alerts page
│   │   └── alerts/               # Alert-spezifische Seiten & Komponenten
│   │       ├── components/       # Alert-Komponenten (UI, Logic)
│   │       ├── PatientAlertsPage.tsx # Alerts page for patient alerts
│   │       ├── PatientAlertsPageController.tsx # The Alerts controller for loading patient alerts
│   │       ├── types/            # Type definitions an api to ui mapper for alerts
│   │       └── AmpelResultRepository.tsx
│   ├── routes/                   # File-based routing utilities
│   │   └── root-redirect.tsx     # Redirects and similar logic
│   └── tests/                    # For Testing
├── public/                       # Static assets
├── styles/                       # Tailwind & global CSS
├── vite.config.js                # Vite config including aliasing and SSR support
├── tailwind.config.js            # Tailwind CSS configuration
├── eslint.config.js              # ESLint configuration
├── postcss.config.mjs            # Tailwind/PostCSS setup
├── .prettierrc                   # Prettier configuration
└── tsconfig.json                 # TypeScript configuration
```

### 🧪 Linting

```bash
npm run lint
```

This uses .gitignore as ignore path to skip common development artifacts.

### ⚙️ Build & Production

Create a production build

```bash
npm run build
```

Start the production server

```bash
npm run start
```

### Desktop App (Electron)

Run React + Electron in one command for local desktop development:

```bash
npm run desktop:dev
```

Build desktop package:

```bash
npm run desktop:build
```

On Windows/Linux this creates a portable `.exe`; on macOS this creates a `.dmg`.

The generated executable will be written to:

```bash
release/
```

---

## 🐳 Docker Setup

This project uses a single multi-stage Dockerfile:

- `docker/Dockerfile`

Build the image:

```bash
docker build -f docker/Dockerfile -t ampel-ui .
```

Run the container:

```bash
docker run --rm -p 3003:3003 ampel-ui
```

### Docker Dev Mode

You can also run the React Router dev server through Docker Compose with live source mounting:

```bash
docker compose --profile dev up ampel-ui-dev
```

The dev server is then available at:

```bash
http://localhost:5173
```

This service mounts the repo into the container and runs:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

If your backend is in the same larger Compose stack, set `BASE_API_URL` to the backend service URL,
for example `http://backend:8080`.

### Runtime Header Configuration

The patient header values are now read at runtime by the server, so you can change them in Docker
or Docker Compose without rebuilding the image:

- `HEADER_PRODUCT_LOGO_URL`
- `HEADER_CLINIC_LOGO_URL`
- `HEADER_TICKET_LINK`
- `HEADER_CONTACT_PHONE`
- `HEADER_MT_NUMBER`
- `HEADER_INSTRUCTIONS_LINK`

If you leave them unset, the UI uses neutral defaults:

- the product logo falls back to the bundled `assets/brand-default-logo.svg`
- no clinical logo is shown unless `HEADER_CLINIC_LOGO_URL` is configured
- links stay visible but are not clickable
- phone and MT number render as `-`

If a configured product logo URL cannot be loaded by the browser, the UI falls back to the bundled
product logo. If a configured clinical logo URL cannot be loaded, the clinical logo is hidden.

Example with Docker Compose:

```bash
docker compose up --build
```

The repo contains a ready-to-use [`docker-compose.yml`](docker-compose.yml) that passes these
values from the outside:

```yaml
services:
  ampel-ui:
    volumes:
      - ./assets:/app/public/runtime-assets:ro
    environment:
      BASE_API_URL: http://backend:8080
      HEADER_PRODUCT_LOGO_URL: brand-default-logo.svg
      HEADER_CLINIC_LOGO_URL: clinic-logo.svg
      HEADER_TICKET_LINK: ${HEADER_TICKET_LINK:-}
      HEADER_CONTACT_PHONE: ${HEADER_CONTACT_PHONE:-}
      HEADER_MT_NUMBER: ${HEADER_MT_NUMBER:-}
      HEADER_INSTRUCTIONS_LINK: ${HEADER_INSTRUCTIONS_LINK:-}
```

There is also a development service in the same compose file:

```yaml
services:
  ampel-ui-dev:
    profiles: [dev]
    ports:
      - '5173:5173'
    volumes:
      - .:/app
      - ampel_ui_dev_node_modules:/app/node_modules
```

The repo ships with a bundled product logo:

- `assets/brand-default-logo.svg` for the configurable primary brand logo

For local mounted logos, put the file into the mounted host folder and point
`HEADER_PRODUCT_LOGO_URL` and `HEADER_CLINIC_LOGO_URL` to either:

- the file name only, for example `brand-default-logo.svg`
- the public path, for example `/runtime-assets/brand-default-logo.svg`
- or the container path `/app/public/runtime-assets/brand-default-logo.svg`

To explicitly use a bundled repo logo, use the source assets path, for example
`assets/brand-default-logo.svg`. Other bundled SVGs in `assets/` can be referenced the same way.

---

## 🧪 Testing

This project uses **[Vitest](https://vitest.dev/)** for testing React components and application logic.  
All test files are located in the `app/tests` directory and follow the naming convention `*.test.tsx` or `*.test.ts`.

### Test Types

- **Unit Tests:** Test individual components and utility functions.
- **Integration Tests:** Test multiple components together and simulate user interactions.
- **Snapshot Tests:**
  - Capture and compare the rendered output of React components to detect UI regressions.
  - Snapshots are stored alongside test files.
  - Obsolete snapshots should be cleaned up automatically or via `vitest --update`.

### Test Strategy

This testing setup uses integration tests, which also include unit tests and snapshot tests.  
Integration tests verify that multiple components work together as intended, while unit tests check individual functions or components in isolation.  
Snapshot tests are used to detect unintended UI changes by comparing the rendered output of components over time.

In practice, our integration tests combine these approaches:  
they validate both the correct behavior of UI components (unit testing), their interaction in the app (integration testing), and the stability of the rendered output (snapshot testing).

### Running Tests

```sh
npm run test
```

Runs all tests in watch mode.

```sh
npm run coverage
```

Runs tests with coverage reporting (HTML summary in /coverage).

React Testing Library is used for rendering components and querying the DOM.

Faker is seeded deterministically in tests to ensure reproducible results.

Tests are automatically run in the CI pipeline (GitHub Actions) on every push to the main branch and for pull requests and in every commit to avoid broken builds on the main branch.

### Accessibility (axe)

```sh
npx playwright install chromium   # once, or use A11Y_BROWSER_CHANNEL=chrome
npm run a11y
```

Builds the app, starts it against a mock backend (`a11y/mock-backend.mjs`) and checks every view and state in a real browser with axe (WCAG 2.2 AA and best practices): overview, expanded section, detail drawer with table and chart, phone width, loading state and all HTTP error pages. In addition, the script checks that each page has exactly one level-1 heading, that the browser title names the page, that opening the drawer focuses the chart switch and that Escape closes it and returns focus. The JSON report is written to `a11y/results/axe-report.json`; the command exits non-zero on any finding.

The unit tests replace the KoliBri components with light-DOM stubs (`app/tests/kolibriMock.tsx`), so real accessibility is only covered by `npm run a11y`.

### 🧹 Code-Qualität & Formatierung

This project uses the following tools to ensure consistent and clean code:

- **Prettier** for automatic code formatting
- **ESLint** for static code analysis
- **lint-staged** to check and format changed files before commits

The configuration is already set up – affected files are automatically formatted and linted during each commit.

This Project uses the best practises from the [google style guide](https://google.github.io/styleguide/tsguide.html).

👉 See [`.eslint.config.ts`](eslint.config.ts), [`.prettierrc`](.prettierrc).
