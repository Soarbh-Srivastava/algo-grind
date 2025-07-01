
# Algo Grind - System Design

This document outlines the system architecture for Algo Grind, a full-stack web application for tracking DSA progress.

```mermaid
graph TD
    subgraph User
        Client[💻 Client / Browser]
    end

    subgraph "Vercel Hosting"
        NextApp[Next.js Application]
    end

    subgraph "Firebase"
        Auth[🔒 Firebase Authentication]
        Firestore[📄 Firestore Database <br> (User Data, Goals, Problems)]
    end

    subgraph "Google AI"
        Genkit[🤖 Genkit Flows <br> (Server-side AI Logic)]
        Gemini[✨ Gemini Pro Model]
    end

    Client -- "HTTPS Request" --> NextApp
    NextApp -- "Renders React Components (HTML/JS/CSS)" --> Client

    Client -- "Login / Register" --> Auth
    Auth -- "User Session Token" --> Client

    NextApp -- "CRUD via useAppData hook" --> Firestore
    Firestore -- "Real-time Data Sync" --> NextApp

    Client -- "Chat / Recommendation Request" --> NextApp
    NextApp -- "Invokes AI Flow (e.g., chatWithCodingBuddy)" --> Genkit
    Genkit -- "Sends Prompt to LLM" --> Gemini
    Gemini -- "Returns AI Response" --> Genkit
    Genkit -- "Returns Structured Data" --> NextApp
```

## Architecture Components

1.  **Client (Browser)**: The user's interface, running the Next.js/React application.
2.  **Vercel Hosting**: The platform where the Next.js application is deployed and served globally.
3.  **Next.js Application**:
    *   **App Router**: Handles routing, page rendering (Server Components), and API endpoints.
    *   **React Components**: The UI building blocks, some of which are client-side interactive.
    *   **Hooks & Context**: The `useAuth` and `useAppData` hooks manage global state and data fetching logic.
4.  **Firebase Services**:
    *   **Firebase Authentication**: Manages user identity (email/password, Google OAuth).
    *   **Firestore Database**: A NoSQL database storing user-specific documents containing solved problems, goals, and leaderboard profiles.
5.  **Google AI (Genkit)**:
    *   **Genkit Flows**: Server-side functions that define the AI logic, such as the chat agent and problem recommender. This keeps prompts and API keys secure.
    *   **Gemini Pro Model**: The underlying Large Language Model that processes prompts from Genkit and generates responses.

## Key Data Flows

*   **Authentication Flow**: The client communicates directly with Firebase Auth to sign in. The resulting user session is managed in the Next.js app via the `AuthContext`.
*   **Data Management Flow**: Client components use the `useAppData` hook to interact with Firestore. This hook centralizes all database operations (Create, Read, Update, Delete).
*   **AI Feature Flow**: The client sends a request to a Next.js API Route, which in turn invokes a server-side Genkit Flow. Genkit handles the interaction with the Gemini model and returns a structured response to the client.
