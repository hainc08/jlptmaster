export class OwnershipError extends Error {
  constructor(message: string = "Truy cập bị từ chối: Bạn không có quyền truy cập dữ liệu của học viên khác") {
    super(message);
    this.name = "OwnershipError";
  }
}

export class UnauthorizedRoleError extends Error {
  constructor(message: string = "Truy cập bị từ chối: Yêu cầu quyền ADMIN") {
    super(message);
    this.name = "UnauthorizedRoleError";
  }
}

export function assertUserOwnership(currentUserId: string, resourceOwnerId: string): void {
  if (!currentUserId || currentUserId !== resourceOwnerId) {
    throw new OwnershipError();
  }
}

export function assertAdminRole(role: string): void {
  if (role !== "ADMIN") {
    throw new UnauthorizedRoleError();
  }
}
