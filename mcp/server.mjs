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
import { dealHands } from "./dealCore.js";

const ONE_HAND_FILTER_SCHEMA = {
  type: "object",
  properties: {
    points: {
      type: "array",
      items: { type: "number" },
      minItems: 2,
      maxItems: 2,
      description: "HCP range [min, max] inclusive.",
    },
    shapes: {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      description: "Exact distribution [S, H, D, C], must sum to 13, e.g. [5,3,3,2].",
    },
    ambiguousShape: {
      type: "array",
      items: {
        type: "array",
        items: { type: "number" },
        minItems: 2,
        maxItems: 2,
        description: "per-suit [min, max]",
      },
      minItems: 4,
      maxItems: 4,
      description:
        "Per-suit count ranges [[minS,maxS],[minH,maxH],[minD,maxD],[minC,maxC]], e.g. [[5,6],[3,4],[2,3],[1,3]].",
    },
    maxsuit: {
      type: "number",
      description: "Longest suit must be at most this many cards.",
    },
    minsuit: {
      type: "number",
      description: "Shortest suit must be at least this many cards.",
    },
    havesuit: {
      type: "array",
      items: { type: "number" },
      description: "Hand must contain a suit with one of these lengths, e.g. [4,5] means a 4- or 5-card suit.",
    },
    solid: {
      type: "boolean",
      description: "Longest suit must contain at least 3 of A/K/Q/J.",
    },
    maxace: { type: "number", description: "At most this many aces." },
    minace: { type: "number", description: "At least this many aces." },
    cards: {
      type: "array",
      items: { type: "string" },
      description:
        'Known/fixed cards held by this seat, as rank-then-suit codes e.g. ["AS","KD","TS"] (T = 10).',
    },
  },
  additionalProperties: false,
};

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
      {
        name: "deal_hands",
        description:
          "Generate random bridge deals (hands) subject to per-seat constraints " +
          "like HCP range, exact shape, shape ranges, longest/shortest suit, " +
          "aces, and known fixed cards. Same engine as the web app's Deal page. " +
          "Returns one PBN-format deal per board plus a per-hand summary " +
          "(points, shape). Randomness is genuine; ask for more boards to get " +
          "more hands, or pair the result with analyze_double_dummy.",
        inputSchema: {
          type: "object",
          properties: {
            boardSize: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 1,
              description: "How many deals/boards to generate (default 1).",
            },
            filters: {
              type: "object",
              properties: {
                N: { ...ONE_HAND_FILTER_SCHEMA, description: "North hand constraints" },
                S: { ...ONE_HAND_FILTER_SCHEMA, description: "South hand constraints" },
                E: { ...ONE_HAND_FILTER_SCHEMA, description: "East hand constraints" },
                W: { ...ONE_HAND_FILTER_SCHEMA, description: "West hand constraints" },
              },
              additionalProperties: false,
              description:
                "Optional per-seat constraints. Omit a seat to deal it freely. " +
                "With no shape constraints at all it just deals random hands.",
            },
          },
          required: [],
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
      case "deal_hands": {
        const boardSize = args.boardSize ?? 1;
        const filters = args.filters || {};
        const boards = dealHands(boardSize, filters);

        const lines = boards.map((b) => {
          const seats = ["N", "S", "E", "W"].map(
            (seat) => {
              const h = b[seat];
              const shape = `${h.shape.S}-${h.shape.H}-${h.shape.D}-${h.shape.C}`;
              return `${seat}: ${shape} (${h.points} HCP)`;
            }
          );
          return [
            `Board ${b.boardnum} — dealer ${b.dealer}, vul ${b.vul}`,
            `PBN: ${b.pbn}`,
            ...seats.map((s) => "  " + s),
          ].join("\n");
        });

        return {
          content: [
            {
              type: "text",
              text:
                `Dealt ${boards.length} board(s):\n\n` +
                lines.join("\n\n"),
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