// utilities.js

const generateResetPasswordEmail = (userName, link) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f9;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#EC4899,#f472b6);padding:40px 48px 36px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.75);font-family:Georgia,serif;">
                Edtech Platform
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:-0.5px;">
                Password Reset
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:44px 48px 36px;">
              <p style="text-align:center;font-size:48px;margin:0 0 24px 0;">🔐</p>

              <h2 style="margin:0 0 12px 0;font-size:22px;color:#1a1a1a;font-family:Georgia,serif;font-weight:600;">
                Hi, ${userName}
              </h2>

              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#555555;font-family:Georgia,serif;">
                We received a request to reset the password associated with your Edtech account.
                Click the button below to choose a new password. This link is valid for <strong style="color:#EC4899;">1 hour</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0 28px;">
                    <a href="${link}"
                       style="display:inline-block;background:linear-gradient(135deg,#EC4899,#f472b6);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;font-family:Georgia,serif;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(236,72,153,0.35);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px 0;" />

              <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#888888;font-family:Georgia,serif;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#EC4899;font-family:monospace;">
                ${link}
              </p>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#aaaaaa;font-family:Georgia,serif;">
                If you didn't request a password reset, you can safely ignore this email —
                your password will remain unchanged.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fdf2f8;padding:24px 48px;text-align:center;border-top:1px solid #fce7f3;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;font-family:Georgia,serif;">
                © ${new Date().getFullYear()} Edtech Team · This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `;
};

const createChildByParent = (studentName, tempPassword, loginLink) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Account Is Ready</title>
</head>

<body style="margin:0;padding:0;background-color:#f9f9f9;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9;padding:40px 0;">
    <tr>
      <td align="center">

        <table width="580" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#60a5fa);padding:40px 48px 36px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.75);">
                Edtech Platform
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Your Account Is Ready!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 48px 36px;">
              <p style="text-align:center;font-size:48px;margin:0 0 24px 0;">🎉</p>

              <h2 style="margin:0 0 12px 0;font-size:22px;color:#1a1a1a;font-weight:600;">
                Welcome, ${studentName}
              </h2>

              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#555555;">
                Your parent has created your account on our learning platform.
                You can now log in, explore your classes, check your progress,
                and start your learning journey.
              </p>

              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#555555;">
                Here is your temporary password:
              </p>

              <p style="margin:0 0 24px 0;padding:12px 16px;background:#f3f4f6;border-radius:12px;font-size:18px;font-weight:600;color:#1f2937;text-align:center;font-family:monospace;">
                ${tempPassword}
              </p>

              <p style="margin:0 0 20px 0;font-size:14px;color:#888888;">
                You will be able to change your password after logging in.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0 28px;">
                    <a href="${loginLink}"
                       style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(59,130,246,0.35);">
                      Log In Now
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px 0;" />

              <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#888888;">
                If the button doesn't work, use this link:
              </p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#3b82f6;font-family:monospace;">
                ${loginLink}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#eff6ff;padding:24px 48px;text-align:center;border-top:1px solid #dbeafe;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} Edtech Team · This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

const createParentApprovalEmail = (studentName, approveLink, parentEmail) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Parent Approval Request</title>
</head>

<body style="margin:0;padding:0;background-color:#f9f9f9;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9;padding:40px 0;">
    <tr>
      <td align="center">

        <table width="580" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#fbbf24);padding:40px 48px 36px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.75);">
                Edtech Platform
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Parent Approval Request
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 48px 36px;">
              <p style="text-align:center;font-size:48px;margin:0 0 24px 0;">👪</p>

              <h2 style="margin:0 0 12px 0;font-size:22px;color:#1a1a1a;font-weight:600;">
                Hi, ${studentName}
              </h2>

              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#555555;">
                Your parent wants with the email ${parentEmail} to link their Edtech account with yours.
                You have the right to approve or refuse this request.
              </p>

              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#555555;">
                Click the button below to approve your parent:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0 28px;">
                    <a href="${approveLink}"
                       style="display:inline-block;background:linear-gradient(135deg,#f97316,#fbbf24);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(249,115,22,0.35);">
                      Approve Parent
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px 0;" />

              <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#888888;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#f97316;font-family:monospace;">
                ${approveLink}
              </p>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#aaaaaa;">
                If you did not expect this request, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fffbf0;padding:24px 48px;text-align:center;border-top:1px solid #fde68a;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} Edtech Team · This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

module.exports = { generateResetPasswordEmail, createChildByParent, createParentApprovalEmail };