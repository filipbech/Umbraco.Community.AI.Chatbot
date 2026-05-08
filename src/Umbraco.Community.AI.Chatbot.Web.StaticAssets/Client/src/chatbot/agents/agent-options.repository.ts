import { umbHttpClient } from "@umbraco-cms/backoffice/http-client";

// Lightweight client-side fetch of available agents for the agent-alias dropdown.
// We hit the AI Agent management API directly instead of taking a hard dependency on
// internal types from `@umbraco-ai/agent`.
const AGENTS_API = "/umbraco/ai/management/api/v1/agents";
const security = [{ type: "http" as const, scheme: "bearer" as const }];

export interface AgentOption {
    id: string;
    alias: string;
    name: string;
    isActive: boolean;
}

interface AgentsResponse {
    items?: Array<{
        id?: string;
        alias?: string;
        name?: string;
        isActive?: boolean;
    }>;
}

export async function fetchAgentOptions(): Promise<AgentOption[]> {
    const { data, error } = (await umbHttpClient.get({
        url: `${AGENTS_API}?skip=0&take=200`,
        security,
    })) as { data?: AgentsResponse; error?: Error };
    if (error || !data?.items) {
        return [];
    }
    return data.items
        .filter((a) => a.alias && a.name)
        .map((a) => ({
            id: a.id ?? "",
            alias: a.alias!,
            name: a.name!,
            isActive: a.isActive ?? true,
        }));
}
