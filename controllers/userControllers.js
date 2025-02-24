const User = require('../models/schema');

// Admin Controller
const admin = async(req,res)=>{
    res.render('admin-dashboard', { title: 'Admin Dashboard' });
}

// Get available responders
const getResponders = async (req, res) => {
    try {
        const responders = await User.find({ role: 'responder' })
            .select('_id name')
            .lean();
        res.json(responders);
    } catch (err) {
        console.error('Error fetching responders:', err);
        res.status(500).json({ error: 'Failed to fetch responders' });
    }
};

// Responder Controller
const responder = async(req,res)=>{
    res.render('responder-dashboard', { title: 'Responder Dashboard' });
}

// User Controller
const user = async(req,res)=>{
    res.render('user-dashboard', { title: 'User Dashboard' });
}

module.exports = {admin, responder, user, getResponders};
