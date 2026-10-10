// STEP-1 : IMPORT MONGOOSE PACKAGE
const mongoose = require('mongoose');

// Database Connection URL
const uri = "mongodb://singmeychy_db_user:mey1234@ac-1kowxpb-shard-00-00.cku8rka.mongodb.net:27017,ac-1kowxpb-shard-00-01.cku8rka.mongodb.net:27017,ac-1kowxpb-shard-00-02.cku8rka.mongodb.net:27017/aupp2026CN?ssl=true&replicaSet=atlas-j323u9-shard-0&authSource=admin&appName=MyCluster1"

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
    try {
        // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
        // STEP-2 : ESTABLISH CONNECTION WITH MONGODB DATABASE THROUGH MONGOOSE
        await mongoose.connect(uri, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await mongoose.disconnect();
    }
}
run().catch(console.dir);

// STEP-3 : EXPORT MODULE mongoose because we need it in other JS file
module.exports = mongoose;
