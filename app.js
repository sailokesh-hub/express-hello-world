const express = require("express");
const app = express();
const mysql = require('mysql');
const cors = require('cors');

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const fs = require("fs");

const port = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://24hr7comit.site');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.options('/login', (req, res) => {
  res.sendStatus(200);
});


const connection = mysql.createConnection({
  host: 'srv1327.hstgr.io',
  user: 'u540642530_SaiLokesh',
  password: '24Hr7@45it',
  database: 'u540642530_User_Forms',
});

app.get("/", (req, res) => res.type('html').send(html));

// Route to handle login requests


app.get("/get", (request, response) => {
  response.send("you are hacked");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  try {
    const [results] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

    // Check if user exists and password matches
    const user = results[0]; // Assuming email is unique
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Authentication successful
    res.status(200).json({ success: true, message: "Login successful", redirectTo: "/Services/services.html" });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});


app.post('/submit-form', async (req, res) => {
  try {
    const formData = req.body;

    // Use formData to insert data into the MySQL database
    const [result] = await connection.query(
      'INSERT INTO form_data (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [formData.name, formData.email, formData.phone, formData.message]
    );

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Render!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Hello from Render!
    </section>
  </body>
</html>
`
