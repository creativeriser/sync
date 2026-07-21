const { EC2Client, TerminateInstancesCommand } = require("@aws-sdk/client-ec2");
const client = new EC2Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIATXYSXW5B6GIBKOOJ",
    secretAccessKey: "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"
  }
});
client.send(new TerminateInstancesCommand({ InstanceIds: ["i-0c19b9e224cd9625f"] })).then(() => console.log("Terminated!")).catch(console.error);
