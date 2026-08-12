import { NextResponse } from "next/server";

type AxonMessage = {
  role: "user" | "axon";
  text: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: AxonMessage[] = body.messages || [];

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is missing." },
        { status: 500 }
      );
    }

    const formattedMessages = [
      {
        role: "system",
        content: `
You are Axon, an intelligent AI assistant.

Your name is Axon.

Be helpful, intelligent, friendly, and clear.
Answer the user's questions directly.

You can help with:
- coding
- writing
- learning
- brainstorming
- problem solving
- general questions

Never claim to be ChatGPT.

If someone asks who you are, say you are Axon.

Keep answers natural and useful.
        `,
      },

      ...messages.map((message) => ({
        role: message.role === "axon" ? "assistant" : "user",
        content: message.text,
      })),
    ];

    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://axon-d7ro.vercel.app",
          "X-Title": "Axon AI",
        },

        body: JSON.stringify({
          model: "openrouter/free",
          messages: formattedMessages,
          stream: true,
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();

      console.error("OpenRouter error:", errorText);

      return NextResponse.json(
        {
          error: "Axon couldn't generate a response.",
        },
        {
          status: openRouterResponse.status,
        }
      );
    }

    if (!openRouterResponse.body) {
      return NextResponse.json(
        {
          error: "OpenRouter returned no stream.",
        },
        {
          status: 500,
        }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterResponse.body!.getReader();

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
              stream: true,
            });

            const lines = buffer.split("\n");

            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();

              if (!trimmedLine.startsWith("data:")) {
                continue;
              }

              const data = trimmedLine.slice(5).trim();

              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                const content =
                  parsed?.choices?.[0]?.delta?.content;

                if (content) {
                  controller.enqueue(
                    encoder.encode(content)
                  );
                }
              } catch {
                // Ignore non-JSON streaming lines
              }
            }
          }
        } catch (error) {
          console.error("Axon streaming error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Axon API error:", error);

    return NextResponse.json(
      {
        error: "Axon couldn't generate a response.",
      },
      {
        status: 500,
      }
    );
  }
}