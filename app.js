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
app.use(fileUpload());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
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

//check username is valid or not

//validate username in db
const checkUserName = async (request, response, next) => {
  const { username } = request.body;
  const userPresentQuery = "SELECT username FROM users WHERE username = ?";

  try {
    const dbResponse = await new Promise((resolve, reject) => {
      connection.query(userPresentQuery, [username], (error, results) => {
        if (error) {
          console.error("Error executing user presence query:", error);
          reject(error);
          return;
        }
        resolve(results[0]);
      });
    });

    if (!dbResponse || !dbResponse.username) {
      response.status(400).send("Invalid user");
      return;
    }

    const user = dbResponse.username;
    if (user === username) {
      request.username = username;
      next();
    } else {
      response.status(400).send("Invalid user");
    }
  } catch (error) {
    console.error("Error checking user name:", error);
    response.status(500).send("Internal Server Error");
  }
};

//validate password in db
const checkPassword = async (request, response, next) => {
  const { username } = request;
  const { password } = request.body;
  const getPasswordQuery = "SELECT password FROM users WHERE username = ?";

  try {
    const dbResponse = await new Promise((resolve, reject) => {
      connection.query(getPasswordQuery, [username], (error, results) => {
        if (error) {
          console.error("Error executing get password query:", error);
          reject(error);
          return;
        }
        resolve(results[0]);
      });
    });

    if (!dbResponse || !dbResponse.password) {
      response.status(400).send("Invalid password");
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, dbResponse.password);
    if (isPasswordValid) {
      request.password = password;
      next();
    } else {
      response.status(400).send("Invalid password");
    }
  } catch (error) {
    console.error("Error checking password:", error);
    response.status(500).send("Internal Server Error");
  }
};

app.get("/", (req, res) => res.type('html').send(html));

// Route to handle login requests


app.get("/get", (request, response) => {
  response.send("you are hacked");
});

const verifyToken = async (request, response, next) => {
  const authHeader = request.headers["authorization"];

  if (!authHeader) {
    response.status(401).send("Invalid JWT Token: Token missing");
    return;
  }

  const jwtToken = authHeader.split(" ")[1];

  if (!jwtToken) {
    response.status(401).send("Invalid JWT Token: Token missing");
    return;
  }

  try {
    const payload = await jwt.verify(jwtToken, "SECRET_KEY");
    request.username = payload.username;
    next();
  } catch (error) {
    console.error("Error verifying JWT token:", error);
    response.status(401).send("Invalid JWT Token");
  }
};

app.post("/register", async (request, response) => {
  const { username, password, email } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if the 'user' table exists, if not, create it
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL
    )
  `;

  connection.query(createTableQuery, async (tableError) => {
    if (tableError) {
      console.error("Error creating 'user' table:", tableError);
      response.status(500).send("Internal Server Error");
      return;
    }

    const createQuery =
      "INSERT INTO users(username, password, email) VALUES (?, ?, ?)";

    if (password.length < 6) {
      response.status(400).send("Password is too short");
      return;
    }

    try {
      connection.query(
        createQuery,
        [username, hashedPassword, email],
        async (error) => {
          if (error) {
            console.error("Error executing registration query:", error);
            response.status(500).send("Internal Server Error");
            return;
          }

          const payload = { username: username };
          const jwtToken = await jwt.sign(payload, "SECRET_KEY");

          response.json({ message: "User created successfully", jwtToken });
          console.log("User created");
        }
      );
    } catch (error) {
      console.error("Error creating user:", error);
      response.status(500).send("Internal Server Error");
    }
  });
});

app.post("/login", checkUserName, checkPassword, async (req, res) => {
  const { username } = req.body;
  const query = "SELECT username, password FROM users WHERE username = ?";

  connection.query(query, [username], async (err, results) => {
    try {
      if (err) {
        console.error("Error executing login query: ", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length > 0) {
        const dbPassword = results[0].password;

        // Now you have the hashed password from the database
        const isPasswordValid = await bcrypt.compare(req.password, dbPassword);

        if (isPasswordValid) {
          const payload = { username: username };
          const jwtToken = jwt.sign(payload, "SECRET_KEY");
          return res.json({ jwtToken });
          console.log("success");
        } else {
          return res
            .status(400)
            .json({ error: "Invalid username or password" });
        }
      } else {
        return res.status(400).json({ error: "Invalid username or password" });
      }
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

app.post("/login1", async (req, res) => {
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
