import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const isValidUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

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

    const { userId, type, category, name, email, message, stepsToReproduce } = body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const cleanType = type === 'issue' ? 'issue' : 'feedback';
    const cleanCategory = category || (cleanType === 'issue' ? 'bug' : 'suggestion');
    const cleanUserId = isValidUuid(userId) ? userId : null;

    console.log(`[Vercel Serverless /api/feedback] Type: ${cleanType}, Category: ${cleanCategory}, UserID: ${cleanUserId || 'Anonymous'}, From: ${name || 'Anonymous'} (${email || 'No email'}), Message: ${message}`);

    if (supabase) {
      const { error: dbError } = await supabase.from('feedback_reports').insert({
        user_id: cleanUserId,
        type: cleanType,
        category: cleanCategory,
        user_name: name ? name.trim() : null,
        user_email: email ? email.trim() : null,
        message: message.trim(),
        steps_to_reproduce: stepsToReproduce ? stepsToReproduce.trim() : null,
      });

      if (dbError) {
        console.error('[Feedback API] Supabase insert error:', dbError);
        return res.status(500).json({ error: 'Failed to record submission in database: ' + dbError.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: cleanType === 'issue' ? "Thanks! We've received your report." : "Thanks! Your feedback has been submitted.",
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process feedback.' });
  }
}

