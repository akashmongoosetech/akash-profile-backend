const nodemailer = require("nodemailer");

// Helper function to escape HTML characters
const escapeHtml = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
};

// Helper function to escape HTML but preserve newlines for display
const escapeHtmlPlain = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Create transporter
const createTransporter = () => {
  // Validate email configuration
  const emailHost = process.env.EMAIL_HOST;
  const emailUser = process.env.EMAIL_USER;
  // Remove spaces from password in case user accidentally included them
  const emailPass = process.env.EMAIL_PASS
    ? process.env.EMAIL_PASS.replace(/\s/g, "")
    : "";
  const emailFrom = process.env.EMAIL_FROM;

  if (!emailHost || !emailUser || !emailPass || !emailFrom) {
    console.error("❌ Email configuration is incomplete!");
    console.error(
      "📧 Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM",
    );
    console.error(`📧 Current values:`);
    console.error(`   EMAIL_HOST: ${emailHost || "NOT SET"}`);
    console.error(`   EMAIL_USER: ${emailUser || "NOT SET"}`);
    console.error(
      `   EMAIL_PASS: ${emailPass ? "***" + emailPass.slice(-4) : "NOT SET"}`,
    );
    console.error(`   EMAIL_FROM: ${emailFrom || "NOT SET"}`);
    throw new Error(
      "Email configuration is incomplete. Please set environment variables.",
    );
  }

  console.log("📧 Creating email transporter with:");
  console.log(`   Host: ${emailHost}`);
  console.log(`   Port: ${process.env.EMAIL_PORT || 587}`);
  console.log(`   User: ${emailUser}`);
  console.log(`   From: ${emailFrom}`);

  return nodemailer.createTransport({
    host: emailHost,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
    logger: true,
  });
};

