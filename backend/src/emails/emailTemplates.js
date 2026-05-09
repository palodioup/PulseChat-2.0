export function createEmailTemplate(name, clientUrl) {
 return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333333;">Welcome to PulseChat, ${name}!</h2>
            <p style="color: #555555;">Thank you for signing up for PulseChat. We're excited to have you on board!</p>
            <p style="color: #555555;">To get started, please click the button below to verify your email address and complete your registration:</p>
            <a href="${clientUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: #ffffff; text-decoration: none; border-radius: 4px;">Open PulseChat</a>
            <p style="color: #555555; margin-top: 20px;">If you did not sign up for PulseChat, please ignore this email.</p>
            <p style="color: #555555; margin-top: 20px;">Best regards,<br/>The PulseChat Team</p>
        </div>
    </div>                  

 `
}