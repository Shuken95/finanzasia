export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body);

    const prompt = `
Clasifica este movimiento bancario en UNA categoría:

Categorías:
- comida
- transporte
- ocio
- hogar
- salud
- suscripciones
- ingresos
- seguros
- otros

Movimiento: "${text}"

Responde SOLO con la categoría.
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 50,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    const textResponse =
      data.content?.[0]?.text?.trim().toLowerCase() || "otros";

    return {
      statusCode: 200,
      body: JSON.stringify({ category: textResponse })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        category: "otros",
        error: error.message
      })
    };
  }
}
