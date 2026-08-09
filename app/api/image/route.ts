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

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENROUTER_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/images",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",

          "HTTP-Referer":
            "https://axon-d7ro.vercel.app",

          "X-Title": "Axon AI",
        },

        body: JSON.stringify({
          model:
            "openai/gpt-image-1-mini",

          prompt,

          n: 1,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenRouter image error:",
        JSON.stringify(data)
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

    const generatedImage =
      data?.data?.[0];

    if (!generatedImage) {
      console.error(
        "No image in OpenRouter response:",
        data
      );

      return NextResponse.json(
        {
          error:
            "OpenRouter did not return an image.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * OpenRouter's Image API normally
     * returns the generated image as
     * base64 in b64_json.
     */

    if (generatedImage.b64_json) {
      return NextResponse.json({
        image:
          `data:image/png;base64,${generatedImage.b64_json}`,
      });
    }

    /*
     * Keep URL support just in case a
     * provider returns a URL instead.
     */

    if (generatedImage.url) {
      return NextResponse.json({
        image: generatedImage.url,
      });
    }

    console.error(
      "Unknown image response:",
      generatedImage
    );

    return NextResponse.json(
      {
        error:
          "The image provider returned an unsupported response.",
      },
      {
        status: 500,
      }
    );
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