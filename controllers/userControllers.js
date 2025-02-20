// Admin Controller
const admin = async(req,res)=>{
    res.render('admin-dashboard', { title: 'Admin Dashboard' });
}

// Responder Controller
const responder = async(req,res)=>{
    res.render('responder-dashboard', { title: 'Responder Dashboard' });
}

// User Controller
const user = async(req,res)=>{
    res.render('user-dashboard', { title: 'User Dashboard' });
}

module.exports = {admin,responder,user};
