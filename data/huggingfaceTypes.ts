export interface HuggingFaceFilePointer {
    rfilename: string;
}

export interface CardData {
    license?: string | string[],
    language?: string | string[],
}

export interface HuggingfaceCommitJson_FromList {
    "_id": string,
    "id": string,
    "lastModified": string,
    "likes": number,
    "private": boolean,
    "sha": string,
    "downloads": number,
    "tags": string[],
    "pipeline_tag"?: string,
    "library_name": string,
    "siblings"?: HuggingFaceFilePointer[],
}

export interface HuggingfaceCommitJson_Full extends HuggingfaceCommitJson_FromList {
    "author": string,
    "disabled": boolean,
    "gated": boolean,
    "cardData": CardData,
    "spaces"?: [],
    "modelId"?: string,
    "descriptions"?: string,
    "siblings": HuggingFaceFilePointer[],
}
