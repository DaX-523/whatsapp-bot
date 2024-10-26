var express = require("express");
var router = express.Router();
const { sendMessage, getTextMessageInput } = require("../utils/messageHelper");
const WhatsApp = require("whatsapp");
console.log(process.env.PHONE_NUMBER_ID);
// Your test sender phone number
const wa = new WhatsApp(process.env.PHONE_NUMBER_ID);

// Enter the recipient phone number
const recipient_number = process.env.RECIPIENT_WAID;

function custom_callback(statusCode, headers, body, resp, err) {
  console.log(
    `Incoming webhook status code: ${statusCode}\n\nHeaders:
        ${JSON.stringify(headers)}\n\nBody: ${JSON.stringify(body)}`
  );

  if (resp) {
    resp.writeHead(200, { "Content-Type": "text/plain" });
    resp.end();
  }

  if (err) {
    console.log(`ERROR: ${err}`);
  }
}

wa.webhooks.start(custom_callback);

router.post("/sdk", async function send_message(req, res) {
  try {
    const sent_text_message = wa.messages.text({ body: "" }, recipient_number);

    await sent_text_message.then((res) => {
      console.log(res.rawResponse());
      res.sendStatus(200);
    });
  } catch (e) {
    console.log(JSON.stringify(e));
  }
});

router.post("/chat", function (req, res, next) {
  var data = getTextMessageInput(process.env.RECIPIENT_WAID, "Hatt bosdk");

  sendMessage(data)
    .then(function (response) {
      console.log(response);
      // res.redirect("/");
      res.sendStatus(200);
      return;
    })
    .catch(function (error) {
      console.log(error);
      console.log(error.response);
      res.sendStatus(500);
      return;
    });
});

router.get("/webhook", async (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];
  try {
    if (mode && token) {
      if (
        mode === "subscribe" &&
        token === process.env.WEBHOOK_VERIFICATION_TOKEN
      ) {
        console.log("Webhook Verified");
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send("Failed");
      }
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/webhook", async (req, res) => {
  const body = req.body;

  // Check if the webhook event is for a message
  if (body.object === "whatsapp_business_account") {
    body.entry.forEach((entry) => {
      // Loop over each messaging event
      const changes = entry.changes;
      changes.forEach((change) => {
        if (change.field === "messages") {
          const messageEvent = change.value;
          if (messageEvent && messageEvent.messages) {
            const messages = messageEvent.messages;
            messages.forEach((message) => {
              const senderId = message.from; // The WhatsApp user ID (phone number)
              const messageText = message.text.body; // The text message sent by the user

              // Handle the received message
              console.log(`Received message from ${senderId}: ${messageText}`);

              // You can add your business logic here
            });
          }
        }
      });
    });
    // Send a 200 OK response to Facebook
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // If not from WhatsApp, return 404
    res.sendStatus(404);
  }
});

module.exports = router;
