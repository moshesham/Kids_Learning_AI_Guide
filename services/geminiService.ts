
import { GoogleGenAI, Type } from "@google/genai";
import { User, Subject, MathCategory, EnglishCategory, HebrewCategory, HebrewExercise } from '../types';

// Per guidelines, API key must be from process.env.API_KEY
// We will create the client just before the API call to ensure it's fresh.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const createSystemInstruction = (user: User, subject: Subject, category: string, previousStoryContext?: string): string => {
    let instruction = `You are a fun, encouraging, and highly predictable AI tutor for a grade ${user.grade} student named ${user.name}. 
    Your goal is to create an educational exercise that is engaging and appropriate for their age.
    The student may have Autism Spectrum Disorder (ASD) or other learning disabilities. 
    CRITICAL RULES FOR ASD:
    1. Use clear, literal, and direct language.
    2. Avoid sarcasm, idioms, metaphors, or ambiguous phrasing.
    3. Keep instructions extremely concise and predictable.
    The subject is ${subject}, focusing on ${category}.`;

    if (user.difficultyLevel) {
        instruction += `
    **DIFFICULTY LEVEL:** The user's current difficulty level is ${user.difficultyLevel} out of 10. 
    Adjust the complexity of the vocabulary, numbers, and concepts accordingly. Level 1 is very basic, Level 5 is average for their grade, and Level 10 is advanced.`;
    }

    if (user.interest) {
        instruction += `
    **CRITICAL:** The student has a special interest in "${user.interest}". You MUST frame the entire exercise (questions, context, examples, and vocabulary) around this interest to help them hyperfocus and stay engaged. For example, if the interest is "Space" and the subject is math, use planets or rockets in the problems.`;
    }

    if (user.storyMode) {
        instruction += `
    **STORY MODE ENABLED:** You must provide a "story_context" field in the JSON response. This should be a 1-2 sentence narrative that sets the scene for the exercise, making it feel like part of an ongoing adventure related to their interest ("${user.interest}"). The question itself should naturally follow this context.`;
        
        if (previousStoryContext) {
            instruction += `
    **PREVIOUS STORY CONTEXT:** "${previousStoryContext}"
    Continue the narrative from this previous context to make it a cohesive, ongoing story.`;
        }
    }

    instruction += `
    The response must be a JSON object that strictly follows the schema provided. Do not include any markdown formatting like \`\`\`json or any introductory text.`;

    if (subject === 'english' && category === 'reading_practice') {
        instruction += `

You are also an expert in early childhood reading education, specializing in the "Bob Books" phonics-based methodology. The sentence you generate for reading practice MUST adhere to the following principles:
- **Phonetic Focus:** Use primarily phonetically regular, decodable words.
- **CVC Words:** For early grades (1-2), heavily favor CVC (consonant-vowel-consonant) words (e.g., cat, sun, pin).
- **Repetition:** Use repetition of words and sounds to build confidence.
- **Simple Structure:** The sentence must be grammatically simple and very short.
- **Real Words Only:** Every word must be a valid, correctly-spelled English word. Do not invent words.
- **Gradual Complexity based on grade ${user.grade}:**
  - **Grade 1:** Strictly CVC words and a few basic sight words (e.g., a, the, is, on, see, I). Example: "A big pig sat."
  - **Grade 2:** Introduce consonant blends (e.g., stop, frog), digraphs (e.g., fish, chat), and more common sight words. Example: "The fish swims in the pond."
  - **Grades 3+:** Sentences can be slightly longer and include multi-syllable but still decodable words. The focus remains on pronunciation practice, not complex narrative. Example: "The children started to finish their project."`;
    }

    if (subject === 'math' && category === 'visual_exercises') {
        instruction += `
For visual exercises, you MUST:
- Set the "type" property to "visual".
- Provide a "visualization" object.
- Use simple, recognizable emojis (e.g., 🍎, 🚗, ⭐️, 🐶).
- Create a simple problem like "How many apples are there?" or "3 apples plus 2 apples equals how many?"
- Ensure the "elements" array in "visualization" matches the numbers in your question.
- For addition/subtraction, use two elements in the "elements" array and set the "operation" accordingly.
- For simple counting, use one element in the "elements" array and set "operation" to "+".`;
    }
    
    if (subject === 'english' && category === 'visual_syntax') {
        instruction += `
For Visual Syntax exercises, you MUST:
- Set the "type" property to "visual_syntax".
- Provide a "sentence_parts" array.
- Each part in "sentence_parts" must have "text" and "part_of_speech" (Noun, Verb, Adjective, Article, Preposition).
- The "question" should be "Arrange the blocks to build the sentence."
- The "answer" should be the full, correct sentence string.
- Use the student's interest ("${user.interest}") to make the sentence engaging.`;
    }
    
    if (subject === 'math' && category === 'pattern_architect') {
        instruction += `
For Pattern Architect exercises, you MUST:
- Set the "type" property to "pattern".
- Provide a "pattern_sequence" array. This can be an array of emojis OR an array of numbers.
- The sequence MUST have a clear, logical repeating pattern (e.g., emojis: A-B-A-B or A-A-B-A-A-B; numbers: 2, 4, 6, 8 or 5, 10, 15, 20).
- One item in the sequence should be replaced with a "?" character.
- The "question" should be "What comes next in the pattern?" or "What is the missing piece?"
- The "answer" MUST be the exact number or emoji that logically follows the numerical sequence or repeating emoji pattern. Do NOT provide a creative interpretation or a different object.
- Provide 4 "options" for the student to choose from. If the pattern is numerical, the options must be numbers (represented as strings). If the pattern is emojis, the options must be emojis.
- If using emojis, you may use the student's interest ("${user.interest}") for inspiration, but prioritize the logical pattern over creativity.`;
    }
    
    if (subject === 'hebrew' && category === 'gematria') {
        instruction += `
For Gematria Bridge exercises, you MUST:
- Set the "type" property to "gematria".
- Provide a "word" in Hebrew.
- Provide a "letter_values" array where each object has "letter" (Hebrew) and its "value" (number).
- The "question" should be "What is the total Gematria value of this word?"
- The "answer" should be the sum of all letter values.
- Provide 4 "options" (numbers) for the student to choose from.
- Use the student's interest ("${user.interest}") to pick relevant Hebrew words if possible.`;
    }
    
    if (category === 'social_scripting') {
        instruction += `
For Social Scripting exercises, you MUST:
- Set the "type" property to "social_scripting".
- Provide a "scenario" description (e.g., "At the park", "Meeting a new friend"). The scenario should often involve a minor conflict, a misunderstanding, or a strong emotion related to the subject context (${subject}).
- Provide a "dialogue" array of objects with "speaker" and "text".
- The last speaker should be "You" and the "text" should be a "?".
- The "question" should be "What is the best way to respond?"
- The "answer" should be the most appropriate social response.
- Provide 4 "options" for the response. Ensure the correct "answer" is clearly the most polite, appropriate, and de-escalating response.
- Provide "bodySignals": Describe the other person's body language.
- Provide "peerEmotionEmoji": A single emoji representing the AI peer's emotion (e.g., 😠, 😢, 😊).
- Provide "emotionalRegulationHint": A short, concrete tip to stay calm.
- Provide "conflictResolutionHint": A short tip to solve the problem peacefully.
- Use the student's interest ("${user.interest}") to make the scenario more relatable.`;
    }
    
    if (subject === 'hebrew' && category === 'shoresh_tree') {
        instruction += `
For Shoresh Tree exercises, you MUST:
- Set the "type" property to "shoresh".
- Provide a "root" (3 Hebrew letters).
- Provide a "derived_words" array of objects with "word" (Hebrew) and "meaning" (English).
- The "question" should be "Which of these words does NOT share the root?" or "What is the common root of these words?"
- The "answer" should be the correct root or the odd word out.
- Provide 4 "options" for the student to choose from.`;
    }
    
    return instruction;
}

