import * as Koa from "koa"
import * as Router from "koa-router"
import * as Parser from "koa-bodyparser"
import * as path from "path"
import * as fs from "fs"
import * as cors from 'koa2-cors'


export class App {
    app: Koa<Koa.DefaultState, Koa.DefaultContext>
    parentDir = "./public/pw"
    pwDir = "./pw"
    configJson = this.loadNodeConfigJson()
    router = new Router()
    parser = Parser({
        /** 要和html对应 */
        extendTypes: {
            json: ['application/x-www-form-urlencoded']
        }
    })

    constructor() {
        this.app = new Koa()

        this.app.use(cors());

        // this.app.use(cors({
        //     origin: (ctx) => {
        //         if (ctx.url === '/test') {
        //             return false;
        //         }
        //         return ctx.header.origin;
        //     },
        //     exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        //     maxAge: 5,
        //     credentials: true,
        //     allowMethods: ['GET', 'POST', 'DELETE'],
        //     allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
        // }));

        // this.app.use(async (ctx, next) => {
        //     await ctx.set('Access-Control-Allow-Origin', 'http://toy.mingdesigner.cn')
        //     await next()
        // })

        this.app.use(this.parser)
        this.logger()
        this.xResponeseTime()
        this.postRouter()
        console.log(`开始监听:${this.configJson.listen}`)
        this.app.listen(this.configJson.listen)
    }

    postRouter() {
        this.router.post("/loadPW", async (ctx, next) => {
            console.log("正在读取数据!!")
            //@ts-ignore
            let data: LoadPWType = ctx.request.body
            if (data.filePath == undefined) {
                ctx.body = undefined
            }
            let file = path.join(this.pwDir, data.filePath)
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, `{"datas":[],"pw":""}`, { 'encoding': "utf-8" })
            }
            let str = fs.readFileSync(file, { encoding: "utf-8" })
            let json: PWJSON = JSON.parse(str)
            if (Array.isArray(json)) {
                json = { datas: json, pw: "" }
            }
            if (json.pw == undefined || json.pw == '' || json.pw == data.pw) {
                ctx.body = JSON.stringify(json)
            }
            else {
                ctx.body = undefined
            }
        })
        this.router.post("/savePW", async (ctx, next) => {
            console.log("正在保存数据")
            //@ts-ignore
            let data: SavePWType = ctx.request.body
            if (data.filePath == undefined || data.content == undefined) {
                // 数据不正确
                ctx.body = -1
            }
            let file = path.join(this.pwDir, data.filePath)
            if (!fs.existsSync(file)) {
                // 文件不存在,无法保存`
                ctx.body = -2
            }
            else {
                let str = fs.readFileSync(file, { encoding: "utf-8" })
                let json: PWJSON = JSON.parse(str)
                if (Array.isArray(json)) {
                    json = { datas: json, pw: "" }
                }
                if (json.pw == undefined || json.pw == '' || json.pw == data.pw) {
                    let writeJson: PWJSON = { datas: JSON.parse(data.content), pw: json.pw }
                    fs.writeFileSync(file, JSON.stringify(writeJson))
                    // 保存成功
                    ctx.body = 1
                }
                else {
                    ``
                    // 密码不对
                    ctx.body = -3
                }
            }
        })

        for (let i = 0; i < this.configJson.htmlList.length; i++) {
            let json = this.configJson.htmlList[i]
            let jsonStr = JSON.stringify(json)
            this.router.get(`/${json.head}`, async (ctx, next) => {
                let htmlStr = fs.readFileSync("./web/template.html", { encoding: "utf-8" })
                htmlStr = htmlStr.replace("%%%template%%%", jsonStr)
                ctx.response.body = htmlStr
            })
        }
        this.router.get('/lib/:filename', async (ctx, next) => {
            let str = fs.readFileSync(`./web/lib/${ctx.params.filename}`, { encoding: "utf-8" })
            ctx.response.body = str
        })
        this.router.get('/js/:filename', async (ctx, next) => {
            let str = fs.readFileSync(`./web/js/${ctx.params.filename}`, { encoding: "utf-8" })
            ctx.response.body = str
        })
        this.app.use(this.router.routes())

    }

    loadNodeConfigJson() {
        let tempUrl = "./nodeConfig.template.jsonc"
        let url = "./nodeConfig.jsonc"
        if (!fs.existsSync(url)) {
            let str = fs.readFileSync(tempUrl, { encoding: "utf-8" })
            fs.writeFileSync(url, str, { "encoding": "utf-8" })
        }
        let str = fs.readFileSync(url, { "encoding": "utf-8" })
        let json: loadNodeConfigType = eval(`(${str})`)
        return json
    }


    /** 打印log */
    logger() {
        this.app.use(async (ctx, next) => {
            await next()
            const rt = ctx.response.get("X-Response-Time")
            console.log(`${ctx.method} ${ctx.url} -- ${rt}`)
        })
    }

    /** 计算时间 */
    xResponeseTime() {
        this.app.use(async (ctx, next) => {
            const start = Date.now()
            await next();
            const ms = Date.now() - start
            ctx.set("X-Response-Time", `${ms}ms`)
        })
    }
}

new App()