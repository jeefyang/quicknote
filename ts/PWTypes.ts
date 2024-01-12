type SavePWType = {
    filePath: string
    content: string
    pw?: string
}

type LoadPWType = {
    pw?: string
    filePath: string
}

type PWJSON = {
    datas: any[],
    pw?: string
} | any[]

type LoadHtmlType = {
    title?: string,
    filePath: string,
    mainPW?: string
    type: "note" | "pw" | "galpw",
    head: string
}

type loadNodeConfigType = {
    listen: number
    htmlList: LoadHtmlType[]
}