const createUserPrompt = (previousCorrectness?: 'correct' | 'incorrect' | 'first'): string => {
    let prompt = "Generate a new exercise.";
    if (previousCorrectness === 'correct') {
        prompt += ` The student just answered the previous question correctly, so make this one a little more challenging, but still within their grade level and adhering to all system instructions.`;
    } else if (previousCorrectness === 'incorrect') {
        prompt += ` The student struggled with the last question, so generate a slightly easier one to help them build confidence.`;
    } else {
        prompt += ` This is the first question of the session.`;
    }
    return prompt;
}

const mathExerciseSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, description: 'Either "visual" for grades 1-2 or "text" for grades 3-6.'},
        question: { type: Type.STRING },
        answer: { type: Type.STRING, description: 'The correct answer. Can be a number (as a string) or an emoji.' },
        story_context: { type: Type.STRING, description: 'A 1-2 sentence narrative setting the scene. Required if story mode is enabled.' },
        visualization: {
            type: Type.OBJECT,
            description: 'Required if type is "visual", otherwise omit. Use simple, common emojis.',
            properties: {
                elements: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            emoji: { type: Type.STRING },
                            count: { type: Type.NUMBER }
                        },
                        required: ['emoji', 'count']
                    }
                },
                operation: { type: Type.STRING, description: 'e.g., "+", "-", "×", "÷"' }
            },
            required: ['elements', 'operation']
        },
        pattern_sequence: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Required if type is "pattern", otherwise omit. MUST be an array of strings (convert numbers to strings if necessary).'
        },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Provide 4 options for multiple choice. MUST be an array of strings (convert numbers to strings if necessary).'
        },
        scenario: { type: Type.STRING },
        dialogue: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING }
                },
                required: ['speaker', 'text']
            }
        },
        bodySignals: { type: Type.STRING },
        peerEmotionEmoji: { type: Type.STRING },
        emotionalRegulationHint: { type: Type.STRING },
        conflictResolutionHint: { type: Type.STRING }
    },
    required: ['type', 'question', 'answer']
};

