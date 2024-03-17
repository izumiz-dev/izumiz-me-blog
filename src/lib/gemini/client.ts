import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

export async function getSummarizedText(
  content: string
): Promise<string> | never {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prefixPrompt = '次の内容を要約してください:\n';

    const result = await model.generateContent(prefixPrompt + content);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to summarize text');
  }
}
