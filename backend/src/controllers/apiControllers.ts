import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OpenAI } from 'openai';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'kremlin_studios_super_secret_ai_9988';
const ADMIN_REGISTRATION_TOKEN = process.env.ADMIN_REGISTRATION_TOKEN || 'kremlin_admin_token_2026';

// OpenAI client setup
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Helper to escape HTML tags for XSS protection
export const sanitizeString = (str: any): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Regex for validating email format (restrictive to prevent injections)
export const emailRegex = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;

// Regex for validating phone format (allows digits, spaces, hyphens, parentheses, optional leading +)
export const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

// Regex for validating session ID (alphanumeric, underscores, dashes)
export const sessionIdRegex = /^[a-zA-Z0-9_\-]+$/;

// Whitelist of allowed analytics event types
export const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'cta_click',
  'date_check',
  'booking_click',
  'chat_message_sent',
  'chat_suggestion',
  'toggle_chat_widget'
]);

// Helper to recursively sanitize all string values in an object or array (e.g. JSON metadata logs)
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[sanitizeString(key)] = sanitizeObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

// ----------------------------------------------------
// AUTH CONTROLLER
// ----------------------------------------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (token !== ADMIN_REGISTRATION_TOKEN) {
      res.status(403).json({ error: 'Invalid registration token' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Invalid email address format' });
      return;
    }

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (userCheck.rows.length > 0) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role, created_at',
      [cleanEmail, hashedPassword]
    );

    const newUser = result.rows[0];
    const jwtToken = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token: jwtToken, user: newUser });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Invalid email address format' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      token: jwtToken,
      user: { id: user.id, email: user.email, role: user.role, created_at: user.created_at }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const userResult = await pool.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({ user: userResult.rows[0] });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ----------------------------------------------------
