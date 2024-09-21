import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCaNqe4QENctROqNalkMLFLE2JN2xnDqds");

export async function identifyPlant(imageFile: File): Promise<{ name: string; description: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageData = await fileToGenerativePart(imageFile);

    const prompt = "Identify this plant and provide a brief description. Return the result as a JSON object with 'name' and 'description' fields.";

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    console.log('Raw Gemini response:', text); // Log the raw response

    try {
      const parsedResult = JSON.parse(text);
      if (!parsedResult.name || !parsedResult.description) {
        throw new Error('Response does not contain name and description fields');
      }
      return {
        name: parsedResult.name,
        description: parsedResult.description,
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);

      // Attempt to extract information even if it's not valid JSON
      const nameMatch = text.match(/name["']?\s*:\s*["']?([^"'\n]+)/i);
      const descriptionMatch = text.match(/description["']?\s*:\s*["']?([^"'\n]+)/i);

      if (nameMatch && descriptionMatch) {
        return {
          name: nameMatch[1].trim(),
          description: descriptionMatch[1].trim(),
        };
      }

      throw new Error(`Unable to parse the plant identification result: ${text}`);
    }
  } catch (error) {
    console.error('Error in identifyPlant:', error);
    if (error instanceof Error) {
      throw new Error(`Plant identification failed: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred during plant identification');
    }
  }
}

async function fileToGenerativePart(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result?.toString().split(',')[1];
      if (base64Data) {
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          },
        });
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}