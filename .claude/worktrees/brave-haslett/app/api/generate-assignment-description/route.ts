import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, parts } = body

    if (!title || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: "Missing or invalid parameters. 'title' (string) and 'parts' (array of strings) are required." },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing")
      return NextResponse.json(
        { error: "Server configuration error: Missing API key" },
        { status: 500 }
      )
    }

    if (apiKey === "your-api-key" || apiKey.length < 20) {
      return NextResponse.json(
        { error: `Invalid API key configured. Length is ${apiKey.length}.` },
        { status: 500 }
      )
    }

    // Initialize genAI dynamically so it picks up the latest env var without a server restart
    const genAI = new GoogleGenerativeAI(apiKey)

    // 1. The prompt template used for generation
    const prompt = `You are generating the instruction text for a school assignment.

    Assignment title: "${title}"

    Assignment parts:
    ${parts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

    Write a short assignment instruction (1–2 sentences).

    Rules:
    - Write the task itself, not a description of the assignment.
    - Start directly with the action (e.g., "Complete", "Write", "Prepare", "Solve", "Create").
    - Be concise and specific.
    - Maximum 35 words.
    - Do NOT mention "this assignment".
    - Do NOT address the student directly (no "you will").
    - No bullet points or markdown.
    - Return only the instruction text.`;

    // 2. Call the Gemini API (using gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error("Failed to generate description text from Gemini")
    }

    // 3. Return the generated description
    return NextResponse.json({ description: responseText.trim() }, { status: 200 })

  } catch (error: any) {
    // 4. Error handling
    console.error("Gemini API Error:", error)

    // Check for specific Google AI errors if possible
    if (error.message?.includes("API key not valid")) {
      return NextResponse.json({ error: "Invalid API configuration." }, { status: 500 })
    }

    return NextResponse.json(
      { error: `Failed to generate description. Please try again later. Details: ${error.message}` },
      { status: 500 }
    )
  }
}
