// English CCMAX Open API 1.1.0 paths and components, carried over verbatim from the
// previous console. Edit the published surface in tightenCcmaxOpenApi() (openapi.ts).
import type { EmbeddedSpec } from './openapi';

export const EN_SPEC: EmbeddedSpec = {
  "paths": {
    "/api/open/v1/ccmax/projects": {
      "get": {
        "operationId": "ccmaxListEligibleProjects",
        "summary": "List eligible projects",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Project"
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/proxies": {
      "get": {
        "operationId": "ccmaxListVisibleProxies",
        "summary": "List visible proxies",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyPage"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "search",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "maxLength": 128
            }
          },
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/proxies/import": {
      "post": {
        "operationId": "ccmaxImportProxies",
        "summary": "Import proxies",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyImportResult"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ProxyImport"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/submissions/credentials": {
      "post": {
        "operationId": "ccmaxSubmitCredentials",
        "summary": "Submit credentials",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CredentialSubmit"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/submissions/oauth/authorize": {
      "post": {
        "operationId": "ccmaxStartOauth",
        "summary": "Start OAuth",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OAuthAuthorization"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Account"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/submissions/oauth/complete": {
      "post": {
        "operationId": "ccmaxCompleteOauth",
        "summary": "Complete OAuth",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/OAuthSubmit"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/submissions/{id}": {
      "get": {
        "operationId": "ccmaxQuerySubmission",
        "summary": "Query submission",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/submissions/{id}/cancel": {
      "post": {
        "operationId": "ccmaxCancelPendingSubmission",
        "summary": "Cancel pending submission",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/resources": {
      "get": {
        "operationId": "ccmaxListResources",
        "summary": "List resources",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResourcePage"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "search",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "state",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "projectCode",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "operationalStatus",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1
            }
          },
          {
            "name": "size",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/resources/{id}": {
      "get": {
        "operationId": "ccmaxGetResource",
        "summary": "Get resource",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Resource"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/daily-summary": {
      "get": {
        "operationId": "ccmaxGetTodayQuoteSummary",
        "summary": "Get today quote summary",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business response. Check state for account submissions and skipped for proxy imports.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DailySummary"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "quoteId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/intake": {
      "get": {
        "operationId": "ccmaxGetTodayIntake",
        "summary": "Get today account creation allowance",
        "description": "Requires resource.read. No query parameters. Counts are independent of resource filters. Priority values, tiers and ranges are never exposed. Clients cannot submit priority, tier, canPro or quota source controls in query parameters or request bodies.",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Current caller daily creation counts and allowance",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/IntakeToday"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/proxy-replacements": {
      "post": {
        "operationId": "ccmaxReplaceProxies",
        "summary": "Replace resource proxies",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyReplacementJob"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ProxyReplacementCreate"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/proxy-replacements/{id}": {
      "get": {
        "operationId": "ccmaxGetProxyReplacement",
        "summary": "Get proxy replacement job",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyReplacementJob"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local job/operation ID."
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/proxy-replacements/{id}/reconcile": {
      "post": {
        "operationId": "ccmaxReconcileProxyReplacement",
        "summary": "Reconcile proxy binding",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyReplacementJob"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local job/operation ID."
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/resources/{resourceId}/credential-refresh": {
      "get": {
        "operationId": "ccmaxCurrentCredentialRefresh",
        "summary": "Get current credential refresh",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local resource ID."
            }
          }
        ]
      },
      "post": {
        "operationId": "ccmaxRefreshCredential",
        "summary": "Force credential refresh",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local resource ID."
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CredentialRefreshRequest"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/resources/{resourceId}/reauthorizations/current": {
      "get": {
        "operationId": "ccmaxCurrentReauthorization",
        "summary": "Get current reauthorization",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local resource ID."
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/resources/{resourceId}/reauthorizations": {
      "post": {
        "operationId": "ccmaxStartReauthorization",
        "summary": "Start reauthorization",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local resource ID."
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ReauthorizationStart"
              }
            }
          }
        }
      }
    },
    "/api/open/v1/ccmax/resources/{resourceId}/reauthorizations/{id}": {
      "put": {
        "operationId": "ccmaxSubmitReauthorization",
        "summary": "Submit reauthorization credentials",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local resource ID."
            }
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local job/operation ID."
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ReauthorizationSubmit"
              }
            }
          }
        }
      },
      "get": {
        "operationId": "ccmaxGetReauthorization",
        "summary": "Get reauthorization progress",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business receipt; check state/status and item outcomes.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "Missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Insufficient permission",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Object not found or not accessible",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "State or idempotency conflict",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "Upstream request failed",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "Temporarily unavailable",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "parameters": [
          {
            "name": "resourceId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local resource ID."
            }
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Local job/operation ID."
            }
          }
        ]
      }
    }
  },
  "components": {
    "securitySchemes": {
      "AccountApiKey": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "hp_…"
      }
    },
    "schemas": {
      "Account": {
        "type": "object",
        "description": "PRO policy is derived from server settings. Clients cannot override canPro.",
        "properties": {
          "projectCode": {
            "type": "string",
            "minLength": 1,
            "maxLength": 100
          },
          "credentialMode": {
            "type": "string",
            "enum": [
              "REFRESH_TOKEN",
              "ACCESS_TOKEN",
              "SESSION_KEY",
              "OAUTH"
            ]
          },
          "accountName": {
            "type": "string",
            "minLength": 1,
            "maxLength": 128
          },
          "proxyId": {
            "type": "string",
            "minLength": 1,
            "maxLength": 4096,
            "description": "An existing proxy id or a SOCKS5 / HTTP / HTTPS proxy address. Also accepts host:port or host:port:username:password (SOCKS5 by default). An address saves or reuses a proxy owned by the caller, without a separate import or preflight, and additionally requires proxy.read and proxy.write.",
            "example": "http://username:password@proxy.example.com:8080"
          },
          "refreshToken": {
            "type": "string",
            "writeOnly": true
          },
          "accessToken": {
            "type": "string",
            "writeOnly": true
          },
          "sessionKey": {
            "type": "string",
            "writeOnly": true
          },
          "expiresAt": {
            "type": "integer",
            "format": "int64",
            "minimum": 1,
            "description": "Expiration timestamp in milliseconds, consistent with the web application. Only supported for ACCESS_TOKEN."
          },
          "setupToken": {
            "type": "boolean",
            "enum": [
              false
            ],
            "description": "Only false is supported; true is not currently supported."
          },
          "remark": {
            "type": "string",
            "maxLength": 2000
          }
        },
        "required": [
          "projectCode",
          "credentialMode",
          "accountName",
          "proxyId"
        ]
      },
      "CredentialSubmit": {
        "type": "object",
        "properties": {
          "requestKey": {
            "type": "string",
            "format": "uuid"
          },
          "input": {
            "$ref": "#/components/schemas/Account"
          }
        },
        "required": [
          "requestKey",
          "input"
        ]
      },
      "OAuthSubmit": {
        "type": "object",
        "properties": {
          "sessionId": {
            "type": "string"
          },
          "code": {
            "type": "string",
            "writeOnly": true
          },
          "input": {
            "$ref": "#/components/schemas/Account"
          }
        },
        "required": [
          "sessionId",
          "code",
          "input"
        ]
      },
      "Project": {
        "type": "object",
        "properties": {
          "projectId": {
            "type": "string"
          },
          "projectCode": {
            "type": "string"
          },
          "projectName": {
            "type": "string"
          },
          "settlementMethod": {
            "type": "string"
          },
          "quoteId": {
            "type": "string"
          },
          "quoteCode": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          }
        }
      },
      "ProxyImport": {
        "type": "object",
        "properties": {
          "lines": {
            "type": "string",
            "description": "Up to 500 lines, using the existing proxy formats."
          },
          "defaultProtocol": {
            "type": "string",
            "enum": [
              "SOCKS5",
              "HTTP",
              "HTTPS"
            ]
          },
          "maxResources": {
            "type": "integer",
            "minimum": 0
          }
        },
        "required": [
          "lines",
          "maxResources"
        ]
      },
      "ProxyImportResult": {
        "type": "object",
        "properties": {
          "imported": {
            "type": "integer"
          },
          "skipped": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "line": {
                  "type": "integer"
                },
                "reason": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "Proxy": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "protocol": {
            "type": "string"
          },
          "endpoint": {
            "type": "string"
          },
          "enabled": {
            "type": "boolean"
          },
          "maxResources": {
            "type": "integer"
          },
          "usedResources": {
            "type": "integer"
          },
          "reservedResources": {
            "type": "integer"
          },
          "version": {
            "type": "integer",
            "description": "Current proxy version; send as proxyVersion when selecting an existing proxy.",
            "minimum": 0
          }
        }
      },
      "Resource": {
        "type": "object",
        "properties": {
          "id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "accountName": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "projectId": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "projectName": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "credentialMode": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "state": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "dispatchState": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "laneId": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "laneState": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "operationalStatus": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "createdAt": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "updatedAt": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "submittedAt": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "creationFailureHint": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "dispatchFailureReason": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "resourceType": {
            "type": "string",
            "const": "CCMAX"
          },
          "resourceData": {
            "anyOf": [
              {
                "type": "object",
                "additionalProperties": true
              },
              {
                "type": "null"
              }
            ]
          },
          "creationAttempts": {
            "type": "integer"
          },
          "creationRetrying": {
            "type": "boolean"
          },
          "creationFinished": {
            "type": "boolean"
          },
          "creationHttpStatus": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ]
          },
          "version": {
            "type": "integer",
            "description": "Current resource version; retrieve it before a maintenance operation.",
            "minimum": 0
          }
        }
      },
      "Submission": {
        "type": "object",
        "properties": {
          "failureCode": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "description": "Definite plan failures use PRO_PLAN_NOT_ALLOWED or PLAN_CHECK_FAILED; other failures retain their original business codes."
          },
          "state": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "resourceId": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "laneId": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "laneState": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "expiresAt": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "message": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "creationFailureHint": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "creationAttempts": {
            "type": "integer"
          },
          "creationRetrying": {
            "type": "boolean"
          },
          "creationFinished": {
            "type": "boolean"
          },
          "creationHttpStatus": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ]
          }
        }
      },
      "OAuthAuthorization": {
        "type": "object",
        "properties": {
          "sessionId": {
            "type": "string"
          },
          "authUrl": {
            "type": "string",
            "format": "uri"
          },
          "expiresAt": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "sessionId",
          "authUrl",
          "expiresAt"
        ]
      },
      "DailySummary": {
        "type": "object",
        "properties": {
          "businessDate": {
            "type": "string",
            "format": "date"
          },
          "timezone": {
            "type": "string",
            "const": "Asia/Shanghai"
          },
          "quoteId": {
            "type": "string"
          },
          "currency": {
            "type": "string"
          },
          "hasData": {
            "type": "boolean"
          },
          "resourceCount": {
            "type": "integer"
          },
          "entryCount": {
            "type": "integer"
          },
          "pendingCount": {
            "type": "integer"
          },
          "consumptionTotal": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^-?\\d+(\\.\\d+)?$"
              },
              {
                "type": "null"
              }
            ]
          },
          "pendingConsumption": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^-?\\d+(\\.\\d+)?$"
              },
              {
                "type": "null"
              }
            ]
          },
          "payableTotal": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^-?\\d+(\\.\\d+)?$"
              },
              {
                "type": "null"
              }
            ],
            "description": "Booked receivables are returned only to supplier primary accounts. Department administrators and ordinary members do not receive this field."
          },
          "lastQueriedAt": {
            "anyOf": [
              {
                "type": "string",
                "format": "date-time"
              },
              {
                "type": "null"
              }
            ]
          }
        }
      },
      "Error": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "status": {
            "type": "integer"
          },
          "traceId": {
            "type": "string"
          },
          "creationNotStarted": {
            "type": "boolean"
          },
          "code": {
            "type": "string"
          }
        },
        "required": [
          "message",
          "status",
          "traceId"
        ]
      },
      "ProxyPage": {
        "type": "object",
        "properties": {
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Proxy"
            }
          },
          "total": {
            "type": "integer",
            "format": "int64"
          },
          "page": {
            "type": "integer"
          },
          "size": {
            "type": "integer"
          }
        },
        "required": [
          "items",
          "total",
          "page",
          "size"
        ]
      },
      "ResourcePage": {
        "type": "object",
        "properties": {
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Resource"
            }
          },
          "total": {
            "type": "integer",
            "format": "int64"
          },
          "page": {
            "type": "integer"
          },
          "size": {
            "type": "integer"
          }
        },
        "required": [
          "items",
          "total",
          "page",
          "size"
        ]
      },
      "IntakeAllowance": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "limit",
          "used",
          "remaining",
          "source",
          "groupId",
          "reclaimed"
        ],
        "properties": {
          "limit": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "used": {
            "type": "integer",
            "minimum": 0
          },
          "remaining": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "source": {
            "type": "string"
          },
          "groupId": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "reclaimed": {
            "type": "boolean"
          }
        },
        "description": "Null limit/remaining means unlimited. Reclaimed personal allocations have no remaining allowance today; sharing resumes the next Beijing day."
      },
      "IntakeToday": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "date",
          "total",
          "pro",
          "nonPro",
          "unknown",
          "processing",
          "proAllowance",
          "nonProAllowance",
          "canPro",
          "accepting"
        ],
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          },
          "total": {
            "type": "integer",
            "minimum": 0
          },
          "pro": {
            "type": "integer",
            "minimum": 0
          },
          "nonPro": {
            "type": "integer",
            "minimum": 0
          },
          "unknown": {
            "type": "integer",
            "minimum": 0
          },
          "processing": {
            "type": "integer",
            "minimum": 0
          },
          "proAllowance": {
            "$ref": "#/components/schemas/IntakeAllowance"
          },
          "nonProAllowance": {
            "$ref": "#/components/schemas/IntakeAllowance"
          },
          "canPro": {
            "type": "boolean"
          },
          "accepting": {
            "type": "boolean"
          }
        }
      },
      "ProxyReplacementItem": {
        "type": "object",
        "required": [
          "resourceId",
          "resourceVersion"
        ],
        "additionalProperties": false,
        "properties": {
          "resourceId": {
            "type": "string",
            "description": "Local resource ID, not an upstream Lane ID."
          },
          "resourceVersion": {
            "type": "integer",
            "description": "The version returned by the resource detail endpoint.",
            "minimum": 0
          },
          "proxyId": {
            "type": "string",
            "description": "Existing proxy ID; supply proxyVersion and omit proxyUrl."
          },
          "proxyVersion": {
            "type": "integer",
            "description": "The version returned by the proxy list endpoint.",
            "minimum": 0
          },
          "proxyUrl": {
            "type": "string",
            "description": "SOCKS5/HTTP URI or host:port[:username:password]; additionally requires proxy.write.",
            "maxLength": 4096
          }
        },
        "oneOf": [
          {
            "required": [
              "proxyId",
              "proxyVersion"
            ]
          },
          {
            "required": [
              "proxyUrl"
            ]
          }
        ]
      },
      "ProxyReplacementCreate": {
        "type": "object",
        "required": [
          "requestKey",
          "items"
        ],
        "additionalProperties": false,
        "properties": {
          "requestKey": {
            "type": "string",
            "description": "Keep unchanged when retrying the same replacement; 16–80 letters, digits, underscores or hyphens.",
            "pattern": "^[A-Za-z0-9_-]{16,80}$"
          },
          "items": {
            "type": "array",
            "minItems": 1,
            "maxItems": 100,
            "items": {
              "$ref": "#/components/schemas/ProxyReplacementItem"
            },
            "description": "1–100 items from the same supplier and CCMAX target."
          }
        }
      },
      "ProxyReplacementResultItem": {
        "type": "object",
        "properties": {
          "resourceId": {
            "type": "string",
            "description": "Local resource ID."
          },
          "resourceName": {
            "type": "string"
          },
          "proxyName": {
            "type": "string"
          },
          "state": {
            "type": "string",
            "description": "Per-item outcome; DONE confirms binding, NEEDS_REVIEW requires reconciliation."
          },
          "error": {
            "type": [
              "string",
              "null"
            ]
          },
          "bindingApplied": {
            "type": "boolean"
          },
          "readiness": {
            "type": "string",
            "description": "Currently unverified; successful binding does not guarantee account readiness."
          }
        }
      },
      "ProxyReplacementJob": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Local replacement job ID."
          },
          "mode": {
            "type": "string",
            "enum": [
              "SINGLE",
              "BATCH"
            ]
          },
          "state": {
            "type": "string",
            "description": "QUEUED/PREPARING/SUBMITTING/RUNNING/VERIFYING/COMPLETED/PARTIAL_FAILED/FAILED/NEEDS_REVIEW; HTTP 200 is not confirmation of replacement."
          },
          "total": {
            "type": "integer"
          },
          "finished": {
            "type": "integer"
          },
          "error": {
            "type": [
              "string",
              "null"
            ]
          },
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ProxyReplacementResultItem"
            }
          }
        }
      },
      "CredentialRefreshRequest": {
        "type": "object",
        "required": [
          "requestId",
          "version"
        ],
        "additionalProperties": false,
        "properties": {
          "requestId": {
            "type": "string",
            "description": "Caller-generated canonical lowercase UUID; keep it unchanged for the same operation.",
            "format": "uuid"
          },
          "version": {
            "type": "integer",
            "description": "The version returned by the resource detail endpoint.",
            "minimum": 0
          }
        }
      },
      "ReauthorizationStart": {
        "type": "object",
        "required": [
          "version",
          "mode"
        ],
        "additionalProperties": false,
        "properties": {
          "version": {
            "type": "integer",
            "description": "The version returned by the resource detail endpoint.",
            "minimum": 0
          },
          "mode": {
            "type": "string",
            "description": "OAUTH creates an authorization link; REFRESH_TOKEN accepts new manual credentials.",
            "enum": [
              "OAUTH",
              "REFRESH_TOKEN"
            ]
          }
        }
      },
      "ReauthorizationSubmit": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "code": {
            "type": "string",
            "description": "For OAUTH only: the new authorization code; do not send tokens.",
            "maxLength": 16384
          },
          "refreshToken": {
            "type": "string",
            "description": "Required for REFRESH_TOKEN; mutually exclusive with code.",
            "maxLength": 16384
          },
          "accessToken": {
            "type": "string",
            "description": "Optional in REFRESH_TOKEN mode.",
            "maxLength": 16384
          },
          "expiresAt": {
            "type": "integer",
            "description": "Optional future expiry in milliseconds for REFRESH_TOKEN mode."
          }
        }
      },
      "MaintenanceOperation": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Local operation ID; use it to submit and query the same reauthorization."
          },
          "resourceId": {
            "type": "string"
          },
          "mode": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "description": "NONE means no record; READY awaits input; saved awaits installation; complete means complete; UNKNOWN is uncertain. Other upstream stages are preserved; HTTP 200 does not mean complete."
          },
          "credentialSaved": {
            "type": "boolean"
          },
          "laneState": {
            "type": [
              "string",
              "null"
            ]
          },
          "paused": {
            "type": "boolean"
          },
          "busy": {
            "type": "boolean"
          },
          "reauthorizationAllowed": {
            "type": "boolean",
            "description": "Current maintenance policy, returned by current-operation queries."
          },
          "authUrl": {
            "type": "string",
            "description": "Returned when starting OAuth; the account holder opens this URL."
          },
          "expiresAt": {
            "type": [
              "string",
              "null"
            ],
            "format": "date-time"
          },
          "updatedAt": {
            "type": [
              "string",
              "null"
            ],
            "format": "date-time"
          },
          "queryFailed": {
            "type": "boolean"
          }
        }
      }
    }
  }
};
