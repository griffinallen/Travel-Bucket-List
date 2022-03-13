require('dotenv').config()
const {Client} = require("pg")
const express = require("express")
const app = express();
app.use(express.json())
app.use(express.static(__dirname));

const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASS, 
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
})

console.log(client)

app.get('/', (req, res) => res.sendFile(`${__dirname}/index.html`))

/**
 * Accept http GET call and get all coordinates
 */
app.get('/coordinates', async (req, res) =>{
    const rows = await readCoordinates();
    res.setHeader("content-type", "application/json")
    res.send(JSON.stringify(rows))
})

/**
 * Accept http GET call and get a coordinate matching given x and y values
 */
app.get('/specificCoordinate', async (req, res) =>{
    console.log("MADE IT")
    const reqJson = req.query;
    console.log(req.query);
    const result = await getSpecificCoordinate(reqJson.lng, reqJson.lat);
    console.log(result);
    res.setHeader("content-type", "application/json")
    res.send(JSON.stringify(result))
})

/**
 * Accept http POST call and create a coordinate
 */
app.post('/coordinates', async (req, res) =>{
    console.log("post received")
    let result = {}
    try{
        const reqJson = req.body;
        await addCoordinate(reqJson.name, reqJson.lng, reqJson.lat);
        result.success = true;
    }
    catch(e){
        result.success=false;
    }
    finally{
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(result))
    }
})


/**
 * Accept http PUT call and update a coordinate
 */
app.put('/coordinates', async (req, res) =>{
    let result = {}
    try{
        const reqJson = req.body;
        await updateCoordinate(reqJson.x, reqJson.y, reqJson.name, reqJson.visited);
        result.success=true;
    }
    catch(e){
        result.success=false;
    }
    finally{
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(result))
    }
})

/**
 * Accept http DELETE call and delete coordinate
 */
app.delete('/coordinates', async (req, res) =>{
    let result = {}
    try{
        const reqJson = req.body;
        await deleteCoordinate(reqJson.name);
        result.success=true;
    }
    catch(e){
        result.success=false;   
    }
    finally{
        res.setHeader("content-type", "application/json")
        res.send(JSON.stringify(result))
    }
})

// listen to port 8080
app.listen(8080, () => console.log("Web server is listening on port 8080"))


execute()

/**
 * Start the program, connect to database and test CRUD
 */
async function execute(){
    await connectToDB()
    console.log("connection successful")
    var coordinates = await readCoordinates();
    console.table(coordinates);
    const sucCreate = await addCoordinate('test',false);
    console.log(`Add was ${sucCreate}`);
    coordinates = await readCoordinates();
    console.table(coordinates);
    //const sucDelete = await deleteCoordinate(-1, -1);
    //console.log(`Delete was ${sucDelete}`);
    //coordinates = await readCoordinates();
    //console.table(coordinates);
}

/**
 * Connect to the database
 */
async function connectToDB(){
    try {
        await client.connect();
    }
    catch(e){
        console.error(`Connection failed ${e}`)
    }
}

/**
 * Retrieving the bucket list from the database
 * @return {Array} true if we get the bucket list, false otherwise
 */
async function readCoordinates(){
    try {
        const results = await client.query("SELECT name, ST_X (ST_Transform (geom, 4326)) AS lng, ST_Y (ST_Transform (geom, 4326)) AS lat FROM coordinates")
        console.log(results.rows)
        return results.rows;
    }
    catch(e){
        console.error(`read failed ${e}`)
        return [];
    }
}


/**
 * Get an item or items that match and x and y coordinate
 * @param {*} x x coordinate of item
 * @param {*} y y coordinate of item
 * @return {Array} true if we get a coordinate from the bucket list, false otherwise
 */
async function getSpecificCoordinate(name){
    try {
        const results = await client.query("SELECT * FROM coordinates WHERE namne = '" + name + "'");
        return results.rows;
    }
    catch(e){
        console.error(`get failed ${e}`)
        return [];
    }
}



/**
 * Add item to bucket list
 * @param {*} x x coordinate
 * @param {*} y y coordinate
 * @param {String} name name of place
 * @param {boolean} visited whether the place has been visited or not
 * @return {boolean} true if successfully added, false otherwise
 */
async function addCoordinate(name, lng, lat){
    try {
        console.log("add: " + lng + ", " + lat)
        //ST_Point(x, y)
        console.log("INSERT INTO coordinates(name,geom) VALUES ('" + name + "'," + "ST_Point(" + lng + ", " + lat + ")")
        await client.query("INSERT INTO coordinates(name,geom) VALUES ('" + name + "'," + "ST_Point(" + lng + ", " + lat + "))");
        return true;
    }
    catch(e){
        return false;
    }
}

/**
 * Update item in the bucket list
 * @param {*} x new x coordinate
 * @param {*} y new y coordinate
 * @param {String} name new name
 * @param {bool} visited new visited
 * @return {boolean} true if successfully updated, false otherwise
 */
async function updateCoordinate(name, geom){
    try {
        await client.query("UPDATE coordinates SET x = " + x + ", y = " + y +", name = '" + name + "', visited = " + visited + " WHERE x = " + x + " AND y = " + y);
        return true;
    }
    catch(e){
        return false;
    }
}


/**
 * Remove an item from the bucket list
 * @param {*} x x coordiate of item to remove
 * @param {*} y y coordinate of item to remove
 * @return {boolean} true if successfully deleted, false otherwise
 */
async function deleteCoordinate(name){
    try {
        console.log("delete " + name);
        await client.query("delete from coordinates where name = '" + name + "'");
        return true;
    }
    catch(e){
        return false;
    }
}