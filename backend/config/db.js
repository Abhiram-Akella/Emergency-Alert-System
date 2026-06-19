var mongoose = require('mongoose');
const { Resolver } = require('dns');

// Node.js v24 changed DNS resolver behavior — system DNS fails SRV lookups
// for mongodb+srv:// URIs. Override with Google's public DNS which resolves them correctly.
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const ConnectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB successfully connected');
    } catch(err){
        console.log(err.message);
        process.exit(1);
    }
}
module.exports = ConnectDB;