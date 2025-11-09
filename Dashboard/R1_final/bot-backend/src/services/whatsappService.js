const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Send WhatsApp message via Twilio
 */
const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
  try {
    // Format phone number for WhatsApp
    const formattedNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const messageData = {
      from: whatsappNumber,
      to: formattedNumber,
      body: message,
    };

    // Add media if provided
    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(messageData);

    console.log(`✅ WhatsApp message sent: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send WhatsApp message with location (for affected areas map)
 */
const sendWhatsAppLocation = async (to, latitude, longitude, name, address) => {
  try {
    const formattedNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Send location message
    const result = await client.messages.create({
      from: whatsappNumber,
      to: formattedNumber,
      body: `📍 ${name || 'Affected Area'}\n${address || ''}`,
      // Note: Twilio WhatsApp doesn't support location sharing directly
      // You'll need to send a Google Maps link instead
      body: `📍 Affected Area\n${name || ''}\n${address || ''}\n\nView on map: https://maps.google.com/?q=${latitude},${longitude}`,
    });

    console.log(`✅ WhatsApp location sent: ${result.sid}`);
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('❌ WhatsApp location error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppLocation,
};
