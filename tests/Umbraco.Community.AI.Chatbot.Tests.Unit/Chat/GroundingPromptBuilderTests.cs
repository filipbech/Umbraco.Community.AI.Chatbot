using Umbraco.Community.AI.Chatbot.Core.Chat;
using Umbraco.Community.AI.Chatbot.Core.Configuration;
using Umbraco.Community.AI.Chatbot.Core.Search;

namespace Umbraco.Community.AI.Chatbot.Tests.Unit.Chat;

public class GroundingPromptBuilderTests
{
    private static ChatInstance MakeInstance(string fallback = "No idea, sorry.") => new()
    {
        Alias = "test",
        AgentAlias = "agent-x",
        FallbackMessage = fallback,
    };

    [Fact]
    public void Build_WithNoSources_StatesSourcesAreNone()
    {
        var prompt = GroundingPromptBuilder.Build(MakeInstance(), []);

        prompt.ShouldContain("SOURCES: (none)");
    }

    [Fact]
    public void Build_WithSources_NumbersAndIncludesUrlAndBody()
    {
        var sources = new List<ResolvedSource>
        {
            new(Guid.NewGuid(), "Page A", "/a", "Body A"),
            new(Guid.NewGuid(), "Page B", null, "Body B"),
        };

        var prompt = GroundingPromptBuilder.Build(MakeInstance(), sources);

        prompt.ShouldContain("[1] Page A");
        prompt.ShouldContain("URL: /a");
        prompt.ShouldContain("Body A");
        prompt.ShouldContain("[2] Page B");
        prompt.ShouldNotContain("URL: \n"); // Page B had no URL — line should be omitted
        prompt.ShouldContain("Body B");
    }

    [Fact]
    public void Build_EmbedsConfiguredFallbackMessage()
    {
        var prompt = GroundingPromptBuilder.Build(MakeInstance("Custom fallback wording."), []);

        prompt.ShouldContain("Custom fallback wording.");
    }

    [Fact]
    public void Build_AlwaysIncludesGroundingRules()
    {
        // The strict "Answer ONLY" instruction is the load-bearing rule against hallucinations.
        // If it ever drifts the test catches it.
        var prompt = GroundingPromptBuilder.Build(MakeInstance(), []);

        prompt.ShouldContain("RULES:");
        prompt.ShouldContain("Answer ONLY using information from the SOURCES below");
        prompt.ShouldContain("Do not fabricate URLs");
    }
}
