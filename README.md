# AI Video Code Generator

An AI-powered video code generator built with Remotion, featuring an interactive coding experience similar to Cursor.

## Features

- 🤖 **AI-Powered Code Generation**: Use AI to generate and modify Remotion video code
- 💻 **Interactive Code Editor**: Monaco Editor with TypeScript support
- 🎬 **Real-time Preview**: See your video changes instantly with Remotion Player
- 🔒 **Security Validation**: AST-based code analysis to prevent malicious code
- ⚡ **Browser-based Compilation**: Uses esbuild-wasm for fast TypeScript compilation
- 🎨 **Modern UI**: Built with Next.js 14, Tailwind CSS, and shadcn/ui
- 💾 **Local Storage**: All data stored locally using IndexedDB
- 🔑 **Bring Your Own API Key**: Configure your own AI provider (OpenAI, Anthropic, etc.)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Video Engine**: Remotion 4.0
- **Code Editor**: Monaco Editor
- **AI Integration**: Vercel AI SDK
- **State Management**: Zustand with LocalForage
- **Code Compilation**: esbuild-wasm
- **Code Analysis**: @typescript-eslint/typescript-estree
- **Deployment**: GitHub Pages (Static Export)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An AI API key (OpenAI, Anthropic, or compatible provider)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd video-create-demo

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Configuration

1. Click the "Configure AI" button in the AI Chat panel
2. Add your AI provider details:
   - Provider Name (e.g., "OpenAI GPT-4")
   - API Key (your API key)
   - Model (e.g., "gpt-4", "claude-3-opus")
   - Base URL (optional, for custom endpoints)
3. Click "Add Provider" and then "Activate"

## Usage

### Basic Workflow

1. **Configure AI**: Set up your AI provider in the settings
2. **Chat with AI**: Ask the AI to create or modify video code
   - Example: "Create a video with animated text"
   - Example: "Add a fade-in effect"
3. **Edit Code**: Use the code editor to make manual changes
4. **Preview**: See your video update in real-time
5. **Export**: (Coming soon) Export your video

### Example Prompts

- "Create a simple hello world video with blue background"
- "Add a fade-in animation to the text"
- "Create a video with multiple text layers"
- "Make the text bounce using interpolation"

## Project Structure

```
video-create-demo/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   └── chat/           # AI chat endpoint
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── ai/                 # AI-related components
│   │   ├── AIChatPanel.tsx
│   │   └── AIConfigDialog.tsx
│   ├── editor/             # Editor components
│   │   ├── CodeEditor.tsx
│   │   ├── VideoEditor.tsx
│   │   └── VideoPreview.tsx
│   └── ui/                 # UI components (shadcn/ui)
├── lib/                     # Utilities and libraries
│   ├── compiler/           # Code compilation
│   ├── security/           # Code validation
│   ├── store/              # State management
│   └── utils/              # Utility functions
├── public/                  # Static assets
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml          # Deployment workflow
└── package.json            # Dependencies

```

## Deployment

### GitHub Pages (One-Click Deployment)

This project is configured for automatic deployment to GitHub Pages:

1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be available at `https://<username>.github.io/<repo-name>`

### Manual Deployment

```bash
# Build the project
npm run build

# The static site will be in the ./out directory
# You can deploy this to any static hosting service
```

## Development

### Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Security

This application includes multiple security layers:

1. **AST Analysis**: Code is parsed and analyzed before execution
2. **API Blacklist**: Dangerous APIs (eval, Function, etc.) are blocked
3. **Import Whitelist**: Only approved libraries can be imported
4. **Sandbox Execution**: Code runs in an isolated environment
5. **Local Storage**: All data is stored locally, not on servers

## Cost Estimation

- **MVP/Small Scale**: $0/month (free hosting on GitHub Pages)
- **AI API Costs**: User-provided (bring your own API key)
- No server costs as everything runs in the browser

## Limitations

- Browser-based compilation may be slower for large files
- Some Remotion features may not work in browser environment
- Video export requires additional setup (ffmpeg.wasm)

## Roadmap

- [ ] Video export functionality
- [ ] Template library
- [ ] Code snippets
- [ ] Multiple video projects
- [ ] Collaboration features
- [ ] More AI providers
- [ ] Advanced Remotion features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- [Remotion](https://www.remotion.dev/) - Amazing video framework
- [Vercel AI SDK](https://sdk.vercel.ai/) - Excellent AI integration
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## Support

For issues and questions, please [open an issue](https://github.com/<username>/<repo>/issues) on GitHub.

---

Made with ❤️ using Remotion and AI

