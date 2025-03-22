# ciphernotes

The project is live on https://ciphernotes.com

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose (for database only)
- Bun (for backend)
- Yarn (for frontend)
- mkcert (for generating development certificates)

### Database Setup
1. Start the PostgreSQL database:
   ```bash
   docker-compose up -d postgres
   ```
   This will start the PostgreSQL database on port 5432.
2. Initialize the database schema:
   ```bash
   cd backend
   bun db:push    # Apply schema changes
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Start the backend:
   ```bash
   bun dev
   ```

### SSL Certificate Setup
1. Install mkcert (if not already installed):
   - Windows (with chocolatey): `choco install mkcert`
   - macOS (with homebrew): `brew install mkcert`
   - Linux: Check your package manager or visit https://github.com/FiloSottile/mkcert

2. Install local CA:
   ```bash
   mkcert -install
   ```

3. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

4. Generate certificates for localhost:
   ```bash
   mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
   ```
   This will create two files:
   - `cert.pem`: SSL certificate (trusted by your system)
   - `key.pem`: Private key

### Frontend Setup
1. Navigate to the frontend directory (if not already there):
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the frontend development server:
   ```bash
   yarn dev:https
   ```

### Development URLs
- Frontend: https://localhost:5173
- Backend API: http://localhost:(env.PORT)
- PostgreSQL: localhost:5432

### Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Bun + TypeScript
- Database: PostgreSQL 16
- ORM: Drizzle

### Mobile Device Access
1. Find your computer's local IP address:
   ```bash
   ipconfig # Windows
   ifconfig # macOS/Linux
   ```
2. Generate new certificates including your IP:
   ```bash
   mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1 192.168.x.x
   ```
3. Start the frontend with host flag:
   ```bash
   yarn dev:https --host
   ```
4. Find and install the root CA certificate on your mobile device:
   ```bash
   mkcert -CAROOT
   ```
   This shows the folder containing `rootCA.pem`
5. Access https://192.168.x.x:5173 on your mobile device