// Email templates
const emailTemplates = {
  contactNotification: (contactData) => ({
    subject: `New Contact Form Submission: ${escapeHtmlPlain(contactData.subject)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Contact Details</h3>
          <p><strong>Name:</strong> ${escapeHtmlPlain(contactData.name)}</p>
          <p><strong>Email:</strong> ${escapeHtmlPlain(contactData.email)}</p>
          ${contactData.mobile ? `<p><strong>Mobile:</strong> ${escapeHtmlPlain(contactData.mobile)}</p>` : ""}
          <p><strong>Subject:</strong> ${escapeHtmlPlain(contactData.subject)}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
            ${escapeHtml(contactData.message)}
          </div>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            This is an automated notification from your portfolio website contact form.
          </p>
        </div>
      </div>
    `,
  }),

  contactConfirmation: (contactData) => ({
    subject: `Thank you for contacting me - ${escapeHtmlPlain(contactData.subject)}`,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Thank You for Contacting Akash Raikwar</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#f1f5f9;
  font-family:Arial, Helvetica, sans-serif;
  color:#0f172a;
">

  <!-- Main Wrapper -->
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background-color:#f1f5f9; margin:0; padding:30px 15px;"
  >
    <tr>
      <td align="center">

        <!-- Email Container -->
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width:650px;
            background-color:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 10px 35px rgba(15,23,42,0.08);
          "
        >

          <!-- ========================= -->
          <!-- HERO / BANNER -->
          <!-- ========================= -->

          <tr>
            <td style="padding:0;">

              <!--
                Replace this placeholder URL with your actual banner image.
                Recommended size: 1300 x 500 px
              -->

              <img
                src="https://ik.imagekit.io/sentyaztie/ChatGPT%20Image%20Sep%203,%202026,%2012_51_07%20AM.png"
                alt="Akash Raikwar - Software Engineer"
                width="650"
                style="
                  display:block;
                  width:100%;
                  max-width:650px;
                  height:auto;
                  border:0;
                "
              >

            </td>
          </tr>


          <!-- ========================= -->
          <!-- BRAND HEADER -->
          <!-- ========================= -->

          <tr>
            <td style="padding:30px 35px 15px 35px;">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>

                  <!-- Profile Image -->

                  <td
                    width="75"
                    valign="middle"
                    style="padding-right:18px;"
                  >

                    <!--
                      Replace this placeholder with your actual profile image.
                      Recommended size: 150 x 150 px
                    -->

                    <img
                      src="https://ik.imagekit.io/sentyaztie/cropped_circle_image.png?updatedAt=1785927209061"
                      alt="Akash Raikwar"
                      width="70"
                      height="70"
                      style="
                        display:block;
                        width:70px;
                        height:70px;
                        border-radius:50%;
                        border:3px solid #e2e8f0;
                      "
                    >

                  </td>

                  <!-- Name / Title -->

                  <td valign="middle">

                    <div style="
                      font-size:22px;
                      line-height:28px;
                      font-weight:700;
                      color:#0f172a;
                    ">
                      Akash Raikwar
                    </div>

                    <div style="
                      font-size:14px;
                      line-height:22px;
                      color:#64748b;
                      margin-top:3px;
                    ">
                      Software Engineer
                    </div>

                  </td>

                </tr>
              </table>

            </td>
          </tr>


          <!-- ========================= -->
          <!-- MAIN CONTENT -->
          <!-- ========================= -->

          <tr>
            <td style="padding:15px 35px 35px 35px;">

              <h1 style="
                margin:0 0 18px 0;
                font-size:28px;
                line-height:36px;
                color:#0f172a;
              ">
                Thank You for Reaching Out!
              </h1>

              <p style="
                margin:0 0 18px 0;
                font-size:16px;
                line-height:27px;
                color:#475569;
              ">
                Hi ${escapeHtmlPlain(contactData.name)},
              </p>

              <p style="
                margin:0 0 20px 0;
                font-size:15px;
                line-height:26px;
                color:#475569;
              ">
                Thank you for contacting me through my portfolio website.
                I've successfully received your message and will review
                your inquiry carefully.
              </p>

              <p style="
                margin:0 0 25px 0;
                font-size:15px;
                line-height:26px;
                color:#475569;
              ">
                I'll get back to you as soon as possible. I appreciate you
                taking the time to reach out and look forward to connecting
                with you.
              </p>


              <!-- ========================= -->
              <!-- MESSAGE CARD -->
              <!-- ========================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background-color:#f8fafc;
                  border-radius:12px;
                  border:1px solid #e2e8f0;
                "
              >

                <tr>
                  <td style="padding:24px;">

                    <div style="
                      font-size:13px;
                      font-weight:700;
                      letter-spacing:0.5px;
                      text-transform:uppercase;
                      color:#64748b;
                      margin-bottom:16px;
                    ">
                      Your Message
                    </div>

                    <div style="
                      font-size:16px;
                      font-weight:700;
                      color:#0f172a;
                      margin-bottom:15px;
                    ">
                      ${escapeHtmlPlain(contactData.subject)}
                    </div>

                    <div style="
                      background-color:#ffffff;
                      border-left:4px solid #2563eb;
                      border-radius:8px;
                      padding:16px;
                      font-size:14px;
                      line-height:24px;
                      color:#475569;
                    ">
                      ${escapeHtml(contactData.message)}
                    </div>

                  </td>
                </tr>

              </table>


              <!-- ========================= -->
              <!-- RESPONSE TIME -->
              <!-- ========================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:22px;"
              >

                <tr>

                  <td
                    style="
                      background-color:#eff6ff;
                      border:1px solid #dbeafe;
                      border-radius:10px;
                      padding:16px 18px;
                    "
                  >

                    <p style="
                      margin:0;
                      font-size:14px;
                      line-height:23px;
                      color:#1e40af;
                    ">
                      <strong>Response Time</strong><br>
                      I typically respond within 24–48 hours.
                      I'll get back to you with the next steps after
                      reviewing your message.
                    </p>

                  </td>

                </tr>

              </table>


              <!-- ========================= -->
              <!-- WHAT'S NEXT -->
              <!-- ========================= -->

              <div style="
                margin-top:28px;
                margin-bottom:10px;
                font-size:18px;
                font-weight:700;
                color:#0f172a;
              ">
                What happens next?
              </div>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                <tr>
                  <td style="padding:8px 0;">

                    <span style="
                      display:inline-block;
                      width:26px;
                      height:26px;
                      line-height:26px;
                      text-align:center;
                      border-radius:50%;
                      background-color:#dbeafe;
                      color:#2563eb;
                      font-size:13px;
                      font-weight:bold;
                    ">1</span>

                    <span style="
                      margin-left:8px;
                      font-size:14px;
                      color:#475569;
                    ">
                      I'll review your message and requirements.
                    </span>

                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;">

                    <span style="
                      display:inline-block;
                      width:26px;
                      height:26px;
                      line-height:26px;
                      text-align:center;
                      border-radius:50%;
                      background-color:#dbeafe;
                      color:#2563eb;
                      font-size:13px;
                      font-weight:bold;
                    ">2</span>

                    <span style="
                      margin-left:8px;
                      font-size:14px;
                      color:#475569;
                    ">
                      I'll contact you if additional information is required.
                    </span>

                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;">

                    <span style="
                      display:inline-block;
                      width:26px;
                      height:26px;
                      line-height:26px;
                      text-align:center;
                      border-radius:50%;
                      background-color:#dbeafe;
                      color:#2563eb;
                      font-size:13px;
                      font-weight:bold;
                    ">3</span>

                    <span style="
                      margin-left:8px;
                      font-size:14px;
                      color:#475569;
                    ">
                      I'll share a detailed response, solution, or proposal.
                    </span>

                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;">

                    <span style="
                      display:inline-block;
                      width:26px;
                      height:26px;
                      line-height:26px;
                      text-align:center;
                      border-radius:50%;
                      background-color:#dbeafe;
                      color:#2563eb;
                      font-size:13px;
                      font-weight:bold;
                    ">4</span>

                    <span style="
                      margin-left:8px;
                      font-size:14px;
                      color:#475569;
                    ">
                      We can schedule a call to discuss your project.
                    </span>

                  </td>
                </tr>

              </table>


              <!-- ========================= -->
              <!-- WHATSAPP CTA -->
              <!-- ========================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:30px;"
              >

                <tr>

                  <td
                    align="center"
                    style="
                      background-color:#f0fdf4;
                      border:1px solid #bbf7d0;
                      border-radius:12px;
                      padding:22px;
                    "
                  >

                    <div style="
                      font-size:17px;
                      font-weight:700;
                      color:#166534;
                      margin-bottom:7px;
                    ">
                      Need a quicker response?
                    </div>

                    <div style="
                      font-size:13px;
                      line-height:21px;
                      color:#4d7c0f;
                      margin-bottom:18px;
                    ">
                      You can also contact me directly on WhatsApp.
                    </div>

                    <a
                      href="https://wa.me/919685533878?text=Hi%20Akash%2C%20I%20just%20contacted%20you%20through%20your%20portfolio."
                      target="_blank"
                      style="
                        display:inline-block;
                        background-color:#16a34a;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:14px;
                        font-weight:700;
                        padding:13px 24px;
                        border-radius:8px;
                      "
                    >
                      💬 Chat with me on WhatsApp
                    </a>

                  </td>

                </tr>

              </table>


              <!-- ========================= -->
              <!-- WEBSITE CTA -->
              <!-- ========================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:25px;"
              >

                <tr>
                  <td align="center">

                    <a
                      href="https://akashraikwar.in/"
                      target="_blank"
                      style="
                        display:inline-block;
                        background-color:#2563eb;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:14px;
                        font-weight:700;
                        padding:13px 28px;
                        border-radius:8px;
                      "
                    >
                      Visit My Portfolio →
                    </a>

                  </td>
                </tr>

              </table>


              <!-- ========================= -->
              <!-- SIGNATURE -->
              <!-- ========================= -->

              <div style="
                margin-top:35px;
                padding-top:25px;
                border-top:1px solid #e2e8f0;
              ">

                <p style="
                  margin:0 0 5px 0;
                  font-size:15px;
                  color:#475569;
                ">
                  Best regards,
                </p>

                <p style="
                  margin:0;
                  font-size:18px;
                  font-weight:700;
                  color:#0f172a;
                ">
                  Akash Raikwar
                </p>

                <p style="
                  margin:4px 0 0 0;
                  font-size:13px;
                  color:#64748b;
                ">
                  Software Engineer
                </p>

              </div>

            </td>
          </tr>


          <!-- ========================= -->
          <!-- CONTACT INFORMATION -->
          <!-- ========================= -->

          <tr>
            <td
              style="
                background-color:#0f172a;
                padding:28px 35px;
              "
            >

              <div style="
                text-align:center;
                font-size:17px;
                font-weight:700;
                color:#ffffff;
                margin-bottom:18px;
              ">
                Let's Connect
              </div>


              <!-- Email -->

              <div style="
                text-align:center;
                margin-bottom:9px;
              ">

                <a
                  href="mailto:info@akashraikwar.in"
                  style="
                    color:#cbd5e1;
                    text-decoration:none;
                    font-size:13px;
                  "
                >
                  ✉ info@akashraikwar.in
                </a>

              </div>


              <!-- Phone -->

              <div style="
                text-align:center;
                margin-bottom:9px;
              ">

                <a
                  href="tel:+919685533878"
                  style="
                    color:#cbd5e1;
                    text-decoration:none;
                    font-size:13px;
                  "
                >
                  ☎ +91 96855 33878
                </a>

              </div>


              <!-- WhatsApp -->

              <div style="
                text-align:center;
                margin-bottom:18px;
              ">

                <a
                  href="https://wa.me/919685533878"
                  target="_blank"
                  style="
                    color:#86efac;
                    text-decoration:none;
                    font-size:13px;
                    font-weight:600;
                  "
                >
                  💬 WhatsApp
                </a>

              </div>


              <!-- Social Links -->

              <table
                role="presentation"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                <tr>

                  <!-- LinkedIn -->

                  <td style="padding:0 6px;">

                    <a
                      href="https://www.linkedin.com/in/akash-raikwar-4a67bb171/"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:13px;
                        padding:8px 12px;
                        border:1px solid #334155;
                        border-radius:6px;
                      "
                    >
                      LinkedIn
                    </a>

                  </td>


                  <!-- Instagram -->

                  <td style="padding:0 6px;">

                    <a
                      href="https://www.instagram.com/akashraikwar_007/"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:13px;
                        padding:8px 12px;
                        border:1px solid #334155;
                        border-radius:6px;
                      "
                    >
                      Instagram
                    </a>

                  </td>


                  <!-- Website -->

                  <td style="padding:0 6px;">

                    <a
                      href="https://akashraikwar.in/"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:13px;
                        padding:8px 12px;
                        border:1px solid #334155;
                        border-radius:6px;
                      "
                    >
                      Portfolio
                    </a>

                  </td>

                </tr>

              </table>

            </td>
          </tr>


          <!-- ========================= -->
          <!-- FOOTER -->
          <!-- ========================= -->

          <tr>
            <td
              align="center"
              style="
                background-color:#020617;
                padding:18px 25px;
              "
            >

              <p style="
                margin:0;
                font-size:11px;
                line-height:18px;
                color:#64748b;
              ">
                This is an automated confirmation email sent from
                <a
                  href="https://akashraikwar.in/"
                  target="_blank"
                  style="
                    color:#94a3b8;
                    text-decoration:none;
                  "
                >
                  akashraikwar.in
                </a>
              </p>

              <p style="
                margin:5px 0 0 0;
                font-size:11px;
                color:#475569;
              ">
                © ${new Date().getFullYear()} Akash Raikwar. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`,
  }),

  subscriptionWelcome: (subscriptionData) => ({
    subject: "Welcome to the Akash Raikwar Newsletter 🚀",

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Welcome to Akash Raikwar Newsletter</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#f1f5f9;
  font-family:Arial, Helvetica, sans-serif;
  color:#0f172a;
">

  <!-- ============================= -->
  <!-- MAIN WRAPPER -->
  <!-- ============================= -->

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      background-color:#f1f5f9;
      margin:0;
      padding:30px 15px;
    "
  >
    <tr>
      <td align="center">

        <!-- ============================= -->
        <!-- EMAIL CONTAINER -->
        <!-- ============================= -->

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width:650px;
            background-color:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 10px 35px rgba(15,23,42,0.08);
          "
        >

          <!-- ============================= -->
          <!-- HERO BANNER -->
          <!-- ============================= -->

          <tr>
            <td style="padding:0;">

              <img
                src="https://ik.imagekit.io/sentyaztie/ChatGPT%20Image%20Sep%203,%202026,%2012_51_07%20AM.png"
                alt="Akash Raikwar - Software Engineer"
                width="650"
                style="
                  display:block;
                  width:100%;
                  max-width:650px;
                  height:auto;
                  border:0;
                "
              >

            </td>
          </tr>


          <!-- ============================= -->
          <!-- PROFILE / BRAND -->
          <!-- ============================= -->

          <tr>
            <td style="padding:30px 35px 10px 35px;">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                <tr>

                  <td
                    width="75"
                    valign="middle"
                    style="padding-right:18px;"
                  >

                    <img
                      src="https://ik.imagekit.io/sentyaztie/cropped_circle_image.png?updatedAt=1785927209061"
                      alt="Akash Raikwar"
                      width="70"
                      height="70"
                      style="
                        display:block;
                        width:70px;
                        height:70px;
                        border-radius:50%;
                        border:3px solid #e2e8f0;
                      "
                    >

                  </td>

                  <td valign="middle">

                    <div style="
                      font-size:21px;
                      line-height:28px;
                      font-weight:700;
                      color:#0f172a;
                    ">
                      Akash Raikwar
                    </div>

                    <div style="
                      font-size:14px;
                      line-height:22px;
                      color:#64748b;
                    ">
                      Software Engineer
                    </div>

                  </td>

                </tr>

              </table>

            </td>
          </tr>


          <!-- ============================= -->
          <!-- WELCOME CONTENT -->
          <!-- ============================= -->

          <tr>
            <td style="padding:20px 35px 35px 35px;">

              <div style="
                display:inline-block;
                background-color:#eff6ff;
                color:#2563eb;
                font-size:12px;
                font-weight:700;
                letter-spacing:0.7px;
                text-transform:uppercase;
                padding:7px 12px;
                border-radius:20px;
                margin-bottom:16px;
              ">
                Newsletter Subscriber
              </div>


              <h1 style="
                margin:0 0 18px 0;
                font-size:30px;
                line-height:38px;
                color:#0f172a;
              ">
                Welcome to the Newsletter! 🚀
              </h1>


              <p style="
                margin:0 0 18px 0;
                font-size:16px;
                line-height:27px;
                color:#475569;
              ">
                Hi ${escapeHtmlPlain(subscriptionData.firstName || "there")},
              </p>


              <p style="
                margin:0 0 18px 0;
                font-size:15px;
                line-height:26px;
                color:#475569;
              ">
                Thanks for subscribing to my newsletter. I'm excited to
                have you here!
              </p>


              <p style="
                margin:0 0 25px 0;
                font-size:15px;
                line-height:26px;
                color:#475569;
              ">
                From time to time, I'll share practical insights from my
                work as a software engineer, along with projects,
                development tips, AI innovations, automation ideas,
                and useful technology trends.
              </p>


              <!-- ============================= -->
              <!-- WHAT YOU'LL RECEIVE -->
              <!-- ============================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background-color:#f8fafc;
                  border:1px solid #e2e8f0;
                  border-radius:12px;
                "
              >

                <tr>
                  <td style="padding:25px;">

                    <div style="
                      font-size:19px;
                      font-weight:700;
                      color:#0f172a;
                      margin-bottom:20px;
                    ">
                      What you'll receive
                    </div>


                    <!-- Item 1 -->

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="margin-bottom:15px;"
                    >
                      <tr>

                        <td
                          width="42"
                          valign="top"
                        >
                          <div style="
                            width:34px;
                            height:34px;
                            line-height:34px;
                            text-align:center;
                            background-color:#dbeafe;
                            border-radius:8px;
                            font-size:17px;
                          ">
                            💻
                          </div>
                        </td>

                        <td valign="middle">

                          <div style="
                            font-size:14px;
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:3px;
                          ">
                            Projects & Case Studies
                          </div>

                          <div style="
                            font-size:13px;
                            line-height:20px;
                            color:#64748b;
                          ">
                            Behind-the-scenes insights from real-world
                            development projects.
                          </div>

                        </td>

                      </tr>
                    </table>


                    <!-- Item 2 -->

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="margin-bottom:15px;"
                    >
                      <tr>

                        <td
                          width="42"
                          valign="top"
                        >
                          <div style="
                            width:34px;
                            height:34px;
                            line-height:34px;
                            text-align:center;
                            background-color:#dbeafe;
                            border-radius:8px;
                            font-size:17px;
                          ">
                            🤖
                          </div>
                        </td>

                        <td valign="middle">

                          <div style="
                            font-size:14px;
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:3px;
                          ">
                            AI & Automation
                          </div>

                          <div style="
                            font-size:13px;
                            line-height:20px;
                            color:#64748b;
                          ">
                            Practical ideas around AI, chatbots,
                            automation and modern business solutions.
                          </div>

                        </td>

                      </tr>
                    </table>


                    <!-- Item 3 -->

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="margin-bottom:15px;"
                    >
                      <tr>

                        <td
                          width="42"
                          valign="top"
                        >
                          <div style="
                            width:34px;
                            height:34px;
                            line-height:34px;
                            text-align:center;
                            background-color:#dbeafe;
                            border-radius:8px;
                            font-size:17px;
                          ">
                            💡
                          </div>
                        </td>

                        <td valign="middle">

                          <div style="
                            font-size:14px;
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:3px;
                          ">
                            Development Tips
                          </div>

                          <div style="
                            font-size:13px;
                            line-height:20px;
                            color:#64748b;
                          ">
                            Useful techniques, best practices and lessons
                            learned from software development.
                          </div>

                        </td>

                      </tr>
                    </table>


                    <!-- Item 4 -->

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>

                        <td
                          width="42"
                          valign="top"
                        >
                          <div style="
                            width:34px;
                            height:34px;
                            line-height:34px;
                            text-align:center;
                            background-color:#dbeafe;
                            border-radius:8px;
                            font-size:17px;
                          ">
                            🚀
                          </div>
                        </td>

                        <td valign="middle">

                          <div style="
                            font-size:14px;
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:3px;
                          ">
                            Technology & Industry Trends
                          </div>

                          <div style="
                            font-size:13px;
                            line-height:20px;
                            color:#64748b;
                          ">
                            Emerging technologies, tools and trends
                            shaping the future of software.
                          </div>

                        </td>

                      </tr>
                    </table>

                  </td>
                </tr>

              </table>


              <!-- ============================= -->
              <!-- FIRST NEWSLETTER MESSAGE -->
              <!-- ============================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:24px;"
              >

                <tr>

                  <td
                    style="
                      background-color:#eff6ff;
                      border:1px solid #dbeafe;
                      border-radius:12px;
                      padding:20px;
                    "
                  >

                    <div style="
                      font-size:15px;
                      font-weight:700;
                      color:#1e40af;
                      margin-bottom:7px;
                    ">
                      You're officially on the list 🎉
                    </div>

                    <div style="
                      font-size:13px;
                      line-height:22px;
                      color:#475569;
                    ">
                      Keep an eye on your inbox. I'll be sharing
                      useful content and updates periodically.
                    </div>

                  </td>

                </tr>

              </table>


              <!-- ============================= -->
              <!-- PORTFOLIO CTA -->
              <!-- ============================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:28px;"
              >

                <tr>
                  <td align="center">

                    <div style="
                      font-size:14px;
                      line-height:22px;
                      color:#64748b;
                      margin-bottom:15px;
                    ">
                      Want to explore my work right now?
                    </div>

                    <a
                      href="https://akashraikwar.in/"
                      target="_blank"
                      style="
                        display:inline-block;
                        background-color:#2563eb;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:14px;
                        font-weight:700;
                        padding:13px 28px;
                        border-radius:8px;
                      "
                    >
                      Explore My Portfolio →
                    </a>

                  </td>
                </tr>

              </table>


              <!-- ============================= -->
              <!-- WHATSAPP CTA -->
              <!-- ============================= -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:25px;"
              >

                <tr>

                  <td
                    align="center"
                    style="
                      background-color:#f0fdf4;
                      border:1px solid #bbf7d0;
                      border-radius:12px;
                      padding:22px;
                    "
                  >

                    <div style="
                      font-size:16px;
                      font-weight:700;
                      color:#166534;
                      margin-bottom:7px;
                    ">
                      Have a project or idea?
                    </div>

                    <div style="
                      font-size:13px;
                      line-height:21px;
                      color:#4d7c0f;
                      margin-bottom:17px;
                    ">
                      Feel free to reach out. I'd love to hear about it.
                    </div>

                    <a
                      href="https://wa.me/919685533878?text=Hi%20Akash%2C%20I%27m%20a%20newsletter%20subscriber%20and%20I%27d%20like%20to%20discuss%20a%20project."
                      target="_blank"
                      style="
                        display:inline-block;
                        background-color:#16a34a;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:14px;
                        font-weight:700;
                        padding:12px 22px;
                        border-radius:8px;
                      "
                    >
                      💬 Chat with me on WhatsApp
                    </a>

                  </td>

                </tr>

              </table>


              <!-- ============================= -->
              <!-- SIGNATURE -->
              <!-- ============================= -->

              <div style="
                margin-top:32px;
                padding-top:24px;
                border-top:1px solid #e2e8f0;
              ">

                <p style="
                  margin:0 0 5px 0;
                  font-size:14px;
                  color:#475569;
                ">
                  Looking forward to having you along for the journey.
                </p>

                <p style="
                  margin:15px 0 0 0;
                  font-size:18px;
                  font-weight:700;
                  color:#0f172a;
                ">
                  Akash Raikwar
                </p>

                <p style="
                  margin:4px 0 0 0;
                  font-size:13px;
                  color:#64748b;
                ">
                  Software Engineer
                </p>

              </div>

            </td>
          </tr>


          <!-- ============================= -->
          <!-- CONTACT / SOCIAL FOOTER -->
          <!-- ============================= -->

          <tr>
            <td
              style="
                background-color:#0f172a;
                padding:28px 35px;
              "
            >

              <div style="
                text-align:center;
                font-size:17px;
                font-weight:700;
                color:#ffffff;
                margin-bottom:18px;
              ">
                Let's Connect
              </div>


              <!-- Email -->

              <div style="
                text-align:center;
                margin-bottom:9px;
              ">

                <a
                  href="mailto:info@akashraikwar.in"
                  style="
                    color:#cbd5e1;
                    text-decoration:none;
                    font-size:13px;
                  "
                >
                  ✉ info@akashraikwar.in
                </a>

              </div>


              <!-- Phone -->

              <div style="
                text-align:center;
                margin-bottom:9px;
              ">

                <a
                  href="tel:+919685533878"
                  style="
                    color:#cbd5e1;
                    text-decoration:none;
                    font-size:13px;
                  "
                >
                  ☎ +91 96855 33878
                </a>

              </div>


              <!-- WhatsApp -->

              <div style="
                text-align:center;
                margin-bottom:18px;
              ">

                <a
                  href="https://wa.me/919685533878"
                  target="_blank"
                  style="
                    color:#86efac;
                    text-decoration:none;
                    font-size:13px;
                    font-weight:600;
                  "
                >
                  💬 WhatsApp
                </a>

              </div>


              <!-- Social Links -->

              <table
                role="presentation"
                align="center"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                <tr>

                  <td style="padding:0 5px;">

                    <a
                      href="https://www.linkedin.com/in/akash-raikwar-4a67bb171/"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:12px;
                        padding:8px 11px;
                        border:1px solid #334155;
                        border-radius:6px;
                      "
                    >
                      LinkedIn
                    </a>

                  </td>


                  <td style="padding:0 5px;">

                    <a
                      href="https://www.instagram.com/akashraikwar_007/"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:12px;
                        padding:8px 11px;
                        border:1px solid #334155;
                        border-radius:6px;
                      "
                    >
                      Instagram
                    </a>

                  </td>


                  <td style="padding:0 5px;">

                    <a
                      href="https://akashraikwar.in/"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:12px;
                        padding:8px 11px;
                        border:1px solid #334155;
                        border-radius:6px;
                      "
                    >
                      Portfolio
                    </a>

                  </td>

                </tr>

              </table>

            </td>
          </tr>


          <!-- ============================= -->
          <!-- FOOTER -->
          <!-- ============================= -->

          <tr>
            <td
              align="center"
              style="
                background-color:#020617;
                padding:18px 25px;
              "
            >

              <p style="
                margin:0;
                font-size:11px;
                line-height:18px;
                color:#64748b;
              ">
                You're receiving this email because you subscribed
                to the newsletter at
                <a
                  href="https://akashraikwar.in/"
                  target="_blank"
                  style="
                    color:#94a3b8;
                    text-decoration:none;
                  "
                >
                  akashraikwar.in
                </a>
              </p>

              <p style="
                margin:7px 0 0 0;
                font-size:11px;
                color:#475569;
              ">
                You can unsubscribe at any time from future newsletters.
              </p>

              <p style="
                margin:7px 0 0 0;
                font-size:11px;
                color:#475569;
              ">
                © ${new Date().getFullYear()} Akash Raikwar. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
  }),

  newsletter: (subscribers, newsletterData) => ({
    subject: newsletterData.subject,
    html: newsletterData.html,
  }),

  eventRegistrationConfirmation: (regData, eventData) => {
    const dateStr = new Date(eventData.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = new Date(eventData.date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return {
      subject: `Registration Confirmed: ${eventData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Registration Confirmed! 🎉
          </h2>
          
          <p>Hi ${escapeHtmlPlain(regData.fullName)},</p>
          
          <p>Your registration for the following event has been confirmed:</p>
          
          <div style="background: linear-gradient(135deg,#3b82f6,#8b5cf6); padding: 2px; border-radius: 12px; margin: 20px 0;">
            <div style="background: white; padding: 24px; border-radius: 10px;">
              <h3 style="color: #1e293b; margin-top: 0;">${escapeHtmlPlain(eventData.title)}</h3>
              <p style="color: #64748b;"><strong>Date:</strong> ${dateStr}</p>
              <p style="color: #64748b;"><strong>Time:</strong> ${timeStr}</p>
              <p style="color: #64748b;"><strong>Location:</strong> ${escapeHtmlPlain(eventData.location)}</p>
              ${eventData.meetingLink ? `<p style="color: #64748b;"><strong>Join Link:</strong> <a href="${escapeHtmlPlain(eventData.meetingLink)}">${escapeHtmlPlain(eventData.meetingLink)}</a></p>` : ""}
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e293b; margin-top: 0;">Your Registration Details</h4>
            <p><strong>Name:</strong> ${escapeHtmlPlain(regData.fullName)}</p>
            <p><strong>Email:</strong> ${escapeHtmlPlain(regData.email)}</p>
            ${regData.company ? `<p><strong>Company:</strong> ${escapeHtmlPlain(regData.company)}</p>` : ""}
          </div>
          
          ${
            eventData.meetingLink
              ? `
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              <strong>Join the event:</strong><br>
              <a href="${escapeHtmlPlain(eventData.meetingLink)}" style="color: #2563eb;">Click here to join</a>
            </p>
          </div>
          `
              : ""
          }
          
          <p>Best regards,<br>
          <strong>Akash Raikwar</strong></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">
              This is an automated confirmation email. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };
  },
};

// Email service functions
const emailService = {
  // Send contact form notification to admin
  async sendContactNotification(contactData) {
    try {
      console.log("📧 [sendContactNotification] Starting...");
      console.log(
        "📧 [sendContactNotification] Sending to:",
        process.env.EMAIL_USER,
      );
      console.log("📧 [sendContactNotification] From:", process.env.EMAIL_FROM);

      const transporter = createTransporter();
      const template = emailTemplates.contactNotification(contactData);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: template.subject,
        html: template.html,
      };

      console.log("📧 [sendContactNotification] Mail options:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      const result = await transporter.sendMail(mailOptions);
      console.log("✅ Contact notification sent:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error sending contact notification:", error.message);
      throw error;
    }
  },

  // Send confirmation email to contact form submitter
  async sendContactConfirmation(contactData) {
    try {
      console.log("📧 [sendContactConfirmation] Starting...");
      console.log(
        "📧 [sendContactConfirmation] Sending to:",
        contactData.email,
      );
      console.log("📧 [sendContactConfirmation] From:", process.env.EMAIL_FROM);

      const transporter = createTransporter();
      const template = emailTemplates.contactConfirmation(contactData);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: contactData.email,
        subject: template.subject,
        html: template.html,
      };

      console.log("📧 [sendContactConfirmation] Mail options:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      const result = await transporter.sendMail(mailOptions);
      console.log("✅ Contact confirmation sent:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error sending contact confirmation:", error.message);
      throw error;
    }
  },

  // Send welcome email to new subscribers
  async sendSubscriptionWelcome(subscriptionData) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.subscriptionWelcome(subscriptionData);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: subscriptionData.email,
        subject: template.subject,
        html: template.html,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("✅ Subscription welcome sent:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error sending subscription welcome:", error);
      throw error;
    }
  },

  // Send newsletter to subscribers
  async sendNewsletter(subscribers, newsletterData) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.newsletter(subscribers, newsletterData);

      const results = [];

      for (const subscriber of subscribers) {
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: subscriber.email,
          subject: template.subject,
          html: template.html,
        };

        const result = await transporter.sendMail(mailOptions);
        results.push({ email: subscriber.email, messageId: result.messageId });
      }

      console.log(`✅ Newsletter sent to ${results.length} subscribers`);
      return { success: true, results };
    } catch (error) {
      console.error("❌ Error sending newsletter:", error);
      throw error;
    }
  },

  // Send event registration confirmation to attendee
  async sendEventRegistrationConfirmation(registrationData, eventData) {
    try {
      console.log(
        "📧 [sendEventRegistrationConfirmation] Sending to:",
        registrationData.email,
      );
      const transporter = createTransporter();
      const template = emailTemplates.eventRegistrationConfirmation(
        registrationData,
        eventData,
      );

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: registrationData.email,
        subject: template.subject,
        html: template.html,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("✅ Event registration confirmation sent:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(
        "❌ Error sending event registration confirmation:",
        error.message,
      );
      throw error;
    }
  },

  // Test email configuration
  async testConnection() {
    try {
      const transporter = createTransporter();
      console.log("🔄 Testing email connection...");
      await transporter.verify();
      console.log("✅ Email service is ready");
      return { success: true, message: "Email service is ready" };
    } catch (error) {
      console.error("❌ Email service test failed:", error.message);
      console.error("Error code:", error.code);
      console.error("Error response:", error.response);
      // Provide more helpful error messages
      if (error.code === "EAUTH") {
        console.error(
          "💡 Hint: This usually means the email/password is incorrect or the App Password is invalid/revoked.",
        );
        console.error(
          "💡 Go to: https://myaccount.google.com/apppasswords to generate a new App Password",
        );
      }
      throw error;
    }
  },
};

module.exports = emailService;
