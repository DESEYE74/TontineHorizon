// Fonction serverless Vercel. Déployée automatiquement à partir du dossier /api.
// Nécessite la variable d'environnement ANTHROPIC_API_KEY (à définir dans les
// réglages du projet Vercel, jamais dans le code ni côté client).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { message, role } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Message manquant" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY non configurée" });
  }

  const system = role === "admin"
    ? "Tu es l'assistant de l'administrateur d'une tontine. Réponds brièvement, en français, en te basant uniquement sur les informations fournies par l'administrateur dans la conversation. Si tu n'as pas la donnée, dis-le clairement."
    : "Tu es l'assistant d'un membre d'une tontine, en lecture seule. Réponds brièvement, en français, à ses questions sur ses cotisations et son tour de bénéficiaire. Si tu n'as pas la donnée, dis-le clairement.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const reply = data?.content?.find((b) => b.type === "text")?.text
      ?? "Je n'ai pas pu générer de réponse pour le moment.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de l'appel à l'assistant" });
  }
}
