import { NextResponse } from "next/server"

export const runtime = "edge"

/**
 * GET /api/public/v1/openapi
 *
 * Minimal OpenAPI 3.1 spec so integrators can plug the endpoints into
 * Postman / Insomnia / client-codegen without hand-writing types.
 */
export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "HobbyLink Public API",
      version: "v1",
      description:
        "Read-only HTTP API for published HobbyLink data (events, hobby catalog). Authenticate with `Authorization: Bearer <API key>`.",
    },
    servers: [{ url: "/api/public/v1" }],
    security: [{ ApiKey: [] }],
    components: {
      securitySchemes: {
        ApiKey: { type: "http", scheme: "bearer", bearerFormat: "API key" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
              required: ["code", "message"],
            },
          },
        },
        Event: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            event_date: { type: "string", format: "date-time" },
            location: { type: "string", nullable: true },
            max_participants: { type: "integer", nullable: true },
            price_cents: { type: "integer", nullable: true },
            currency: { type: "string", nullable: true },
          },
          required: ["id", "title", "event_date"],
        },
        Hobby: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            category: { type: "string" },
            description: { type: "string", nullable: true },
            member_count: { type: "integer" },
            is_featured: { type: "boolean" },
          },
          required: ["id", "name", "category"],
        },
      },
    },
    paths: {
      "/events": {
        get: {
          summary: "List upcoming events",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
            { name: "cursor", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "tag", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Event" } },
                      next_cursor: { type: "string", format: "date-time", nullable: true },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Auth error",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "429": {
              description: "Rate limited",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/hobbies": {
        get: {
          summary: "List all hobbies",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Hobby" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  })
}
