<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Quick Start

### Prerequisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows.
- Install [Node.js](https://nodejs.org/) (LTS recommended).

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Start the Backend in Development Mode

```bash
npm run start:dev
```

### 4. Start the Database (PostgreSQL) with Docker Compose

```bash
docker compose up -d
```

### 5. Stop the Database

```bash
docker compose down
```

---

You must have Docker Desktop running before using Docker Compose commands.

Other useful commands can be added below as needed.