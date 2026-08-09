import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Image prompt is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/images/generations",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",

          "HTTP-Referer":
            "https://axon-d7ro.vercel.app",

          "X-Title": "Axon AI",
        },

        body: JSON.stringify({
          model: "openai/gpt-image-1-mini",

          prompt,

          size: "1024x1024",

          n: 1,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenRouter image error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Axon couldn't generate the image.",
        },
        {
          status: response.status,
        }
      );
    }

    const image =
      data?.data?.[0];

    if (!image) {
      return NextResponse.json(
        {
          error:
            "No image was returned.",
        },
        {
          status: 500,
        }
      );
    }

    const imageUrl =
      image.url ||
      image.b64_json;

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "The image response was empty.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      image:
        image.url ||
        `data:image/png;base64,${image.b64_json}`,
    });
  } catch (error) {
    console.error(
      "Axon image API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Axon couldn't generate the image.",
      },
      {
        status: 500,
      }
    );
  }
}