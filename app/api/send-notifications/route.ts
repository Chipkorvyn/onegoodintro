import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Get unsent notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .eq('sent', false)
      .order('created_at', { ascending: true })
      .limit(50) // Process in batches

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const results = []

    for (const notification of notifications || []) {
      try {
        // For now, we'll just log the email content
        // In production, you'd integrate with an email service like SendGrid, Resend, etc.
        const emailContent = {
          to: notification.user?.email,
          subject: notification.title,
          html: generateEmailHTML(notification)
        }

        console.log('Would send email:', emailContent)
        
        // Mock sending (replace with actual email service)
        const emailSent = true // await sendEmail(emailContent)

        if (emailSent) {
          // Mark as sent
          await supabase
            .from('notifications')
            .update({ 
              sent: true, 
              sent_at: new Date().toISOString() 
            })
            .eq('id', notification.id)

          results.push({ id: notification.id, status: 'sent' })
        } else {
          results.push({ id: notification.id, status: 'failed' })
        }
      } catch (error) {
        console.error('Error sending notification:', error)
        results.push({ id: notification.id, status: 'error' })
      }
    }

    return NextResponse.json({ 
      processed: results.length,
      results 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateEmailHTML(notification: any) {
  const matchUrl = `${process.env.NEXTAUTH_URL}${notification.data?.match_url || '/matches'}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #007bff; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>${notification.title}</h2>
            </div>
            
            <p>Hi ${notification.user?.name || 'there'},</p>
            
            <p>${notification.message}</p>
            
            <p>
                <a href="${matchUrl}" class="button">View Match Details</a>
            </p>
            
            <p>
                You can review the match details and decide whether to accept or decline the introduction.
            </p>
            
            <div class="footer">
                <p>This is an automated message from OneGoodIntro. If you have any questions, please contact support.</p>
            </div>
        </div>
    </body>
    </html>
  `
}