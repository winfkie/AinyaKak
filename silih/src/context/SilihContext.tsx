"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  ClothingItem,
  MenfessPost,
  ChatMessage,
  RentalOrder,
  CourierTask,
  OrderStatus,
  ZoneId
} from "@/types/silih";
import { seedItems, seedMenfess, DEMO_PROFILES } from "@/data/seedData";
import { calculateSingleLegShipping, PLATFORM_FEE } from "@/lib/pricing";
import { uid } from "@/lib/format";

type Role = "RENTER" | "OWNER" | "COURIER" | "ADMIN";

interface State {
  items: ClothingItem[];
  menfess: MenfessPost[];
  chats: ChatMessage[];
  orders: RentalOrder[];
  courierTasks: CourierTask[];
  currentRole: Role;
  soundEnabled: boolean;
}

const LS_KEY = "silih_app_state_v1";

function defaultState(role: Role): State {
  return {
    items: [...seedItems],
    menfess: [...seedMenfess],
    chats: [],
    orders: [],
    courierTasks: [],
    currentRole: role,
    soundEnabled: false
  };
}

interface SilihContextValue extends State {
  currentProfile: (typeof DEMO_PROFILES)["RENTER"];
  setRole: (r: Role) => void;
  resetData: () => void;
  toggleSound: () => void;
  addItem: (item: Omit<ClothingItem, "id">) => void;
  toggleItemAvailability: (id: string) => void;
  createMenfess: (m: Omit<MenfessPost, "id" | "createdAt" | "replies">) => void;
  replyMenfess: (menfessId: string, reply: Omit<import("@/types/silih").MenfessReply, "id" | "createdAt">) => void;
  sendChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  sendDealOffer: (p: {
    channel: ChatMessage["channel"];
    referenceId: string;
    senderRole: ChatMessage["senderRole"];
    senderName: string;
    text?: string;
    dealOffer: ChatMessage["dealOffer"];
  }) => void;
  acceptDeal: (chatId: string) => void;
  createOrder: (input: {
    itemId: string;
    durationDays: number;
    rentalTotal: number;
    startDate: string;
    endDate: string;
    renterName: string;
    renterZone: ZoneId;
    renterSubArea: string;
    renterAddressDetail: string;
    deliverySchedule: RentalOrder["deliverySchedule"];
    returnSchedule: RentalOrder["returnSchedule"];
  }) => RentalOrder;
  payOrder: (orderId: string) => void;
  requestReturn: (orderId: string) => void;
  takeTask: (taskId: string) => void;
  advanceTask: (taskId: string) => void;
  ownerActiveBalance: number;
  ownerEscrowHeld: number;
  courierBalance: number;
}

const SilihContext = createContext<SilihContextValue | null>(null);

