//import necessary modules
const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");//mongodb client and objectid fior working with database
const path = require("path");

const app = express();
//Middleware to serve uploaded images statically
app.set("port", 3000);//setup the appliction port

// Middleware for handling CORS and headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader( "Access-Control-Allow-Methods","GET, HEAD, OPTIONS, POST, PUT");
  res.setHeader("Access-Control-Allow-Headers","Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers" );

  next();
});
//mongodb connection uri
const mongoUri = "mongodb+srv://admin:admin@cluster0.yohpw.mongodb.net";
let db;
//cnnect to mongodb
MongoClient.connect(mongoUri, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);//exits if the connection fails
  }
  db = client.db("webstore");//conection to the webstore database
  console.log("Connected to MongoDB");
});
// Middleware
app.use(express.json());
app.use(express.static("public")); // Serve static files from the "public" folder

// Serve storefront.html as the home page,, routes to the homapage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "storefront.html"));
});

// Fetch all courses from the database 
app.get("/collection/courses", (req, res) => {
    db.collection("courses")
      .find({})
      .toArray((err, courses) => {
        if (err) {
          console.error("Error fetching courses:", err);
          return res.status(500).send({ error: "Failed to fetch courses" });
        }
        // return all courses
        res.send(courses);
      });
  });
        //fetches customers orders
  app.get("/get-customer-orders", async (req, res) => {
    try {
        const orders = await db.collection("CustomerOrders").find({}).toArray();
        res.send(orders); //return all customers orders
    } catch (err) {
        console.error("Error fetching customer orders:", err);
        res.status(500).send({ error: "Failed to fetch customer orders" });
    }
  });

  // route to Fetch a specific course by ID
app.get('/collection/courses/:id', async (req, res) => {
    const { id } = req.params; // Middleware for handling CORS and headers
    try {
        const course = await db.collection('courses').findOne({ _id: new ObjectID(id) });   
        if (!course) {
            return res.status(404).send({ error: "Course not found" });
        }  
        res.send(course);//return all the courses
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).send({ error: "Failed to fetch course" });
    }
  });
  
