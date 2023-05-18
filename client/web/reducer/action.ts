import { FileRecord, Repository, Revision } from "@prisma/client";

export interface BaseAction {}

export interface SearchInput extends BaseAction {
    type: "SearchInput"
    keyword: string,
}

export interface ChangePathname extends BaseAction {
    type: "ChangePathname",
    pathname: string,
}

export interface ProvideEntities extends BaseAction {
    type: "ProvideEntities",
        repositories: Repository[],
        revisions: Revision[],
        fileRecords: FileRecord[],
}


export type ClientAction = SearchInput | ChangePathname | ProvideEntities
