import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tevzpqfoaumgzpljimrc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_C6EM7jUC3LIFWUKqYOyP5Q_NM4Ik2pv';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Gemini client on server with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser for JSON payloads up to 25MB (to handle high-res poster uploads)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // ==========================================
  // API: Analyze Tournament Poster with Gemini AI
  // ==========================================
  app.post('/api/analyze-poster', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: 'No image data provided for poster analysis.',
        });
      }

      // Strip potential data URL prefix if sent
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const systemInstruction = `You are a high-speed tournament poster data extractor for KataTira Nepal.
Extract the visible text from the event flyer into a JSON object matching this schema:
{
  "title": string,
  "category": "Football" | "Futsal" | "Basketball" | "Cricket" | "Badminton" | "Chess" | "Esports" | "MUN" | "Debate" | "Quiz" | "Hackathon" | "Marathon" | "Charity & Relief" | "Other",
  "format": string,
  "ageGroup": string,
  "location": string,
  "city": string,
  "province": "Bagmati" | "Gandaki" | "Koshi" | "Lumbini" | "Madhesh" | "Karnali" | "Sudurpashchim",
  "calendarType": "AD" | "BS",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "time": string,
  "entryFee": number,
  "prizePool": string,
  "totalTeams": number,
  "hostName": string,
  "hostOrg": string,
  "hostPhone": string,
  "hostPhoneSecondary": string,
  "hostEmail": string,
  "registrationDeadline": string,
  "description": string,
  "officialLink": string
}
Return only valid JSON. Do not include markdown codeblocks or conversational text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: 'Extract all competition details from this poster into JSON.',
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const extractedText = response.text || '{}';
      let parsedData = {};
      try {
        parsedData = JSON.parse(extractedText);
      } catch (parseErr) {
        console.warn('Failed to parse Gemini JSON output, attempting cleanup:', parseErr);
        const match = extractedText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        }
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error analyzing tournament poster:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to analyze poster image.',
      });
    }
  });

  // ==========================================
  // API: Anti-Bot & Scam Verification Check
  // ==========================================
  app.post('/api/security/verify-submission', (req, res) => {
    try {
      const {
        captchaAnswer,
        expectedAnswer,
        token,
        honeypot,
        timeElapsedMs,
        title,
        description,
        phone,
      } = req.body;

      // 1. Honeypot check: Bots fill hidden fields
      if (honeypot && String(honeypot).trim() !== '') {
        return res.status(403).json({
          success: false,
          code: 'BOT_HONEYPOT_TRIGGERED',
          message: 'Automated submission detected by security shield.',
        });
      }

      // 2. Superhuman timing check: Submissions under 2 seconds are bot scripts
      if (typeof timeElapsedMs === 'number' && timeElapsedMs < 2000) {
        return res.status(429).json({
          success: false,
          code: 'SUBMISSION_TOO_FAST',
          message: 'Submission completed unnaturally fast. Please verify as a human.',
        });
      }

      // 3. CAPTCHA verification
      if (expectedAnswer !== undefined && captchaAnswer !== undefined) {
        if (String(captchaAnswer).trim() !== String(expectedAnswer).trim()) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_CAPTCHA',
            message: 'Incorrect security challenge answer. Please try again.',
          });
        }
      }

      // 4. Anti-Scam Heuristic Filter for event text & phone
      const combinedText = `${title || ''} ${description || ''}`.toLowerCase();
      const scamKeywords = [
        'crypto investment',
        'bitcoin doubling',
        'free cash prize without playing',
        'telegram investment',
        'binance giveaway',
        'easy money hack',
        'pyramid scheme',
      ];

      for (const badWord of scamKeywords) {
        if (combinedText.includes(badWord)) {
          return res.status(400).json({
            success: false,
            code: 'SCAM_HEURISTIC_FLAG',
            message: `Event flagged by KataTira Scam Shield due to restricted promotion ("${badWord}").`,
          });
        }
      }

      // 5. Phone validation check for Nepal telecom standards
      if (phone) {
        const cleanDigits = String(phone).replace(/\D/g, '');
        if (cleanDigits.length < 8 || cleanDigits.length > 15) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_PHONE_NUMBER',
            message: 'Please provide a valid 10-digit organizer phone number.',
          });
        }
      }

      return res.json({
        success: true,
        verified: true,
        verificationToken: `kt-sec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Security verification error',
      });
    }
  });

  // ==========================================
  // API: Cross-Device Community Videos (Multi-Platform)
  // ==========================================
  const dataDir = path.resolve(__dirname, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
  }
  const videosFilePath = path.resolve(dataDir, 'community_videos.json');
  const deletedVideosFilePath = path.resolve(dataDir, 'deleted_video_ids.json');

  async function readDeletedVideoIds(): Promise<string[]> {
    try {
      if (!fs.existsSync(deletedVideosFilePath)) {
        await fs.promises.writeFile(deletedVideosFilePath, '[]', 'utf-8');
        return [];
      }
      const raw = await fs.promises.readFile(deletedVideosFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function recordDeletedVideoId(id: string): Promise<string[]> {
    try {
      const existing = await readDeletedVideoIds();
      if (!existing.includes(id)) {
        existing.push(id);
        await fs.promises.writeFile(deletedVideosFilePath, JSON.stringify(existing, null, 2), 'utf-8');
      }
      return existing;
    } catch (err) {
      console.error('Error recording deleted video id:', err);
      return [];
    }
  }

  async function readVideosFromFile(): Promise<any[]> {
    try {
      if (!fs.existsSync(videosFilePath)) {
        await fs.promises.writeFile(videosFilePath, '[]', 'utf-8');
        return [];
      }
      const raw = await fs.promises.readFile(videosFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error reading community_videos.json:', err);
      return [];
    }
  }

  async function writeVideosToFile(videos: any[]): Promise<void> {
    try {
      await fs.promises.writeFile(videosFilePath, JSON.stringify(videos, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing community_videos.json:', err);
    }
  }

  // GET /api/videos - returns all community videos across devices (Supabase cloud + local fallback)
  app.get('/api/videos', async (_req, res) => {
    try {
      const deletedList = await readDeletedVideoIds();
      const deletedSet = new Set(deletedList);

      // 1. Primary: Query Supabase cloud
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('category', 'COMMUNITY_VIDEO')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cloudVideos = data
          .filter((row: any) => !deletedSet.has(row.id) && row.status !== 'deleted' && row.title !== '[DELETED]')
          .map((row: any) => {
            let extra: any = {};
            if (row.rules && typeof row.rules === 'string') {
              try { extra = JSON.parse(row.rules); } catch {}
            }
            return {
              id: row.id,
              videoUrl: extra.videoUrl || '',
              youtubeUrl: extra.youtubeUrl || extra.videoUrl || '',
              youtubeId: extra.youtubeId,
              platform: extra.platform || row.format || 'youtube',
              title: row.title || extra.title || 'Competition Video',
              channelName: row.organizer || extra.channelName || 'Community Creator',
              thumbnailUrl: row.banner_url || extra.thumbnailUrl || '',
              category: extra.category || 'Football',
              addedBy: extra.addedBy || 'Community Member',
              createdAt: row.created_at ? row.created_at.split('T')[0] : (extra.createdAt || ''),
            };
          })
          .filter((v: any) => Boolean(v.videoUrl && v.title && !deletedSet.has(v.id)));

        // Keep local mirror updated strictly without deleted videos
        await writeVideosToFile(cloudVideos);
        return res.json({ success: true, videos: cloudVideos, deletedIds: deletedList, source: 'cloud' });
      }

      // 2. Fallback to local file if cloud temporarily unreachable
      const videos = await readVideosFromFile();
      const filtered = videos.filter((v: any) => !deletedSet.has(v.id));
      return res.json({ success: true, videos: filtered, deletedIds: deletedList, source: 'file' });
    } catch (err: any) {
      console.warn('GET /api/videos error, falling back to disk:', err);
      const deletedList = await readDeletedVideoIds();
      const deletedSet = new Set(deletedList);
      const videos = await readVideosFromFile();
      const filtered = videos.filter((v: any) => !deletedSet.has(v.id));
      return res.json({ success: true, videos: filtered, deletedIds: deletedList, source: 'file_fallback' });
    }
  });

  // POST /api/videos - saves a new video to Supabase cloud and local file
  app.post('/api/videos', async (req, res) => {
    try {
      const newVideo = req.body;
      if (!newVideo || !newVideo.title || !newVideo.videoUrl) {
        return res.status(400).json({ success: false, error: 'Title and videoUrl are required' });
      }

      const today = new Date().toISOString().split('T')[0];
      const videoRecord = {
        ...newVideo,
        id: newVideo.id || `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: newVideo.createdAt || today,
      };

      // 1. Save to Supabase Cloud
      try {
        const row = {
          id: videoRecord.id,
          title: videoRecord.title,
          category: 'COMMUNITY_VIDEO',
          format: videoRecord.platform || 'youtube',
          status: 'active',
          start_date: today,
          end_date: today,
          time: 'Replay',
          city: 'Kathmandu',
          province: 'Bagmati',
          venue: 'Online / Multi-Platform',
          registration_deadline: `${today}T23:59:59`,
          entry_fee: 0,
          prize_pool: 'N/A',
          max_participants: 0,
          current_participants: 0,
          banner_url: videoRecord.thumbnailUrl || null,
          description: videoRecord.title,
          rules: JSON.stringify(videoRecord),
          contact_email: '',
          contact_phone: '',
          organizer: videoRecord.channelName || 'Community Creator',
          is_verified: true,
          is_relief: false,
        };
        await supabase.from('tournaments').upsert(row, { onConflict: 'id' });
      } catch (cloudErr) {
        console.warn('Supabase cloud upsert warning:', cloudErr);
      }

      // 2. Also save to local mirror file
      const existing = await readVideosFromFile();
      const updated = [videoRecord, ...existing.filter((v: any) => v.id !== videoRecord.id)];
      await writeVideosToFile(updated);

      return res.json({ success: true, video: videoRecord, videos: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/videos/:id - permanently deletes a video across devices
  app.delete('/api/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Permanently record ID in persistent deleted tracker
      const allDeleted = await recordDeletedVideoId(id);

      // 2. Remove from local mirror file
      const existing = await readVideosFromFile();
      const updated = existing.filter((v: any) => v.id !== id);
      await writeVideosToFile(updated);

      // 3. Mark as deleted and attempt hard delete in Supabase Cloud
      try {
        await supabase.from('tournaments').update({ status: 'deleted', title: '[DELETED]' }).eq('id', id);
        await supabase.from('tournaments').delete().eq('id', id);
      } catch (cloudErr) {
        console.warn('Supabase delete warning:', cloudErr);
      }

      return res.json({
        success: true,
        message: 'Video removed successfully from all devices',
        deletedId: id,
        deletedIds: allDeleted,
        videos: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'KataTira Nepal Platform API' });
  });

  // Serve Frontend
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KataTira Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
