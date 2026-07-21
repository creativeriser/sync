const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const client = new EC2Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIATXYSXW5B6GIBKOOJ",
    secretAccessKey: "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"
  }
});
async function main() {
  const res = await client.send(new DescribeInstancesCommand({
    InstanceIds: ["i-0e810973bc1efe65f"]
  }));
  const ip = res.Reservations[0].Instances[0].PublicIpAddress;
  console.log(ip);
}
main();
