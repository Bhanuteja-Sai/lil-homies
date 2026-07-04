const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for your React app address
app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());

// Main incoming pipeline handler for the contact form submissions
app.post('/api/inquire', (req, res) => {
    const { name, email, scope, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing critical parameters.' });
    }

    // Console logging incoming briefs for direct local visualization
    console.log(`\n--- 📥 NEW STUDIO INQUIRY RECEIVED ---`);
    console.log(`Client: ${name} (${email})`);
    console.log(`Allocated Budget Scale: ${scope}`);
    console.log(`Brief Parameters: "${message}"`);
    console.log(`--------------------------------------\n`);

    // Pro-Tip: Here is where you hook up mail distribution (like nodemailer) or discord/slack layout webhooks later
    return res.status(200).json({ success: true, message: 'Brief parsed and archived.' });
});

app.listen(PORT, () => {
    console.log(`[B1+M Secure Core Engine running on port ${PORT}]`);
});