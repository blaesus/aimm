import { FileRecord, Repository, Revision } from "@prisma/client";

export interface BaseAction {}

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


export type ClientAction = SearchInput | ChangeUrl | ProvideEntities
