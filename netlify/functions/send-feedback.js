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
        
        // Option 1: Use Formspree (free tier available)
        // Set FORMSPREE_ENDPOINT in Netlify environment variables
        // Example: https://formspree.io/f/YOUR_FORM_ID
        const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
        
        if (formspreeEndpoint) {
            // Use Formspree - requires node-fetch or use https module
            const https = require('https');
            const url = require('url');
            
            return new Promise((resolve) => {
                const formData = `title=${encodeURIComponent(title)}&message=${encodeURIComponent(comment)}&_replyto=${encodeURIComponent(recipientEmail)}`;
                const parsedUrl = url.parse(formspreeEndpoint);
                
                const options = {
                    hostname: parsedUrl.hostname,
                    path: parsedUrl.path,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(formData)
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        resolve({
                            statusCode: 200,
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ success: true, message: 'Feedback submitted successfully' })
                        });
                    });
                });

                req.on('error', (error) => {
                    console.error('Formspree error:', error);
                    resolve({
                        statusCode: 500,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ error: 'Failed to send feedback' })
                    });
                });

                req.write(formData);
                req.end();
            });
        }

        // Option 2: Use SendGrid (if configured)
        // Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in Netlify environment variables
        const sendgridApiKey = process.env.SENDGRID_API_KEY;
        if (sendgridApiKey) {
            try {
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
            } catch (sgError) {
                console.error('SendGrid error:', sgError);
            }
        }

        // Option 3: Log for development (configure email service for production)
        console.log('=== FEEDBACK RECEIVED ===');
        console.log('Title:', title);
        console.log('Comment:', comment);
        console.log('Recipient Email:', recipientEmail);
        console.log('========================');

        // For production, configure FORMSPREE_ENDPOINT or SENDGRID_API_KEY
        // For now, return success but log feedback
        if (!formspreeEndpoint && !sendgridApiKey) {
            console.warn('WARNING: No email service configured. Set FORMSPREE_ENDPOINT or SENDGRID_API_KEY in Netlify environment variables.');
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

