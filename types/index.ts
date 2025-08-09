import { Request as ExpressRequest } from "express";
import { Document } from "mongoose";

export enum UserRoles {
    ADMIN = "ADMIN",
    USER = "USER",
}

export enum UserPlans {
    BASIC = "BASIC",
    PRO = "PRO"
}

export type Request = ExpressRequest & {
    _id: string,
    user: UserType,
    enclosingDir?: string;
    filename?: string
};

export type AnonymousUserType = {
    mobileId: string;
    firstName: string;
    role: UserRoles;
    sex: string;
    age: string;
    cookingLevel: string;
    cookingFrequency: string;
    cookingForWho: string;
    cookingTime: string;
    diet: string;
    howDidHeKnowCookEatAI: string;
    lastActivity: any;
    notificationToken?: string;
    lastNotificationSent?: any;
} & Partial<Document<unknown, any, AnonymousUserType>>

export type UserType = {
    firstName: string;
    email: string;
    password: string;
    plan?: UserPlans;
    role?: UserRoles;
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    temporaryToken?: string;
    tempPassword?: string;
    refreshToken?: string;
    useExternalConnexion?: boolean;
    nbSearch?: number;
    language?: string;
} & Partial<Document<unknown, any, UserType>>

export type StripeCustomerType = {
    id: string;
    email: string;
} & Partial<Document<unknown, any, StripeCustomerType>>

export type RouteType = {
    url: string;
    method: "get" | "post" | "patch" | "put" | "delete";
    func: () => any;
}