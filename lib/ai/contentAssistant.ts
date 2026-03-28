import OpenAI from "openai";

import { stripHtml, summarizeText } from "@/lib/utils/text";

type SummaryInput = {
  title: string;
  contentHtml: string;
  publicationName?: string;
};

type HeadlineInput = {
  contentHtml: string;
  publicationName?: string;
};

type AltTextInput = {
  articleTitle: string;
  context?: string;
  imageCaption?: string;
};

let aiClient: OpenAI | null = null;

function getAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!aiClient) {
    aiClient = new OpenAI({ apiKey });
  }

  return aiClient;
}

async function runTextPrompt(prompt: string, maxOutputTokens = 120): Promise<string | null> {
  const client = getAIClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      input: prompt,
      max_output_tokens: maxOutputTokens
    });

    const text = response.output_text?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function generateSummary({ title, contentHtml, publicationName }: SummaryInput): Promise<string> {
  const plainText = stripHtml(contentHtml);

  const aiSummary = await runTextPrompt(
    [
      "Create a concise, factual news SEO summary under 155 characters.",
      `Publication: ${publicationName ?? "News site"}`,
      `Title: ${title}`,
      `Article body: ${plainText}`,
      "Return plain text only."
    ].join("\n")
  );

  return summarizeText(aiSummary || plainText, 155);
}

export async function generateHeadline({ contentHtml, publicationName }: HeadlineInput): Promise<string> {
  const plainText = stripHtml(contentHtml);

  const aiHeadline = await runTextPrompt(
    [
      "Write a compelling, objective news headline under 70 characters.",
      `Publication: ${publicationName ?? "News site"}`,
      `Body: ${plainText}`,
      "Return plain text only."
    ].join("\n"),
    60
  );

  if (aiHeadline) {
    return summarizeText(aiHeadline.replace(/["']/g, ""), 70);
  }

  return summarizeText(plainText, 70) || "Breaking News Update";
}

export async function generateAltText({ articleTitle, context, imageCaption }: AltTextInput): Promise<string> {
  const fallback = summarizeText(
    `${articleTitle}${context ? `, ${context}` : ""}${imageCaption ? `, ${imageCaption}` : ""}`,
    125
  );

  const aiAlt = await runTextPrompt(
    [
      "Generate descriptive, accessibility-friendly ALT text under 125 characters for a news image.",
      `Article title: ${articleTitle}`,
      `Context: ${context || "General article illustration"}`,
      `Caption: ${imageCaption || "N/A"}`,
      "Do not add placeholders like image/photo. Return plain text only."
    ].join("\n"),
    60
  );

  return summarizeText(aiAlt || fallback, 125);
}