// INQUIRIES CONTROLLER
// ----------------------------------------------------
export const createInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, checkInDate, checkOutDate, guests, message, source } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Invalid email address format' });
      return;
    }

    if (phone) {
      const cleanPhoneCheck = phone.trim();
      if (!phoneRegex.test(cleanPhoneCheck)) {
        res.status(400).json({ error: 'Invalid phone number format' });
        return;
      }
    }

    if (guests && isNaN(parseInt(guests))) {
      res.status(400).json({ error: 'Invalid number of guests' });
      return;
    }

    if (checkInDate && isNaN(Date.parse(checkInDate))) {
      res.status(400).json({ error: 'Invalid check-in date' });
      return;
    }

    if (checkOutDate && isNaN(Date.parse(checkOutDate))) {
      res.status(400).json({ error: 'Invalid check-out date' });
      return;
    }

    const cleanName = sanitizeString(name);
    const cleanPhone = phone ? sanitizeString(phone.trim()) : null;
    const cleanMessage = message ? sanitizeString(message) : null;
    const cleanSource = source ? sanitizeString(source) : 'contact_form';

    const result = await pool.query(
      'INSERT INTO inquiries (name, email, phone, check_in_date, check_out_date, guests, message, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        cleanName, 
        cleanEmail, 
        cleanPhone, 
        checkInDate ? new Date(checkInDate) : null, 
        checkOutDate ? new Date(checkOutDate) : null, 
        guests ? parseInt(guests) : 1, 
        cleanMessage, 
        cleanSource
      ]
    );

    res.status(201).json({ success: true, inquiry: result.rows[0] });
  } catch (error: any) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    res.status(200).json({ inquiries: result.rows });
  } catch (error: any) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const result = await pool.query(
      'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.status(200).json({ success: true, inquiry: result.rows[0] });
  } catch (error: any) {
    console.error('Update inquiry error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inquiries WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error: any) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ----------------------------------------------------
// CONCIERGE CHAT CONTROLLER
// ----------------------------------------------------
export const chatAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, message, guestEmail, guestName } = req.body;

    if (!sessionId || !message) {
      res.status(400).json({ error: 'Session ID and message are required' });
      return;
    }

    if (!sessionIdRegex.test(sessionId)) {
      res.status(400).json({ error: 'Invalid Session ID' });
      return;
    }

    const cleanGuestEmail = guestEmail ? guestEmail.trim().toLowerCase() : null;
    if (cleanGuestEmail && !emailRegex.test(cleanGuestEmail)) {
      res.status(400).json({ error: 'Invalid email address format' });
      return;
    }

    const cleanSessionId = sanitizeString(sessionId);
    const cleanMessage = sanitizeString(message);
    const cleanGuestName = guestName ? sanitizeString(guestName) : null;

    let chatSession = await pool.query('SELECT * FROM chat_sessions WHERE session_id = $1', [cleanSessionId]);
    let messageHistory = [];

    if (chatSession.rows.length > 0) {
      messageHistory = chatSession.rows[0].messages || [];
    }

    const userMessageObj = { role: 'user', content: cleanMessage, timestamp: new Date().toISOString() };
    messageHistory.push(userMessageObj);

    // Rebrand chatbot to "Kremlin Concierge"
    const systemPrompt = `You are "Kremlin Concierge", the virtual host at Kremlin Luxury Studios (http://kremlinstudios.com).
Your tone is welcoming, luxury, warm, conversational, and highly helpful. You assist prospective guests.
Our location: Gaur City Centre, Sector 4, Greater Noida West, Near Char Murti, Noida NCR, Uttar Pradesh, India.
Contact Details: Direct Call at +91 8799775158 or Email at kremlinluxurystudios@gmail.com.

You are not just a booking bot; you are a worldly, engaging concierge. Feel free to talk, chat about general topics, travel tips, local culture, food recommendations, and hold a warm conversation if the guest wishes to talk.

Key details you know about:
1. Stays booking options: We are listed on Booking.com, Airbnb, and MakeMyTrip. You can share links, or tell guests to book directly.
2. Amenities: High-speed Wi-Fi, Smart TV with Netflix, Gourmet fully equipped kitchenette, Plush sheets/linens, 24/7 Hot water, Self Check-in with electronic lock.
3. Local Guide sights: 
   - Delhi Sights (35 mins away): India Gate, Humayun's Tomb, Qutub Minar, Chandni Chowk (Old Delhi street food).
   - Greater Noida West (Nearby): Gaur City Mall, Venice Mall (Gondola rides), City Park, local eateries.
4. House Rules:
   - Self check-in from 2:00 PM onwards.
   - Check-out by 11:00 AM.
   - No loud parties. Quiet hours from 10:00 PM.
5. Creator-Friendly Policy: We are a creator retreat! We welcome content creators, filmmakers, remote workers, and designers.
   
Respond beautifully, conversationally, and helpfully to the guest.`;

    let reply = '';
    let apiSuccess = false;

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messageHistory.map((msg: any) => ({ role: msg.role, content: msg.content }))
          ] as any,
          temperature: 0.7,
          max_tokens: 500,
        });

        reply = response.choices[0]?.message?.content || '';
        apiSuccess = true;
      } catch (err) {
        console.error('OpenAI Concierge API failed, falling back to mock:', err);
      }
    }

    if (!apiSuccess) {
      const cleanMsg = message.toLowerCase();
      
      // Strict regex word boundary checks to avoid substring matches (e.g. "creator" matching "eat", "decor" matching "rate")
      const pricingRegex = /\bprice\b|\brates?\b|\bcosts?\b|\bbook(ing)?\b/;
      const amenitiesRegex = /\bamenit(y|ies)\b|\bwi-?fi\b|\bkitchen(ette)?\b|\bwater\b/;
      const locationRegex = /\blocation\b|\baddress\b|\bwhere\b|\bnoida\b|\bdelhi\b/;
      const rulesRegex = /\brules?\b|\bcheck(-?in|-?out)?\b/;
      const helloRegex = /\bhello\b|\bhi\b|\bhey\b|\bgreetings\b/;
      const foodRegex = /\bfood\s*places?\b|\bfoods?\b|\beat(ing)?\b|\brestaurant\b|\bcafe\b|\bdining\b/;
      const creatorRegex = /\bcreator\b|\bshoot(ing)?\b|\bphotos?\b|\bvideos?\b|\bcamera\b/;
      const weatherRegex = /\bweather\b|\bclimate\b|\bseasons?\b|\bvisit\b/;

      if (pricingRegex.test(cleanMsg)) {
        reply = `Pricing at Kremlin Luxury Studios varies depending on the dates and platforms. Typically, rates range from INR 2,200 to INR 3,500 per night. 
        
You can book your stay via:
1. **Booking.com** (Highly Rated)
2. **Airbnb**
3. **MakeMyTrip**
4. **Direct Reservation**: Call us at **+91 8799775158** or email **kremlinluxurystudios@gmail.com** for direct booking discounts!

Would you like me to show booking details?`;
      } else if (amenitiesRegex.test(cleanMsg)) {
        reply = `We have curated the studio to ensure your comfort:
- **High-speed Wi-Fi**: Free 150 Mbps connection.
- **Smart TV**: Loaded with Netflix and streaming apps.
- **Gourmet Kitchen**: Induction cooktop, microwave, electric kettle, and essential kitchenware.
- **Bathroom**: 24/7 hot water geyser and clean towels.
- **Check-in**: Convenient self check-in using a smart lock.`;
      } else if (locationRegex.test(cleanMsg)) {
        reply = `Kremlin Luxury Studios is located at **Gaur City Centre, Sector 4, Greater Noida West (Near Char Murti)**. 

It is a well-connected landmark. You can easily travel to:
- **Delhi Sights**: India Gate, Humayun's Tomb, Qutub Minar (about 35-40 mins drive).
- **Gaur City Mall**: Just a 2-minute walk from the studios!
- **Grand Venice Mall**: Located in Greater Noida, famous for gondola rides.`;
      } else if (rulesRegex.test(cleanMsg)) {
        reply = `Here are our check-in and stay guidelines:
- **Check-In**: Self check-in via electronic lock code is available anytime after **2:00 PM**.
- **Check-Out**: By **11:00 AM**.
- **House Rules**: No parties, no smoking inside the studio, and quiet hours begin at 10:00 PM to respect neighbors.`;
      } else if (helloRegex.test(cleanMsg)) {
        reply = `Hello! Welcome to Kremlin Luxury Studios. I'm your Kremlin Concierge. 😊
        
It's wonderful to meet you! Whether you want to know about our luxury stays, book a room, explore Delhi/NCR sightseeing spots, or simply have a friendly chat, I'm here for you. 

How has your day been so far?`;
      } else if (foodRegex.test(cleanMsg)) {
        reply = `Noida and Delhi are food lovers' paradises! 
        
Near Gaur City Centre, you have:
- **Gaur City Mall Food Court**: Steps away with a massive selection of popular restaurants, fast food, and desserts.
- **Local Street Food**: Fantastic rolls, momos, and traditional North Indian dishes right in Sector 4.
- **Old Delhi Street Food (35 mins away)**: World-famous paranthas at Paranthe Wali Gali and kebabs at Chandni Chowk.
        
Let me know if you want a specific cuisine recommendation!`;
      } else if (creatorRegex.test(cleanMsg)) {
        reply = `Kremlin Luxury Studios is custom-tailored for content creators! 
        
We feature:
- Backlit circular mirrors, premium neutral backdrops, and scenic balcony views perfect for Instagram reels, TikTok, or photography.
- High-speed 150 Mbps Wi-Fi for fast 4K video uploads and remote work.
- Quiet, aesthetic atmosphere for writers, developers, and filmmakers.
        
Are you planning a photoshoot or creative stay? I'd love to help configure it!`;
      } else if (weatherRegex.test(cleanMsg)) {
        reply = `The best time to visit Delhi NCR is from **October to March** when the weather is cool, pleasant, and perfect for exploring historical monuments.
        
During summer (April to June), it gets quite hot, but our studio is fully air-conditioned for your comfort! Monsoons (July to September) bring refreshing rain to the city.`;
      } else {
        reply = `That's interesting! I'm happy to chat with you about that. 
        
As your Kremlin Concierge, I love holding warm conversations. While I'm also here to help you reserve your room and guide you through check-in rules or local attractions, feel free to talk to me about travel tips, creator ideas, or anything else!
        
What else would you like to talk about?`;
      }
    }

    const assistantMessageObj = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
    messageHistory.push(assistantMessageObj);

    // Save session
    const qualified = message.toLowerCase().includes('book') || message.toLowerCase().includes('price') || message.toLowerCase().includes('stay');
    if (chatSession.rows.length === 0) {
      await pool.query(
        'INSERT INTO chat_sessions (session_id, guest_name, guest_email, messages, qualified) VALUES ($1, $2, $3, $4, $5)',
        [sessionId, guestName || null, guestEmail || null, JSON.stringify(messageHistory), qualified]
      );
    } else {
      await pool.query(
        'UPDATE chat_sessions SET messages = $1, guest_name = COALESCE($2, guest_name), guest_email = COALESCE($3, guest_email), qualified = qualified OR $4, updated_at = NOW() WHERE session_id = $5',
        [JSON.stringify(messageHistory), guestName || null, guestEmail || null, qualified, sessionId]
      );
    }

    res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Chat assistant error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// ----------------------------------------------------
