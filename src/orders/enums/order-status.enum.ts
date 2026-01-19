/**
 * Order status enum.
 * Represents the lifecycle stages of an order.
 * Status transitions must follow a valid sequence.
 */
export enum OrderStatus {
  REQUESTED = 'requested',
  PICKED_UP = 'picked_up',
  IN_LAUNDRY = 'in_laundry',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Valid status transitions map.
 * Defines which statuses can transition to which.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.REQUESTED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_LAUNDRY, OrderStatus.CANCELLED],
  [OrderStatus.IN_LAUNDRY]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Check if a status transition is valid.
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
