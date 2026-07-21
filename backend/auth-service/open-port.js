const { EC2Client, DescribeInstancesCommand, AuthorizeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');
require('dotenv').config({ path: '/Users/vikrantsingh/Downloads/sync/backend/auth-service/.env' });

const ec2 = new EC2Client({
  region: 'us-east-1', 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function openPort443() {
  try {
    const ip = '3.110.171.248';
    console.log(`Finding instance with IP: ${ip}...`);
    const data = await ec2.send(new DescribeInstancesCommand({
      Filters: [{ Name: 'ip-address', Values: [ip] }]
    }));
    
    if (!data.Reservations || data.Reservations.length === 0) {
        // try to find by tags if it was ap-south-1 maybe?
        console.log("Could not find instance by IP directly. It might be in us-east-1? Let's check.");
        return;
    }

    const instance = data.Reservations[0].Instances[0];
    const sgId = instance.SecurityGroups[0].GroupId;
    console.log(`Found instance! Security Group ID: ${sgId}`);
    
    console.log(`Adding rule for port 443 to ${sgId}...`);
    try {
      await ec2.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: sgId,
        IpPermissions: [{
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }]
        }]
      }));
      console.log('Port 443 successfully opened!');
    } catch (err) {
      if (err.name === 'InvalidPermission.Duplicate') {
        console.log('Port 443 is already open in this Security Group.');
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

openPort443();
