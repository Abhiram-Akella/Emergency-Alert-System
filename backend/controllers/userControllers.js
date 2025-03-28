const User = require('../models/schema');
const EmergencyReports = require('../models/emergencyreports');

// Admin Controllers
const admin = async(req,res)=>{
    res.json({ user: {role:"admin"} });
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

// Get analytics data
const getAnalytics = async (req, res) => {
    try {
        const { timeFilter } = req.query;
        let dateFilter = {};

        // Apply time filter
        if (timeFilter) {
            const now = new Date();
            switch (timeFilter) {
                case 'weekly':
                    dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
                    break;
                case 'monthly':
                    dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
                    break;
                case 'yearly':
                    dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
                    break;
            }
        }

        // Fetch all reports based on filter
        const reports = await EmergencyReports.find(dateFilter)
            .populate('user', 'name')
            .populate('assignedResponder', 'name');

        // Calculate type distribution
        const typeDistribution = await EmergencyReports.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Calculate status distribution
        const statusDistribution = await EmergencyReports.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Calculate average response times (time between creation and assignment)
        const responseTimesByType = await EmergencyReports.aggregate([
            { 
                $match: { 
                    ...dateFilter,
                    assignedResponder: { $exists: true, $ne: null }
                } 
            },
            {
                $group: {
                    _id: '$type',
                    avgResponseTime: {
                        $avg: {
                            $divide: [
                                { $subtract: ['$updatedAt', '$createdAt'] },
                                60000 // Convert to minutes
                            ]
                        }
                    }
                }
            }
        ]);

        // Calculate average resolution times for resolved reports
        const resolutionTimesByType = await EmergencyReports.aggregate([
            { 
                $match: { 
                    ...dateFilter,
                    status: 'Resolved'
                } 
            },
            {
                $group: {
                    _id: '$type',
                    avgResolutionTime: {
                        $avg: {
                            $divide: [
                                { $subtract: ['$updatedAt', '$createdAt'] },
                                60000 // Convert to minutes
                            ]
                        }
                    }
                }
            }
        ]);

        // Calculate total reports
        const totalReports = await EmergencyReports.countDocuments(dateFilter);

        // Calculate active reports
        const activeReports = await EmergencyReports.countDocuments({
            ...dateFilter,
            status: { $in: ['Pending', 'Assigned', 'In Progress'] }
        });

        // Calculate resolved reports
        const resolvedReports = await EmergencyReports.countDocuments({
            ...dateFilter,
            status: 'Resolved'
        });

        res.json({
            typeDistribution,
            statusDistribution,
            responseTimesByType,
            resolutionTimesByType,
            totalReports,
            activeReports,
            resolvedReports,
            reports
        });
    } catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
};

// Responder Controllers
const responder = async(req,res)=>{
    res.json({user:{role:"responder"}});
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
    return res.json({user:req.user});
}

const getUserReports = async(req,res)=>{
    try{
        const id = req.user.id;
        const reports = await EmergencyReports.find({user : id})
        .populate("user","name")
        .populate("assignedResponder","name")
        .sort({ createdAt: -1 });
        return res.status(200).json({"reports":reports});
    }catch(err){
        console.error('Error fetching user reports:', err);
        res.status(500).json({ error: 'Failed to fetch user reports'});
    }
}

const getResources = (req, res) => {
    const resources = [
        {
            category: "Emergency Contacts",
            items: [
                { title: "National Emergency Number", description: "Dial 112 for all types of emergencies.", link: "tel:112" },
                { title: "Fire Department", description: "Dial 101 to report fire incidents.", link: "tel:101" },
                { title: "Medical Emergency", description: "Dial 108 for an ambulance.", link: "tel:108" }
            ]
        },
        {
            category: "First Aid & Medical Guides",
            items: [
                { title: "CPR Guide", description: "Step-by-step guide for performing CPR.", link: "https://www.redcross.org/cpr" },
                { title: "Burn Injury First Aid", description: "How to treat minor and severe burns.", link: "https://www.mayoclinic.org/first-aid/burns" }
            ]
        },
        {
            category: "Disaster Preparedness",
            items: [
                { title: "Earthquake Safety", description: "How to stay safe before, during, and after an earthquake.", link: "https://www.ready.gov/earthquakes" },
                { title: "Flood Preparedness", description: "What to do before and during a flood.", link: "https://www.redcross.org/flood-safety" }
            ]
        },
        {
            category: "Crime Prevention & Personal Safety",
            items: [
                { title: "Self-Defense Tips", description: "Basic self-defense techniques to stay safe.", link: "https://www.selfdefense.com" },
                { title: "Online Safety Tips", description: "How to protect yourself from cybercrime.", link: "https://staysafeonline.org" }
            ]
        },
        {
            category: "Fire Safety Guidelines",
            items: [
                { title: "Home Fire Safety", description: "How to prevent fires at home.", link: "https://www.nfpa.org/Home-Fire-Safety" },
                { title: "Fire Extinguisher Usage", description: "Guide on how to use a fire extinguisher.", link: "https://www.osha.gov/fire-extinguishers" }
            ]
        },
        {
            category: "Mental Health & Support Helplines",
            items: [
                { title: "Suicide Prevention Hotline", description: "Dial 988 for mental health support.", link: "tel:988" },
                { title: "Domestic Violence Support", description: "Dial 800-799-7233 for confidential help.", link: "tel:8007997233" }
            ]
        }
    ];

    res.json(resources);
};

module.exports = {admin,getAnalytics ,responder,responderType, user, getResponders, getUserReports, getResources};