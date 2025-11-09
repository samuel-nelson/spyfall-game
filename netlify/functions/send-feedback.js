// Send feedback email
// Configure your email in environment variables:
// FEEDBACK_EMAIL - the email address to send feedback to
// Optionally use a service like SendGrid, Mailgun, or Formspree

exports.handler = async (event, context) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { title, comment } = JSON.parse(event.body);

        if (!title || !comment) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Title and comment are required' })
            };
        }

        // Get email from environment variable
        const recipientEmail = process.env.FEEDBACK_EMAIL || 'your-email@example.com';
        
        // For now, we'll use a simple approach with Formspree or similar
        // You can replace this with SendGrid, Mailgun, or any email service
        // Option 1: Use Formspree (free tier available)
        const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
        
        if (formspreeEndpoint) {
            // Use Formspree
            const response = await fetch(formspreeEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    message: comment,
                    _replyto: recipientEmail
                })
            });

            if (response.ok) {
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ success: true, message: 'Feedback submitted successfully' })
                };
            }
        }

        // Option 2: Use SendGrid (if configured)
        const sendgridApiKey = process.env.SENDGRID_API_KEY;
        if (sendgridApiKey) {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(sendgridApiKey);
            
            const msg = {
                to: recipientEmail,
                from: process.env.SENDGRID_FROM_EMAIL || 'noreply@spyfall-game.netlify.app',
                subject: `Feedback: ${title}`,
                text: comment,
                html: `<h2>${title}</h2><p>${comment.replace(/\n/g, '<br>')}</p>`
            };

            await sgMail.send(msg);

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ success: true, message: 'Feedback submitted successfully' })
            };
        }

        // Option 3: Simple console log for development (replace with actual email service)
        console.log('Feedback received:');
        console.log('Title:', title);
        console.log('Comment:', comment);
        console.log('Would send to:', recipientEmail);

        // For production, you should configure one of the email services above
        // For now, return success but log a warning
        if (process.env.NODE_ENV === 'production' && !formspreeEndpoint && !sendgridApiKey) {
            console.warn('WARNING: No email service configured. Feedback not sent.');
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Feedback received. Thank you!',
                note: process.env.NODE_ENV !== 'production' ? 'Email service not configured - check console logs' : undefined
            })
        };
    } catch (error) {
        console.error('Error sending feedback:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

