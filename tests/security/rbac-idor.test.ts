import { describe, it, expect } from "vitest";
import { assertUserOwnership, assertAdminRole } from "../../src/server/services/auth-service";

describe("Security & Authorization — RBAC & IDOR Protection", () => {
  it("allows a student to access their own resources", () => {
    const currentUserId = "user-minh-123";
    const resourceOwnerId = "user-minh-123";

    expect(() => assertUserOwnership(currentUserId, resourceOwnerId)).not.toThrow();
  });

  it("blocks IDOR attempts when a student tries to access another student's attempt", () => {
    const currentUserId = "user-minh-123";
    const victimUserId = "user-alice-999";

    expect(() => assertUserOwnership(currentUserId, victimUserId)).toThrowError(
      "Truy cập bị từ chối: Bạn không có quyền truy cập dữ liệu của học viên khác"
    );
  });

  it("permits ADMIN role and rejects STUDENT or EDITOR for publish actions", () => {
    expect(() => assertAdminRole("ADMIN")).not.toThrow();
    expect(() => assertAdminRole("STUDENT")).toThrowError("Truy cập bị từ chối: Yêu cầu quyền ADMIN");
    expect(() => assertAdminRole("EDITOR")).toThrowError("Truy cập bị từ chối: Yêu cầu quyền ADMIN");
  });
});
