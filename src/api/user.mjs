import express from "express";
import authenticate from "../middleware/authenticate.mjs";
import firebaseAdmin from "../services/firebase.mjs";
import { MongoClient } from "mongodb";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  res.status(200).json(req.user);
});

router.post("/", async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      error:
        "Invalid request body. Must contain email, password, and name for user."
    });
  }

  try {
    const newFirebaseUser = await firebaseAdmin.auth.createUser({
      email,
      password
    })
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log('Successfully created new user:', userRecord.uid);
      MongoClient.connect("mongodb://root:root@ac-2mzu4bs-shard-00-00.bhwozvz.mongodb.net:27017,ac-2mzu4bs-shard-00-01.bhwozvz.mongodb.net:27017,ac-2mzu4bs-shard-00-02.bhwozvz.mongodb.net:27017/?ssl=true&replicaSet=atlas-9yzanp-shard-0&authSource=admin&retryWrites=true&w=majority", function(err, db) {
        if (err) throw err;
        var dbo = db.db("mern-firebase");
        var createUserObj = {
          email,
          name,
          firebaseId: userRecord.uid
        };
        dbo.collection("user").insertOne(createUserObj, function(err, res) {
          if (err) throw err;
          db.close();
        });
      });
    })
    .catch((error) => {
      console.log('Error creating new user:', error);
    });
    return res
      .status(200)
      .json({ success: "Account created successfully. Please sign in." });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      return res
        .status(400)
        .json({ error: "User account already exists at email address." });
    }
    return res.status(500).json({ error: "Server error. Please try again" });
  }
});

export default router;