export function SilihProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => defaultState("RENTER"));

  // Hydrate from localStorage once on client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        setState((prev) => ({
          ...prev,
          items: parsed.items ?? prev.items,
          menfess: parsed.menfess ?? prev.menfess,
          chats: parsed.chats ?? prev.chats,
          orders: parsed.orders ?? prev.orders,
          courierTasks: parsed.courierTasks ?? prev.courierTasks,
          currentRole: (parsed.currentRole as Role) ?? prev.currentRole,
          soundEnabled: parsed.soundEnabled ?? prev.soundEnabled
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage & sync other tabs
  useEffect(() => {
    try {
      const serialized = JSON.stringify(state);
      if (localStorage.getItem(LS_KEY) !== serialized) {
        localStorage.setItem(LS_KEY, serialized);
      }
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    function handler(e: StorageEvent) {
      if (e.key === LS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Partial<State>;
          setState((prev) => ({
            ...prev,
            items: parsed.items ?? prev.items,
            menfess: parsed.menfess ?? prev.menfess,
            chats: parsed.chats ?? prev.chats,
            orders: parsed.orders ?? prev.orders,
            courierTasks: parsed.courierTasks ?? prev.courierTasks,
            currentRole: (parsed.currentRole as Role) ?? prev.currentRole,
            soundEnabled: parsed.soundEnabled ?? prev.soundEnabled
          }));
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const currentProfile = DEMO_PROFILES[state.currentRole];

  const setRole = useCallback((r: Role) => setState((prev) => ({ ...prev, currentRole: r })), []);

  const resetData = useCallback(() => setState((prev) => defaultState(prev.currentRole)), []);

  const toggleSound = useCallback(
    () => setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled })),
    []
  );

  const addItem = useCallback(
    (item: Omit<ClothingItem, "id">) =>
      setState((prev) => ({ ...prev, items: [{ ...item, id: uid("item") }, ...prev.items] })),
    []
  );

  const toggleItemAvailability = useCallback(
    (id: string) =>
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === id ? { ...it, isAvailable: !it.isAvailable } : it))
      })),
    []
  );

  const createMenfess = useCallback(
    (m: Omit<MenfessPost, "id" | "createdAt" | "replies">) =>
      setState((prev) => ({
        ...prev,
        menfess: [
          { ...m, id: uid("menfess"), createdAt: new Date().toISOString(), replies: [] } as MenfessPost,
          ...prev.menfess
        ]
      })),
    []
  );

  const replyMenfess = useCallback(
    (menfessId: string, reply: Omit<import("@/types/silih").MenfessReply, "id" | "createdAt">) => {
      setState((prev) => ({
        ...prev,
        menfess: prev.menfess.map((mp) =>
          mp.id === menfessId
            ? {
                ...mp,
                replies: [
                  ...mp.replies,
                  { ...reply, id: uid("reply"), createdAt: new Date().toISOString() } as import("@/types/silih").MenfessReply
                ]
              }
            : mp
        )
      }));
    },
    []
  );

  const sendChatMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) =>
      setState((prev) => ({
        ...prev,
        chats: [...prev.chats, { ...msg, id: uid("chat"), timestamp: new Date().toISOString() }]
      })),
    []
  );

  const sendDealOffer = useCallback(
    (p: Parameters<SilihContextValue["sendDealOffer"]>[0]) =>
      setState((prev) => ({
        ...prev,
        chats: [
          ...prev.chats,
          {
            ...p,
            text: p.text || "",
            id: uid("chat"),
            timestamp: new Date().toISOString()
          }
        ]
      })),
    []
  );

  const acceptDeal = useCallback(
    (chatId: string) =>
      setState((prev) => ({
        ...prev,
        chats: prev.chats.map((c) =>
          c.id === chatId && c.dealOffer
            ? { ...c, dealOffer: { ...c.dealOffer, status: "ACCEPTED" } }
            : c
        )
      })),
    []
  );

  const createOrder = useCallback(
    (input: Parameters<SilihContextValue["createOrder"]>[0]) => {
      const item = state.items.find((i) => i.id === input.itemId);
      if (!item) throw new Error("Item tidak ditemukan");
      const singleLeg = calculateSingleLegShipping(item.zone, input.renterZone);
      const totalShip = singleLeg * 2;
      const pf = PLATFORM_FEE;
      const grand = input.rentalTotal + totalShip + pf;
      const order: RentalOrder = {
        id: uid("order"),
        itemId: item.id,
        itemTitle: item.title,
        itemImage: item.imageUrl,
        renterName: input.renterName,
        renterZone: input.renterZone,
        renterSubArea: input.renterSubArea,
        renterAddressDetail: input.renterAddressDetail,
        ownerName: item.ownerName,
        ownerZone: item.zone,
        ownerSubArea: item.subArea,
        ownerAddressDetail: item.addressDetail,
        startDate: input.startDate,
        durationDays: input.durationDays,
        endDate: input.endDate,
        rentalTotal: input.rentalTotal,
        singleLegShippingFee: singleLeg,
        totalShippingFee: totalShip,
        platformFee: pf,
        grandTotal: grand,
        deliverySchedule: input.deliverySchedule,
        returnSchedule: input.returnSchedule,
        status: "PENDING_PAYMENT",
        escrowSplit: {
          ownerAmount: input.rentalTotal,
          ownerReleased: false,
          deliveryCourierAmount: singleLeg,
          deliveryCourierReleased: false,
          returnCourierAmount: singleLeg,
          returnCourierReleased: false,
          platformRevenue: pf
        },
        createdAt: new Date().toISOString()
      };
      const deliveryTask: CourierTask = {
        id: uid("task"),
        orderId: order.id,
        type: "DELIVERY",
        itemTitle: item.title,
        pickupName: item.ownerName,
        pickupZone: item.zone,
        pickupAddress: item.addressDetail,
        dropoffName: input.renterName,
        dropoffZone: input.renterZone,
        dropoffAddress: input.renterAddressDetail,
        scheduleType: input.deliverySchedule.type,
        scheduledDate: input.deliverySchedule.date,
        scheduledTimeSlot: input.deliverySchedule.timeSlot,
        meetingNotes: input.deliverySchedule.notes,
        fee: singleLeg,
        status: "OPEN"
      };
      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        courierTasks: [deliveryTask, ...prev.courierTasks]
      }));
      return order;
    },
    [state.items]
  );

  const payOrder = useCallback(
    (orderId: string) =>
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status: "WAITING_DELIVERY_COURIER" } : o
        )
      })),
    []
  );

  const requestReturn = useCallback((orderId: string) => {
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order || order.status !== "ACTIVE_RENTAL") return prev;
      const returnTask: CourierTask = {
        id: uid("task"),
        orderId: order.id,
        type: "RETURN",
        itemTitle: order.itemTitle,
        pickupName: order.renterName,
        pickupZone: order.renterZone,
        pickupAddress: order.renterAddressDetail,
        dropoffName: order.ownerName,
        dropoffZone: order.ownerZone,
        dropoffAddress: order.ownerAddressDetail,
        scheduleType: "SCHEDULED",
        scheduledDate: order.returnSchedule.date,
        scheduledTimeSlot: order.returnSchedule.timeSlot,
        meetingNotes: order.returnSchedule.notes,
        fee: order.singleLegShippingFee,
        status: "OPEN"
      };
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status: "WAITING_RETURN_COURIER" } : o
        ),
        courierTasks: [returnTask, ...prev.courierTasks]
      };
    });
  }, []);

  const takeTask = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.courierTasks.find((t) => t.id === taskId);
      if (!task || task.status !== "OPEN") return prev;
      const courierName = DEMO_PROFILES[prev.currentRole].name;
      const nextStatus: OrderStatus =
        task.type === "DELIVERY" ? "DELIVERY_PICKING_UP" : "RETURN_PICKING_UP";
      return {
        ...prev,
        courierTasks: prev.courierTasks.map((t) =>
          t.id === taskId ? { ...t, courierName, status: "ASSIGNED_PICKING_UP" } : t
        ),
        orders: prev.orders.map((o) =>
          o.id === task.orderId ? { ...o, status: nextStatus } : o
        )
      };
    });
  }, []);

  const advanceTask = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.courierTasks.find((t) => t.id === taskId);
      if (!task || !task.courierName) return prev;
      const order = prev.orders.find((o) => o.id === task.orderId);
      if (!order) return prev;

      let newTaskStatus = task.status;
      let newOrderStatus = order.status;
      let ownerReleased = order.escrowSplit.ownerReleased;
      let dcReleased = order.escrowSplit.deliveryCourierReleased;
      let rcReleased = order.escrowSplit.returnCourierReleased;

      if (task.type === "DELIVERY") {
        if (task.status === "ASSIGNED_PICKING_UP") {
          newTaskStatus = "IN_TRANSIT";
          newOrderStatus = "DELIVERY_ON_THE_WAY";
        } else if (task.status === "IN_TRANSIT") {
          newTaskStatus = "COMPLETED";
          newOrderStatus = "ACTIVE_RENTAL";
          dcReleased = true;
        }
      } else {
        if (task.status === "ASSIGNED_PICKING_UP") {
          newTaskStatus = "IN_TRANSIT";
          newOrderStatus = "RETURN_ON_THE_WAY";
        } else if (task.status === "IN_TRANSIT") {
          newTaskStatus = "COMPLETED";
          newOrderStatus = "COMPLETED";
          rcReleased = true;
          ownerReleased = true;
        }
      }

      return {
        ...prev,
        courierTasks: prev.courierTasks.map((t) =>
          t.id === taskId ? { ...t, status: newTaskStatus as CourierTask["status"] } : t
        ),
        orders: prev.orders.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: newOrderStatus,
                escrowSplit: {
                  ...o.escrowSplit,
                  ownerReleased,
                  deliveryCourierReleased: dcReleased,
                  returnCourierReleased: rcReleased
                }
              }
            : o
        )
      };
    });
  }, []);

  const ownerActiveBalance = useMemo(
    () =>
      state.orders
        .filter(
          (o) =>
            o.ownerName === currentProfile.name &&
            o.escrowSplit.ownerReleased
        )
        .reduce((s, o) => s + o.escrowSplit.ownerAmount, 0),
    [state.orders, currentProfile.name]
  );

  const ownerEscrowHeld = useMemo(
    () =>
      state.orders
        .filter(
          (o) =>
            o.ownerName === currentProfile.name &&
            !o.escrowSplit.ownerReleased
        )
        .reduce((s, o) => s + o.escrowSplit.ownerAmount, 0),
    [state.orders, currentProfile.name]
  );

  const courierBalance = useMemo(
    () =>
      state.courierTasks
        .filter(
          (t) =>
            t.status === "COMPLETED" &&
            t.courierName === currentProfile.name
        )
        .reduce((s, t) => s + t.fee, 0),
    [state.courierTasks, currentProfile.name]
  );

  const value: SilihContextValue = {
    ...state,
    currentProfile,
    setRole,
    resetData,
    toggleSound,
    addItem,
    toggleItemAvailability,
    createMenfess,
    replyMenfess,
    sendChatMessage,
    sendDealOffer,
    acceptDeal,
    createOrder,
    payOrder,
    requestReturn,
    takeTask,
    advanceTask,
    ownerActiveBalance,
    ownerEscrowHeld,
    courierBalance
  };

  return <SilihContext.Provider value={value}>{children}</SilihContext.Provider>;
}

export function useSilih() {
  const ctx = useContext(SilihContext);
  if (!ctx) throw new Error("useSilih harus dipakai di dalam SilihProvider");
  return ctx;
}
