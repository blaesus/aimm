import type { FileRecord, Repository, Revision } from "@prisma/client";
import type { MatchedItems } from "../../../data/aimmApi";

export interface BaseAction {
}

export interface SearchInput extends BaseAction {
    type: "SearchInput"
    keyword: string,
}

export interface ChangeUrl extends BaseAction {
    type: "ChangeUrl",
    url: string,
}

export interface ProvideEntities extends BaseAction {
    type: "ProvideEntities",
    repositories: Repository[],
    revisions: Revision[],
    fileRecords: FileRecord[],
}

export interface SearchSuccessAction extends  BaseAction {
    type: "SearchSuccessAction",
    matchedItems: MatchedItems,
}


export type ClientAction = SearchInput | ChangeUrl | ProvideEntities | SearchSuccessAction
