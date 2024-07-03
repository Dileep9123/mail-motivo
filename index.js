const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const axios = require("axios");
const bodyParser = require('body-parser');

require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/"+process.env.DATABASE_NAME, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model("User", {
  email: String,
  firstname: String,
  lastname: String,
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service:'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function getMotivationalQuote() {
  try {
    const response = await axios.get("https://zenquotes.io/api/random");
    if (response.data.length > 0) {
      return response.data[0].q;
    } else {
      return "Stay motivated!";
    }
  } catch (error) {
    console.error("Failed to fetch motivational quote:", error);
    return "Stay motivated!";
  }
}


async function sendMotivationalEmail(user, quote) {
  const mailOptions = {
    from:  {
      name : 'Web Wizard',
      address : process.env.EMAIL
    },
    to: user.email,
    subject: "Your Daily Motivation",
    text: `Hello ${user.firstname},\n\n${quote}\n\nStay motivated!`,
    
  };
  try {
  await transporter.sendMail(mailOptions);
  console.log('Email Has Been Sent');
  }
  catch(error){
    console.log('Error in sending email : ' + error);
  }
}

app.get("/", (req,res)=> {
   res.sendFile(__dirname+'/public/signup.html')
});

app.post("/", async (req,res)=> {
  console.log(req.body);
  const {firstname, lastname, email} = req.body;
  const result = await User.find({email:email});
  if(result.length > 0) {
    res.sendFile(__dirname+'/public/failure.html');
  }
  else if(!firstname || !email) {
    res.sendFile(__dirname+'/public/failure.html');
  }
  else{
  const newUser = new User(req.body);
  newUser.save();
   try {
  await sendMotivationalEmail(req.body, "Thank you for registering in our mail motivo. We will send motivation quote to you at 5:00 AM Everyday");
   }
   catch(error){
    console.log('Error in sending email : ' + error);
   }
  res.sendFile(__dirname+'/public/success.html')
  }
});



cron.schedule("00 20 * * *", async () => {
  console.log("Sending daily motivational emails...");

  try {
    // Fetch a motivational quote
    const quote = await getMotivationalQuote();

    // Find all users in the database
    const users = await User.find().exec();

    // Send emails to all users
    for (const user of users) {
      await sendMotivationalEmail(user, quote);
    }

    console.log("Motivational emails sent successfully!");
  } catch (error) {
    console.error("Error occurred while sending motivational emails:", error);
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


