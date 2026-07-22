const { EC2Client, CreateKeyPairCommand, DescribeKeyPairsCommand, CreateSecurityGroupCommand, DescribeSecurityGroupsCommand, AuthorizeSecurityGroupIngressCommand, RunInstancesCommand, DescribeImagesCommand } = require("@aws-sdk/client-ec2");
const fs = require("fs");

const region = "ap-south-1";
const client = new EC2Client({
  region,
  credentials: {
    accessKeyId: "AKIATXYSXW5B6GIBKOOJ",
    secretAccessKey: "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"
  }
});

async function main() {
  const keyName = "syncmind-ec2-key";
  const sgName = "syncmind-sg";
  let sgId;

  // 1. Setup Key Pair
  try {
    const keys = await client.send(new DescribeKeyPairsCommand({ KeyNames: [keyName] }));
    console.log(`KeyPair ${keyName} already exists.`);
  } catch (err) {
    if (err.name === 'InvalidKeyPair.NotFound') {
      console.log(`Creating KeyPair ${keyName}...`);
      const keyRes = await client.send(new CreateKeyPairCommand({ KeyName: keyName }));
      fs.writeFileSync(`${keyName}.pem`, keyRes.KeyMaterial);
      fs.chmodSync(`${keyName}.pem`, 0o400);
      console.log(`Saved KeyPair to ${keyName}.pem`);
    } else {
      throw err;
    }
  }

  // 2. Setup Security Group
  try {
    const sgs = await client.send(new DescribeSecurityGroupsCommand({ GroupNames: [sgName] }));
    sgId = sgs.SecurityGroups[0].GroupId;
    console.log(`Security Group ${sgName} already exists (${sgId}).`);
  } catch (err) {
    if (err.name === 'InvalidGroup.NotFound') {
      console.log(`Creating Security Group ${sgName}...`);
      const sgRes = await client.send(new CreateSecurityGroupCommand({
        GroupName: sgName,
        Description: "Security group for SyncMind AI backend"
      }));
      sgId = sgRes.GroupId;
      console.log(`Created Security Group (${sgId}). Adding rules...`);
      
      const ports = [22, 80, 443, 5001, 5002];
      const ipPermissions = ports.map(port => ({
        IpProtocol: "tcp",
        FromPort: port,
        ToPort: port,
        IpRanges: [{ CidrIp: "0.0.0.0/0" }]
      }));
      
      await client.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: sgId,
        IpPermissions: ipPermissions
      }));
      console.log(`Added inbound rules for ports ${ports.join(', ')}.`);
    } else {
      throw err;
    }
  }

  // 3. Find latest Ubuntu 22.04 AMI
  console.log("Finding latest Ubuntu 22.04 AMI...");
  const images = await client.send(new DescribeImagesCommand({
    Filters: [
      { Name: "name", Values: ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"] },
      { Name: "architecture", Values: ["x86_64"] }
    ],
    Owners: ["099720109477"] // Canonical
  }));
  const latestAmi = images.Images.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate))[0];
  console.log(`Found AMI: ${latestAmi.ImageId} (${latestAmi.Name})`);

  // 4. Launch Instance
  const userData = `#!/bin/bash
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release
mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose
usermod -aG docker ubuntu
systemctl enable docker
systemctl start docker
`;

  console.log("Launching EC2 instance...");
  const runRes = await client.send(new RunInstancesCommand({
    ImageId: latestAmi.ImageId,
    InstanceType: "t3.micro",
    KeyName: keyName,
    SecurityGroupIds: [sgId],
    MinCount: 1,
    MaxCount: 1,
    UserData: Buffer.from(userData).toString('base64'),
    TagSpecifications: [{
      ResourceType: "instance",
      Tags: [{ Key: "Name", Value: "SyncMind-Backend" }]
    }]
  }));

  const instanceId = runRes.Instances[0].InstanceId;
  console.log(`Successfully launched instance: ${instanceId}`);
  console.log("It will take a minute or two to start and install Docker.");
}

main().catch(console.error);
