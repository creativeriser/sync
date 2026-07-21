# Milestone 4 Implementation Plan

This document outlines the step-by-step plan to achieve all requirements for Milestone 4, based on the provided rubric. It also identifies existing glitches in the current codebase that need to be resolved before deployment.

## Discovered Glitches

While reviewing the project, I found a few issues that will break the deployment if left unfixed:

1. **Docker-Compose Database Mismatch**: 
   - `docker-compose.yml` specifies `DATABASE_URL=file:./prod.db` (SQLite format) for both backends.
   - However, the `prisma/schema.prisma` in both services is configured for `provider = "mongodb"`. 
   - **Impact**: If we spin up the containers with docker-compose, Prisma will immediately crash because it cannot use a SQLite URL with a MongoDB provider.
2. **CORS Configuration Inconsistency**:
   - `auth-service/src/app.js` hardcodes a specific vercel domain (`https://sync-mind-ai-frontend1-633l.vercel.app/`), whereas `project-service/src/app.js` relies strictly on `env.CLIENT_URL` and `localhost`. We need a unified approach to ensure the deployed frontend can talk to both backend services smoothly.
3. **AWS SES Setup**:
   - `project-service` has AWS SES installed and configured, but the OTP verification during signup belongs to `auth-service`, which does not have AWS SES installed.

---

## Step-by-Step Execution Plan

### Step 1: Fix Existing Glitches
- Update `docker-compose.yml` to remove the `file:./prod.db` injection and properly pass through the cloud database URL.
- Standardize CORS settings in both `app.js` files so they securely accept requests from the deployed frontend URL.

### Step 2: SES Integration (OTP Verification) - 4 points
- Add `@aws-sdk/client-ses` to `auth-service`.
- Update the `User` Prisma schema in `auth-service` to include `otpCode` and `isVerified` fields.
- Modify the signup endpoint (`/auth/register`) to generate an OTP, send an email via SES, and return a "pending verification" status.
- Create a new endpoint (`/auth/verify-otp`) to confirm the OTP and complete registration.

### Step 3: Integration Testing - 4 points
- **Auth Service**: Write `jest`/`supertest` integration tests for Custom Auth (Signup, Login, OTP verification).
- **Project Service**: Write integration tests for two core features (e.g., Creating a Project and Creating a Task).

### Step 4: Database Deployment - 4 points
- **Note on Database**: The rubric mentions "Supabase / Neon / RDS / ...". Currently, the project uses **MongoDB Atlas**. Since MongoDB is a deployed cloud database, it technically fits the `...` category. We can either stick with MongoDB Atlas (less work) or migrate the Prisma schema to PostgreSQL and deploy on Supabase/Neon.
- Verify the connection from the local backend to the deployed database.

### Step 5: Backend Deployment to EC2 - 4 points
- Provision an EC2 instance.
- Clone the repository to the EC2 instance.
- Update `docker-compose.yml` for production (ensuring `.env` variables are correctly injected).
- Start both `auth-service` and `project-service` using Docker Compose on EC2.
- Configure Security Groups on EC2 to allow traffic on ports `5001` and `5002`.

### Step 6: Frontend Deployment - 4 points
- Update `frontend/.env` to point `VITE_AUTH_API_URL` and `VITE_PROJECT_API_URL` to the public IP/Domain of the EC2 instance (e.g., `http://<EC2-IP>:5001/auth`).
- Deploy the frontend to Vercel (or Netlify).
- Verify end-to-end connectivity between the deployed frontend, EC2 backends, and deployed database.
