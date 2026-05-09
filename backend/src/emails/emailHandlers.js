import { resendClient, sender } from "../lib/resend.js";
import { createEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientUrl) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to PulseChat!",
    html: createEmailTemplate(name, clientUrl),
  });

  if (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send welcome email");
  }

  console.log("Email sent successfully:", data);
}