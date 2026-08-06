// Fonction serverless Vercel. Déployée automatiquement à partir du dossier /api.
// Nécessite la variable d'environnement ANTHROPIC_API_KEY (à définir dans les
// réglages du projet Vercel, jamais dans le code ni côté client).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { message, role, context } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Message manquant" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY non configurée" });
  }

  const dataBlock = context ? `\n\nDonnées actuelles de la tontine (JSON) :\n${JSON.stringify(context)}` : "";

  const system = role === "admin"
    ? `Tu es l'assistant de l'administrateur d'une tontine. Réponds brièvement, en français, en te basant UNIQUEMENT sur les données JSON fournies ci-dessous. Ne devine jamais un nom ou un chiffre absent des données. Si l'information demandée n'y figure pas, dis-le clairement.${dataBlock}`
    : `Tu es l'assistant d'un membre d'une tontine, en lecture seule. Réponds brièvement, en français, en te basant UNIQUEMENT sur les données JSON fournies ci-dessous (le champ "moi" concerne la personne qui te parle). Ne devine jamais un chiffre absent des données. Si l'information demandée n'y figure pas, dis-le clairement.${dataBlock}`;

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
    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || "Erreur de l'API Anthropic" });
    }
    const reply = data?.content?.find((b) => b.type === "text")?.text
      ?? "Je n'ai pas pu générer de réponse pour le moment.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de l'appel à l'assistant" });
  }
}
