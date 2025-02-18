// Admin Controller
const admin = async(req,res)=>{
    res.json({message:"Welcome Admin!"});
}

// Responder Controller
const responder = async(req,res)=>{
    res.json({message:"Welcome Responder!"});
}

// User Controller
const user = async(req,res)=>{
    res.json({message:"Welcome User!"});
}

module.exports = {admin,responder,user};