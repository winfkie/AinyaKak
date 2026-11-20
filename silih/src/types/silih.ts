export type ZoneId = "ZONA_1" | "ZONA_2" | "ZONA_3";

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  label: string;
  subAreas: string[];
}

export interface ClothingItem {
  id: string;
  title: string;
  category: "Jas & Blazer" | "Kebaya & Batik" | "Dress & Formal" | "Kostum & Almamater";
  size: "S" | "M" | "L" | "XL";
  pricePerDay: number;
  maxDays: number;
  ownerName: string;
  zone: ZoneId;
  subArea: string;
  addressDetail: string;
  imageUrl: string;
  description: string;
  isAvailable: boolean;
  availableUntilText: string;
}

export interface MenfessReply {
  id: string;
  ownerName: string;
  clothingItemId: string;
  message: string;
  createdAt: string;
}

export interface MenfessPost {
  id: string;
  authorName: string;
  zone: ZoneId;
  subArea: string;
  content: string;
  budgetPerDay: number;
  neededDate: string;
  createdAt: string;
  replies: MenfessReply[];
}

export interface ChatMessage {
  id: string;
  channel: "NEGOTIATION" | "DELIVERY_COURIER" | "RETURN_COURIER";
  referenceId: string;
  senderRole: "RENTER" | "OWNER" | "COURIER";
  senderName: string;
  text: string;
  timestamp: string;
  dealOffer?: {
    days: number;
    agreedRentalPrice: number;
    status: "PENDING" | "ACCEPTED";
  };
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "WAITING_DELIVERY_COURIER"
  | "DELIVERY_PICKING_UP"
  | "DELIVERY_ON_THE_WAY"
  | "ACTIVE_RENTAL"
  | "WAITING_RETURN_COURIER"
  | "RETURN_PICKING_UP"
  | "RETURN_ON_THE_WAY"
  | "COMPLETED";

export interface CourierTask {
  id: string;
  orderId: string;
  type: "DELIVERY" | "RETURN";
  itemTitle: string;
  pickupName: string;
  pickupZone: ZoneId;
  pickupAddress: string;
  dropoffName: string;
  dropoffZone: ZoneId;
  dropoffAddress: string;
  scheduleType: "INSTANT" | "SCHEDULED";
  scheduledDate: string;
  scheduledTimeSlot: string;
  meetingNotes: string;
  fee: number;
  status: "OPEN" | "ASSIGNED_PICKING_UP" | "IN_TRANSIT" | "COMPLETED";
  courierName?: string;
}

export interface RentalOrder {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  renterName: string;
  renterZone: ZoneId;
  renterSubArea: string;
  renterAddressDetail: string;
  ownerName: string;
  ownerZone: ZoneId;
  ownerSubArea: string;
  ownerAddressDetail: string;
  startDate: string;
  durationDays: number;
  endDate: string;
  rentalTotal: number;
  singleLegShippingFee: number;
  totalShippingFee: number;
  platformFee: number;
  grandTotal: number;
  deliverySchedule: {
    type: "INSTANT" | "SCHEDULED";
    date: string;
    timeSlot: string;
    notes: string;
  };
  returnSchedule: {
    date: string;
    timeSlot: string;
    notes: string;
  };
  status: OrderStatus;
  escrowSplit: {
    ownerAmount: number;
    ownerReleased: boolean;
    deliveryCourierAmount: number;
    deliveryCourierReleased: boolean;
    returnCourierAmount: number;
    returnCourierReleased: boolean;
    platformRevenue: number;
  };
  createdAt: string;
}
