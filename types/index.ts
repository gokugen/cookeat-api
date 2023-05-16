import { Request as ExpressRequest } from "express";
import { ObjectId, Document, SchemaDefinitionProperty } from "mongoose";

export enum Roles {
    ADMIN = "ADMIN",
    USER = "USER",
}

export type Request = ExpressRequest & {
    _id: string,
    user: UserType,
    enclosingDir?: string;
    filename?: string
};

export type RoomType = {
    link: string;
    isPublic: boolean;
    category: string;
    title: string;
    tags?: SchemaDefinitionProperty<string[]>
    views?: SchemaDefinitionProperty<string[]>
} & Partial<Document<unknown, any, UserType>>

export type UserType = {
    email: string;
    username: string;
    password: string;
    role: Roles
    views?: SchemaDefinitionProperty<string[]>
    videosFiles?: SchemaDefinitionProperty<any[]>
} & Partial<Document<unknown, any, UserType>>

export type RouteType = {
    url: string;
    method: "get" | "post" | "patch" | "put" | "delete";
    func: () => any;
}