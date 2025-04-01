var mongoose = require('mongoose');

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