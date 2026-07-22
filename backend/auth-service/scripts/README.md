# DevOps Scripts

These are infrastructure and deployment scripts for the SyncMind AI backend.
Run them from the `auth-service/` directory (they reference `syncmind-ec2-key.pem` by relative path).

---

## `deploy-ec2.js`
**When to use:** You need to **spin up a brand-new EC2 instance** from scratch.

What it does:
- Creates an AWS key pair (if not already present) and saves it as `syncmind-ec2-key.pem`
- Creates a security group `syncmind-sg` with ports 22, 80, 443, 5001, 5002 open
- Finds the latest Ubuntu 22.04 AMI
- Launches a `t3.micro` instance with Docker pre-installed via user-data script

```bash
cd backend/auth-service
node scripts/deploy-ec2.js
```

---

## `deploy.js`
**When to use:** The EC2 instance already exists and you want to **deploy or redeploy** the application.

What it does:
- Waits for SSH to become available on the server (`98.80.11.80`)
- Waits for Docker to be installed and ready
- Syncs the project files to the server via `rsync`
- Creates a 2 GB swap file (to avoid OOM kills during builds)
- Runs `docker compose up -d --build` to rebuild and start all containers

```bash
cd backend/auth-service
node scripts/deploy.js
```

---

## `fix-mongo.js`
**When to use:** MongoDB fails to start because the replica set (`rs0`) is not initialized.

What it does: A MongoDB shell script that initialises or re-initialises the `rs0` replica set.

Run it by piping it into `mongosh` inside the running container:
```bash
ssh -i syncmind-ec2-key.pem ubuntu@98.80.11.80 \
  "sudo docker exec syncmind-ai-mongo-db-1 mongosh < ~/syncmind-ai/backend/auth-service/scripts/fix-mongo.js"
```
