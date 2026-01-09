
export default function handler(req, res) {
  const VERIFY_TOKEN = "my_secret_123";

  // Meta Webhook Verification (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Verification failed");
    }
  } 
  // Messenger Event Reception (POST)
  else if (req.method === "POST") {
    const body = req.body;

    if (body.object === 'page') {
      body.entry.forEach(entry => {
        const webhook_event = entry.messaging[0];
        console.log("Messenger Event Received:", webhook_event);
        
        // In a full production stack, you would use a server-side 
        // Atlas Driver here to update the conversations collection.
      });
      res.status(200).send("EVENT_RECEIVED");
    } else {
      res.sendStatus(404);
    }
  } else {
    res.status(404).send("Not Found");
  }
}
