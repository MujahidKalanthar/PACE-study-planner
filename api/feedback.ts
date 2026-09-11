import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export async function processFeedbackSubmission(body: any) {
  const {
    type = 'feedback',
    category = 'general',
    name,
    email,
    message,
    stepsToReproduce,
    currentPage,
    userId,
    metadata = {}
  } = body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      status: 400,
      json: { error: 'A message description is required for submission.' }
    };
  }

  const cleanMessage = message.trim();
  const cleanType = type === 'issue' ? 'issue' : 'feedback';
  const cleanCategory = String(category || 'general').trim();
  const cleanName = name ? String(name).trim() : null;
  const cleanEmail = email ? String(email).trim() : null;
  const cleanSteps = stepsToReproduce ? String(stepsToReproduce).trim() : null;
  const cleanPage = currentPage ? String(currentPage).trim() : 'Unknown';
  const cleanUserId = userId ? String(userId).trim() : null;

  const timestamp = new Date().toISOString();
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.NOTIFICATION_EMAIL || 'mujahidkalanthar@gmail.com';

  console.log(`[PACE ${cleanType.toUpperCase()} SUBMISSION] Category: "${cleanCategory}", From: "${cleanName || 'Anonymous'}" (${cleanEmail || 'No email'}), Page: "${cleanPage}"`);

  // 1. PERSIST TO SUPABASE (feedback_reports table)
  let persisted = false;
  let dbErrorMsg: string | null = null;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from('feedback_reports')
        .insert([
          {
            type: cleanType,
            category: cleanCategory,
            user_name: cleanName,
            user_email: cleanEmail,
            message: cleanMessage,
            steps_to_reproduce: cleanSteps,
            user_id: cleanUserId,
            metadata: {
              currentPage: cleanPage,
              appVersion: '1.0.0',
              timestamp,
              ...metadata
            }
          }
        ]);

      if (error) {
        console.error('[Supabase Feedback DB Save Error]:', error.message);
        dbErrorMsg = error.message;
      } else {
        persisted = true;
        console.log('[Supabase Feedback DB Save Success] Inserted into public.feedback_reports');
      }
    } catch (err: any) {
      console.error('[Supabase Exception]:', err?.message || err);
      dbErrorMsg = err?.message || 'Database error';
    }
  } else {
    console.warn('[Supabase Feedback Warning] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. Skipping DB persistence.');
  }

  // 2. EMAIL DELIVERY VIA RESEND OR TRANSACTIONAL PROVIDER
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const isIssue = cleanType === 'issue';
    const emailSubject = isIssue
      ? `[Study Planner Issue] ${cleanCategory}`
      : `[Study Planner Feedback] ${cleanCategory}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f9fafb; color: #111827; max-width: 620px; margin: 0 auto; border-radius: 16px; border: 1px solid ${isIssue ? '#fecdd3' : '#e0e7ff'};">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px; background-color: ${isIssue ? '#ffe4e6' : '#e0e7ff'}; color: ${isIssue ? '#e11d48' : '#4338ca'};">
            ${isIssue ? '🚨 ISSUE REPORT' : '💡 USER FEEDBACK'}
          </span>
          <h2 style="font-size: 20px; font-weight: 600; margin: 12px 0 4px 0; color: #111827;">
            ${emailSubject}
          </h2>
          <p style="font-size: 13px; color: #6b7280; margin: 0;">Submitted on ${new Date(timestamp).toLocaleString()}</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-top: 0; margin-bottom: 8px;">
            ${isIssue ? 'Issue Description' : 'Feedback Message'}
          </h3>
          <div style="font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap; background-color: ${isIssue ? '#fff1f2' : '#f8fafc'}; padding: 14px; border-radius: 8px; border-left: 4px solid ${isIssue ? '#e11d48' : '#4f46e5'};">
${cleanMessage}
          </div>

          ${cleanSteps ? `
            <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-top: 16px; margin-bottom: 8px;">
              Steps to Reproduce
            </h3>
            <div style="font-size: 13px; line-height: 1.5; color: #4b5563; background-color: #f3f4f6; padding: 12px; border-radius: 8px;">
${cleanSteps}
            </div>
          ` : ''}
        </div>

        <div style="background-color: #ffffff; padding: 16px 20px; border-radius: 12px; border: 1px solid #e5e7eb; font-size: 13px; color: #374151;">
          <h3 style="font-size: 13px; font-weight: 700; color: #4b5563; margin-top: 0; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
            Contact & User Context
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #6b7280; width: 140px;">Sender Name:</td>
              <td style="padding: 4px 0; font-weight: 600;">${cleanName || 'Anonymous'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Contact Email:</td>
              <td style="padding: 4px 0; font-weight: 600;">${cleanEmail ? `<a href="mailto:${cleanEmail}" style="color: #4f46e5;">${cleanEmail}</a>` : 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Logged-In User ID:</td>
              <td style="padding: 4px 0; font-family: monospace; font-size: 12px;">${cleanUserId || 'Not logged in'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Page / Feature:</td>
              <td style="padding: 4px 0; font-weight: 500;">${cleanPage}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Database Status:</td>
              <td style="padding: 4px 0;">${persisted ? '✅ Persisted in Supabase' : '⚠️ DB not saved'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #9ca3af;">
          PACE Study Planner • System Notification Engine
        </div>
      </div>
    `;

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'PACE Support <onboarding@resend.dev>',
          to: [supportEmail],
          subject: emailSubject,
          html: htmlContent,
          reply_to: cleanEmail || undefined,
        }),
      });

      if (!resendRes.ok) {
        const resendErrText = await resendRes.text();
        console.error('[Resend Email Delivery API Error]:', resendErrText);
        return {
          status: 502,
          json: {
            success: false,
            persisted,
            error: 'Submission was recorded, but email delivery to support failed. Please check backend email credentials.'
          }
        };
      }

      console.log(`[Resend Email Success] Delivery sent to ${supportEmail}`);
      return {
        status: 200,
        json: {
          success: true,
          persisted,
          emailSent: true,
          message: 'Thank you! Your submission has been sent to our support email and saved successfully.'
        }
      };
    } catch (emailErr: any) {
      console.error('[Resend Fetch Exception]:', emailErr?.message || emailErr);
      return {
        status: 502,
        json: {
          success: false,
          persisted,
          error: 'Saved submission, but email transport service is currently unreachable.'
        }
      };
    }
  }

  // Fallback when RESEND_API_KEY is not configured
  console.log('[Email Warning] RESEND_API_KEY is not set in environment. Email delivery skipped.');

  return {
    status: 200,
    json: {
      success: true,
      persisted,
      emailSent: false,
      message: 'Submission received and logged. (Note: RESEND_API_KEY is required in Vercel environment for direct inbox delivery).'
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { /* ignore */ }
    }

    const result = await processFeedbackSubmission(body);
    return res.status(result.status).json(result.json);
  } catch (error: any) {
    console.error('Feedback handler exception:', error);
    return res.status(500).json({ error: 'Failed to process feedback submission.' });
  }
}
