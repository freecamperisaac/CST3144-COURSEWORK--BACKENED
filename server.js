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