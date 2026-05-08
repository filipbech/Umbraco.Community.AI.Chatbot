using Umbraco.Community.AI.Chatbot.Core.Chat;

namespace Umbraco.Community.AI.Chatbot.Tests.Unit.Chat;

public class FollowUpParseSuggestionsTests
{
    [Fact]
    public void Returns_Empty_For_Whitespace_Or_Null()
    {
        FollowUpGenerator.ParseSuggestions("", 3).ShouldBeEmpty();
        FollowUpGenerator.ParseSuggestions("   ", 3).ShouldBeEmpty();
    }

    [Fact]
    public void Returns_Empty_When_No_Json_Object_Found()
    {
        FollowUpGenerator.ParseSuggestions("totally not json", 3).ShouldBeEmpty();
    }

    [Fact]
    public void Returns_Empty_When_Suggestions_Key_Missing()
    {
        FollowUpGenerator.ParseSuggestions("{\"other\":[\"x\"]}", 3).ShouldBeEmpty();
    }

    [Fact]
    public void Returns_Empty_When_Suggestions_Not_Array()
    {
        FollowUpGenerator.ParseSuggestions("{\"suggestions\":\"x\"}", 3).ShouldBeEmpty();
    }

    [Fact]
    public void Returns_Empty_For_Malformed_Json()
    {
        // The brace-extraction picks "{not valid}" then JsonDocument.Parse throws.
        FollowUpGenerator.ParseSuggestions("{not valid}", 3).ShouldBeEmpty();
    }

    [Fact]
    public void Parses_Valid_Suggestions()
    {
        var raw = "{\"suggestions\":[\"What's the price?\",\"How do I install?\",\"Where is support?\"]}";

        var result = FollowUpGenerator.ParseSuggestions(raw, 3);

        result.Count.ShouldBe(3);
        result[0].ShouldBe("What's the price?");
        result[2].ShouldBe("Where is support?");
    }

    [Fact]
    public void Tolerates_Surrounding_Prose()
    {
        // Models sometimes wrap JSON in "Here are the suggestions: ...". The brace scan handles it.
        var raw = "Here you go: {\"suggestions\":[\"a\",\"b\"]} hope that helps!";

        FollowUpGenerator.ParseSuggestions(raw, 3).ShouldBe(new[] { "a", "b" });
    }

    [Fact]
    public void Honors_Max_Cap()
    {
        var raw = "{\"suggestions\":[\"a\",\"b\",\"c\",\"d\",\"e\"]}";

        FollowUpGenerator.ParseSuggestions(raw, 2).Count.ShouldBe(2);
        FollowUpGenerator.ParseSuggestions(raw, 5).Count.ShouldBe(5);
    }

    [Fact]
    public void Skips_Empty_Strings()
    {
        var raw = "{\"suggestions\":[\"a\",\"\",\"  \",\"b\"]}";

        FollowUpGenerator.ParseSuggestions(raw, 5).ShouldBe(new[] { "a", "b" });
    }
}
