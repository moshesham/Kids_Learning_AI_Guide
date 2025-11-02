import { GoogleGenAI, Type } from "@google/genai";
import { User, Subject, MathCategory, EnglishCategory } from '../types';

// Per guidelines, API key must be from process.env.API_KEY
// We will create the client just before the API call to ensure it's fresh.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const createSystemInstruction = (user: User, subject: Subject, category: string): string => {
    let instruction = `You are a fun and encouraging AI tutor for a grade ${user.grade} student named ${user.name}. 
    Your goal is to create an educational exercise that is engaging and appropriate for their age.
    The subject is ${subject}, focusing on ${category}.
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
        answer: { type: Type.NUMBER },
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
        }
    },
    required: ['type', 'question', 'answer']
};

export const generateMathExercise = async (user: User, category: MathCategory, previousCorrectness?: 'correct' | 'incorrect' | 'first') => {
  const ai = getAiClient();
  const systemInstruction = createSystemInstruction(user, 'math', category);
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

  const jsonText = response.text.trim();
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
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        answer: { type: Type.STRING }
    },
    required: ['type']
};

export const generateEnglishExercise = async (user: User, category: EnglishCategory, previousCorrectness?: 'correct' | 'incorrect' | 'first') => {
  const ai = getAiClient();
  const systemInstruction = createSystemInstruction(user, 'english', category);
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

  const jsonText = response.text.trim();
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
        type: { type: Type.STRING, description: 'Always "text" for Hebrew.' },
        question: { type: Type.STRING, description: 'Question in Hebrew, with vowels (nikkud) for clarity.' },
        options: {
            type: Type.ARRAY,
            items: { type: Type.STRING, description: 'Options in Hebrew with vowels.' }
        },
        answer: { type: Type.STRING, description: 'The correct answer in Hebrew.' }
    },
    required: ['type', 'question', 'answer']
};

export const generateHebrewExercise = async (user: User, previousCorrectness?: 'correct' | 'incorrect' | 'first') => {
  const ai = getAiClient();
  const systemInstruction = createSystemInstruction(user, 'hebrew', 'reading and basic vocabulary');
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

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", jsonText, e);
    throw new Error("Could not generate a valid exercise.");
  }
};

export const getFeedbackForAnswer = async (user: User, question: string, userAnswer: string, correctAnswer: string | number) => {
    const ai = getAiClient();
    const isCorrect = userAnswer.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();

    const prompt = `A grade ${user.grade} student named ${user.name} answered a question.
    Question: "${question}"
    Their answer: "${userAnswer}"
    Correct answer: "${correctAnswer}"
    The student was ${isCorrect ? 'correct' : 'incorrect'}.
    Provide a short, positive, and encouraging feedback message for them. If they were incorrect, gently explain the correct answer without being discouraging. Keep it to one or two sentences.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return {
        isCorrect,
        feedbackText: response.text,
    };
};