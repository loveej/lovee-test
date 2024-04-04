const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ region: 'australia-southeast-2' })
// const eventbridge = new AWS.EventBridge();

// Parse JSON requests
app.use(express.json());
app.use(express.text())

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, async () => {
  console.log('Example app listening on port 3000!');
});

async function pollSQS() {
  console.log("Polling SQS...");
  var params = {
    QueueUrl: 'https://sqs.ap-southeast-2.amazonaws.com/764385434156/lovee-test-queue',
    AttributeNames: [
      "CreatedTimestamp"
      /* more items */
    ],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: [
      'some_message_attribute'
      /* more items */
    ]
  };
  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages) {
      data.Messages.forEach(async (message) => {
        const eventData = JSON.parse(message.Body); // Assuming event data is JSON
        console.log("sqs_data_______", eventData);

        // Delete the message from the queue
        await sqs.deleteMessage({
          QueueUrl: 'https://sqs.ap-southeast-2.amazonaws.com/764385434156/lovee-test-queue',
          ReceiptHandle: message.ReceiptHandle
        }).promise();
      });
    }
  } catch (error) {
    console.error("Error polling SQS:", error);
  }
}


// Initial polling and periodic polling
pollSQS(); 
setInterval(pollSQS, 30000); // Example polling every 5 seconds


app.post('/sync1', (req, res) => {
  console.log("API Destination Sync");
  const event = req.body
  org_name = event.detail.payload.org.organisation.name
  console.log("org_name..........", org_name);
  res.send(`Synced! ${org_name}`);
});

app.post('/sync2', (req, res) => {
  console.log("SNS Topic HTTPs Triggered Sync");
  if (req.headers['x-amz-sns-message-type'] == 'SubscriptionConfirmation') {
    console.log("body...", req.body)
    res.send("ready to subscribe")
  }
  else {
    const message = JSON.parse(JSON.parse(req.body).Message)
    const org_name = message.detail.payload.org.organisation.name
    console.log("org_name..........", org_name);
    res.send(`Synced! ${org_name}`);
  }
});