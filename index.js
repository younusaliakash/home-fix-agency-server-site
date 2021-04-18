const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ObjectId = require("mongodb").ObjectID;
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

const app = express();
const port = process.env.PORT ||5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("doctors"));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.cxw2z.mongodb.net/homeFixServiceProvider?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const servicesCollection = client
    .db("homeFixServiceProvider")
    .collection("services");
  const adminCollection = client
    .db("homeFixServiceProvider")
    .collection("admin");
  const bookingCollection = client
    .db("homeFixServiceProvider")
    .collection("booking");
  const reviewCollection = client
    .db("homeFixServiceProvider")
    .collection("reviews");

  app.get("/services", (req, res) => {
    servicesCollection
      .find()
      .sort({ _id: -1 })
      .toArray((error, documents) => {
        res.send(documents);
      });
  });

  app.get('/reviews' , (req, res) => {
      reviewCollection.find()
      .toArray((error , data) => {
          res.send(data)
      } )
  })

  app.delete("/deleteService/:id", (req, res) => {
    const id = req.params.id;
    console.log(id);
    servicesCollection.deleteOne({ _id: ObjectId(id) }).then((deleteResult) => {
      servicesCollection
        .find()
        .sort({ _id: -1 })
        .toArray((error, documents) => {
          res.send(documents);
        });
    });
  });

  app.get('/getService/:_id', (req,res) => {
      servicesCollection.find({_id : ObjectId(req.params._id)})
      .toArray((error, result) => {
          res.send(result)
      })
  })

  app.get('/bookingList', (req,res) => {
      bookingCollection.find({email : req.query.email})
      .toArray((error, resultList) => {
          res.send(resultList)
      })
  })

  app.get('/totalOrders' ,(req,res) => {
    bookingCollection.find().sort({_id : -1})
    .toArray((error, totalOrderResult) => {
        res.send(totalOrderResult)
    })
  })

  app.post("/addService", (req, res) => {
    const file = req.files.file;
    const serviceTitle = req.body.serviceTitle;
    const description = req.body.description;
    const price = req.body.price;
    const imgData = file.data;
    const encrImg = imgData.toString("base64");

    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encrImg, "base64"),
    };

    servicesCollection
      .insertOne({ serviceTitle, description, price, image })
      .then((addServiceResult) => {
        res.send(addServiceResult.insertedCount > 0);
      });
  });

  app.post("/addAdmin", (req, res) => {
    const adminEmail = req.body;
    adminCollection.insertOne(adminEmail).then((addAdminResult) => {
      res.send(addAdminResult.insertedCount > 0);
    });
  });

  app.post("/isAdmin", (req, res) => {
    const adminEmail = req.body.email;
    console.log(adminEmail)
    adminCollection.find({email : adminEmail})
    .toArray((error, isAdminResult) => {
        res.send(isAdminResult.length > 0)
    })
  });

  app.post("/addReview", (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review).then((addReviewResult) => {
      res.send(addReviewResult.insertedCount > 0);
    });
  });

  app.post("/addBooking", (req, res) => {
    const booking = req.body;
    bookingCollection.insertOne(booking).
    then((bookingResult) => {
      res.send(bookingResult.insertedCount > 0);
    });
  });

  console.log("db connected");
});

app.get("/", (req, res) => {
  res.send("Server is runnig");
});

app.listen(port, () => {
  console.log("server is active");
});
