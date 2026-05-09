import { Resend } from "resend";

import { ENV } from "./env.js";

export const resendClient = new Resend(ENV.RESEND_API_KEY);

if (!ENV.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is missing! Check Railway Variables.");
}

export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};
