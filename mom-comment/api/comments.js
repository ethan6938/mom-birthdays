import "dotenv/config";
import { MongoClient } from "mongodb";

let client;
let clientPromise;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("cwd:", process.cwd());
    console.log("has MONGODB_URI:", !!process.env.MONGODB_URI);

    const client = await getClientPromise();
    const db = client.db("birthday_messages");
    const collection = db.collection("comments");

    if (req.method === "POST") {
      const { name, message } = req.body || {};

      if (!name?.trim() || !message?.trim()) {
        return res.status(400).json({ error: "Name and message are required." });
      }

      const result = await collection.insertOne({
        name: name.trim(),
        message: message.trim(),
        createdAt: new Date()
      });

      return res.status(200).json({
        success: true,
        id: result.insertedId
      });
    }

    if (req.method === "GET") {
      const comments = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(comments);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}