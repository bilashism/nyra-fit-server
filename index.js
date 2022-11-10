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
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ").pop();
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
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

    //  get single service
    app.get("/service/:id", async (req, res) => {
      const itemId = req?.params?.id;
      const query = { _id: ObjectId(itemId) };
      const options = {};
      const result = await servicesCollection.findOne(query, options);
      // let result = await cursor.toArray();
      res.send(result);
    });

    //  get all services
    app.get("/services", async (req, res) => {
      const itemsNum = req?.query?.itemsLimit;
      const query = {};
      const options = { sort: { _id: -1 } };
      const cursor = servicesCollection.find(query, options);
      let result;
      if (itemsNum) {
        result = await cursor.limit(parseInt(itemsNum)).toArray();
        return res.send(result);
      }
      result = await cursor.toArray();
      res.send(result);
    });

    //  get service specific all testimonials
    app.get("/testimonials", async (req, res) => {
      const testimonialsCollection = database.collection("testimonials");
      const serviceId = req?.query?.serviceId;
      const query = { serviceId: serviceId };
      const options = { sort: { _id: -1 } };
      const cursor = testimonialsCollection.find(query, options);
      let result = await cursor.toArray();
      res.send(result);
    });

    //  add service specific testimonial
    app.post("/testimonials", async (req, res) => {
      const testimonialsCollection = database.collection("testimonials");
      const testimony = req.body;
      const result = await testimonialsCollection.insertOne(testimony);
      res.send(result);
    });
    //  get a specific testimonial
    app.get("/testimonial/:id", async (req, res) => {
      const testimonialsCollection = database.collection("testimonials");
      const testimonyId = req?.params?.id;
      const query = { _id: ObjectId(testimonyId) };
      const options = {};
      const result = await testimonialsCollection.findOne(query, options);

      res.send(result);
    });

    //  get all of testimonials
    app.get("/myReviews", verifyToken, async (req, res) => {
      const testimonialsCollection = database.collection("testimonials");
      const userEmail = req?.query?.userEmail;
      const query = { "reviewer.email": userEmail };
      console.log(query);
      const options = { sort: { _id: -1 } };
      const cursor = testimonialsCollection.find(query, options);
      let result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
};
run().catch(console.dir);
