# Sri Lankan Constitution Q&A - Frontend

## Project Overview

This is the frontend for an AI-powered Sri Lankan Constitution question-answering application. Built with React, TypeScript, and modern web technologies, it provides a beautiful, intuitive interface for asking questions about the Constitution and receiving accurate, article-cited answers in real-time.

## Features

- **Constitutional Focus**: Specialized UI for Sri Lankan constitutional law queries
- **Real-time Streaming**: Server-Sent Events (SSE) for progressive answer display
- **Agent Progress Tracking**: Visual feedback showing Planning → Retrieval → Summarization → Verification stages
- **Article Citations**: Answers include specific constitutional article references
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality React components
- **Lottie** - Smooth animations
- **Vercel AI SDK** - SSE streaming protocol

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:8000`

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```sh
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable React components
│   └── AgentProgress.tsx  # Multi-agent progress display
├── pages/             # Page components
│   └── chat.tsx       # Main chat interface
├── assets/            # Static assets (animations, images)
├── lib/               # Utility functions
└── App.tsx            # Root component
```

## Environment Configuration

The frontend connects to the backend API. If your backend is not on `localhost:8000`, you'll need to update the API URL in the code or use environment variables.

## Key Components

### Chat Interface (`src/pages/chat.tsx`)
- Main constitutional Q&A interface
- SSE streaming integration
- Real-time agent progress display
- Message history with user/assistant styling

### Agent Progress (`src/components/AgentProgress.tsx`)
- Visual representation of the 4-agent workflow
- Shows current processing stage
- Displays stage-specific data (plan, retrieved articles, etc.)

## Development

```sh
# Run linter
npm run lint

# Type check
npm run type-check
```

## Deployment

### Quick Deploy
The easiest way to deploy is using Vercel or similar platforms that support Vite applications.

### Docker Deploy
Use the provided `Dockerfile` for containerized deployment:

```sh
docker build -t sri-lanka-constitution-frontend .
docker run -p 80:80 sri-lanka-constitution-frontend
```

### AWS Deployment
See the `Terraform/` directory in the project root for complete AWS infrastructure setup including ECS Fargate deployment.

## Example Questions

Try asking:
- "What fundamental rights are guaranteed under Article 12?"
- "Explain the powers of the President under Article 42"
- "How was the executive presidency changed by the 19th Amendment?"
- "What is the role of the Supreme Court?"

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is for educational purposes.

