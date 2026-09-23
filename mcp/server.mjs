// Bridge-Tools MCP server — exposes the repo's double-dummy engine to any
// MCP-capable client (Claude Desktop, Cursor, VSCode, JetBrains, npx inspectors...).
//
// Run with stdio transport:
//   node mcp/server.mjs

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { calculateDoubleDummyTable, getNextPlays } from "./ddsCore.js";

const STRAINS = ["N", "S", "H", "D", "C"];

function ddTableToRows(dd) {
  // Same layout the web app's ShowTricks uses:
  // 4 rows (declarer: S, W, N, E) x 5 columns (NT, S, H, D, C) = makeable tricks.
  const rows = [["S", ...STRAINS.map((s) => dd[s]["S"])],
                ["W", ...STRAINS.map((s) => dd[s]["W"])],
                ["N", ...STRAINS.map((s) => dd[s]["N"])],
                ["E", ...STRAINS.map((s) => dd[s]["E"])]];
  return rows;
}

function summarizeDD(dd) {
  const lines = [];
  for (const strain of STRAINS) {
    const names = { N: "NT", S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
    lines.push(
      `${names[strain]}: N=${dd[strain]["N"]} S=${dd[strain]["S"]} E=${dd[strain]["E"]} W=${dd[strain]["W"]}`
    );
  }
  return lines.join("\n");
}

const server = new Server(
  {
    name: "bridge-tools",
    version: "0.1.0",
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_double_dummy",
        description:
          "Given a complete 52-card bridge deal in PBN format, compute the double-dummy " +
          "optimal result for every strain and every declarer (which side makes how many " +
          "tricks with best play, both sides seeing all cards). Use this as ground truth " +
          "when discussing bridge play problems. The result is deterministic and exact, " +
          "not an estimate.",
        inputSchema: {
          type: "object",
          properties: {
            pbn: {
              type: "string",
              description:
                'PBN deal, e.g. "N:AKQJT9876543.2..3 2.AKQJT9.AKQJT9.2 ..." ' +
                "Format: leading seat (N/E/S/W) that leads, then the four hands " +
                "joined by spaces in order N, E, S, W; each hand is 4 suits (S.H.D.C) " +
                "separated by dots, 10 written as T. All 13 cards of each hand required.",
            },
          },
          required: ["pbn"],
        },
      },
      {
        name: "next_plays",
        description:
          "Single-trick double-dummy analysis for a given deal and trump contract, " +
          "as seen from the LEADING side's perspective. Given the cards the first " +
          "player has already led/played IN ORDER (all belonging to the player who " +
          "leads), return the double-dummy best cards to play from that hand, e.g. " +
          "answer 'which card should the leader choose?'. Pass an empty array when " +
          "analyzing the opening lead. Cards are encoded as rank+suit ('5D', 'QD'). " +
          "Suits: S/H/D/C; trump 'N' = notrump. Deterministic and exact.",
        inputSchema: {
          type: "object",
          properties: {
            pbn: {
              type: "string",
              description: 'PBN deal, e.g. "N:AKQJ.32.4... ..." (leader + 4 full hands).',
            },
            trump: {
              type: "string",
              enum: ["S", "H", "D", "C", "N"],
              description: "Trump suit: S/H/D/C or N for notrump.",
            },
            plays: {
              type: "array",
              items: { type: "string" },
              description:
                "Cards already played THIS trick from the leading hand, in play order.",
            },
          },
          required: ["pbn", "trump", "plays"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "analyze_double_dummy": {
        const dd = calculateDoubleDummyTable(args.pbn);
        return {
          content: [
            {
              type: "text",
              text:
                `Double-dummy makeable tricks (best play, both sides perfect):\n\n` +
                summarizeDD(dd) +
                `\n\nAs table (declarer row x strain column):\n` +
                JSON.stringify(ddTableToRows(dd)),
            },
          ],
        };
      }
      case "next_plays": {
        const res = getNextPlays(args.pbn, args.trump, args.plays || []);
        return {
          content: [
            {
              type: "text",
              text:
                `Double-dummy best plays for the trick (trump ${args.trump}):\n` +
                JSON.stringify(res, null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `bridge-tools error: ${err.message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("bridge-tools MCP server running on stdio");