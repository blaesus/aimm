import Koa from "koa";

export async function spiderAdminAuth(ctx: Koa.Context, next: () => Promise<any>) {
    const authorizationHeader = ctx.request.headers.authorization || "";
    const token = authorizationHeader.replace("Bearer ", "");
    const adminToken = process.env["ADMIN_TOKEN"] || "12321c8sd3";
    if (token !== adminToken) {
        ctx.status = 401;
        ctx.body = "Unauthorized";
        return;
    }
    return next()
}
