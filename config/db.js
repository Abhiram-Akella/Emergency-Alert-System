var mongoose = require('mongoose');

const ConnectDB = async()=>{
    try{
        await mongoose.connect('mongodb://127.0.0.1:27017/projectdb');
        console.log('MongoDB successfully connected');
    } catch(err){
        console.log(err.message);
        process.exit(1);
    }
}
module.exports = ConnectDB;