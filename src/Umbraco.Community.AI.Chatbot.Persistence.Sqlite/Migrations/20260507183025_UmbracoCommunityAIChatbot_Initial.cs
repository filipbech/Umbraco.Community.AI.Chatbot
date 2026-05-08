using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Community.AI.Chatbot.Persistence.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class UmbracoCommunityAIChatbot_Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "umbracoCommunityAIChatbot_Instance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    Alias = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    AgentAlias = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    WelcomeMessage = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    FallbackMessage = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    TopK = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 5),
                    SuggestionCount = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 3),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DateCreated = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DateModified = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_umbracoCommunityAIChatbot_Instance", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_umbracoCommunityAIChatbot_Instance_Alias",
                table: "umbracoCommunityAIChatbot_Instance",
                column: "Alias",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "umbracoCommunityAIChatbot_Instance");
        }
    }
}
