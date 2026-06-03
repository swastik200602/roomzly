import swaggerJsdoc from "swagger-jsdoc";

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Roomzly API",
      version: "0.1.0"
    },
    servers: [{ url: "/api/v1" }]
  },
  apis: ["src/modules/**/*.ts"]
});
