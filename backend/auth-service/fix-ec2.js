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
  const sshCmd = `ssh -i syncmind-ec2-key.pem -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@3.110.124.20`;
  
  console.log("Waiting for EC2 to reboot and SSH to become available...");
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

  console.log("SSH is up! Creating swap file...");
  const swapCmd = `
sudo fallocate -l 2G /swapfile &&
sudo chmod 600 /swapfile &&
sudo mkswap /swapfile &&
sudo swapon /swapfile &&
free -h
`;
  try {
    run(`${sshCmd} "${swapCmd}"`);
  } catch(e) {
    console.log("Swap might already exist or failed. Ignoring error.");
  }

  console.log("Building and starting containers...");
  run(`${sshCmd} "cd syncmind-ai && sudo docker compose down && sudo docker compose up -d --build"`);
  console.log("Deployment complete!");
}

main();
