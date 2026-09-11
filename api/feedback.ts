import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, category, name, email, message, stepsToReproduce } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    console.log(`[Vercel Serverless /api/feedback] Type: ${type}, Category: ${category}, From: ${name || 'Anonymous'} (${email || 'No email'}), Message: ${message}`);

    return res.status(200).json({
      success: true,
      message: 'Thank you for your submission. Your feedback has been received.',
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ error: 'Failed to process feedback.' });
  }
}
