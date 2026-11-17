// Chinese CCMAX Open API 1.1.0 paths and components, carried over verbatim from the
// previous console. Edit the published surface in tightenCcmaxOpenApi() (openapi.ts).
import type { EmbeddedSpec } from './openapi';

export const ZH_SPEC: EmbeddedSpec = {
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
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
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyPage"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyImportResult"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OAuthAuthorization"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Submission"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResourcePage"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Resource"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
            "description": "业务响应；上号须检查state，导入须检查skipped",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DailySummary"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
        "summary": "查询今日上号额度",
        "description": "需要resource.read，不接受查询参数。计数独立于资源筛选。不返回优先级及档位区间；客户端不能通过参数或请求体提交priority、tier、canPro和额度来源。",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "当前账号今日成功数量及实际额度",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/IntakeToday"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
        "summary": "更换代理",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyReplacementJob"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
        "summary": "查询代理更换任务",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyReplacementJob"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地任务／操作ID。"
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/proxy-replacements/{id}/reconcile": {
      "post": {
        "operationId": "ccmaxReconcileProxyReplacement",
        "summary": "重新核对代理绑定",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProxyReplacementJob"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地任务／操作ID。"
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/resources/{resourceId}/credential-refresh": {
      "get": {
        "operationId": "ccmaxCurrentCredentialRefresh",
        "summary": "查询强制刷新结果",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地资源ID。"
            }
          }
        ]
      },
      "post": {
        "operationId": "ccmaxRefreshCredential",
        "summary": "强制刷新授权",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地资源ID。"
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
        "summary": "查询当前重新授权操作",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地资源ID。"
            }
          }
        ]
      }
    },
    "/api/open/v1/ccmax/resources/{resourceId}/reauthorizations": {
      "post": {
        "operationId": "ccmaxStartReauthorization",
        "summary": "发起重新授权",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地资源ID。"
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
        "summary": "提交重新授权凭据",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地资源ID。"
            }
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "本地任务／操作ID。"
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
        "summary": "查询重新授权进度",
        "security": [
          {
            "AccountApiKey": []
          }
        ],
        "responses": {
          "200": {
            "description": "已取得业务回执，须检查state／status及逐项结果。",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MaintenanceOperation"
                }
              }
            }
          },
          "400": {
            "description": "输入不合法",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "密钥无效或缺失",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "无权调用",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "对象不可见",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "409": {
            "description": "状态或幂等冲突",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "502": {
            "description": "上游失败",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "503": {
            "description": "暂不可用",
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
              "description": "本地资源ID。"
            }
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "本地任务／操作ID。"
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
        "description": "PRO策略由服务端两级配置决定，不接受客户端canPro覆盖。",
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
            "description": "已有代理 id，或直接填写 SOCKS5 / HTTP / HTTPS 代理地址；也支持 host:port、host:port:username:password（默认 SOCKS5）。地址自动保存或复用本人代理，无需单独导入或预检，另需 proxy.read 和 proxy.write 权限。",
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
            "description": "与现有页面一致的毫秒时间戳，仅ACCESS_TOKEN可用"
          },
          "setupToken": {
            "type": "boolean",
            "enum": [
              false
            ],
            "description": "仅兼容false，true暂不支持"
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
            "description": "最多500行；沿用现有代理格式"
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
            "description": "代理当前版本，使用已有代理更换时传proxyVersion。",
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
            "description": "资源当前版本；维护操作前查询此值。",
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
            "description": "明确套餐拒绝时为PRO_PLAN_NOT_ALLOWED或PLAN_CHECK_FAILED；其他失败保留原业务代码。"
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
            "description": "仅供应商主账号返回已入账应收金额；部门管理员和普通成员不返回此字段。"
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
        "description": "limit/remaining为null表示不限。已回收且当日已用的个人预留当天不转入共享池，次日恢复共享。"
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
            "description": "本地资源ID，不是上游Lane ID。"
          },
          "resourceVersion": {
            "type": "integer",
            "description": "资源详情返回的version。",
            "minimum": 0
          },
          "proxyId": {
            "type": "string",
            "description": "已有代理ID；和proxyVersion一起填写，与proxyUrl互斥。"
          },
          "proxyVersion": {
            "type": "integer",
            "description": "代理列表返回的version。",
            "minimum": 0
          },
          "proxyUrl": {
            "type": "string",
            "description": "直接填写SOCKS5／HTTP地址或host:port[:username:password]；额外需proxy.write。",
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
            "description": "同一次更换重试保持不变；16–80位字母、数字、下划线或短横线。",
            "pattern": "^[A-Za-z0-9_-]{16,80}$"
          },
          "items": {
            "type": "array",
            "minItems": 1,
            "maxItems": 100,
            "items": {
              "$ref": "#/components/schemas/ProxyReplacementItem"
            },
            "description": "1–100条，同一供应商和CCMAX目标。"
          }
        }
      },
      "ProxyReplacementResultItem": {
        "type": "object",
        "properties": {
          "resourceId": {
            "type": "string",
            "description": "本地资源ID。"
          },
          "resourceName": {
            "type": "string"
          },
          "proxyName": {
            "type": "string"
          },
          "state": {
            "type": "string",
            "description": "逐项结果；DONE表示绑定已核实，NEEDS_REVIEW表示待核对。"
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
            "description": "当前为unverified；绑定成功不保证账号就绪。"
          }
        }
      },
      "ProxyReplacementJob": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "本地更换任务ID。"
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
            "description": "QUEUED／PREPARING／SUBMITTING／RUNNING／VERIFYING／COMPLETED／PARTIAL_FAILED／FAILED／NEEDS_REVIEW；HTTP200不代表已更换成功。"
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
            "description": "调用方生成的小写规范UUID，同一次操作保持不变。",
            "format": "uuid"
          },
          "version": {
            "type": "integer",
            "description": "资源详情返回的version。",
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
            "description": "资源详情返回的version。",
            "minimum": 0
          },
          "mode": {
            "type": "string",
            "description": "OAUTH生成授权链接；REFRESH_TOKEN手动提交新凭据。",
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
            "description": "OAUTH模式仅填写本次新授权码；不得同时传Token。",
            "maxLength": 16384
          },
          "refreshToken": {
            "type": "string",
            "description": "REFRESH_TOKEN模式必填；与code互斥。",
            "maxLength": 16384
          },
          "accessToken": {
            "type": "string",
            "description": "REFRESH_TOKEN模式可选。",
            "maxLength": 16384
          },
          "expiresAt": {
            "type": "integer",
            "description": "REFRESH_TOKEN模式可选，未来的毫秒时间戳。"
          }
        }
      },
      "MaintenanceOperation": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "本地操作ID；重新授权时用于提交和查询同一操作。"
          },
          "resourceId": {
            "type": "string"
          },
          "mode": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "description": "NONE无记录；READY待提交；saved已保存待安装；complete完成；UNKNOWN未知。保留其他上游阶段，HTTP200不等于完成。"
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
            "description": "current查询返回的当前授权维护开关。"
          },
          "authUrl": {
            "type": "string",
            "description": "仅发起OAuth时返回，供账号持有人打开。"
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
