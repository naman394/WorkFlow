# SMTP Email Setup for Workflow

This guide will help you configure SMTP email notifications for the automatic email alert system.

## Quick Setup

Add these environment variables to your `.env.local` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password (not your regular Gmail password)

3. **Add to .env.local**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   ```

## Other Email Providers

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=your_username
SMTP_PASS=your_password
```

## Testing Your Configuration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Visit the test page**:
   ```
   http://localhost:3000/test-email
   ```

3. **Test SMTP Configuration**:
   - Click "Test SMTP Configuration" button
   - Should show green status if configured correctly

4. **Send a test email**:
   - Fill in the form with a real email address
   - Click "Send Real Email via SMTP"
   - Check the recipient's inbox

## Troubleshooting

### Common Issues

1. **"Authentication failed"**:
   - Make sure you're using an App Password for Gmail (not your regular password)
   - Check that 2FA is enabled on your account

2. **"Connection timeout"**:
   - Verify SMTP_HOST and SMTP_PORT are correct
   - Check if your network blocks SMTP ports

3. **"Invalid credentials"**:
   - Double-check SMTP_USER and SMTP_PASS
   - For Gmail, ensure you're using the App Password

4. **"TLS/SSL errors"**:
   - Try changing SMTP_PORT to 465 (SSL) instead of 587 (TLS)
   - Some providers require different security settings

### Debug Mode

If emails aren't sending, check your console logs for detailed error messages:

```bash
npm run dev
# Watch the console for SMTP-related logs
```

## Production Deployment

For production deployment on Vercel:

1. **Add environment variables** in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add all SMTP_* variables

2. **Test in production**:
   - Deploy your changes
   - Visit `/test-email` on your production URL
   - Test the SMTP configuration

## Security Notes

- **Never commit** your `.env.local` file to version control
- **Use App Passwords** instead of regular passwords
- **Consider using** a dedicated email service for production
- **Monitor** email sending limits and quotas

## Email Templates

The system uses professional HTML email templates with:
- Responsive design for all devices
- Color-coded probability indicators
- Actionable recommendations
- Direct links to GitHub issues
- Fallback text versions

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your SMTP configuration with the test endpoint
3. Test with a simple email client first
4. Check your email provider's documentation for specific requirements
