const {Client} = require("pg")
const express = require("express")
const app = express();
app.use(express.json())
app.use(express.static(__dirname));

const client = new Client({
    user: "postgres",
    password: "penguin", 
    host: "localhost",
    port: "5432",
    database: "griffin"
})

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
    const result = await getSpecificCoordinate(reqJson.x, reqJson.y);
    console.log(result);
    res.setHeader("content-type", "application/json")
    res.send(JSON.stringify(result))
})

/**
 * Accept http POST call and create a coordinate
 */
app.post('/coordinates', async (req, res) =>{
    let result = {}
    try{
        const reqJson = req.body;
        await addCoordinate(reqJson.x, reqJson.y, reqJson.name, reqJson.visited);
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
        await deleteCoordinate(reqJson.x, reqJson.y);
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
    const sucCreate = await addCoordinate(-1,-1,'test',false);
    console.log(`Add was ${sucCreate}`);
    coordinates = await readCoordinates();
    console.table(coordinates);
    const sucDelete = await deleteCoordinate(-1, -1);
    console.log(`Delete was ${sucDelete}`);
    coordinates = await readCoordinates();
    console.table(coordinates);
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
        const results = await client.query("SELECT * FROM coordinates")
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
async function getSpecificCoordinate(x, y){
    try {
        console.log(x + " " + y)
        const results = await client.query("SELECT * FROM coordinates WHERE x = " + x + " AND y = " + y);
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
async function addCoordinate(x, y, name, visited){
    try {
        console.log("add: " + x + " " + y)
        await client.query("INSERT INTO coordinates(x,y,name,visited) VALUES (" + x + "," + y + ",'" + name + "'," + visited + ")");
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
async function updateCoordinate(x, y, name, visited){
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
async function deleteCoordinate(x, y){
    try {
        console.log("delete" + x + ", " + y);
        await client.query("delete from coordinates where x = " + x + " AND y =" + y);
        return true;
    }
    catch(e){
        return false;
    }
}