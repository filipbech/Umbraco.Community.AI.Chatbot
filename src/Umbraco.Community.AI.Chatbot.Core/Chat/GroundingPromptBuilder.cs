using System.Text;
using Umbraco.Community.AI.Chatbot.Core.Configuration;
using Umbraco.Community.AI.Chatbot.Core.Search;

namespace Umbraco.Community.AI.Chatbot.Core.Chat;

/// <summary>
/// Builds the system message that pins the agent to the retrieved sources. The exact wording matters
/// — "Answer ONLY from the SOURCES below" is the load-bearing instruction; weaker phrasing lets the
/// model fill gaps with training data.
/// </summary>
internal static class GroundingPromptBuilder
{
    public static string Build(ChatInstance instance, IReadOnlyList<ResolvedSource> sources)
    {
        var sb = new StringBuilder();

        // Persona / tone is set on the Agent's Instructions in the backoffice — we only own
        // the grounding rules + the source block here, so the two prompts don't fight.
        sb.AppendLine("RULES:");
        sb.AppendLine("1. Answer ONLY using information from the SOURCES below. Do not use any outside knowledge.");
        sb.AppendLine("2. If the SOURCES do not contain the answer, reply with EXACTLY this sentence and nothing else:");
        sb.AppendLine($"   {instance.FallbackMessage}");
        sb.AppendLine("3. Do not fabricate URLs, page titles, prices, dates, or quotes.");
        sb.AppendLine("4. Be concise. Prefer 1–3 short paragraphs.");
        sb.AppendLine();

        if (sources.Count == 0)
        {
            sb.AppendLine("SOURCES: (none)");
        }
        else
        {
            sb.AppendLine("SOURCES:");
            for (var i = 0; i < sources.Count; i++)
            {
                var s = sources[i];
                sb.Append("[").Append(i + 1).Append("] ").AppendLine(s.Title);
                if (!string.IsNullOrWhiteSpace(s.Url))
                {
                    sb.Append("URL: ").AppendLine(s.Url);
                }
                sb.AppendLine(s.BodyText);
                sb.AppendLine("---");
            }
        }

        return sb.ToString();
    }
}
