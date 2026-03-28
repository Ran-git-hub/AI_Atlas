# 🗺️ AI Atlas

**AI Atlas** is a modern, full-stack web application designed to serve as a comprehensive directory and exploration tool for the rapidly evolving AI ecosystem. Whether you are mapping out AI models, cataloging tools, or saving prompt architectures, AI Atlas provides a clean, fast, and responsive interface to manage and discover AI resources.

The application UI was rapidly prototyped using [v0 by Vercel](https://v0.dev) and developed with the [Cursor AI editor](https://cursor.sh/), leveraging a powerful modern React stack.

Live Demo: [https://v0-ai-nine-gules.vercel.app](https://v0-ai-nine-gules.vercel.app)

---

## ✨ Key Features

* 🔍 **Comprehensive Directory:** Browse, filter, and search through a curated atlas of AI use cases and related organizations.
* ⚡ **Lightning Fast UI:** Built on the Next.js App Router for optimized rendering, faster page loads, and seamless client-side navigation.
* 🗄️ **Robust Backend:** Powered by Supabase (PostgreSQL) for secure data storage, user authentication, and real-time data fetching.
* 🎨 **Accessible & Responsive Design:** A beautiful, minimalist interface built from the ground up using Tailwind CSS and highly customizable `shadcn/ui` components.
* 🤖 **AI-Assisted Daily update** AI automated workflow via OpenClaw for daily updates
  
## 🛠️ Tech Stack

### Frontend
* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/) & Radix UI

### Backend & Tooling
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Package Manager:** [pnpm](https://pnpm.io/)
* **Deployment:** [Vercel](https://vercel.com/)
* **Development Environment:** Configured for [Cursor](https://cursor.sh/)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development.

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.17 or higher)
* [pnpm](https://pnpm.io/installation)
* [Supabase CLI](https://supabase.com/docs/guides/cli) (for managing local migrations)

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Ran-git-hub/AI_Atlas.git](https://github.com/Ran-git-hub/AI_Atlas.git)
   cd AI_Atlas

2. **Install dependencies:**
   ```bash
   pnpm install

3. **Configure Environment Variables:**
Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the Database:**
Link your local environment to your Supabase project and apply the existing database migrations:

    ```bash
    npx supabase link --project-ref your-project-ref
    npx supabase db pull
    ```

5. **Start the development server:**
   ```Bash
   pnpm dev
   ```
   Open http://localhost:3000 with your browser to see the app in action.

## 📂 Architecture Overview
/app: Contains the Next.js App Router logic, pages, and layouts.

/components: Houses reusable UI elements, including pre-configured shadcn/ui components.

/supabase/migrations: Contains the SQL files required to build the PostgreSQL schema.

/lib: Contains utility functions, including the Supabase client initialization.

/hooks: Custom React hooks for managing state and database subscriptions.

## 🤝 Contributing
Contributions are welcome! If you have suggestions or want to add features to the Atlas, please feel free to fork the repository, make your changes, and open a Pull Request.

## 📄 License
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