export const generateMathExercise = async (user: User, category: MathCategory, previousCorrectness?: 'correct' | 'incorrect' | 'first', previousStoryContext?: string) => {
  const ai = getAiClient();
  const systemInstruction = createSystemInstruction(user, 'math', category, previousStoryContext);
  const userPrompt = createUserPrompt(previousCorrectness);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: mathExerciseSchema,
    },
  });

  const jsonText = response.text ? response.text.trim() : "";
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", jsonText, e);
    throw new Error("Could not generate a valid exercise.");
  }
};

const englishExerciseSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, description: 'Should be one of: "reading_practice", "vocabulary", "comprehension".' },
        sentence: { type: Type.STRING, description: "A single, grade-appropriate sentence for the student to read aloud. Required for type 'reading_practice'." },
        passage: { type: Type.STRING, description: "A short passage for comprehension exercises. Required for type 'comprehension'." },
        word: { type: Type.STRING, description: 'The vocabulary word.' },
        definition: { type: Type.STRING, description: 'A simple definition for the vocabulary word.' },
        question: { type: Type.STRING },
        story_context: { type: Type.STRING, description: 'A 1-2 sentence narrative setting the scene. Required if story mode is enabled.' },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        answer: { type: Type.STRING },
        sentence_parts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    part_of_speech: { type: Type.STRING }
                },
                required: ['text', 'part_of_speech']
            }
        },
        scenario: { type: Type.STRING },
        dialogue: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING }
                },
                required: ['speaker', 'text']
            }
        },
        bodySignals: { type: Type.STRING, description: "Description of the other person's body language or facial expressions to help identify their emotion." },
        peerEmotionEmoji: { type: Type.STRING, description: "A single emoji representing the AI peer's emotion." },
        emotionalRegulationHint: { type: Type.STRING, description: "A tip for the student on how to stay calm and regulate their own emotions in this scenario." },
        conflictResolutionHint: { type: Type.STRING, description: "A tip on how to peacefully resolve the conflict presented in the scenario." }
    },
    required: ['type']
};

export const generateEnglishExercise = async (user: User, category: EnglishCategory, previousCorrectness?: 'correct' | 'incorrect' | 'first', previousStoryContext?: string) => {
  const ai = getAiClient();
  const systemInstruction = createSystemInstruction(user, 'english', category, previousStoryContext);
  const userPrompt = createUserPrompt(previousCorrectness);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: englishExerciseSchema,
    },
  });

  const jsonText = response.text ? response.text.trim() : "";
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", jsonText, e);
    throw new Error("Could not generate a valid exercise.");
  }
};

const hebrewExerciseSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING },
        question: { type: Type.STRING },
        story_context: { type: Type.STRING, description: 'A 1-2 sentence narrative setting the scene. Required if story mode is enabled.' },
        word: { type: Type.STRING },
        letter_values: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    letter: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                },
                required: ['letter', 'value']
            }
        },
        options: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER }
        },
        answer: { type: Type.NUMBER },
        hebrew_options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        hebrew_answer: { type: Type.STRING },
        root: { type: Type.STRING },
        derived_words: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING }
                },
                required: ['word', 'meaning']
            }
        },
        scenario: { type: Type.STRING },
        dialogue: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING }
                },
                required: ['speaker', 'text']
            }
        },
        bodySignals: { type: Type.STRING },
        peerEmotionEmoji: { type: Type.STRING },
        emotionalRegulationHint: { type: Type.STRING },
        conflictResolutionHint: { type: Type.STRING }
    },
    required: ['type', 'question']
};

export const generateHebrewExercise = async (user: User, category: HebrewCategory, previousCorrectness?: 'correct' | 'incorrect' | 'first', previousStoryContext?: string): Promise<HebrewExercise> => {
  const ai = getAiClient();
  const systemInstruction = createSystemInstruction(user, 'hebrew', category, previousStoryContext);
  const userPrompt = createUserPrompt(previousCorrectness);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: hebrewExerciseSchema,
    },
  });

  const jsonText = response.text ? response.text.trim() : "";
  try {
    const parsed = JSON.parse(jsonText);
    // Map back to our types if needed, or just return as is if schema matches
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", jsonText, e);
    throw new Error("Could not generate a valid exercise.");
  }
};

export const getFeedbackForAnswer = async (user: User, question: string, userAnswer: string, correctAnswer: string | number) => {
    const ai = getAiClient();
    const isCorrect = userAnswer ? userAnswer.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase() : false;

    const prompt = `A grade ${user.grade} student named ${user.name} answered a question.
    Question: "${question}"
    Their answer: "${userAnswer}"
    Correct answer: "${correctAnswer}"
    The student was ${isCorrect ? 'correct' : 'incorrect'}.
    
    Provide a short, encouraging feedback message. 
    If they were correct, verify specifically what they did right.
    If they were incorrect, help them understand why. 
    CRITICAL: The question might be about math, reading, vocabulary, or visual patterns (emojis). Do NOT assume the answer must be a number. If the correct answer is an emoji, a word, or a sentence, explain why that specific answer is correct based on the pattern or context.
    Keep the tone warm, supportive, and appropriate for a grade ${user.grade} child. Limit to 2-3 sentences.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return {
        isCorrect,
        feedbackText: response.text,
    };
};