// ANALYTICS CONTROLLER
// ----------------------------------------------------
export const logEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, pagePath, referrer, metadata } = req.body;

    if (!eventType) {
      res.status(400).json({ error: 'Event type is required' });
      return;
    }

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      res.status(400).json({ error: 'Invalid event type' });
      return;
    }

    const cleanPagePath = pagePath ? sanitizeString(pagePath) : '/';
    const cleanReferrer = referrer ? sanitizeString(referrer) : null;
    const cleanMetadata = metadata ? sanitizeObject(metadata) : null;

    await pool.query(
      'INSERT INTO analytics_events (event_type, page_path, referrer, metadata) VALUES ($1, $2, $3, $4)',
      [eventType, cleanPagePath, cleanReferrer, cleanMetadata ? JSON.stringify(cleanMetadata) : null]
    );

    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Log event error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalInquiries = await pool.query('SELECT COUNT(*) FROM inquiries');
    const totalChatSessions = await pool.query('SELECT COUNT(*) FROM chat_sessions');
    const qualifiedChats = await pool.query('SELECT COUNT(*) FROM chat_sessions WHERE qualified = true');
    const totalViews = await pool.query("SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view'");
    
    // Group views by day (last 7 days)
    const viewsByDay = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM analytics_events 
      WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    // Group inquiries by status
    const inquiriesByStatus = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM inquiries 
      GROUP BY status
    `);

    // Source breakdown
    const inquiriesBySource = await pool.query(`
      SELECT source, COUNT(*) as count
      FROM inquiries
      GROUP BY source
    `);

    res.status(200).json({
      summary: {
        totalInquiries: parseInt(totalInquiries.rows[0].count),
        totalChatSessions: parseInt(totalChatSessions.rows[0].count),
        qualifiedChats: parseInt(qualifiedChats.rows[0].count),
        totalViews: parseInt(totalViews.rows[0].count),
      },
      viewsByDay: viewsByDay.rows,
      inquiriesByStatus: inquiriesByStatus.rows,
      inquiriesBySource: inquiriesBySource.rows,
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
