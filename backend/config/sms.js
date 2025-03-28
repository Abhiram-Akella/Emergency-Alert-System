const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (to, message) => {
    try {
        await client.messages.create({
            body: message,
            from: twilioNumber,
            to
        });
        console.log(`SMS sent to ${to}`);
    } catch (error) {
        console.error(`Error sending SMS to ${to}:`, error);
    }
};

module.exports = { sendSMS };
