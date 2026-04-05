/**
 * ApiResponse — consistent response envelope for all successful responses.
 *
 * Every endpoint returns this shape so the frontend can rely on a
 * predictable structure:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "Records retrieved successfully.",
 *   data: [...],
 *   pagination: { total, page, limit, totalPages }  // only when paginating
 * }
 */
class ApiResponse {
  constructor(statusCode, message, data = null, pagination = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) this.data = data;
    if (pagination !== null) this.pagination = pagination;
  }
}

module.exports = ApiResponse;
