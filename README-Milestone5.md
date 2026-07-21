# SyncMind AI: Complete End-to-End Documentation (Milestone 5)

## Overview
SyncMind AI is a full-stack, distributed application utilizing a microservices architecture. It provides an intuitive, highly responsive frontend built with React/Vite/Tailwind CSS, and a robust backend composed of multiple Node.js services (Auth Service and Project Service).

This document covers the end-to-end flow, architecture, error handling strategies, and how to deploy the application securely with HTTPS.

---

## 1. Architecture Details

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (fully responsive using utility classes `sm:`, `md:`, `lg:`).
- **Functionality:** Handles all user interactions, authentication state, Kanban boards, and project management UI.
- **Error Handling:** Wraps all API interactions in `try/catch` blocks and provides graceful user feedback via `toast` notifications.

### Backend Microservices
- **Auth Service (Port 5001):** Responsible for user registration, login, and issuing JWT tokens.
- **Project Service (Port 5002):** Responsible for handling projects, tasks, Kanban columns, and integrating with the Gemini API for AI features.
- **Database:** PostgreSQL (via Prisma ORM) with separate databases for each service.
- **Error Handling:** Both services utilize a centralized error handler middleware (`errorHandler.js`). In production, this prevents raw stack traces or database errors from leaking to the client, returning standardized JSON payloads.

---

## 2. Security & HTTPS (EC2 Setup)

For production deployment on an AWS EC2 instance, the application requires an **NGINX Reverse Proxy** secured with **HTTPS**.

### A. Prerequisites
1. **Domain Name:** You must have a registered domain name (e.g., `api.yourdomain.com`).
2. **DNS A-Record:** Create an A-Record in your DNS provider pointing your domain to the Public IP address of your EC2 instance.

### B. Configuring the Infrastructure
The deployment script (`backend/auth-service/deploy-ec2.js`) automates launching the EC2 instance and opening the necessary ports in the Security Group:
- **Port 22:** SSH
- **Port 80:** HTTP (Required for Certbot challenge and redirects)
- **Port 443:** HTTPS (Secure traffic)
- **Ports 5001 & 5002:** Microservices (bound to localhost for security)

### C. NGINX & SSL Installation
We have provided an automated script: `backend/setup-ssl.sh`.
This script will:
1. Install `nginx` and `certbot`.
2. Configure NGINX to proxy incoming HTTP/HTTPS traffic on your domain directly to the local microservices running in Docker.
3. Use Certbot to automatically fetch and configure Let's Encrypt SSL certificates.

**Usage:**
```bash
# On your EC2 Instance
cd /path/to/backend
nano setup-ssl.sh    # Edit YOUR_DOMAIN variable to match your domain
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

---

## 3. How the Services Interact (The Flow)

1. **Client Request:** A user visits `https://yourdomain.com`. 
2. **NGINX Reception:** NGINX intercepts the HTTPS request on port 443 and decrypts the SSL traffic.
3. **Routing:**
   - Requests to `/api/auth/*` are forwarded to the Auth Service (`http://localhost:5001`).
   - Requests to `/api/project/*` are forwarded to the Project Service (`http://localhost:5002`).
4. **Service Processing:** The respective microservice connects to the PostgreSQL database, processes the logic, and returns a JSON response.
5. **Client Response:** The frontend parses the response, updating the UI accordingly.

---

## 4. Local Development

To run the project locally without the complex EC2 setup:

1. Clone the repository.
2. In the `backend/auth-service` and `backend/project-service` directories, ensure `.env` files are configured.
3. Start the application using Docker Compose from the root directory:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost`.

---

> **Note:** If you are migrating a newly purchased domain, please update the `CLIENT_URL` in `docker-compose.yml` to reflect your new `https://<domain>` URL to ensure CORS policies permit your frontend.
