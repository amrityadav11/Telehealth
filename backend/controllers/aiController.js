const Groq = require('groq-sdk');
const asyncHandler = require('express-async-handler');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a helpful AI health assistant for a telehealth platform called TeleHealth.
Your job is to:
1. Listen to the patient's symptoms carefully.
2. Ask 1–2 clarifying follow-up questions if needed (duration, severity, associated symptoms).
3. Suggest the most relevant medical specialist(s) the patient should consult.
4. If symptoms sound like a medical emergency (chest pain, stroke, difficulty breathing, unconsciousness, severe bleeding, suicidal thoughts), immediately advise calling emergency services (112 / 911).
5. Always include a disclaimer that this is not a medical diagnosis and the patient should consult a qualified doctor.
6. Keep responses concise, warm, and easy to understand. Use bullet points where helpful.
7. Do NOT prescribe medications or provide a definitive diagnosis.
8. Respond in the same language the patient uses.`;

/**
 * POST /api/ai/symptom-check
 * Body: { messages: [{ role: 'user'|'assistant', content: string }], userMessage: string }
 */
const symptomCheck = asyncHandler(async (req, res) => {
    const { messages = [], userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'userMessage is required.' });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }

    // Build message history in OpenAI-compatible format
    const history = messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : m.role, // normalise Gemini 'model' → 'assistant'
        content: m.parts?.[0]?.text || m.content || '',
    }));

    const chatMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: userMessage.trim() },
    ];

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        max_tokens: 512,
        temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not process that. Please try again.';

    res.json({ success: true, reply });
});

module.exports = { symptomCheck };
