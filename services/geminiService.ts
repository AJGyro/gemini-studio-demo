
import { GoogleGenAI, Type } from "@google/genai";
import type { StoryLog } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        story: {
            type: Type.STRING,
            description: "The next part of the story. Describe the scene and the outcome of the player's last action in a captivating, second-person narrative. Keep it to 2-3 paragraphs.",
        },
        choices: {
            type: Type.ARRAY,
            description: "A list of 3-4 actions the player can take next. These should be concise and clear.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: {
                        type: Type.STRING,
                        description: "The text for a single choice."
                    }
                }
            }
        },
        gameOver: {
            type: Type.BOOLEAN,
            description: "Set to true if the player has reached a definitive failure-state ending."
        },
        gameWin: {
            type: Type.BOOLEAN,
            description: "Set to true if the player has successfully completed the adventure."
        },
    },
    required: ["story", "choices", "gameOver", "gameWin"]
};


const systemInstruction = `You are the Dungeon Master for a dynamic text-based adventure game.
Your role is to create a compelling and coherent narrative based on player choices.
The theme is dark fantasy, filled with ancient ruins, mysterious magic, and dangerous creatures.
Always respond in the provided JSON format.
- Narrate the story in the second person ("You enter a room...", "You see...").
- Make the world feel alive and reactive. The story should evolve based on the player's actions.
- Provide meaningful choices that lead to different outcomes.
- If gameOver or gameWin is true, the story should be a concluding paragraph, and the choices array can be empty.
- Be creative and unpredictable!`;


export const generateAdventureStep = async (history: StoryLog[], playerAction: string) => {
    const fullHistory = history.map(log => ({
        role: log.role,
        parts: [{ text: log.text }]
    }));

    const contents = [...fullHistory, { role: 'user', parts: [{ text: playerAction }] }];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            },
        });

        const jsonText = response.text;
        const parsedResponse = JSON.parse(jsonText);
        
        return parsedResponse;

    } catch (error) {
        console.error("Error generating adventure step:", error);
        return {
            story: "An unexpected magical interference disrupts your reality. The connection to the story has been lost. Please try starting a new game.",
            choices: [],
            gameOver: true,
            gameWin: false
        };
    }
};
