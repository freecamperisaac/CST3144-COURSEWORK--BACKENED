//import necessary modules
const express = require("express");
const { MongoClient, ObjectID } = require("mongodb");//mongodb client and objectid fior working with database
const path = require("path");

const app = express();
//Middleware to serve uploaded images statically
app.set("port", 3000);//setup the appliction port

// Middleware for handling and headers
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
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static("public")); // Serve static files from the "public" folder

// Serve storefront.html as the home page,, routes to the homapage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
  // Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
  });
  
// Route: Insert a document into a specified collection
app.post("/collection/:collectionName", (req, res, next) => {
    const { collectionName } = req.params;// Collection name from the route
    // Validate the collection name
    if (!collectionName) {
        return res.status(400).send({ error: "Collection name is required" });
    }
    const collection = db.collection(collectionName); // Get the collection
    collection.insertOne(req.body, (err, result) => {
        if (err) {
            console.error("Error inserting document:", err);
            return res.status(500).send({ error: "Failed to insert document" });
        }
        res.json(result.ops[0]); // Send the inserted document back
    });
  });

  // Store orders in the "CustomerOrders" collection and update inventory
app.post("/add-to-cart", async (req, res) => {
    const { cart, order } = req.body; // Extract cart and order details
    if (!cart || !order) {
      return res
        .status(400)
        .send({ error: "Cart and order details are required" });
    }
  
    try {
      // insert and Save order to the "CustomerOrders" collection
      const customerOrder = {
        orderDetails: order,
        cartItems: cart,
        createdAt: new Date(),
      };
  
      // Save the customer order
      const orderResult = await db
        .collection("CustomerOrders")
        .insertOne(customerOrder);
  
      // Update inventory for each course in the cart
      const updatePromises = cart.map((item) =>
        db
          .collection("courses")
          .updateOne(
            { _id: ObjectID(item.id) },
            { $inc: { availableInventory: -item.quantity } }
          )
      );
  
      const results = await Promise.all(updatePromises); // Wait for all updates to complete
      console.log("Inventory updated successfully", results);
  
      res.send({
        message: "Order successfully saved",
        orderId: orderResult.insertedId,
      });
    } catch (error) {
      console.error("Error processing order:", error);
      res.status(500).send({ error: "Failed to process order" });
    }
  });
  // Route to Update course inventory
app.put('/collection/courses/:id', async (req, res) => {
    const { id } = req.params; //extract course ID
    const { availableInventory } = req.body; // New inventory value
  
    if (availableInventory === undefined || availableInventory === null) {
        return res.status(400).send({ error: 'availableInventory is required' });
    }
  
    try {
        const collection = db.collection('courses'); // Ensure collection is valid
        if (!collection) throw new Error("Collection 'courses' not found");
  
        const result = await collection.updateOne(
            { _id: new ObjectID(id) }, // Match the document
            { $set: { availableInventory } } // Update operation
        );
  
        if (result.matchedCount === 0) {
            return res.status(404).send({ error: 'Course not found' });
        }
  
        res.send({ message: 'Inventory updated successfully' });
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).send({ error: 'Failed to update inventory' });
    }
  });

  
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({ error: "Something went wrong!" });
  });
  
  // Start the server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  
