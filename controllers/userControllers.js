const User = require('../models/schema');
const EmergencyReports = require('../models/emergencyreports');

// Admin Controllers
const admin = async(req,res)=>{
    res.render('admin-dashboard', { title: 'Admin Dashboard' });
}

// Get available responders
const getResponders = async (req, res) => {
    try {
        const responders = await User.find({ role: 'responder' }).select("name responderType");
        res.json(responders);
    } catch (err) {
        console.error('Error fetching responders:', err);
        res.status(500).json({ error: 'Failed to fetch responders' });
    }
};

// Responder Controllers
const responder = async(req,res)=>{
    res.render('responder-dashboard', { title: 'Responder Dashboard' });
}

const responderType = async(req,res)=>{
    try{
        const {type} = req.query;
        if(!type){
            return res.status(400).json({error: 'Responder type is required'});
        }
        const responders = await User.find({ role: 'responder', responderType: type }).select("name responderType location");
        res.json(responders);
    } catch(err){
        console.error('Error fetching responders:', err);
        res.status(500).json({ error: 'Failed to fetch responders' });
    }
}

// User Controllers
const user = async(req,res)=>{
    res.render('user-dashboard', { title: 'User Dashboard' });
}

const getUserReports = async(req,res)=>{
    try{
        const id = req.user.id;
        const reports = await EmergencyReports.find({ user: id })
        .populate("user","name")
        .populate("assignedResponder","name");
        res.json(reports);
    }catch(err){
        console.error('Error fetching user reports:', err);
        res.status(500).json({ error: 'Failed to fetch user reports' });
    }
}

module.exports = {admin, responder,responderType, user, getResponders, getUserReports};  // Exporting the controllers
