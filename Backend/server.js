const express = require("express");
const path = require("path");
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors=require('cors'); 
const app = express();
app.use(cors());
app.use(express.json())
const dbPath = path.join(__dirname, "database.db");



const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000, () => {
      console.log("Server Running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/", async (request, response) => {
    const getBooksQuery = `
      SELECT
        *
      FROM
         userneed;`;
    const booksArray = await db.all(getBooksQuery);
    response.send(booksArray);
  });

  app.post("/userneed/", async (request, response) => {
    const needRequests=request.body;
    const { postedDate, imageUrl1,imageUrl2,imageUrl3,title,description} = needRequests;
    
    const postNeedRueQuery = `INSERT INTO userneed
    (pdate,imgurl1,imgurl2,imgurl3,title,description)
     VALUES ('${postedDate}','${imageUrl1}','${imageUrl2}','${imageUrl3}','${title}','${description}');`;
    const needRequestsArray = await db.run(postNeedRueQuery);
    const needId=needRequestsArray.lastID;

    response.send({NeedsReqId:needId});
  });

//AdminPageDatabase

  app.get("/admin", async (request, response) => {
    const getAdminQuery = `
      SELECT
        *
      FROM
         adminlogin;`;
    const adminArray = await db.all(getAdminQuery);
    response.send(adminArray);
  });

  app.post("/adminpost/", async (request, response) => {
    const adminpost=request.body;
    const {userId, passWord} = adminpost;
    
    const postNeedRueQuery = `INSERT INTO adminlogin
    (userId,passWord)
     VALUES (${userId},'${passWord}');`;
    const needRequestsArray = await db.run(postNeedRueQuery);
    const needId=needRequestsArray.lastID;

    response.send({NeedsReqId:needId});
  });


  //NEW ADMIN PAGE


  app.post("/users/", async (request, response) => {
    const { userId, passWord,} = request.body;
    const hashedPassword = await bcrypt.hash(passWord, 10);
    const selectUserQuery = `SELECT * FROM adminlogin WHERE userId = ${userId}`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          adminlogin (userId,passWord) 
        VALUES 
          (
            ${userId}, 
            '${hashedPassword}'
            
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

  app.post("/login/", async (request, response) => {
    const { userId, passWord } = request.body;
    const selectUserQuery = `SELECT * FROM adminlogin WHERE userId = '${userId}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const isPasswordMatched = await bcrypt.compare(passWord, dbUser.passWord);
      if (isPasswordMatched === true) {
        const payload = {
          username: userId,
        };
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        response.send({ jwtToken });
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  });

//userpage

app.post("/usersign/", async (request, response) => {
  const { studentRegNo, nameOfStudent,passWord} = request.body;
  const hashedPassword = await bcrypt.hash(passWord, 10);
  const selectUserQuery = `SELECT * FROM userlogin WHERE studentregno = '${studentRegNo}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
   if(("LA"===studentRegNo.slice(3,5).toUpperCase() || "FA"===studentRegNo.slice(3,5).toUpperCase()) && (studentRegNo.length === 10 )){ 
    const createUserQuery = `
      INSERT INTO 
        userlogin (studentregno, nameofstudent,password) 
      VALUES 
        (
          '${studentRegNo}', 
          '${nameOfStudent}',
          '${hashedPassword}'
        )`;

        const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with  ${newUserId}`);
   }
    
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});


app.get("/user", async (request, response) => {
  const getAdminQuery = `
    SELECT
      *
    FROM
       userlogin;`;
  const adminArray = await db.all(getAdminQuery);
  response.send(adminArray);
});

app.post("/userlogin/", async (request, response) => {
  const { studentRegNo, passWord } = request.body;
  const selectUserQuery = `SELECT * FROM userlogin WHERE studentregno = '${studentRegNo}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(passWord, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        user: studentRegNo,
      };
      const jwtToken = jwt.sign(payload, "MY_KEY");
      response.send({ jwt });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});


app.get("/userreqget/", async (request, response) => {
  const getBooksQuery = `
    SELECT
      *
    FROM
       userreq;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

app.post("/userreq/", async (request, response) => {
  const needRequests=request.body;
  const {id, postedDate, imageUrl1,imageUrl2,imageUrl3,title,description,} = needRequests;
  
  const postNeedRueQuery = `INSERT INTO userreq
  (postdate,imageurl1,imageurl2,imageurl3,title,description,id)
   VALUES ('${postedDate}','${imageUrl1}','${imageUrl2}','${imageUrl3}','${title}','${description}','${id}');`;
  const needRequestsArray = await db.run(postNeedRueQuery);
  const needId=needRequestsArray.lastID;

  response.send({NeedsReqId:needId});
});


app.post("/needofreq/", async (request, response) => {
  const needRequests=request.body;
  const {id, postdate, imageurl1,imageurl2,imageurl3,title,description,} = needRequests;
  
  const postNeedRueQuery = `INSERT INTO needofreq
  (id,posteddate,imageurl1,imageurl2,imageurl3,title,description)
   VALUES ('${id}','${postdate}','${imageurl1}','${imageurl2}','${imageurl3}','${title}','${description}');`;
  const needRequestsArray = await db.run(postNeedRueQuery);
  const needId=needRequestsArray.lastID;

  response.send({NeedsReqId:needId});
});



app.get("/needofreqget/", async (request, response) => {
  const getBooksQuery = `
    SELECT
      *
    FROM
       needofreq;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});