# Feedback Form Setup Instructions

## Quick Setup (5 minutes)

The feedback form uses **Formspree** - a completely free service that requires no backend code.

### Steps:

1. **Go to https://formspree.io** and create a free account (no credit card required)

2. **Create a new form** - you'll get a form endpoint like:
   ```
   https://formspree.io/f/xpzgkqyz
   ```

3. **Open `public/game.js`** and find line 1357:
   ```javascript
   const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID';
   ```

4. **Replace `YOUR_FORM_ID`** with your actual Formspree form ID:
   ```javascript
   const formspreeEndpoint = 'https://formspree.io/f/xpzgkqyz';
   ```

5. **Save and deploy** - that's it!

### Formspree Free Tier:
- ✅ 50 form submissions per month
- ✅ No credit card required
- ✅ Email notifications
- ✅ Spam protection
- ✅ Works directly from frontend (no backend needed)

### Where to find the feedback button:
- The "FEATURE REQUEST / BUG REPORT" button appears on the homepage (main menu screen)
- It's located below the FAQ section

### Testing:
1. Click the "FEATURE REQUEST / BUG REPORT" button
2. Fill in the title and details
3. Click "SUBMIT"
4. You should see a success message
5. Check your email (the one you used to sign up for Formspree) for the submission

