/**
 * Usage: node utils/seedArticles.js
 * Seeds starter Health Hub articles into the database.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const User = require('../models/User');

const ARTICLES = [
    {
        title: '10 Superfoods You Should Eat Every Day',
        summary: 'Discover the most nutrient-dense foods that can transform your health and boost your energy levels naturally.',
        content: `Eating the right foods can make a huge difference in your overall health. Here are 10 superfoods you should incorporate into your daily diet:

1. **Blueberries** – Packed with antioxidants, they protect your brain and reduce inflammation.

2. **Spinach** – Rich in iron, calcium, and vitamins A, C, and K. Great for bone health and immunity.

3. **Salmon** – An excellent source of omega-3 fatty acids that support heart and brain health.

4. **Avocado** – Contains healthy monounsaturated fats, potassium, and fiber.

5. **Quinoa** – A complete protein containing all nine essential amino acids.

6. **Greek Yogurt** – High in protein and probiotics that support gut health.

7. **Almonds** – Rich in vitamin E, magnesium, and healthy fats.

8. **Sweet Potatoes** – Loaded with beta-carotene, fiber, and vitamins.

9. **Broccoli** – Contains sulforaphane, a compound with powerful anti-cancer properties.

10. **Green Tea** – Rich in catechins and antioxidants that boost metabolism.

Try to include at least 3–4 of these in your daily meals for noticeable health improvements within weeks.`,
        category: 'Diet',
        tags: ['nutrition', 'superfoods', 'healthy eating', 'diet'],
        coverImage: { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80' },
        readTime: 4,
    },
    {
        title: 'The 30-Minute Home Workout That Actually Works',
        summary: 'No gym? No problem. This science-backed 30-minute routine builds strength and burns fat using only your bodyweight.',
        content: `You don't need a gym membership to stay fit. This 30-minute bodyweight workout is effective, efficient, and can be done anywhere.

**Warm-Up (5 minutes)**
- Jumping jacks: 1 minute
- Arm circles: 30 seconds each direction
- Hip rotations: 1 minute
- Light jogging in place: 2 minutes

**Main Circuit (20 minutes) – Repeat 3 times**
- Push-ups: 15 reps
- Squats: 20 reps
- Plank hold: 45 seconds
- Lunges: 12 reps each leg
- Mountain climbers: 30 seconds
- Glute bridges: 15 reps

Rest 60 seconds between circuits.

**Cool-Down (5 minutes)**
- Child's pose: 1 minute
- Hamstring stretch: 30 seconds each leg
- Chest opener: 1 minute
- Deep breathing: 2 minutes

**Tips for Success:**
- Do this 3–4 times per week
- Stay hydrated before, during, and after
- Focus on form over speed
- Track your progress weekly

Consistency is key. Even 30 minutes a day can dramatically improve your fitness level within 4–6 weeks.`,
        category: 'Fitness',
        tags: ['workout', 'exercise', 'home fitness', 'bodyweight'],
        coverImage: { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80' },
        readTime: 5,
    },
    {
        title: 'Managing Anxiety: Practical Techniques That Help',
        summary: 'Evidence-based strategies to calm your mind, reduce anxiety, and build long-term emotional resilience.',
        content: `Anxiety affects millions of people worldwide. The good news is that there are proven techniques to manage it effectively.

**Understanding Anxiety**
Anxiety is your body's natural response to stress. It becomes a problem when it's persistent and interferes with daily life.

**Immediate Relief Techniques**

1. **Box Breathing (4-4-4-4)**
   - Inhale for 4 counts
   - Hold for 4 counts
   - Exhale for 4 counts
   - Hold for 4 counts
   - Repeat 4–6 times

2. **5-4-3-2-1 Grounding**
   Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.

3. **Progressive Muscle Relaxation**
   Tense and release each muscle group from toes to head.

**Long-Term Strategies**

- **Regular Exercise** – Even 20 minutes of walking reduces cortisol levels significantly.
- **Sleep Hygiene** – Aim for 7–9 hours. Poor sleep amplifies anxiety.
- **Limit Caffeine** – Caffeine can trigger or worsen anxiety symptoms.
- **Journaling** – Writing down worries externalizes them and reduces their power.
- **Therapy** – Cognitive Behavioral Therapy (CBT) is highly effective for anxiety disorders.

**When to Seek Help**
If anxiety is affecting your work, relationships, or daily functioning, please consult a mental health professional. You don't have to manage it alone.`,
        category: 'Mental Health',
        tags: ['anxiety', 'mental health', 'stress', 'mindfulness'],
        coverImage: { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
        readTime: 6,
    },
    {
        title: 'Understanding Type 2 Diabetes: Prevention and Management',
        summary: 'A comprehensive guide to understanding, preventing, and managing Type 2 diabetes through lifestyle changes.',
        content: `Type 2 diabetes is one of the most common chronic diseases globally, but it is largely preventable and manageable.

**What is Type 2 Diabetes?**
Type 2 diabetes occurs when your body doesn't use insulin properly (insulin resistance), causing blood sugar levels to rise.

**Risk Factors**
- Being overweight or obese
- Physical inactivity
- Family history of diabetes
- Age over 45
- High blood pressure
- History of gestational diabetes

**Warning Signs**
- Frequent urination
- Increased thirst
- Unexplained weight loss
- Fatigue
- Blurred vision
- Slow-healing wounds

**Prevention Strategies**

1. **Maintain a Healthy Weight** – Losing just 5–7% of body weight can reduce diabetes risk by 58%.

2. **Exercise Regularly** – 150 minutes of moderate activity per week improves insulin sensitivity.

3. **Eat a Balanced Diet**
   - Reduce refined carbohydrates and sugary drinks
   - Increase fiber intake (vegetables, legumes, whole grains)
   - Choose healthy fats (olive oil, nuts, avocado)

4. **Monitor Blood Sugar** – Regular screening is important, especially if you have risk factors.

**Management**
If diagnosed, work with your doctor on a personalized plan including medication if needed, regular monitoring, and lifestyle modifications.

Early detection and lifestyle changes can prevent or delay complications significantly.`,
        category: 'Diseases',
        tags: ['diabetes', 'blood sugar', 'prevention', 'chronic disease'],
        coverImage: { url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' },
        readTime: 7,
    },
    {
        title: 'Building Healthy Sleep Habits for Better Life Quality',
        summary: 'Sleep is the foundation of good health. Learn science-backed strategies to improve your sleep quality tonight.',
        content: `Sleep is not a luxury — it's a biological necessity. Poor sleep is linked to obesity, heart disease, diabetes, depression, and reduced immune function.

**How Much Sleep Do You Need?**
- Adults: 7–9 hours
- Teenagers: 8–10 hours
- Children: 9–12 hours

**Signs of Poor Sleep Quality**
- Waking up tired despite 7+ hours
- Difficulty concentrating
- Mood swings and irritability
- Frequent illness

**Sleep Hygiene Tips**

1. **Consistent Schedule** – Go to bed and wake up at the same time every day, even weekends.

2. **Create a Sleep Environment**
   - Keep your room cool (65–68°F / 18–20°C)
   - Use blackout curtains
   - Reduce noise with earplugs or white noise

3. **Limit Screen Time** – Blue light from phones and computers suppresses melatonin. Stop screens 1 hour before bed.

4. **Avoid Stimulants** – No caffeine after 2 PM. Limit alcohol — it disrupts sleep architecture.

5. **Wind-Down Routine** – Reading, light stretching, or meditation signals your brain it's time to sleep.

6. **Exercise** – Regular physical activity improves sleep quality, but avoid intense exercise within 2 hours of bedtime.

**When to See a Doctor**
If you snore loudly, stop breathing during sleep, or have chronic insomnia, consult a doctor. Sleep apnea and other disorders are treatable.`,
        category: 'Lifestyle',
        tags: ['sleep', 'insomnia', 'wellness', 'lifestyle'],
        coverImage: { url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80' },
        readTime: 5,
    },
    {
        title: 'The Importance of Staying Hydrated',
        summary: 'Water is essential for every function in your body. Learn how much you need and the best ways to stay hydrated.',
        content: `Your body is about 60% water, and every system depends on it. Dehydration — even mild — can impair physical and mental performance.

**Why Hydration Matters**
- Regulates body temperature
- Lubricates joints
- Flushes out toxins
- Delivers nutrients to cells
- Supports kidney function
- Improves skin health

**How Much Water Do You Need?**
The general guideline is 8 glasses (2 liters) per day, but individual needs vary based on:
- Body size and weight
- Activity level
- Climate
- Health conditions

A simple rule: drink enough so your urine is pale yellow.

**Signs of Dehydration**
- Thirst (you're already mildly dehydrated)
- Dark yellow urine
- Headache
- Fatigue
- Dizziness
- Dry mouth

**Tips to Stay Hydrated**

1. Start your day with a glass of water before coffee.
2. Carry a reusable water bottle everywhere.
3. Eat water-rich foods: cucumber, watermelon, oranges, lettuce.
4. Set reminders on your phone to drink water.
5. Drink a glass before each meal.
6. Flavor water with lemon, mint, or cucumber if plain water is boring.

**Hydration and Exercise**
Drink 500ml 2 hours before exercise, sip during, and rehydrate after. For intense workouts over 1 hour, consider electrolyte drinks.`,
        category: 'General',
        tags: ['hydration', 'water', 'health tips', 'wellness'],
        coverImage: { url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' },
        readTime: 4,
    },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find an admin user to set as author
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found. Create an admin first.');
            process.exit(1);
        }

        let created = 0;
        for (const data of ARTICLES) {
            const exists = await Article.findOne({ title: data.title });
            if (!exists) {
                await Article.create({ ...data, author: admin._id, isPublished: true });
                created++;
                console.log(`✅ Created: ${data.title}`);
            } else {
                console.log(`⏭️  Skipped (exists): ${data.title}`);
            }
        }

        console.log(`\n🌿 Done! ${created} articles created.`);
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
};

seed();
