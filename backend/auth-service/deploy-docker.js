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
  const sshCmd = `ssh -i syncmind-ec2-key.pem -o StrictHostKeyChecking=no ubuntu@3.110.124.20`;
  
  console.log("Waiting for docker to be installed and ready...");
  let dockerReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      execSync(`${sshCmd} "docker --version && docker-compose --version"`, { stdio: 'ignore' });
      dockerReady = true;
      break;
    } catch (e) {
      console.log("Not ready yet, waiting 10s...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  if (!dockerReady) {
    console.error("Docker never became ready.");
    process.exit(1);
  }

  console.log("Docker is ready. Building and starting containers...");
  run(`${sshCmd} "cd syncmind-ai && sudo docker-compose up -d --build"`);
  console.log("Deployment complete!");
}

main();
