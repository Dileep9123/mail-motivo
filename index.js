const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const axios = require("axios");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect("mongodb://localhost/your-database-name", {
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
  service: "gmail",
  auth: {
    user: Email,
    pass: Password,
  },
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


function sendMotivationalEmail(user, quote) {
  const mailOptions = {
    from: "your-email@example.com",
    to: user.email,
    subject: "Your Daily Motivation",
    text: `Hello ${user.firstname},\n\n${quote}\n\nStay motivated!`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Error sending email to ${user.email}:`, error);
    } else {
      console.log(`Motivational email sent to ${user.email}`);
    }
  });
}

cron.schedule("0 5 * * *", async () => {
  console.log("Sending daily motivational emails...");

  // Fetch a motivational quote
  const quote = await getMotivationalQuote();

  // Find all users in the database
  User.find({}, (err, users) => {
    if (err) {
      console.error("Error fetching users from the database:", err);
      return;
    }

    // Send motivational emails to all users
    users.forEach((user) => sendMotivationalEmail(user, quote));
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


