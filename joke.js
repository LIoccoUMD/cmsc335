  const axios = require('axios'); // allow creation of http servers and requests / repsonses WAY EASIER than 'http'
  const express = require("express"); // import Express framework
  const app = express(); // access to routes, handling HTTP requests
  const path = require("path");
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const { url } = require('inspector');
  const portNumber = 5000;
  const uri = "mongodb+srv://liocco:thisPassword@cluster0.pxwonlg.mongodb.net/?retryWrites=true&w=majority";
  const databaseAndCollection = {db: "randomJokes", collection:"jokes"};
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


  app.use(express.urlencoded({extended: true}));
  app.use(express.static(__dirname));
  app.set("view engine", "ejs");
  app.set("views", __dirname + "/templates");
  // Express handling HTTP GET request to root URL of the application
  app.get("/", (request, response) => {
    response.render("index"); // Make "index.ejs" the root
  });
  
  // one Joke route
  app.get("/singleJoke", async (request, response) => {
    try {
      const jokeResponse = await axios.get("https://official-joke-api.appspot.com/random_joke");
      const joke = {
        setup: jokeResponse.data.setup,
        punchline: jokeResponse.data.punchline
      };     
      response.render("singleJoke", { joke })
    } catch (err) {
      console.error("Joke was not funny:", err);
      response.status(500).send("Joke was not funny :(");
    }
  });

  // multipleJokes route
  app.get("/multipleJokes", async (request, response) => {
    try {
      const jokeResponse = await axios.get("https://official-joke-api.appspot.com/random_ten");
      jokesArray = jokeResponse.data
      const joke = jokesArray.shift();     
      response.render("multipleJokes", { jokes: jokesArray, currJokeIndex: 0 })
    } catch (err) {
      console.error("Joke was not funny:", err);
      response.status(500).send("Joke was not funny :(");
    }
  });
  
  // multipleJokes route
  app.post("/index", async (request, response) => {
    const joke = {
      setup: request.body.setup,
      punchline: request.body.punchline
    };

    storeCustomJoke(joke);
    response.render("confirmation", { returnLink: "/"});
  });
  
  // Start the server and interpret command line commands
  app.listen(portNumber, () => {
    console.log(`Web server started and running at http://localhost:${portNumber}`);
    commandLineInterpreter();
  });
  
  async function storeCustomJoke(joke) {
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db(databaseAndCollection.db);
      const jokesCollection = db.collection(databaseAndCollection.collection);

      await jokesCollection.insertOne(joke);
      console.log("Joke successfully added!");
    } catch (error) {
      console.error("Joke did not get any laughs :(", error);
    } finally {
      await client.close();
    }
  }


  async function storeJoke() {
    const client = new MongoClient(uri)

    try {
      await client.connect(); // connect to mongoDB
      const db = client.db(databaseAndCollection.db)

      const response = await axios.get("https://official-joke-api.appspot.com/random_joke") // get random joke from api
      const joke = response.data; // store joke in var

      const jokesCollection = db.collection("jokes")
      await jokesCollection.insertOne(joke);
      console.log("Joke successfully stored!")
    } catch (error) {
      console.error("Joke was not funny :(", error);
    } finally {
      await client.close();
    }
  }

  async function storeTenJokes() {
    const client = new MongoClient(uri)

    try {
      await client.connect(); // connect to mongoDB
      const db = client.db(databaseAndCollection.db)

      const response = await axios.get("https://official-joke-api.appspot.com/random_ten") // get random joke from api
      const joke = response.data; // store joke in var

      const jokesCollection = db.collection("jokes")
      await jokesCollection.insertMany(joke);
      console.log("Jokes successfully stored!")
    } catch (error) {
      console.error("Jokes were not funny enough :(", error);
    } finally {
      await client.close();
    }
  }

  // Makes it easy to start and stop server
  function commandLineInterpreter() {
    const commandLine = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
  });
  
  commandLine.question(`Type oneJoke for a single joke, jokes for ten jokes, or stop to shutdown the server: `, input => { 
    if (input === "oneJoke") {
      storeJoke();
      commandLine.close();
      commandLineInterpreter();
    } else if (input === "jokes") {
      storeTenJokes();
      commandLine.close();
      commandLineInterpreter();
    }
      else if (input === "stop") {
      console.log("Shutting down the server");
      process.exit(0);
    } else {
      console.log(`Invalid command: ${input}`);
      commandLine.close();
      commandLineInterpreter();
    }
  })
  
  }; // end of commandLineInterpreter();
