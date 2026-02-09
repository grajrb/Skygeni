# Windows Setup Guide

## Issue: better-sqlite3 Compilation Error

The `better-sqlite3` package requires C++ build tools to compile native Node.js modules on Windows.

## Solutions (Choose One)

### Option 1: Install Visual Studio Build Tools (Recommended)

1. Download [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Run the installer
3. Select **"Desktop development with C++"** workload
4. Install (requires ~7GB disk space)
5. Restart your terminal
6. Run: `cd backend && npm install`

### Option 2: Use Windows Subsystem for Linux (WSL2)

1. Install WSL2:
   ```powershell
   wsl --install
   ```
2. Restart your computer
3. Open Ubuntu from Start Menu
4. Inside WSL:
   ```bash
   cd /mnt/d/Projects/SkyGeni
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. Run the project from WSL terminal

### Option 3: Use Docker (If available)

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

Run:
```bash
docker build -t revenue-backend ./backend
docker run -p 3001:3001 -v $(pwd)/data:/app/data revenue-backend
```

### Option 4: Switch to sql.js (Pure JavaScript)

If you want to avoid native compilation entirely, you can switch to `sql.js`:

1. Update `backend/package.json`:
   ```json
   "dependencies": {
     "express": "^4.18.2",
     "cors": "^2.8.5",
     "sql.js": "^1.10.3"
   }
   ```

2. Modify `backend/src/db/database.ts` to use sql.js instead of better-sqlite3

## Verification

After installing build tools, verify with:
```bash
cd backend
npm install better-sqlite3
```

If successful, you'll see:
```
+ better-sqlite3@9.2.2
```

No errors about Visual Studio or gyp.

## Still Having Issues?

1. Check Node.js version: `node --version` (should be 18+)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Check https://github.com/nodejs/node-gyp#on-windows for more troubleshooting

## Alternative: Run Backend on a Different Machine

If all else fails:
- Run backend on a Mac/Linux machine or cloud VM (AWS EC2, DigitalOcean)
- Update `frontend/src/services/api.ts` to point to the remote backend URL
- Run frontend on Windows
