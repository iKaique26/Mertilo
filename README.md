# Mertilo

A personal finance management desktop application built with Electron, React, and Node.js/TypeScript.

## Features

- Track vehicle expenses and income
- Manage salary and expenses
- Categorize transactions
- Visualize financial data with charts
- Desktop notifications and export capabilities

## Getting Started

### Prerequisites

- Node.js (>=16)
- npm or yarn

### Installation

1. Clone the repository
   `ash
   git clone <repository-url>
   cd mertilo
   `

2. Install dependencies
   `ash
   # Install main app dependencies
   npm install

   # Install backend dependencies
   cd resources/app/api
   npm install
   cd ../..
   `

3. Start the development backend
   `ash
   cd resources/app/api
   npm run dev
   # In another terminal:
   npm start   # runs the built version if you prefer
   `

4. Start the Electron app
   `ash
   npm start
   `

### Building for Production

`ash
# Package the app for your platform
npx electron-builder
`

## Project Structure

`
mertilo/
├─ resources/
│   ├─ app/                # Electron + frontend (React)
│   │   ├─ electron/main.js   # Main process
│   │   ├─ dist/              # Built frontend (React)
│   │   ├─ package.json       # Electron & frontend deps
│   │   └─ api/               # Backend API (Node/TS)
│   │       ├─ src/           # TypeScript source
│   │       ├─ dist/          # Compiled JS
│   │       ├─ data/          # JSON storage
│   │       └─ package.json
├─ .gitignore
├─ README.md
└─ package.json
`

## License

MIT


