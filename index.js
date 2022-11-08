const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());
const verifyToken = (req, res, next) => {
  //
};

// localhost server setup
const server = app.listen(port, "localhost", () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`🌐 Running at: http://${host}:${port}`);
});

// server root
app.get("/", (req, res) => {
  res.sendStatus(200);
});

// integrate mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_CLUSTER_URL}/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const run = async () => {
  try {
    const database = client.db("nyraFit");

    app.post("/jwt", async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, {
        expiresIn: "10h"
      });
      res.send({ token });
    });

    const servicesCollection = database.collection("services");

    app.get("/services", async (req, res) => {
      const itemsNum = req?.query?.itemsLimit;
      const query = {};
      const options = {};
      const cursor = servicesCollection.find(query, options);
      let result;
      if (itemsNum) {
        result = await cursor.limit(parseInt(itemsNum)).toArray();
        return res.send(result);
      }
      result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
};
run().catch(console.dir);