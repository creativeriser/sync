const { execSync } = require('child_process');

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(out);
    return out;
  } catch (e) {
    console.error("Command failed:", cmd);
    console.error(e.stderr);
    throw e;
  }
}

async function main() {
  const ip = "98.80.11.80";
  const sshCmd = `ssh -i syncmind-ec2-key.pem -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@${ip}`;
  
  console.log("Waiting for new EC2 SSH...");
  let sshReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`${sshCmd} "echo SSH is up"`, { stdio: 'ignore' });
      sshReady = true;
      break;
    } catch (e) {
      console.log("Not ready yet, waiting 5s...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  if (!sshReady) {
    console.error("SSH never became ready.");
    process.exit(1);
  }
  console.log("SSH is up!");

  console.log("Waiting for docker to be installed and ready...");
  let dockerReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`${sshCmd} "docker --version && docker compose version"`, { stdio: 'ignore' });
      dockerReady = true;
      break;
    } catch (e) {
      console.log("Docker not ready yet, waiting 5s...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log("Syncing files...");
  run(`rsync -avz -e "ssh -i syncmind-ec2-key.pem -o StrictHostKeyChecking=no" --exclude node_modules --exclude .git --exclude deploy-ec2.js ./ ubuntu@${ip}:~/syncmind-ai/`);

  console.log("Creating swap file...");
  const swapCmd = `
sudo fallocate -l 2G /swapfile &&
sudo chmod 600 /swapfile &&
sudo mkswap /swapfile &&
sudo swapon /swapfile &&
free -h
`;
  try {
    run(`${sshCmd} "${swapCmd}"`);
  } catch(e) {}

  console.log("Building and starting containers...");
  run(`${sshCmd} "cd syncmind-ai && sudo docker compose up -d --build"`);
  console.log("Deployment complete!");
}

main();
