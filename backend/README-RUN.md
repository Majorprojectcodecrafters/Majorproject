# Backend: run guide (Windows / VS Code)

## Requirements

- Node.js 20 or later (Node.js 24 is installed on this computer)
- A PostgreSQL database
- A Groq API key for the AI features
- ChromaDB running at `http://localhost:8000` for RAG/PDF features

## Run in VS Code

1. Extract this ZIP and open the extracted `backend` folder in VS Code.
2. Open **Terminal > New Terminal**.
3. Create your local environment file and enter your own values:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Install packages and prepare the database client:

   ```powershell
   npm.cmd install
   npx.cmd prisma generate
   npx.cmd prisma migrate deploy
   ```

5. In a first terminal, install and start the ChromaDB vector database:

   ```powershell
   npm.cmd run chroma:setup
   npm.cmd run chroma
   ```

6. In a second terminal, start the API:

   ```powershell
   npm.cmd run dev
   ```

7. Visit `http://localhost:5000/`. It should say `API is running`.

Use `Ctrl+C` to stop the server. Start only one `npm.cmd run dev` terminal at a time.

## PowerShell note

If PowerShell blocks `npm`, use `npm.cmd` and `npx.cmd` as shown above.
