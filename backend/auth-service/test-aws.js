const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const client = new EC2Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIATXYSXW5B6GIBKOOJ",
    secretAccessKey: "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"
  }
});
async function test() {
  try {
    await client.send(new DescribeInstancesCommand({}));
    console.log("EC2 permissions OK");
  } catch(e) {
    console.error("EC2 Error:", e.name, e.message);
  }
}
test();
